from django.urls import path
from .views import AnalyzeJDView

urlpatterns = [
    path('analyze/', AnalyzeJDView.as_view(), name='analyze-jd'),
]
