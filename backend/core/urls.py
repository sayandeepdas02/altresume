from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('authentication.urls')),
    path('api/resume/', include('resumes.urls')),
    path('api/jd/', include('jd.urls')),
    path('api/optimize/', include('optimization.urls')),
    path('api/export/', include('export.urls')),
    path('api/career/', include('career.urls')),
    path('api/extension/', include('career.extension_urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
