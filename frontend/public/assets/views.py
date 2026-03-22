# views.py
# Run: pip install djangorestframework

from rest_framework import serializers, generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.core.cache import cache
import hashlib
import json

from .models import Company, Financial, Ratio, PriceData, SavedScreener
from .screener_engine import ScreenerEngine, ParseError


# ------------------------------------------------------------------
# SERIALIZERS
# ------------------------------------------------------------------

class CompanyListSerializer(serializers.ModelSerializer):
    pe_ratio = serializers.SerializerMethodField()
    pb_ratio = serializers.SerializerMethodField()
    roe = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = [
            "id", "nse_symbol", "bse_code", "name",
            "sector", "market_cap", "pe_ratio", "pb_ratio", "roe"
        ]

    def _get_latest_ratio(self, obj, field):
        ratio = obj.ratios.order_by("-as_of_date").first()
        return getattr(ratio, field, None) if ratio else None

    def get_pe_ratio(self, obj): return self._get_latest_ratio(obj, "pe_ratio")
    def get_pb_ratio(self, obj): return self._get_latest_ratio(obj, "pb_ratio")
    def get_roe(self, obj): return self._get_latest_ratio(obj, "roe")


class CompanyDetailSerializer(serializers.ModelSerializer):
    latest_ratios = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = [
            "id", "nse_symbol", "bse_code", "isin",
            "name", "sector", "industry", "market_cap",
            "face_value", "latest_ratios"
        ]

    def get_latest_ratios(self, obj):
        ratio = obj.ratios.order_by("-as_of_date").first()
        if not ratio:
            return {}
        return {
            "pe_ratio": ratio.pe_ratio,
            "pb_ratio": ratio.pb_ratio,
            "ev_ebitda": ratio.ev_ebitda,
            "roe": ratio.roe,
            "roce": ratio.roce,
            "net_margin": ratio.net_margin,
            "operating_margin": ratio.operating_margin,
            "debt_to_equity": ratio.debt_to_equity,
            "interest_coverage": ratio.interest_coverage,
            "dividend_yield": ratio.dividend_yield,
            "revenue_growth": ratio.revenue_growth,
            "profit_growth": ratio.profit_growth,
            "as_of_date": ratio.as_of_date,
        }


class FinancialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Financial
        fields = [
            "period_end", "period_type",
            "revenue", "gross_profit", "ebitda", "net_profit", "eps",
            "total_assets", "total_equity", "total_debt",
            "book_value_per_share", "operating_cash_flow",
            "capex", "free_cash_flow",
        ]


class PriceSerializer(serializers.ModelSerializer):
    class Meta:
        model = PriceData
        fields = ["date", "open", "high", "low", "close", "volume"]


class SavedScreenerSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedScreener
        fields = ["id", "name", "query_text", "is_public", "follow_count", "created_at"]
        read_only_fields = ["id", "follow_count", "created_at"]


# ------------------------------------------------------------------
# VIEWS
# ------------------------------------------------------------------

class CompanyListView(generics.ListAPIView):
    """
    GET /api/v1/companies/
    Query params: ?search=RELIANCE  ?sector=IT  ?index=NIFTY50  ?page=1
    """
    serializer_class = CompanyListSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = Company.objects.filter(is_active=True).prefetch_related("ratios")
        search = self.request.query_params.get("search")
        sector = self.request.query_params.get("sector")
        if search:
            qs = qs.filter(name__icontains=search) | qs.filter(nse_symbol__icontains=search)
        if sector:
            qs = qs.filter(sector__iexact=sector)
        return qs.order_by("-market_cap")


class CompanyDetailView(generics.RetrieveAPIView):
    """
    GET /api/v1/companies/<nse_symbol>/
    """
    serializer_class = CompanyDetailSerializer
    permission_classes = [AllowAny]
    lookup_field = "nse_symbol"
    queryset = Company.objects.filter(is_active=True).prefetch_related("ratios")


class CompanyFinancialsView(APIView):
    """
    GET /api/v1/companies/<nse_symbol>/financials/?period=quarterly
    period param: quarterly | annual | ttm
    """
    permission_classes = [AllowAny]

    def get(self, request, nse_symbol):
        try:
            company = Company.objects.get(nse_symbol=nse_symbol.upper(), is_active=True)
        except Company.DoesNotExist:
            return Response({"error": "Company not found"}, status=404)

        period = request.query_params.get("period", "quarterly")
        period_map = {"quarterly": "Q", "annual": "A", "ttm": "TTM"}
        period_type = period_map.get(period, "Q")

        financials = company.financials.filter(
            period_type=period_type
        ).order_by("-period_end")[:20]

        return Response({
            "company": nse_symbol.upper(),
            "period_type": period,
            "data": FinancialSerializer(financials, many=True).data,
        })


