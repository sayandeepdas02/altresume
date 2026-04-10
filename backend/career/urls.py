from django.urls import path
from .views import (
    CareerProfileView,
    ScanJobsView,
    EvaluateJobView,
    OptimizePipelineView,
    PipelineListView,
    PipelineDetailView,
    JobListView,
    JobDetailView,
    ApplyJobView,
    ApplicationListView,
)

urlpatterns = [
    # Career Profile
    path('profile', CareerProfileView.as_view(), name='career-profile'),

    # Pipeline Operations (async)
    path('scan', ScanJobsView.as_view(), name='career-scan'),
    path('evaluate', EvaluateJobView.as_view(), name='career-evaluate'),
    path('optimize', OptimizePipelineView.as_view(), name='career-optimize'),

    # Pipeline Status
    path('pipeline', PipelineListView.as_view(), name='career-pipeline-list'),
    path('pipeline/<str:run_id>', PipelineDetailView.as_view(), name='career-pipeline-detail'),

    # Job Listings
    path('jobs', JobListView.as_view(), name='career-jobs-list'),
    path('jobs/<str:job_id>', JobDetailView.as_view(), name='career-job-detail'),

    # Applications
    path('apply', ApplyJobView.as_view(), name='career-apply'),
    path('applications', ApplicationListView.as_view(), name='career-applications'),
]
