from django.urls import path
from .views import TemplatesListView, ExportPDFView

urlpatterns = [
    path('templates/', TemplatesListView.as_view(), name='export-templates'),
    path('pdf/', ExportPDFView.as_view(), name='export-pdf'),
]
