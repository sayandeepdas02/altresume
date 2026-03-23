from django.urls import path
from .views import (
    UploadResumeView,
    ParseResumeView,
    CreateResumeView,
    ResumeListView,
    ResumeDetailView,
    DuplicateResumeView,
)

urlpatterns = [
    path('', ResumeListView.as_view(), name='resume-list'),
    path('upload/', UploadResumeView.as_view(), name='resume-upload'),
    path('parse/', ParseResumeView.as_view(), name='resume-parse'),
    path('create/', CreateResumeView.as_view(), name='resume-create'),
    path('<str:pk>/', ResumeDetailView.as_view(), name='resume-detail'),
    path('<str:pk>/duplicate/', DuplicateResumeView.as_view(), name='resume-duplicate'),
]
