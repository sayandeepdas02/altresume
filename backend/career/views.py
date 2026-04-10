"""
Career pipeline API views.

Endpoints:
  POST /api/career/scan         — Trigger portal scan (async)
  POST /api/career/evaluate     — Evaluate a job listing (async)
  POST /api/career/optimize     — Full pipeline: evaluate + optimize + PDF (async)
  GET  /api/career/pipeline     — List all pipeline runs
  GET  /api/career/pipeline/:id — Get single pipeline run status
  GET  /api/career/jobs         — List discovered jobs (paginated)
  GET  /api/career/jobs/:id     — Get single job with evaluation
  PATCH /api/career/jobs/:id    — Update job status
  POST /api/career/profile      — Create/update career profile
  GET  /api/career/profile      — Get career profile
"""

import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from bson import ObjectId

from .models import CareerProfile, JobListing, PipelineRun
from .serializers import (
    CareerProfileSerializer,
    JobListingSerializer,
    JobListingSummarySerializer,
    PipelineRunSerializer,
    ScanRequestSerializer,
    EvaluateRequestSerializer,
    OptimizeRequestSerializer,
)
from .tasks import scan_jobs_task, evaluate_job_task, optimize_pipeline_task

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Career Profile
# ---------------------------------------------------------------------------

class CareerProfileView(APIView):
    """Create, update, or retrieve the user's career targeting profile."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            profile = CareerProfile.objects.get(user=request.user)
            return Response(CareerProfileSerializer(profile).data)
        except CareerProfile.DoesNotExist:
            return Response(
                {"error": "No career profile found. Create one with POST /api/career/profile."},
                status=status.HTTP_404_NOT_FOUND,
            )

    def post(self, request):
        """Create or update career profile."""
        profile, created = CareerProfile.objects.get_or_create(
            user=request.user,
            defaults={
                "target_roles": request.data.get("target_roles", []),
                "target_companies": request.data.get("target_companies", []),
                "excluded_keywords": request.data.get("excluded_keywords", []),
                "salary_range": request.data.get("salary_range", {}),
                "location_preferences": request.data.get("location_preferences", {}),
            },
        )

        if not created:
            serializer = CareerProfileSerializer(profile, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            profile.refresh_from_db()

        return Response(
            CareerProfileSerializer(profile).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


# ---------------------------------------------------------------------------
# Job Scanning
# ---------------------------------------------------------------------------

class ScanJobsView(APIView):
    """Trigger an async portal scan for new job listings."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ScanRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Check if user has a career profile
        if not CareerProfile.objects.filter(user=request.user).exists():
            return Response(
                {"error": "Create a career profile first (POST /api/career/profile)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check for running scans
        active_scans = PipelineRun.objects.filter(
            user=request.user,
            run_type="scan",
            status__in=["pending", "running"],
        ).count()
        if active_scans > 0:
            return Response(
                {"error": "A scan is already in progress. Please wait for it to complete."},
                status=status.HTTP_409_CONFLICT,
            )

        # Create pipeline run record
        run = PipelineRun.objects.create(
            user=request.user,
            run_type="scan",
            status="pending",
            input_data=serializer.validated_data,
        )

        # Dispatch Celery task
        task = scan_jobs_task.delay(
            user_id=str(request.user.pk),
            pipeline_run_id=str(run.pk),
        )

        run.celery_task_id = task.id
        run.save()

        logger.info("[API] Scan triggered for user %s (run=%s)", request.user.email, run.pk)

        return Response({
            "pipeline_run_id": str(run.pk),
            "task_id": task.id,
            "status": "pending",
            "message": "Scan started. Poll /api/career/pipeline/{id} for status.",
        }, status=status.HTTP_202_ACCEPTED)


# ---------------------------------------------------------------------------
# Job Evaluation
# ---------------------------------------------------------------------------

class EvaluateJobView(APIView):
    """Evaluate a job listing against the user's resume."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = EvaluateRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        job = None

        # If job_listing_id provided, use existing listing
        if data.get("job_listing_id"):
            try:
                job = JobListing.objects.get(
                    pk=ObjectId(data["job_listing_id"]),
                    user=request.user,
                )
            except JobListing.DoesNotExist:
                return Response(
                    {"error": "Job listing not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )

        # If URL or JD text provided, create a new listing
        if not job:
            jd_text = data.get("job_description", "")
            company = data.get("company", "Unknown")
            role = data.get("role", "Unknown Role")

            # If no role/company provided but JD exists, try to extract them
            if jd_text and company == "Unknown" and role == "Unknown Role":
                # Quick extraction from first lines of JD
                lines = jd_text.strip().split("\n")
                if lines:
                    first_line = lines[0].strip()
                    if len(first_line) < 100:
                        role = first_line

            job = JobListing.objects.create(
                user=request.user,
                company=company,
                role=role,
                url=data.get("job_url", ""),
                raw_jd=jd_text,
                source="manual",
                status="new",
            )

        # Create pipeline run
        run = PipelineRun.objects.create(
            user=request.user,
            run_type="evaluate",
            status="pending",
            input_data={"job_listing_id": str(job.pk)},
        )

        # Dispatch Celery task
        task = evaluate_job_task.delay(
            user_id=str(request.user.pk),
            job_listing_id=str(job.pk),
            pipeline_run_id=str(run.pk),
            resume_id=data.get("resume_id", ""),
        )

        run.celery_task_id = task.id
        run.save()

        logger.info("[API] Evaluate triggered for job %s (run=%s)", job.pk, run.pk)

        return Response({
            "pipeline_run_id": str(run.pk),
            "job_listing_id": str(job.pk),
            "task_id": task.id,
            "status": "pending",
            "message": "Evaluation started. Poll /api/career/pipeline/{id} for status.",
        }, status=status.HTTP_202_ACCEPTED)


# ---------------------------------------------------------------------------
# Full Pipeline (Evaluate + Optimize + PDF)
# ---------------------------------------------------------------------------

class OptimizePipelineView(APIView):
    """Full pipeline: evaluate job → optimize resume → generate PDF."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = OptimizeRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            job = JobListing.objects.get(
                pk=ObjectId(data["job_listing_id"]),
                user=request.user,
            )
        except JobListing.DoesNotExist:
            return Response(
                {"error": "Job listing not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Create pipeline run
        run = PipelineRun.objects.create(
            user=request.user,
            run_type="optimize",
            status="pending",
            input_data=data,
        )

        # Dispatch the full optimize pipeline task (NOT just evaluate)
        task = optimize_pipeline_task.delay(
            user_id=str(request.user.pk),
            job_listing_id=str(job.pk),
            pipeline_run_id=str(run.pk),
            resume_id=data.get("resume_id", ""),
        )

        run.celery_task_id = task.id
        run.save()

        logger.info("[API] Full pipeline triggered for job %s (run=%s)", job.pk, run.pk)

        return Response({
            "pipeline_run_id": str(run.pk),
            "task_id": task.id,
            "status": "pending",
            "message": "Full pipeline started (evaluate → optimize → PDF). Poll /api/career/pipeline/{id}.",
        }, status=status.HTTP_202_ACCEPTED)


# ---------------------------------------------------------------------------
# Pipeline Status
# ---------------------------------------------------------------------------

class PipelineListView(APIView):
    """List all pipeline runs for the current user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        runs = PipelineRun.objects.filter(user=request.user).order_by('-started_at')[:50]
        return Response(PipelineRunSerializer(runs, many=True).data)


class PipelineDetailView(APIView):
    """Get status of a specific pipeline run."""
    permission_classes = [IsAuthenticated]

    def get(self, request, run_id):
        try:
            run = PipelineRun.objects.get(pk=ObjectId(run_id), user=request.user)
            return Response(PipelineRunSerializer(run).data)
        except PipelineRun.DoesNotExist:
            return Response(
                {"error": "Pipeline run not found."},
                status=status.HTTP_404_NOT_FOUND,
            )


# ---------------------------------------------------------------------------
# Job Listings
# ---------------------------------------------------------------------------

class JobListView(APIView):
    """List all discovered jobs for the current user (paginated)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = JobListing.objects.filter(user=request.user)

        # Filters
        job_status = request.query_params.get("status")
        if job_status:
            queryset = queryset.filter(status=job_status)

        recommendation = request.query_params.get("recommendation")
        if recommendation:
            queryset = queryset.filter(recommendation=recommendation)

        min_score = request.query_params.get("min_score")
        if min_score:
            try:
                queryset = queryset.filter(score__gte=float(min_score))
            except ValueError:
                pass

        company = request.query_params.get("company")
        if company:
            queryset = queryset.filter(company__icontains=company)

        # Pagination
        try:
            limit = min(int(request.query_params.get("limit", 50)), 100)
        except (ValueError, TypeError):
            limit = 50
        try:
            offset = max(int(request.query_params.get("offset", 0)), 0)
        except (ValueError, TypeError):
            offset = 0

        total = queryset.count()
        page = queryset[offset:offset + limit]

        return Response({
            "total": total,
            "limit": limit,
            "offset": offset,
            "jobs": JobListingSummarySerializer(page, many=True).data,
        })


class JobDetailView(APIView):
    """Get or update a single job listing."""
    permission_classes = [IsAuthenticated]

    def get(self, request, job_id):
        try:
            job = JobListing.objects.get(pk=ObjectId(job_id), user=request.user)
            return Response(JobListingSerializer(job).data)
        except JobListing.DoesNotExist:
            return Response(
                {"error": "Job listing not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

    def patch(self, request, job_id):
        """Update job status or raw_jd."""
        try:
            job = JobListing.objects.get(pk=ObjectId(job_id), user=request.user)
        except JobListing.DoesNotExist:
            return Response(
                {"error": "Job listing not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        allowed_fields = {"status", "raw_jd"}
        for field_name in allowed_fields:
            if field_name in request.data:
                setattr(job, field_name, request.data[field_name])

        job.save()
        return Response(JobListingSerializer(job).data)


# ---------------------------------------------------------------------------
# Applications
# ---------------------------------------------------------------------------

from .models import Application
from .serializers import ApplicationSerializer
import datetime

class ApplyJobView(APIView):
    """Mark a job as applied and track application."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        job_listing_id = request.data.get("job_listing_id")
        resume_id = request.data.get("resume_id")
        
        if not job_listing_id:
            return Response({"error": "job_listing_id is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            job = JobListing.objects.get(pk=ObjectId(job_listing_id), user=request.user)
        except JobListing.DoesNotExist:
            return Response({"error": "Job listing not found."}, status=status.HTTP_404_NOT_FOUND)
            
        # Optional: could link specific resume, cover letter, etc.
        # This acts as the final "I hit apply" log.
        app, created = Application.objects.get_or_create(
            user=request.user,
            job=job,
            defaults={
                "status": "applied",
                "applied_at": datetime.datetime.utcnow(),
            }
        )
        
        if not created:
            app.status = "applied"
            app.applied_at = datetime.datetime.utcnow()
            app.save()
            
        # Update JobListing state just in case
        if job.status != "applied":
            job.status = "applied"
            job.save()
            
        return Response(ApplicationSerializer(app).data, status=status.HTTP_201_CREATED)


class ApplicationListView(APIView):
    """List all tracked applications."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        apps = Application.objects.filter(user=request.user).select_related('job', 'assets')
        return Response(ApplicationSerializer(apps, many=True).data)


# ---------------------------------------------------------------------------
# Chrome Extension Integration
# ---------------------------------------------------------------------------

from services.ai_service import evaluate_job, optimize_resume

class ExtensionOptimizeView(APIView):
    """Synchronous optimization specifically for the Chrome Extension."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        jd_text = request.data.get("job_description")
        resume_id = request.data.get("resume_id")

        if not jd_text:
            return Response({"error": "job_description is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Get resume
        from resumes.models import Resume
        if resume_id:
            try:
                resume = Resume.objects.get(pk=ObjectId(resume_id), user=request.user)
            except Resume.DoesNotExist:
                return Response({"error": "Resume not found."}, status=status.HTTP_404_NOT_FOUND)
        else:
            resume = Resume.objects.filter(user=request.user).order_by('-created_at').first()
            if not resume:
                return Response({"error": "No resume found."}, status=status.HTTP_404_NOT_FOUND)

        resume_data = resume.parsed_data or resume.structured_data or {}
        if not resume_data:
            return Response({"error": "Resume has no parsed data."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Synchronous processing for extension prompt UX
            eval_result = evaluate_job(resume_data, jd_text)
            optimization = optimize_resume(resume_data, jd_text, eval_result)
            
            # Construct JSON structure for Extension consumption
            out = {
                "match_score": eval_result.get("match_score", 0),
                "recommendation": eval_result.get("recommendation", "SKIP"),
                "resume_optimization": optimization.get("bullet_rewrites", []),
                "optimized_summary": optimization.get("optimized_summary", ""),
                "cover_letter_placeholder": f"To Hiring Manager... (Role: {eval_result.get('job_title', 'Unknown')})",
                "status": "success"
            }
            return Response(out)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


