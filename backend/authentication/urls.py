from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import GoogleAuthView, UserProfileView

urlpatterns = [
    path('auth/google/', GoogleAuthView.as_view(), name='google_auth'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('user/', UserProfileView.as_view(), name='user_profile'),
]
