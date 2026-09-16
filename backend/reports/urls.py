from django.urls import path
from .views import DashboardSummaryView, DashboardChartsView, DetailedReportsView

urlpatterns = [
    path('summary/', DashboardSummaryView.as_view(), name='dashboard_summary'),
    path('charts/', DashboardChartsView.as_view(), name='dashboard_charts'),
    path('detailed/', DetailedReportsView.as_view(), name='detailed_reports'),
]
