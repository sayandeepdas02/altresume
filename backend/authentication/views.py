import os
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from django.contrib.auth import get_user_model
from google.oauth2 import id_token
from google.auth.transport import requests
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

class GoogleAuthView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('credential')
        if not token:
            return Response({'error': 'No credential provided'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            client_id = os.getenv('NEXT_PUBLIC_GOOGLE_CLIENT_ID') or os.getenv('GOOGLE_CLIENT_ID')
            # Warning: for local dev, we might skip full validation if client_id is not set securely
            if client_id:
                idinfo = id_token.verify_oauth2_token(token, requests.Request(), client_id)
            else:
                # If no client ID provided via env, attempt verification without strict audience check.
                # (Not recommended for prod, but helps in local dev without strict setup)
                idinfo = id_token.verify_oauth2_token(token, requests.Request())
            
            email = idinfo['email']
            name = idinfo.get('name', '')

            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'name': name,
                    'auth_provider': 'google'
                }
            )

            refresh = RefreshToken.for_user(user)

            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': {
                    'id': str(user.pk),
                    'email': user.email,
                    'name': user.name,
                    'onboarding_completed': getattr(user, 'onboarding_completed', False)
                }
            })

        except ValueError as e:
            return Response({'error': 'ValueError: ' + str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': 'Server Error: ' + str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'id': str(user.pk),
            'email': user.email,
            'name': user.name,
            'auth_provider': user.auth_provider,
            'onboarding_completed': user.onboarding_completed,
            'linkedin_url': user.linkedin_url,
            'job_title': user.job_title,
            'current_company': user.current_company,
            'created_at': user.created_at
        })

    def patch(self, request):
        user = request.user
        data = request.data
        
        # Mandatory field validation securely enforced
        if 'linkedin_url' in data and not data['linkedin_url']:
            return Response({'error': 'LinkedIn URL is mandatory.'}, status=status.HTTP_400_BAD_REQUEST)
        if 'name' in data and not data['name']:
            return Response({'error': 'Name is mandatory.'}, status=status.HTTP_400_BAD_REQUEST)

        # Apply updates
        if 'name' in data:
            user.name = data['name']
        if 'linkedin_url' in data:
            user.linkedin_url = data['linkedin_url']
        if 'job_title' in data:
            user.job_title = data['job_title']
        if 'current_company' in data:
            user.current_company = data['current_company']
            
        # If mandatory fields are provided, toggle onboarding success
        if user.name and user.linkedin_url:
            user.onboarding_completed = True
            
        user.save()
        
        return Response({
            'id': str(user.pk),
            'email': user.email,
            'name': user.name,
            'onboarding_completed': user.onboarding_completed,
            'linkedin_url': user.linkedin_url,
            'job_title': user.job_title,
            'current_company': user.current_company
        })
