# screener_engine.py
# Run: pip install pyparsing
#
# Usage:
#   engine = ScreenerEngine()
#   results = engine.run("PE < 20 AND ROE > 15 AND Market Cap > 500")

import re
from dataclasses import dataclass
from typing import Any
from django.db import connection


# ------------------------------------------------------------------
# 1. ALLOWED FIELDS
#    Maps user-facing names → actual DB column (in ratios or companies table)
# ------------------------------------------------------------------
FIELD_MAP = {
    # Valuation
    "pe":                  ("r", "pe_ratio"),
    "pe ratio":            ("r", "pe_ratio"),
    "pb":                  ("r", "pb_ratio"),
    "pb ratio":            ("r", "pb_ratio"),
    "ev/ebitda":           ("r", "ev_ebitda"),
    "price to sales":      ("r", "price_to_sales"),

    # Profitability
    "roe":                 ("r", "roe"),
    "roce":                ("r", "roce"),
    "roa":                 ("r", "roa"),
    "net margin":          ("r", "net_margin"),
    "operating margin":    ("r", "operating_margin"),

    # Leverage
    "debt to equity":      ("r", "debt_to_equity"),
    "d/e":                 ("r", "debt_to_equity"),
    "interest coverage":   ("r", "interest_coverage"),
    "current ratio":       ("r", "current_ratio"),

    # Growth
    "revenue growth":      ("r", "revenue_growth"),
    "profit growth":       ("r", "profit_growth"),

    # Dividends
    "dividend yield":      ("r", "dividend_yield"),
    "dividend payout":     ("r", "dividend_payout"),

    # Size
    "market cap":          ("c", "market_cap"),
    "marketcap":           ("c", "market_cap"),
}

OPERATORS = {">", "<", ">=", "<=", "=", "!="}
LOGICAL_OPS = {"AND", "OR"}


# ------------------------------------------------------------------
# 2. TOKEN + PARSER
# ------------------------------------------------------------------
@dataclass
class Condition:
    field: str
    operator: str
    value: float
    table_alias: str
    db_column: str


@dataclass
class Node:
    type: str          # "condition" | "and" | "or"
    left: Any = None
    right: Any = None
    condition: "Condition" = None


class ParseError(Exception):
    pass


def tokenize(query: str) -> list[str]:
    """Split query string into tokens."""
    # Normalize
    query = query.strip()
    # Insert spaces around operators so they split correctly
    query = re.sub(r'(>=|<=|!=|>|<|=)', r' \1 ', query)
    tokens = query.split()
    return tokens


def parse_query(query: str) -> Node:
    """
    Parse a query string like:
      "PE < 20 AND ROE > 15 AND Market Cap > 500"
    Returns a tree of Node objects.
    """
    tokens = tokenize(query)
    idx = 0

    def peek() -> str | None:
        return tokens[idx] if idx < len(tokens) else None

    def consume() -> str:
        nonlocal idx
        token = tokens[idx]
        idx += 1
        return token

    def parse_condition() -> Node:
        nonlocal idx
        # Collect field name (may be multi-word like "Market Cap")
        field_tokens = []
        while peek() and peek().upper() not in LOGICAL_OPS and peek() not in OPERATORS:
            field_tokens.append(consume())
        field_name = " ".join(field_tokens).lower()

        if field_name not in FIELD_MAP:
            raise ParseError(
                f"Unknown field: '{field_name}'. "
                f"Supported: {', '.join(FIELD_MAP.keys())}"
            )

        op = consume()
        if op not in OPERATORS:
            raise ParseError(f"Expected operator (>, <, >=, <=, =, !=), got: '{op}'")

        try:
            value = float(consume())
        except (ValueError, IndexError):
            raise ParseError(f"Expected a number after '{op}'")

        table_alias, db_column = FIELD_MAP[field_name]
        cond = Condition(
            field=field_name,
            operator=op,
            value=value,
            table_alias=table_alias,
            db_column=db_column,
        )
        return Node(type="condition", condition=cond)

    def parse_expr() -> Node:
        left = parse_condition()
        while peek() and peek().upper() in LOGICAL_OPS:
            op = consume().upper()
            right = parse_condition()
            left = Node(type=op.lower(), left=left, right=right)
        return left

    tree = parse_expr()
    return tree


