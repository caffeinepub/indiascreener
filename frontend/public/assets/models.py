# models.py
# Run: pip install django psycopg2-binary

from django.db import models
from django.contrib.auth.models import User
import uuid


class Company(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nse_symbol = models.CharField(max_length=20, unique=True, null=True, blank=True)
    bse_code = models.CharField(max_length=10, unique=True, null=True, blank=True)
    isin = models.CharField(max_length=12, unique=True)
    name = models.CharField(max_length=200)
    sector = models.CharField(max_length=100, null=True, blank=True)
    industry = models.CharField(max_length=100, null=True, blank=True)
    market_cap = models.DecimalField(max_digits=20, decimal_places=2, null=True)  # in Crores
    face_value = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "companies"
        verbose_name_plural = "companies"

    def __str__(self):
        return f"{self.name} ({self.nse_symbol})"


class PriceData(models.Model):
    """Daily OHLCV price data. Use TimescaleDB for this table in production."""
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="prices")
    date = models.DateField()
    open = models.DecimalField(max_digits=12, decimal_places=2)
    high = models.DecimalField(max_digits=12, decimal_places=2)
    low = models.DecimalField(max_digits=12, decimal_places=2)
    close = models.DecimalField(max_digits=12, decimal_places=2)
    volume = models.BigIntegerField()
    delivery_volume = models.BigIntegerField(null=True, blank=True)

    class Meta:
        db_table = "price_data"
        unique_together = ("company", "date")
        indexes = [
            models.Index(fields=["company", "-date"]),
            models.Index(fields=["date"]),
        ]

    def __str__(self):
        return f"{self.company.nse_symbol} - {self.date}"


class Financial(models.Model):
    """Quarterly and annual P&L, Balance Sheet, Cash Flow data."""

    PERIOD_TYPES = [
        ("Q", "Quarterly"),
        ("A", "Annual"),
        ("TTM", "Trailing Twelve Months"),
    ]

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="financials")
    period_end = models.DateField()
    period_type = models.CharField(max_length=3, choices=PERIOD_TYPES)

    # P&L
    revenue = models.DecimalField(max_digits=20, decimal_places=2, null=True)
    gross_profit = models.DecimalField(max_digits=20, decimal_places=2, null=True)
    ebitda = models.DecimalField(max_digits=20, decimal_places=2, null=True)
    ebit = models.DecimalField(max_digits=20, decimal_places=2, null=True)
    net_profit = models.DecimalField(max_digits=20, decimal_places=2, null=True)
    eps = models.DecimalField(max_digits=12, decimal_places=2, null=True)

    # Balance Sheet
    total_assets = models.DecimalField(max_digits=20, decimal_places=2, null=True)
    total_equity = models.DecimalField(max_digits=20, decimal_places=2, null=True)
    total_debt = models.DecimalField(max_digits=20, decimal_places=2, null=True)
    cash_and_equivalents = models.DecimalField(max_digits=20, decimal_places=2, null=True)
    book_value_per_share = models.DecimalField(max_digits=12, decimal_places=2, null=True)

    # Cash Flow
    operating_cash_flow = models.DecimalField(max_digits=20, decimal_places=2, null=True)
    capex = models.DecimalField(max_digits=20, decimal_places=2, null=True)
    free_cash_flow = models.DecimalField(max_digits=20, decimal_places=2, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "financials"
        unique_together = ("company", "period_end", "period_type")
        indexes = [models.Index(fields=["company", "-period_end", "period_type"])]


class Ratio(models.Model):
    """Pre-computed financial ratios. Recalculated nightly via Celery."""
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="ratios")
    as_of_date = models.DateField()

    # Valuation
    pe_ratio = models.DecimalField(max_digits=12, decimal_places=2, null=True)
    pb_ratio = models.DecimalField(max_digits=12, decimal_places=2, null=True)
    ev_ebitda = models.DecimalField(max_digits=12, decimal_places=2, null=True)
    price_to_sales = models.DecimalField(max_digits=12, decimal_places=2, null=True)

    # Profitability
    roe = models.DecimalField(max_digits=8, decimal_places=2, null=True)    # %
    roce = models.DecimalField(max_digits=8, decimal_places=2, null=True)   # %
    roa = models.DecimalField(max_digits=8, decimal_places=2, null=True)    # %
    net_margin = models.DecimalField(max_digits=8, decimal_places=2, null=True)  # %
    operating_margin = models.DecimalField(max_digits=8, decimal_places=2, null=True)  # %

    # Leverage
    debt_to_equity = models.DecimalField(max_digits=8, decimal_places=2, null=True)
    interest_coverage = models.DecimalField(max_digits=8, decimal_places=2, null=True)
    current_ratio = models.DecimalField(max_digits=8, decimal_places=2, null=True)

    # Growth (YoY %)
    revenue_growth = models.DecimalField(max_digits=8, decimal_places=2, null=True)
    profit_growth = models.DecimalField(max_digits=8, decimal_places=2, null=True)

    # Dividends
    dividend_yield = models.DecimalField(max_digits=8, decimal_places=2, null=True)
    dividend_payout = models.DecimalField(max_digits=8, decimal_places=2, null=True)

    class Meta:
        db_table = "ratios"
        unique_together = ("company", "as_of_date")
        indexes = [
            models.Index(fields=["as_of_date"]),
            models.Index(fields=["pe_ratio"]),
            models.Index(fields=["roe"]),
            models.Index(fields=["market_cap"]),  # via company FK — add to company table
        ]


class Shareholding(models.Model):
    """Quarterly shareholding pattern."""
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="shareholdings")
    quarter_end = models.DateField()
    promoter_pct = models.DecimalField(max_digits=5, decimal_places=2, null=True)
    fii_pct = models.DecimalField(max_digits=5, decimal_places=2, null=True)
    dii_pct = models.DecimalField(max_digits=5, decimal_places=2, null=True)
    public_pct = models.DecimalField(max_digits=5, decimal_places=2, null=True)
    pledged_pct = models.DecimalField(max_digits=5, decimal_places=2, null=True)

    class Meta:
        db_table = "shareholdings"
        unique_together = ("company", "quarter_end")


class SavedScreener(models.Model):
    """User-saved screener queries."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="screeners")
    name = models.CharField(max_length=100)
    query_text = models.TextField()           # raw: "PE < 20 AND ROE > 15"
    query_ast = models.JSONField()            # parsed AST stored as JSON
    is_public = models.BooleanField(default=False)
    follow_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "saved_screeners"


class Portfolio(models.Model):
    """User portfolio holdings."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="portfolios")
    name = models.CharField(max_length=100, default="My Portfolio")

    class Meta:
        db_table = "portfolios"


class PortfolioHolding(models.Model):
    """Individual buy transactions within a portfolio."""
    portfolio = models.ForeignKey(Portfolio, on_delete=models.CASCADE, related_name="holdings")
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=12, decimal_places=4)
    avg_cost = models.DecimalField(max_digits=12, decimal_places=2)
    buy_date = models.DateField()

    class Meta:
        db_table = "portfolio_holdings"


class Watchlist(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="watchlists")
    name = models.CharField(max_length=100)
    companies = models.ManyToManyField(Company, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "watchlists"
