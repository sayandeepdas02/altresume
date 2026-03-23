import os
import json
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
        
        if file_obj.size > 5 * 1024 * 1024:
            return Response({"error": "File size exceeds 5MB limit"}, status=status.HTTP_400_BAD_REQUEST)
            
        ext = os.path.splitext(file_obj.name)[1].lower()
        if ext not in ['.pdf', '.docx']:
            return Response({"error": "Only PDF and DOCX files are supported"}, status=status.HTTP_400_BAD_REQUEST)
        
        title = request.data.get('title', file_obj.name)
        
        resume = Resume.objects.create(
            user=request.user,
            file=file_obj,
            file_name=file_obj.name,
            title=title,
            parsed_data={},
            structured_data={},
        )
        
        return Response({
            "resume_id": str(resume.pk),
            "file_url": request.build_absolute_uri(resume.file.url),
            "file_name": resume.file_name,
            "title": resume.title,
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
        except Exception:
            return Response({"error": "An unexpected error occurred during parsing."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        resume.parsed_data = parsed_data
        resume.save()
        
        return Response({"parsed_data": parsed_data})


class CreateResumeView(APIView):
    """Create a resume from structured form data (no file upload needed)."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        title = request.data.get('title', 'Untitled Resume')
        structured_data = request.data.get('structured_data', {})

        if not structured_data:
            return Response({"error": "structured_data is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Also store as parsed_data for backwards compatibility with optimizer
        resume = Resume.objects.create(
            user=request.user,
            title=title,
            file_name=f"{title}.json",
            structured_data=structured_data,
            parsed_data=structured_data,
        )

        return Response({
            "resume_id": str(resume.pk),
            "title": resume.title,
            "version": resume.version,
        }, status=status.HTTP_201_CREATED)


class ResumeListView(APIView):
    """List all resumes for the authenticated user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        resumes = Resume.objects.filter(user=request.user).order_by('-updated_at')
        data = []
        for r in resumes:
            data.append({
                "id": str(r.pk),
                "title": r.title,
                "file_name": r.file_name,
                "version": r.version,
                "has_file": bool(r.file),
                "has_structured_data": bool(r.structured_data),
                "created_at": r.created_at,
                "updated_at": r.updated_at,
            })
        return Response(data, status=status.HTTP_200_OK)


class ResumeDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            resume = Resume.objects.get(pk=ObjectId(pk), user=request.user)
            response_data = {
                "id": str(resume.pk),
                "title": resume.title,
                "file_name": resume.file_name,
                "parsed_data": resume.parsed_data,
                "structured_data": resume.structured_data,
                "version": resume.version,
                "parent_resume_id": resume.parent_resume_id,
                "created_at": resume.created_at,
                "updated_at": resume.updated_at,
            }
            if resume.file:
                response_data["file_url"] = request.build_absolute_uri(resume.file.url)
            return Response(response_data)
        except Resume.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

    def put(self, request, pk):
        """Update a resume's structured data and/or title."""
        try:
            resume = Resume.objects.get(pk=ObjectId(pk), user=request.user)
        except Resume.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        if 'title' in request.data:
            resume.title = request.data['title']
        if 'structured_data' in request.data:
            resume.structured_data = request.data['structured_data']
            resume.parsed_data = request.data['structured_data']

        resume.save()
        return Response({
            "id": str(resume.pk),
            "title": resume.title,
            "version": resume.version,
            "updated_at": resume.updated_at,
        })

    def delete(self, request, pk):
        try:
            resume = Resume.objects.get(pk=ObjectId(pk), user=request.user)
            if resume.file:
                resume.file.delete(save=False)
            resume.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Resume.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)


class DuplicateResumeView(APIView):
    """Clone a resume as a new version."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            source = Resume.objects.get(pk=ObjectId(pk), user=request.user)
        except Resume.DoesNotExist:
            return Response({"error": "Resume not found"}, status=status.HTTP_404_NOT_FOUND)

        # Find max version for this chain
        max_version = source.version
        siblings = Resume.objects.filter(
            user=request.user,
            parent_resume_id=str(source.pk),
        )
        for s in siblings:
            if s.version > max_version:
                max_version = s.version

        new_title = request.data.get('title', f"{source.title} (Copy)")

        clone = Resume.objects.create(
            user=request.user,
            title=new_title,
            file_name=source.file_name,
            parsed_data=source.parsed_data,
            structured_data=source.structured_data,
            version=max_version + 1,
            parent_resume_id=str(source.pk),
        )

        return Response({
            "resume_id": str(clone.pk),
            "title": clone.title,
            "version": clone.version,
            "parent_resume_id": clone.parent_resume_id,
        }, status=status.HTTP_201_CREATED)
