from django.urls import path
from .views import ExtensionOptimizeView

urlpatterns = [
    path('optimize', ExtensionOptimizeView.as_view(), name='extension-optimize'),
]
