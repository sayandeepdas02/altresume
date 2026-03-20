import os
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.conf import settings
from .models import Resume
from .services.parser import parse_resume
from bson import ObjectId

class UploadResumeView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Max size 5MB
        if file_obj.size > 5 * 1024 * 1024:
            return Response({"error": "File size exceeds 5MB limit"}, status=status.HTTP_400_BAD_REQUEST)
            
        ext = os.path.splitext(file_obj.name)[1].lower()
        if ext not in ['.pdf', '.docx']:
            return Response({"error": "Only PDF and DOCX files are supported"}, status=status.HTTP_400_BAD_REQUEST)
        
        resume = Resume.objects.create(
            user=request.user,
            file=file_obj,
            file_name=file_obj.name,
            parsed_data={}
        )
        
        return Response({
            "resume_id": str(resume.pk),
            "file_url": request.build_absolute_uri(resume.file.url),
            "file_name": resume.file_name
        }, status=status.HTTP_201_CREATED)


class ParseResumeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        resume_id = request.data.get('resume_id')
        if not resume_id:
            return Response({"error": "resume_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            resume = Resume.objects.get(pk=ObjectId(resume_id))
        except Resume.DoesNotExist:
            return Response({"error": "Resume not found"}, status=status.HTTP_404_NOT_FOUND)
        
        file_path = resume.file.path
        if not os.path.exists(file_path):
            return Response({"error": "File does not exist on server"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            parsed_data = parse_resume(file_path)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": "An unexpected error occurred during parsing."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        resume.parsed_data = parsed_data
        resume.save()
        
        return Response({
            "parsed_data": parsed_data
        })

class ResumeDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            resume = Resume.objects.get(pk=pk, user=request.user)
            return Response({
                "id": str(resume.pk),
                "file_url": request.build_absolute_uri(resume.file.url),
                "file_name": resume.file_name,
                "parsed_data": resume.parsed_data,
                "created_at": resume.created_at
            })
        except Resume.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        try:
            resume = Resume.objects.get(pk=pk, user=request.user)
            if resume.file:
                resume.file.delete(save=False)
            resume.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Resume.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
