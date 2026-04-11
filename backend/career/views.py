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

from services.ai_service import generate_form_answers

class ExtensionFormAssistView(APIView):
    """Generates answers for parsed form fields passed by the Chrome extension."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        form_fields = request.data.get("form_fields", [])
        company_name = request.data.get("company", "")
        job_role = request.data.get("role", "")
        resume_id = request.data.get("resume_id")

        if not form_fields:
            return Response({"error": "form_fields array is required."}, status=status.HTTP_400_BAD_REQUEST)

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
            answers = generate_form_answers(resume_data, form_fields, company_name, job_role)
            return Response({"answers": answers, "status": "success"})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ---------------------------------------------------------------------------
# LinkedIn Outreach Generation
# ---------------------------------------------------------------------------

from services.ai_service import generate_outreach

class OutreachView(APIView):
    """Generate personalized LinkedIn outreach message for a job listing."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        jd_text = request.data.get("job_description", "")
        job_listing_id = request.data.get("job_listing_id")
        contact_name = request.data.get("contact_name")
        contact_role = request.data.get("contact_role")

        if not jd_text and not job_listing_id:
            return Response(
                {"error": "Provide job_description text or job_listing_id."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # If job_listing_id, fetch JD from listing
        if job_listing_id and not jd_text:
            try:
                job = JobListing.objects.get(pk=ObjectId(job_listing_id), user=request.user)
                jd_text = job.raw_jd or f"Role: {job.role}\nCompany: {job.company}"
            except JobListing.DoesNotExist:
                return Response({"error": "Job listing not found."}, status=status.HTTP_404_NOT_FOUND)

        # Get resume
        from resumes.models import Resume
        resume = Resume.objects.filter(user=request.user).order_by('-created_at').first()
        resume_data = (resume.parsed_data or resume.structured_data or {}) if resume else {}

        try:
            result = generate_outreach(resume_data, jd_text, contact_name, contact_role)
            return Response(result)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ---------------------------------------------------------------------------
# Application Pattern Analytics
# ---------------------------------------------------------------------------

from django.db.models import Count, Avg, Q, F
from collections import Counter

class AnalyticsView(APIView):
    """Compute application funnel, archetype performance, and actionable insights."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        apps = Application.objects.filter(user=request.user).select_related('job')
        jobs = JobListing.objects.filter(user=request.user)

        total_apps = apps.count()
        total_jobs = jobs.count()

        if total_apps == 0 and total_jobs == 0:
            return Response({
                "error": "No data yet. Start scanning jobs and applying.",
                "has_data": False,
            })

        # --- Funnel ---
        funnel = {}
        for s in ['new', 'evaluated', 'applied', 'interview', 'offer', 'rejected', 'discarded', 'skipped']:
            funnel[s] = jobs.filter(status=s).count()

        # --- Score distribution ---
        scored_jobs = jobs.exclude(score__isnull=True)
        score_stats = scored_jobs.aggregate(
            avg_score=Avg('score'),
            count=Count('id'),
        )

        score_buckets = {
            'high_fit': scored_jobs.filter(score__gte=3.5).count(),
            'medium_fit': scored_jobs.filter(score__gte=2.5, score__lt=3.5).count(),
            'low_fit': scored_jobs.filter(score__lt=2.5).count(),
        }

        # --- Recommendation breakdown ---
        rec_breakdown = {
            'apply': jobs.filter(recommendation='apply').count(),
            'maybe': jobs.filter(recommendation='maybe').count(),
            'skip': jobs.filter(recommendation='skip').count(),
        }

        # --- Archetype performance ---
        archetype_data = {}
        for job in jobs.exclude(archetype=''):
            arch = job.archetype or 'Unknown'
            if arch not in archetype_data:
                archetype_data[arch] = {'total': 0, 'applied': 0, 'interview': 0, 'offer': 0, 'rejected': 0}
            archetype_data[arch]['total'] += 1
            if job.status in ['applied', 'responded']:
                archetype_data[arch]['applied'] += 1
            elif job.status == 'interview':
                archetype_data[arch]['interview'] += 1
            elif job.status == 'offer':
                archetype_data[arch]['offer'] += 1
            elif job.status == 'rejected':
                archetype_data[arch]['rejected'] += 1

        # --- Top missing skills ---
        skill_counter = Counter()
        for job in scored_jobs:
            eval_data = job.evaluation_data or {}
            for skill in eval_data.get('missing_skills', eval_data.get('gaps', [])):
                skill_counter[skill] += 1

        top_skill_gaps = [{"skill": s, "frequency": c} for s, c in skill_counter.most_common(10)]

        # --- Application status summary ---
        app_statuses = {}
        for a in apps:
            app_statuses[a.status] = app_statuses.get(a.status, 0) + 1

        # --- Recommendations ---
        recommendations = []

        if score_buckets['low_fit'] > score_buckets['high_fit']:
            recommendations.append({
                "action": "Tighten your career profile targeting — most scanned jobs are low fit.",
                "impact": "high",
                "reasoning": f"{score_buckets['low_fit']} low-fit jobs vs {score_buckets['high_fit']} high-fit. Update target roles or excluded keywords.",
            })

        if top_skill_gaps:
            top3 = ', '.join([g['skill'] for g in top_skill_gaps[:3]])
            recommendations.append({
                "action": f"Address recurring skill gaps: {top3}",
                "impact": "high",
                "reasoning": "These skills appear most frequently in your missing requirements. Consider adding them to your resume or upskilling.",
            })

        best_arch = max(archetype_data.items(), key=lambda x: x[1].get('interview', 0) + x[1].get('offer', 0), default=None)
        if best_arch and (best_arch[1].get('interview', 0) + best_arch[1].get('offer', 0)) > 0:
            recommendations.append({
                "action": f'Double down on "{best_arch[0]}" roles — best conversion rate.',
                "impact": "medium",
                "reasoning": f"{best_arch[1]['interview'] + best_arch[1]['offer']} positive outcomes from {best_arch[1]['total']} applications in this archetype.",
            })

        if funnel.get('skipped', 0) > total_jobs * 0.4:
            recommendations.append({
                "action": "Too many jobs being skipped. Refine scan filters.",
                "impact": "medium",
                "reasoning": f"{funnel['skipped']} of {total_jobs} jobs skipped. Update career profile exclusions.",
            })

        return Response({
            "has_data": True,
            "total_jobs": total_jobs,
            "total_applications": total_apps,
            "funnel": funnel,
            "score_stats": {
                "avg": round(score_stats['avg_score'] or 0, 1),
                "total_scored": score_stats['count'] or 0,
            },
            "score_buckets": score_buckets,
            "recommendation_breakdown": rec_breakdown,
            "archetype_performance": archetype_data,
            "top_skill_gaps": top_skill_gaps,
            "application_statuses": app_statuses,
            "recommendations": recommendations,
        })


# ---------------------------------------------------------------------------
# Batch Evaluation
# ---------------------------------------------------------------------------

class BatchEvaluateView(APIView):
    """Evaluate multiple job descriptions in one request."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        job_descriptions = request.data.get("job_descriptions", [])
        if not job_descriptions or not isinstance(job_descriptions, list):
            return Response(
                {"error": "Provide 'job_descriptions' as a list of {role, company, description} objects."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(job_descriptions) > 20:
            return Response(
                {"error": "Maximum 20 job descriptions per batch."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        results = []
        for idx, jd_obj in enumerate(job_descriptions):
            role = jd_obj.get("role", f"Role {idx + 1}")
            company = jd_obj.get("company", "Unknown")
            description = jd_obj.get("description", "")

            if not description:
                results.append({"index": idx, "role": role, "company": company, "error": "No description provided"})
                continue

            # Create job listing
            job, _ = JobListing.objects.get_or_create(
                user=request.user,
                company=company,
                role=role,
                defaults={
                    "raw_jd": description,
                    "source": "batch",
                    "status": "new",
                },
            )

            # Create pipeline run for each
            run = PipelineRun.objects.create(
                user=request.user,
                run_type="evaluate",
                status="pending",
                input_data={"job_listing_id": str(job.pk), "batch_index": idx},
            )

            # Dispatch Celery task
            task = evaluate_job_task.delay(
                user_id=str(request.user.pk),
                job_listing_id=str(job.pk),
                pipeline_run_id=str(run.pk),
            )

            run.celery_task_id = task.id
            run.save()

            results.append({
                "index": idx,
                "role": role,
                "company": company,
                "job_listing_id": str(job.pk),
                "pipeline_run_id": str(run.pk),
                "task_id": task.id,
                "status": "pending",
            })

        return Response({
            "total": len(job_descriptions),
            "queued": len([r for r in results if r.get("status") == "pending"]),
            "results": results,
            "message": "Batch evaluation started. Poll individual pipeline runs for status.",
        }, status=status.HTTP_202_ACCEPTED)


# ---------------------------------------------------------------------------
# Deep Company Research
# ---------------------------------------------------------------------------

class DeepResearchView(APIView):
    """Generate structured research prompt / intelligence for a company."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        company = request.data.get("company", "")
        role = request.data.get("role", "")
        job_listing_id = request.data.get("job_listing_id")

        if not company and not job_listing_id:
            return Response(
                {"error": "Provide company name or job_listing_id."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # If job_listing_id provided, extract company + role
        if job_listing_id:
            try:
                job = JobListing.objects.get(pk=ObjectId(job_listing_id), user=request.user)
                company = company or job.company
                role = role or job.role
            except JobListing.DoesNotExist:
                return Response({"error": "Job listing not found."}, status=status.HTTP_404_NOT_FOUND)

        # Get resume for candidate context
        from resumes.models import Resume
        resume = Resume.objects.filter(user=request.user).order_by('-created_at').first()
        resume_data = (resume.parsed_data or resume.structured_data or {}) if resume else {}

        candidate_skills = []
        if isinstance(resume_data.get('skills'), dict):
            candidate_skills = resume_data['skills'].get('hard_skills', [])
        elif isinstance(resume_data.get('skills'), list):
            candidate_skills = resume_data['skills']

        candidate_experience = []
        for exp in resume_data.get('experience', []):
            if isinstance(exp, dict):
                candidate_experience.append(f"{exp.get('role', '')} at {exp.get('company', '')}")

        # Generate structured research template
        research = {
            "company": company,
            "role": role,
            "research_axes": {
                "ai_strategy": {
                    "title": "AI & Technology Strategy",
                    "queries": [
                        f'"{company}" AI ML engineering blog',
                        f'"{company}" technology stack architecture',
                        f'"{company}" engineering team culture',
                    ],
                    "questions": [
                        f"What AI/ML products does {company} build?",
                        f"What is {company}'s technology stack?",
                        f"Do they have an engineering blog? What do they publish about?",
                    ],
                },
                "recent_moves": {
                    "title": "Recent Developments (Last 6 Months)",
                    "queries": [
                        f'"{company}" funding round 2026',
                        f'"{company}" product launch 2026',
                        f'"{company}" acquisition partnership 2026',
                    ],
                    "questions": [
                        "Any recent funding rounds or leadership changes?",
                        "New product launches or pivots?",
                        "Notable hires or acquisitions?",
                    ],
                },
                "engineering_culture": {
                    "title": "Engineering Culture",
                    "queries": [
                        f'"{company}" engineering culture site:glassdoor.com',
                        f'"{company}" developer experience site:teamblind.com',
                    ],
                    "questions": [
                        "How do they ship? (deploy cadence, CI/CD)",
                        "Remote-first or office-first?",
                        "What do engineers say about working there?",
                    ],
                },
                "challenges": {
                    "title": "Likely Technical Challenges",
                    "questions": [
                        f"What scaling problems does {company} face?",
                        "Reliability, cost, or latency challenges?",
                        "Any ongoing platform migrations?",
                    ],
                },
                "competitors": {
                    "title": "Competitive Landscape",
                    "questions": [
                        f"Who are {company}'s main competitors?",
                        "What is their differentiator/moat?",
                        "How do they position vs competition?",
                    ],
                },
                "candidate_angle": {
                    "title": "Your Unique Angle",
                    "candidate_skills": candidate_skills[:10],
                    "candidate_experience": candidate_experience[:5],
                    "questions": [
                        f"What unique value do you bring to {company}?",
                        "Which of your projects is most relevant?",
                        "What story should you tell in the interview?",
                    ],
                },
            },
            "status": "success",
        }

        return Response(research)
