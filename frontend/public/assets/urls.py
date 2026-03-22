# urls.py — paste into your app's urls.py

from django.urls import path
from . import views

urlpatterns = [
    # Companies
    path("companies/", views.CompanyListView.as_view(), name="company-list"),
    path("companies/<str:nse_symbol>/", views.CompanyDetailView.as_view(), name="company-detail"),
    path("companies/<str:nse_symbol>/financials/", views.CompanyFinancialsView.as_view(), name="company-financials"),
    path("companies/<str:nse_symbol>/prices/", views.CompanyPricesView.as_view(), name="company-prices"),

    # Screener
    path("screener/run/", views.ScreenerRunView.as_view(), name="screener-run"),
    path("screener/save/", views.ScreenerSaveView.as_view(), name="screener-save"),
]

# In your project's main urls.py, add:
# path("api/v1/", include("your_app_name.urls")),