# ------------------------------------------------------------------
# 3. SQL GENERATOR
# ------------------------------------------------------------------
def build_sql(node: Node, params: list) -> str:
    """Recursively convert parse tree to a SQL WHERE clause fragment."""
    if node.type == "condition":
        c = node.condition
        col = f"{c.table_alias}.{c.db_column}"
        params.append(c.value)
        return f"{col} {c.operator} %s"
    elif node.type == "and":
        left_sql = build_sql(node.left, params)
        right_sql = build_sql(node.right, params)
        return f"({left_sql} AND {right_sql})"
    elif node.type == "or":
        left_sql = build_sql(node.left, params)
        right_sql = build_sql(node.right, params)
        return f"({left_sql} OR {right_sql})"
    raise ParseError(f"Unknown node type: {node.type}")


# ------------------------------------------------------------------
# 4. SCREENER ENGINE
# ------------------------------------------------------------------
class ScreenerEngine:
    """
    Main entry point. Example:

        engine = ScreenerEngine()
        results, total = engine.run(
            query="PE < 20 AND ROE > 15",
            sort_by="market_cap",
            sort_dir="DESC",
            page=1,
            page_size=50,
        )
    """

    def run(
        self,
        query: str,
        sort_by: str = "market_cap",
        sort_dir: str = "DESC",
        page: int = 1,
        page_size: int = 50,
    ) -> tuple[list[dict], int]:

        # Validate sort_by against allowlist to prevent SQL injection
        allowed_sort = {
            "market_cap": "c.market_cap",
            "pe": "r.pe_ratio",
            "roe": "r.roe",
            "roce": "r.roce",
            "revenue_growth": "r.revenue_growth",
            "profit_growth": "r.profit_growth",
            "dividend_yield": "r.dividend_yield",
        }
        sort_col = allowed_sort.get(sort_by, "c.market_cap")
        sort_dir = "DESC" if sort_dir.upper() == "DESC" else "ASC"

        # Parse query into AST
        tree = parse_query(query)

        # Build WHERE clause
        params = []
        where_clause = build_sql(tree, params)

        # Latest ratios subquery (one row per company)
        latest_ratios_sql = """
            SELECT DISTINCT ON (company_id)
                company_id, pe_ratio, pb_ratio, ev_ebitda,
                roe, roce, roa, net_margin, operating_margin,
                debt_to_equity, interest_coverage, current_ratio,
                revenue_growth, profit_growth,
                dividend_yield, dividend_payout
            FROM ratios
            ORDER BY company_id, as_of_date DESC
        """

        # Count query
        count_sql = f"""
            SELECT COUNT(*)
            FROM companies c
            JOIN ({latest_ratios_sql}) r ON r.company_id = c.id
            WHERE c.is_active = TRUE AND {where_clause}
        """

        # Data query
        offset = (page - 1) * page_size
        data_sql = f"""
            SELECT
                c.id, c.name, c.nse_symbol, c.bse_code, c.sector,
                c.market_cap,
                r.pe_ratio, r.pb_ratio, r.roe, r.roce,
                r.net_margin, r.debt_to_equity, r.dividend_yield,
                r.revenue_growth, r.profit_growth
            FROM companies c
            JOIN ({latest_ratios_sql}) r ON r.company_id = c.id
            WHERE c.is_active = TRUE AND {where_clause}
            ORDER BY {sort_col} {sort_dir} NULLS LAST
            LIMIT %s OFFSET %s
        """

        with connection.cursor() as cursor:
            cursor.execute(count_sql, params)
            total = cursor.fetchone()[0]

            cursor.execute(data_sql, params + [page_size, offset])
            columns = [col[0] for col in cursor.description]
            rows = [dict(zip(columns, row)) for row in cursor.fetchall()]

        return rows, total
