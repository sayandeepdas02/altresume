from django.urls import path
from .views import OptimizeResumeView, SaveOptimizationView, OptimizationHistoryView, OptimizationStatusView

urlpatterns = [
    path('', OptimizeResumeView.as_view(), name='optimize-now'),
    path('status/<str:task_id>/', OptimizationStatusView.as_view(), name='optimize-status'),
    path('save/', SaveOptimizationView.as_view(), name='optimize-save'),
    path('history/', OptimizationHistoryView.as_view(), name='optimize-history'),
]
