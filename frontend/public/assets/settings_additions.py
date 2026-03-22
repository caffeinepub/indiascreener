# settings_additions.py
# Add these blocks to your Django settings.py
# Run: pip install django djangorestframework celery redis django-cors-headers

# ------------------------------------------------------------------
# INSTALLED APPS — add to your INSTALLED_APPS list
# ------------------------------------------------------------------
EXTRA_APPS = [
    "rest_framework",
    "corsheaders",
    "your_app_name",  # replace with your actual app name
]

# ------------------------------------------------------------------
# DATABASE — replace default DATABASES block
# ------------------------------------------------------------------
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "screener_db",
        "USER": "screener_user",
        "PASSWORD": "your_password",    # use env variable in production
        "HOST": "localhost",
        "PORT": "5432",
        "OPTIONS": {
            "connect_timeout": 10,
        },
    }
}

# ------------------------------------------------------------------
# REDIS CACHE
# ------------------------------------------------------------------
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": "redis://localhost:6379/1",
    }
}

# ------------------------------------------------------------------
# CELERY
# ------------------------------------------------------------------
CELERY_BROKER_URL = "redis://localhost:6379/0"
CELERY_RESULT_BACKEND = "redis://localhost:6379/0"
CELERY_TIMEZONE = "Asia/Kolkata"
CELERY_TASK_SERIALIZER = "json"
CELERY_ACCEPT_CONTENT = ["json"]

# Scheduled tasks (runs automatically via celery beat)
from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    # Fetch EOD prices every weekday at 6:30 PM IST
    "daily-price-ingest": {
        "task": "your_app_name.tasks.ingest_daily_prices",
        "schedule": crontab(hour=18, minute=30, day_of_week="1-5"),
    },
    # Compute ratios at 8 PM IST (after prices are in)
    "nightly-ratio-compute": {
        "task": "your_app_name.tasks.compute_ratios",
        "schedule": crontab(hour=20, minute=0, day_of_week="1-5"),
    },
}

# ------------------------------------------------------------------
# DJANGO REST FRAMEWORK
# ------------------------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
        "rest_framework.authentication.BasicAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.AllowAny",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 50,
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "100/hour",
        "user": "1000/hour",
    },
}

# ------------------------------------------------------------------
# CORS — allow your Next.js frontend
# ------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://yoursite.com",   # replace with your domain
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",   # must be first
    "django.middleware.security.SecurityMiddleware",
    # ... rest of your middleware
]

# ------------------------------------------------------------------
# SECURITY (production)
# ------------------------------------------------------------------
import os
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "dev-secret-change-in-prod")
DEBUG = os.environ.get("DEBUG", "True") == "True"
ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "localhost").split(",")