class CompanyPricesView(APIView):
    """
    GET /api/v1/companies/<nse_symbol>/prices/?range=1y
    range param: 1m | 3m | 6m | 1y | 3y | 5y | max
    """
    permission_classes = [AllowAny]

    RANGE_DAYS = {
        "1m": 30, "3m": 90, "6m": 180,
        "1y": 365, "3y": 365 * 3, "5y": 365 * 5,
    }

    def get(self, request, nse_symbol):
        try:
            company = Company.objects.get(nse_symbol=nse_symbol.upper(), is_active=True)
        except Company.DoesNotExist:
            return Response({"error": "Company not found"}, status=404)

        range_param = request.query_params.get("range", "1y")

        cache_key = f"prices:{nse_symbol}:{range_param}"
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        prices = company.prices.order_by("-date")
        if range_param != "max":
            from datetime import date, timedelta
            days = self.RANGE_DAYS.get(range_param, 365)
            cutoff = date.today() - timedelta(days=days)
            prices = prices.filter(date__gte=cutoff)

        data = PriceSerializer(prices.order_by("date"), many=True).data
        response_data = {"company": nse_symbol.upper(), "range": range_param, "data": data}

        cache.set(cache_key, response_data, timeout=3600)  # cache 1 hour
        return Response(response_data)


class ScreenerRunView(APIView):
    """
    POST /api/v1/screener/run/
    Body: {
        "query": "PE < 20 AND ROE > 15",
        "sort_by": "market_cap",
        "sort_dir": "DESC",
        "page": 1,
        "page_size": 50
    }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        query = request.data.get("query", "").strip()
        if not query:
            return Response({"error": "query is required"}, status=400)

        sort_by = request.data.get("sort_by", "market_cap")
        sort_dir = request.data.get("sort_dir", "DESC")
        page = int(request.data.get("page", 1))
        page_size = min(int(request.data.get("page_size", 50)), 200)

        # Cache key from query params
        cache_key = "screener:" + hashlib.md5(
            json.dumps({"q": query, "s": sort_by, "d": sort_dir, "p": page}).encode()
        ).hexdigest()
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        try:
            engine = ScreenerEngine()
            results, total = engine.run(
                query=query,
                sort_by=sort_by,
                sort_dir=sort_dir,
                page=page,
                page_size=page_size,
            )
        except ParseError as e:
            return Response({"error": str(e)}, status=400)

        response_data = {
            "query": query,
            "total": total,
            "page": page,
            "page_size": page_size,
            "results": results,
        }
        cache.set(cache_key, response_data, timeout=900)  # cache 15 minutes
        return Response(response_data)


class ScreenerSaveView(APIView):
    """
    POST /api/v1/screener/save/
    Body: { "name": "My Value Picks", "query": "PE < 15 AND ROE > 20", "is_public": false }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from .screener_engine import parse_query, ParseError
        query = request.data.get("query", "").strip()
        name = request.data.get("name", "").strip()
        is_public = request.data.get("is_public", False)

        if not query or not name:
            return Response({"error": "name and query are required"}, status=400)

        try:
            ast = parse_query(query)
        except ParseError as e:
            return Response({"error": str(e)}, status=400)

        # Convert AST to JSON-serializable dict
        def node_to_dict(node):
            if node.type == "condition":
                c = node.condition
                return {"type": "condition", "field": c.field, "op": c.operator, "value": c.value}
            return {"type": node.type, "left": node_to_dict(node.left), "right": node_to_dict(node.right)}

        screener = SavedScreener.objects.create(
            user=request.user,
            name=name,
            query_text=query,
            query_ast=node_to_dict(ast),
            is_public=is_public,
        )
        return Response(SavedScreenerSerializer(screener).data, status=201)

    def get(self, request):
        """List current user's saved screeners."""
        screeners = SavedScreener.objects.filter(user=request.user).order_by("-created_at")
        return Response(SavedScreenerSerializer(screeners, many=True).data)
