# tasks.py
# Run: pip install celery redis yfinance pandas
#
# Start worker: celery -A your_project worker --loglevel=info
# Start beat:   celery -A your_project beat --loglevel=info

from celery import shared_task
from decimal import Decimal
import logging
import yfinance as yf  # Replace with paid provider in production
import pandas as pd
from datetime import date, timedelta

logger = logging.getLogger(__name__)


# ------------------------------------------------------------------
# 1. DAILY PRICE INGESTION
# ------------------------------------------------------------------
@shared_task(bind=True, max_retries=3)
def ingest_daily_prices(self):
    """
    Runs every weekday at 18:30 IST (after NSE closes at 15:30).
    Fetches EOD prices for all active companies.
    """
    from .models import Company, PriceData

    companies = Company.objects.filter(is_active=True).values("id", "nse_symbol")
    today = date.today()
    created_count = 0

    for co in companies:
        try:
            symbol = co["nse_symbol"] + ".NS"  # Yahoo Finance NSE suffix
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period="2d")  # last 2 days to be safe

            if hist.empty:
                continue

            row = hist.iloc[-1]
            price_date = hist.index[-1].date()

            obj, created = PriceData.objects.update_or_create(
                company_id=co["id"],
                date=price_date,
                defaults={
                    "open": Decimal(str(round(row["Open"], 2))),
                    "high": Decimal(str(round(row["High"], 2))),
                    "low": Decimal(str(round(row["Low"], 2))),
                    "close": Decimal(str(round(row["Close"], 2))),
                    "volume": int(row["Volume"]),
                },
            )
            if created:
                created_count += 1

        except Exception as exc:
            logger.error(f"Price ingest failed for {co['nse_symbol']}: {exc}")
            continue

    logger.info(f"Daily price ingest: {created_count} new records")
    return {"created": created_count}


# ------------------------------------------------------------------
# 2. RATIO COMPUTATION (runs nightly after price ingest)
# ------------------------------------------------------------------
@shared_task
def compute_ratios():
    """
    Recalculates all financial ratios for every active company.
    Must run AFTER daily price ingest completes.
    """
    from .models import Company, Financial, PriceData, Ratio

    today = date.today()
    updated = 0

    for company in Company.objects.filter(is_active=True).prefetch_related("financials", "prices"):
        try:
            latest_price = company.prices.order_by("-date").values("close").first()
            if not latest_price:
                continue
            price = float(latest_price["close"])

            # Get latest annual financial data
            annual = company.financials.filter(period_type="A").order_by("-period_end").first()
            # Get latest quarterly data
            quarterly = company.financials.filter(period_type="Q").order_by("-period_end").first()

            # TTM EPS: sum of last 4 quarters
            ttm_quarters = company.financials.filter(
                period_type="Q"
            ).order_by("-period_end")[:4]

            ttm_eps = None
            if ttm_quarters.count() == 4:
                ttm_eps = sum(
                    float(q.eps or 0) for q in ttm_quarters
                )

            def safe_div(a, b):
                """Returns None if division is undefined or zero."""
                if a is None or b is None or float(b) == 0:
                    return None
                return round(float(a) / float(b), 2)

            def pct(a, b):
                """(a/b - 1) * 100"""
                if a is None or b is None or float(b) == 0:
                    return None
                return round((float(a) / float(b) - 1) * 100, 2)

            ratios = {}

            # ---- Valuation ----
            if ttm_eps and ttm_eps != 0:
                ratios["pe_ratio"] = round(price / ttm_eps, 2)

            if annual and annual.book_value_per_share:
                ratios["pb_ratio"] = safe_div(price, annual.book_value_per_share)

            if annual and annual.ebitda and company.market_cap:
                net_debt = float(annual.total_debt or 0) - float(annual.cash_and_equivalents or 0)
                ev = float(company.market_cap) + net_debt
                ratios["ev_ebitda"] = safe_div(ev, annual.ebitda)

            if annual and annual.revenue and company.market_cap:
                ratios["price_to_sales"] = safe_div(company.market_cap, annual.revenue)

            # ---- Profitability ----
            if annual:
                ratios["net_margin"] = safe_div(annual.net_profit, annual.revenue) and \
                                       round(float(annual.net_profit or 0) / float(annual.revenue or 1) * 100, 2)
                ratios["operating_margin"] = annual.ebitda and annual.revenue and \
                                             round(float(annual.ebitda) / float(annual.revenue) * 100, 2)
                ratios["roe"] = safe_div(annual.net_profit, annual.total_equity) and \
                                round(float(annual.net_profit or 0) / float(annual.total_equity or 1) * 100, 2)

                capital_employed = float(annual.total_assets or 0) - float(annual.total_debt or 0)
                if annual.ebit and capital_employed != 0:
                    ratios["roce"] = round(float(annual.ebit) / capital_employed * 100, 2)

            # ---- Leverage ----
            if annual and annual.total_equity and annual.total_debt is not None:
                ratios["debt_to_equity"] = safe_div(annual.total_debt, annual.total_equity)

            # ---- Growth (YoY) ----
            prev_annual = company.financials.filter(
                period_type="A"
            ).order_by("-period_end")[1:2].first()

            if annual and prev_annual:
                ratios["revenue_growth"] = pct(annual.revenue, prev_annual.revenue)
                ratios["profit_growth"] = pct(annual.net_profit, prev_annual.net_profit)

            # Update market cap from latest price * shares
            # (you'd need shares outstanding in your model)

            if ratios:
                Ratio.objects.update_or_create(
                    company=company,
                    as_of_date=today,
                    defaults=ratios,
                )
                updated += 1

        except Exception as e:
            logger.error(f"Ratio compute failed for {company.nse_symbol}: {e}")
            continue

    logger.info(f"Ratio computation complete: {updated} companies updated")
    return {"updated": updated}


# ------------------------------------------------------------------
# 3. HISTORICAL PRICE BACKFILL (run once on setup)
# ------------------------------------------------------------------
@shared_task
def backfill_prices(nse_symbol: str, years: int = 5):
    """
    Call this once per company to seed historical prices.
    Example: backfill_prices.delay("RELIANCE", years=5)
    """
    from .models import Company, PriceData

    try:
        company = Company.objects.get(nse_symbol=nse_symbol, is_active=True)
    except Company.DoesNotExist:
        return {"error": f"Company {nse_symbol} not found"}

    symbol = nse_symbol + ".NS"
    ticker = yf.Ticker(symbol)
    hist = ticker.history(period=f"{years}y")

    if hist.empty:
        return {"error": "No data returned"}

    bulk_list = []
    for dt, row in hist.iterrows():
        bulk_list.append(PriceData(
            company=company,
            date=dt.date(),
            open=Decimal(str(round(row["Open"], 2))),
            high=Decimal(str(round(row["High"], 2))),
            low=Decimal(str(round(row["Low"], 2))),
            close=Decimal(str(round(row["Close"], 2))),
            volume=int(row["Volume"]),
        ))

    PriceData.objects.bulk_create(bulk_list, ignore_conflicts=True)
    return {"symbol": nse_symbol, "records_inserted": len(bulk_list)}
