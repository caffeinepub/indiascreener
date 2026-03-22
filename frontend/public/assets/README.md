# Screener.in Clone — Setup Guide

## Project Structure

```
backend/               ← Django project
  screener_app/
    models.py          ← All database models
    views.py           ← REST API views + serializers
    urls.py            ← URL routing
    screener_engine.py ← Query parser + SQL generator
    tasks.py           ← Celery data pipeline tasks
    settings_additions.py ← Paste into settings.py

frontend/              ← Next.js project
  app/
    company/[symbol]/page.tsx   ← Company detail page
    screener/page.tsx           ← Main screener page
```

---

## Step 1 — Backend Setup

```bash
# Create Django project
pip install django djangorestframework psycopg2-binary \
  celery redis django-cors-headers yfinance pandas

django-admin startproject myproject
cd myproject
python manage.py startapp screener_app
```

Copy these files into `screener_app/`:
- `models.py`
- `views.py`
- `urls.py`
- `screener_engine.py`
- `tasks.py`

In `myproject/settings.py`, add everything from `settings_additions.py`.

In `myproject/urls.py`:
```python
from django.urls import path, include

urlpatterns = [
    path("api/v1/", include("screener_app.urls")),
]
```

---

## Step 2 — Database Setup

```bash
# Create PostgreSQL database
psql -U postgres -c "CREATE DATABASE screener_db;"
psql -U postgres -c "CREATE USER screener_user WITH PASSWORD 'your_password';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE screener_db TO screener_user;"

# Optional: Install TimescaleDB (for price_data performance)
# https://docs.timescale.com/install/latest/

# Run migrations
python manage.py makemigrations screener_app
python manage.py migrate
```

---

## Step 3 — Start Redis + Celery

```bash
# Start Redis (Mac: brew install redis, Ubuntu: apt install redis)
redis-server

# Start Celery worker (in a new terminal)
celery -A myproject worker --loglevel=info

# Start Celery beat scheduler (in another terminal)
celery -A myproject beat --loglevel=info
```

Add to `myproject/celery.py`:
```python
import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "myproject.settings")
app = Celery("myproject")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()
```

In `myproject/__init__.py`:
```python
from .celery import app as celery_app
__all__ = ("celery_app",)
```

---

## Step 4 — Seed Initial Data

```python
# In Django shell: python manage.py shell

from screener_app.models import Company

# Add a test company
Company.objects.create(
    nse_symbol="RELIANCE",
    bse_code="500325",
    isin="INE002A01018",
    name="Reliance Industries Limited",
    sector="Energy",
    industry="Oil & Gas Refining & Marketing",
    market_cap=1800000,  # in Crores
)

# Backfill 5 years of prices (runs async via Celery)
from screener_app.tasks import backfill_prices
backfill_prices.delay("RELIANCE", years=5)
```

---

## Step 5 — Frontend Setup

```bash
npx create-next-app@latest frontend --typescript --tailwind --app
cd frontend
npm install @tanstack/react-query lightweight-charts

# Add to app/layout.tsx head:
# <script src="https://unpkg.com/lightweight-charts/dist/lightweight-charts.standalone.production.js"></script>
```

Copy to `frontend/app/`:
- `screener/page.tsx` → `app/screener/page.tsx`
- `company_page.tsx` → `app/company/[symbol]/page.tsx`

Add to `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

Wrap `app/layout.tsx` children with TanStack QueryClientProvider:
```tsx
"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
const client = new QueryClient();
export default function RootLayout({ children }) {
  return (
    <html><body>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </body></html>
  );
}
```

---

## Step 6 — Run Everything

```bash
# Terminal 1: Django API
python manage.py runserver

# Terminal 2: Celery worker
celery -A myproject worker --loglevel=info

# Terminal 3: Next.js frontend
cd frontend && npm run dev
```

Visit:
- Screener: http://localhost:3000/screener
- Company page: http://localhost:3000/company/RELIANCE
- API: http://localhost:8000/api/v1/companies/

---

## Test the Screener API directly

```bash
curl -X POST http://localhost:8000/api/v1/screener/run/ \
  -H "Content-Type: application/json" \
  -d '{"query": "PE < 20 AND ROE > 15", "sort_by": "market_cap", "page": 1}'
```

---

## Production Checklist

- [ ] Replace `yfinance` with a licensed data provider (Zerodha Kite Connect, etc.)
- [ ] Set `DEBUG=False` and configure `ALLOWED_HOSTS`
- [ ] Use environment variables for all secrets (python-decouple or django-environ)
- [ ] Add TimescaleDB hypertable for `price_data`: 
      `SELECT create_hypertable('price_data', 'date');`
- [ ] Configure Gunicorn + Nginx for Django
- [ ] Deploy Next.js on Vercel (free tier works great)
- [ ] Set up Cloudflare in front of your domain
- [ ] Configure Sentry for error monitoring
