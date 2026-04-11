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
    OutreachView,
    AnalyticsView,
    BatchEvaluateView,
    DeepResearchView,
    ExtensionOptimizeView,
    ExtensionFormAssistView,
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

    # New: Outreach, Analytics, Batch, Research
    path('outreach', OutreachView.as_view(), name='career-outreach'),
    path('analytics', AnalyticsView.as_view(), name='career-analytics'),
    path('batch-evaluate', BatchEvaluateView.as_view(), name='career-batch-evaluate'),
    path('deep-research', DeepResearchView.as_view(), name='career-deep-research'),

    # Chrome Extension
    path('extension/optimize', ExtensionOptimizeView.as_view(), name='career-extension-optimize'),
    path('extension/assist', ExtensionFormAssistView.as_view(), name='career-extension-assist'),
]

