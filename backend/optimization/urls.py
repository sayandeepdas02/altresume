from django.urls import path
from .views import OptimizeResumeView, SaveOptimizationView, OptimizationHistoryView

urlpatterns = [
    path('', OptimizeResumeView.as_view(), name='optimize-now'),
    path('save/', SaveOptimizationView.as_view(), name='optimize-save'),
    path('history/', OptimizationHistoryView.as_view(), name='optimize-history'),
]
