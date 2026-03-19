from django.urls import path
from .views import UploadResumeView, ParseResumeView, ResumeDetailView

urlpatterns = [
    path('upload/', UploadResumeView.as_view(), name='resume-upload'),
    path('parse/', ParseResumeView.as_view(), name='resume-parse'),
    path('<str:pk>/', ResumeDetailView.as_view(), name='resume-detail'),
]
