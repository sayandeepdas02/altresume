"""
Celery tasks for career pipeline operations.

All Career-Ops operations run as background tasks since they involve:
  - Network requests (portal scanning)
  - Headless browser (PDF generation)
  - LLM API calls (evaluation)

Tasks update PipelineRun status and store results in the database.
Every task: logs fully, catches all errors, never fails silently.
"""

import logging
import sys
import os
from pathlib import Path
from datetime import datetime, timezone

from celery import shared_task
from bson import ObjectId

logger = logging.getLogger(__name__)

# Ensure the services package is importable
SERVICES_ROOT = Path(__file__).resolve().parent.parent.parent / "services"
if str(SERVICES_ROOT.parent) not in sys.path:
    sys.path.insert(0, str(SERVICES_ROOT.parent))


# ---------------------------------------------------------------------------
# Helper: fail a pipeline run safely
# ---------------------------------------------------------------------------

def _fail_run(pipeline_run_id: str, error: str, output_data: dict = None):
    """Safely mark a pipeline run as failed."""
    try:
        from career.models import PipelineRun
        run = PipelineRun.objects.get(pk=ObjectId(pipeline_run_id))
        run.status = "failed"
        run.error = error[:2000]  # Truncate for DB safety
        if output_data:
            run.output_data = output_data
        run.completed_at = datetime.now(timezone.utc)
        run.save()
        logger.error("[Task] Pipeline run %s failed: %s", pipeline_run_id, error)
    except Exception as exc:
        logger.error("[Task] Could not update failed run %s: %s", pipeline_run_id, exc)


# ---------------------------------------------------------------------------
# TASK 1: Scan Jobs
# ---------------------------------------------------------------------------

@shared_task(bind=True, max_retries=2, soft_time_limit=300)
def scan_jobs_task(self, user_id: str, pipeline_run_id: str):
    """
    Background portal scanning via Career-Ops.

    Flow:
    1. Load user's CareerProfile → generate portals.yml
    2. Sync user's latest resume to workspace cv.md
    3. Execute scan.mjs via subprocess
    4. Store discovered jobs as JobListing records
    5. Update PipelineRun with results
    """
    from career.models import CareerProfile, JobListing, PipelineRun
    from resumes.models import Resume
    from users.models import User
    from services.career_ops_service import scan_jobs, setup_user_workspace

    run = None
    try:
        run = PipelineRun.objects.get(pk=ObjectId(pipeline_run_id))
        run.status = "running"
        run.save()
        logger.info("[Scan] Starting scan for user %s (run=%s)", user_id, pipeline_run_id)

        user = User.objects.get(pk=ObjectId(user_id))

        # Load career profile
        try:
            profile = CareerProfile.objects.get(user=user)
            config = profile.to_portals_config()
        except CareerProfile.DoesNotExist:
            _fail_run(pipeline_run_id, "No career profile found. Please configure your targeting preferences first.")
            return {"status": "failed", "error": "No career profile"}

        # Sync resume to workspace
        resume = Resume.objects.filter(user=user).order_by('-created_at').first()
        resume_data = resume.parsed_data if resume else None
        setup_user_workspace(user_id, resume_data=resume_data, profile_config=config)

        # Execute scan
        result = scan_jobs(user_id=user_id, user_config=config)

        if not result.success:
            _fail_run(pipeline_run_id, result.error or "Scan failed", {"raw_stderr": result.raw_stderr[:2000]})
            return {"status": "failed", "error": result.error}

        # Store discovered jobs
        new_count = 0
        for offer in result.data.get("new_offers", []):
            try:
                _, created = JobListing.objects.get_or_create(
                    user=user,
                    company=offer.get("company", "Unknown"),
                    role=offer.get("title", "Unknown Role"),
                    defaults={
                        "url": offer.get("url", ""),
                        "location": offer.get("location", ""),
                        "source": offer.get("source", "scan"),
                        "status": "new",
                    },
                )
                if created:
                    new_count += 1
            except Exception as exc:
                logger.warning("[Scan] Failed to store offer: %s", exc)

        # Update pipeline run
        run.status = "completed"
        run.output_data = {
            "companies_scanned": result.data.get("companies_scanned", 0),
            "total_found": result.data.get("total_found", 0),
            "new_offers_count": new_count,
            "filtered": result.data.get("filtered", 0),
            "duplicates": result.data.get("duplicates", 0),
            "execution_time": result.execution_time,
        }
        run.completed_at = datetime.now(timezone.utc)
        run.save()
        logger.info("[Scan] Completed: %d new jobs found", new_count)

        return {"status": "completed", "new_jobs": new_count}

    except Exception as exc:
        logger.error("[Scan] Task crashed: %s", exc, exc_info=True)
        if run:
            _fail_run(pipeline_run_id, str(exc))
        # Only retry on transient errors
        if "ConnectionError" in str(type(exc).__name__):
            raise self.retry(exc=exc, countdown=30)
        return {"status": "failed", "error": str(exc)}


# ---------------------------------------------------------------------------
# TASK 2: Evaluate Job
# ---------------------------------------------------------------------------

@shared_task(bind=True, max_retries=1, soft_time_limit=120)
def evaluate_job_task(self, user_id: str, job_listing_id: str, pipeline_run_id: str, resume_id: str = None):
    """
    Background job evaluation with AI scoring.

    Flow:
    1. Load job listing and user's resume
    2. If raw_jd is empty, try to parse the JD from title/company
    3. Call AI evaluation service
    4. Apply decision engine (APPLY/CONSIDER/SKIP)
    5. Update JobListing with evaluation results
    6. Update PipelineRun
    """
    from career.models import JobListing, PipelineRun
    from resumes.models import Resume
    from users.models import User
    from services.ai_service import evaluate_job

    run = None
    try:
        run = PipelineRun.objects.get(pk=ObjectId(pipeline_run_id))
        run.status = "running"
        run.save()
        logger.info("[Evaluate] Starting evaluation (job=%s, user=%s)", job_listing_id, user_id)

        user = User.objects.get(pk=ObjectId(user_id))
        job = JobListing.objects.get(pk=ObjectId(job_listing_id), user=user)

        # Get resume (latest if not specified)
        if resume_id:
            try:
                resume = Resume.objects.get(pk=ObjectId(resume_id), user=user)
            except Resume.DoesNotExist:
                _fail_run(pipeline_run_id, f"Resume {resume_id} not found.")
                return {"status": "failed", "error": "Resume not found"}
        else:
            resume = Resume.objects.filter(user=user).order_by('-created_at').first()
            if not resume:
                _fail_run(pipeline_run_id, "No resume found. Please upload a resume first.")
                return {"status": "failed", "error": "No resume found"}

        resume_data = resume.parsed_data or resume.structured_data or {}
        if not resume_data:
            _fail_run(pipeline_run_id, "Resume has no parsed data. Please re-upload and parse your resume.")
            return {"status": "failed", "error": "Empty resume data"}

        # Build JD text
        jd_text = job.raw_jd
        if not jd_text or len(jd_text.strip()) < 20:
            # Fall back to a minimal description for evaluation
            jd_text = f"Role: {job.role}\nCompany: {job.company}\nLocation: {job.location or 'Not specified'}"
            logger.warning("[Evaluate] Job %s has no JD text, using minimal description", job_listing_id)

        # Run AI evaluation
        logger.info("[Evaluate] Calling AI service for %s at %s", job.role, job.company)
        eval_result = evaluate_job(resume_data, jd_text)

        # Update job listing with results
        job.score = eval_result.get("job_score", 0.0)
        job.fit_summary = eval_result.get("fit_summary", "")
        job.archetype = eval_result.get("archetype", "")
        job.evaluation_data = eval_result
        job.status = "evaluated"
        job.evaluated_at = datetime.now(timezone.utc)

        # Map recommendation to model choices (lowercase for DB)
        rec = eval_result.get("recommendation", "SKIP").upper()
        if rec == "APPLY":
            job.recommendation = "apply"
        elif rec == "CONSIDER":
            job.recommendation = "maybe"
        else:
            job.recommendation = "skip"

        job.save()

        # Update pipeline run
        run.status = "completed"
        run.output_data = {
            "match_score": eval_result.get("match_score", 0),
            "job_score": job.score,
            "recommendation": eval_result.get("recommendation", "SKIP"),
            "fit_summary": job.fit_summary,
            "missing_skills": eval_result.get("missing_skills", []),
            "status": eval_result.get("status", "success"),
        }
        run.completed_at = datetime.now(timezone.utc)
        run.save()

        logger.info(
            "[Evaluate] Complete: score=%d, rec=%s (%s at %s)",
            eval_result.get("match_score", 0),
            eval_result.get("recommendation"),
            job.role, job.company,
        )

        return {
            "status": "completed",
            "match_score": eval_result.get("match_score", 0),
            "recommendation": eval_result.get("recommendation"),
        }

    except Exception as exc:
        logger.error("[Evaluate] Task crashed: %s", exc, exc_info=True)
        if run:
            _fail_run(pipeline_run_id, str(exc))
        return {"status": "failed", "error": str(exc)}


# ---------------------------------------------------------------------------
# TASK 3: Full Optimize Pipeline (evaluate → optimize → PDF)
# ---------------------------------------------------------------------------

@shared_task(bind=True, max_retries=1, soft_time_limit=180)
def optimize_pipeline_task(self, user_id: str, job_listing_id: str, pipeline_run_id: str, resume_id: str = None):
    """
    Full pipeline: evaluate → optimize resume → generate PDF.

    Flow:
    1. Evaluate job (if not already evaluated)
    2. Generate resume optimization suggestions
    3. Generate tailored PDF
    4. Store all results
    """
    from career.models import JobListing, PipelineRun
    from resumes.models import Resume
    from users.models import User
    from services.ai_service import evaluate_job, optimize_resume
    from services.career_ops_service import generate_pdf, setup_user_workspace

    run = None
    try:
        run = PipelineRun.objects.get(pk=ObjectId(pipeline_run_id))
        run.status = "running"
        run.save()
        logger.info("[Optimize] Starting full pipeline (job=%s, user=%s)", job_listing_id, user_id)

        user = User.objects.get(pk=ObjectId(user_id))
        job = JobListing.objects.get(pk=ObjectId(job_listing_id), user=user)

        # Get resume
        if resume_id:
            resume = Resume.objects.get(pk=ObjectId(resume_id), user=user)
        else:
            resume = Resume.objects.filter(user=user).order_by('-created_at').first()
            if not resume:
                _fail_run(pipeline_run_id, "No resume found.")
                return {"status": "failed", "error": "No resume found"}

        resume_data = resume.parsed_data or resume.structured_data or {}
        jd_text = job.raw_jd or f"Role: {job.role}\nCompany: {job.company}"

        # STEP 1: Evaluate (if not already done)
        eval_result = None
        if job.status != "evaluated" or not job.evaluation_data:
            logger.info("[Optimize] Step 1: Evaluating job...")
            eval_result = evaluate_job(resume_data, jd_text)

            job.score = eval_result.get("job_score", 0.0)
            job.fit_summary = eval_result.get("fit_summary", "")
            job.archetype = eval_result.get("archetype", "")
            job.evaluation_data = eval_result
            job.status = "evaluated"
            job.evaluated_at = datetime.now(timezone.utc)

            rec = eval_result.get("recommendation", "SKIP").upper()
            job.recommendation = "apply" if rec == "APPLY" else ("maybe" if rec == "CONSIDER" else "skip")
            job.save()
        else:
            eval_result = job.evaluation_data
            logger.info("[Optimize] Step 1: Skipped (already evaluated)")

        # STEP 2: Optimize resume
        logger.info("[Optimize] Step 2: Generating resume optimizations...")
        optimization = optimize_resume(resume_data, jd_text, eval_result)

        # STEP 3: Generate PDF
        logger.info("[Optimize] Step 3: Attempting PDF generation...")
        pdf_result = None
        pdf_url = ""
        try:
            # Set up workspace with resume
            workspace = setup_user_workspace(user_id, resume_data=resume_data)

            # Write a simple HTML from resume for PDF generation
            html_content = _build_resume_html(resume_data, optimization)
            import tempfile
            with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False, encoding='utf-8') as f:
                f.write(html_content)
                temp_html = f.name

            media_root = Path(os.getenv("MEDIA_ROOT", Path(__file__).resolve().parent.parent / "media"))
            output_dir = media_root / "career_pdfs" / str(user_id)
            output_dir.mkdir(parents=True, exist_ok=True)

            company_slug = job.company.lower().replace(" ", "-")[:30]
            pdf_filename = f"{company_slug}-{str(job.pk)[:8]}.pdf"
            output_path = str(output_dir / pdf_filename)

            try:
                pdf_result = generate_pdf(temp_html, output_path)
                if pdf_result.success:
                    pdf_url = f"/media/career_pdfs/{user_id}/{pdf_filename}"
                    job.resume_pdf_url = pdf_url
                    job.save()
                    logger.info("[Optimize] PDF generated: %s", pdf_url)
                else:
                    logger.warning("[Optimize] PDF generation failed: %s", pdf_result.error)
            finally:
                os.unlink(temp_html)

        except Exception as pdf_exc:
            logger.warning("[Optimize] PDF step failed (non-fatal): %s", pdf_exc)

        # Update pipeline run with all results
        run.status = "completed"
        run.output_data = {
            "match_score": eval_result.get("match_score", 0) if isinstance(eval_result, dict) else 0,
            "recommendation": eval_result.get("recommendation", "SKIP") if isinstance(eval_result, dict) else "SKIP",
            "fit_summary": job.fit_summary,
            "optimization": {
                "optimized_summary": optimization.get("optimized_summary", ""),
                "skill_additions": optimization.get("skill_additions", []),
                "bullet_rewrites_count": len(optimization.get("bullet_rewrites", [])),
                "ats_keywords": optimization.get("ats_keywords_to_add", []),
                "strategy": optimization.get("overall_strategy", ""),
            },
            "pdf_url": pdf_url,
            "pdf_generated": bool(pdf_url),
            "status": "success",
        }
        run.completed_at = datetime.now(timezone.utc)
        run.save()

        logger.info("[Optimize] Full pipeline complete for %s at %s", job.role, job.company)
        return {"status": "completed", "pdf_url": pdf_url}

    except Exception as exc:
        logger.error("[Optimize] Pipeline crashed: %s", exc, exc_info=True)
        if run:
            _fail_run(pipeline_run_id, str(exc))
        return {"status": "failed", "error": str(exc)}


# ---------------------------------------------------------------------------
# TASK 4: PDF Generation Only
# ---------------------------------------------------------------------------

@shared_task(bind=True, max_retries=1, soft_time_limit=60)
def generate_career_pdf_task(self, user_id: str, job_listing_id: str, resume_id: str, pipeline_run_id: str):
    """Generate a tailored PDF via Career-Ops Playwright engine."""
    from career.models import JobListing, PipelineRun
    from resumes.models import Resume
    from users.models import User
    from services.career_ops_service import generate_pdf, setup_user_workspace

    run = None
    try:
        run = PipelineRun.objects.get(pk=ObjectId(pipeline_run_id))
        run.status = "running"
        run.save()

        user = User.objects.get(pk=ObjectId(user_id))
        job = JobListing.objects.get(pk=ObjectId(job_listing_id), user=user)
        resume = Resume.objects.get(pk=ObjectId(resume_id), user=user)
        resume_data = resume.parsed_data or resume.structured_data or {}

        # Build HTML
        html_content = _build_resume_html(resume_data, {})
        import tempfile
        with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False, encoding='utf-8') as f:
            f.write(html_content)
            temp_html = f.name

        media_root = Path(os.getenv("MEDIA_ROOT", Path(__file__).resolve().parent.parent / "media"))
        output_dir = media_root / "career_pdfs" / str(user_id)
        output_dir.mkdir(parents=True, exist_ok=True)

        company_slug = job.company.lower().replace(" ", "-")[:30]
        pdf_filename = f"{company_slug}-{str(job.pk)[:8]}.pdf"
        output_path = str(output_dir / pdf_filename)

        try:
            result = generate_pdf(temp_html, output_path)
        finally:
            os.unlink(temp_html)

        if result.success:
            pdf_url = f"/media/career_pdfs/{user_id}/{pdf_filename}"
            job.resume_pdf_url = pdf_url
            job.save()

            run.status = "completed"
            run.output_data = {
                "pdf_url": pdf_url,
                "page_count": result.data.get("page_count", 1),
                "size_kb": result.data.get("size_kb", 0),
            }
        else:
            run.status = "failed"
            run.error = result.error or "PDF generation failed"

        run.completed_at = datetime.now(timezone.utc)
        run.save()

        return {"status": run.status, "pdf_url": job.resume_pdf_url}

    except Exception as exc:
        logger.error("[PDF] Task crashed: %s", exc, exc_info=True)
        if run:
            _fail_run(pipeline_run_id, str(exc))
        return {"status": "failed", "error": str(exc)}


# ---------------------------------------------------------------------------
# Helper: Build resume HTML for PDF generation
# ---------------------------------------------------------------------------

def _build_resume_html(resume_data: dict, optimization: dict) -> str:
    """Build a clean ATS-optimized HTML resume from structured data."""
    name = resume_data.get("name", "Candidate")
    email = resume_data.get("email", "")
    phone = resume_data.get("phone", "")
    summary = optimization.get("optimized_summary") or resume_data.get("summary", "")

    skills = resume_data.get("skills", {})
    skill_list = []
    if isinstance(skills, dict):
        skill_list = skills.get("hard_skills", []) + skills.get("soft_skills", [])
    elif isinstance(skills, list):
        skill_list = skills
    # Add optimization-suggested skills
    skill_list.extend(optimization.get("skill_additions", []))

    sections = []

    # Experience
    experience = resume_data.get("experience", [])
    if experience:
        exp_html = ""
        for exp in experience:
            if isinstance(exp, dict):
                role = exp.get("role", exp.get("title", ""))
                company = exp.get("company", "")
                dates = f"{exp.get('start_date', '')} – {exp.get('end_date', 'Present')}"
                bullets = exp.get("bullets", exp.get("description", []))
                if isinstance(bullets, str):
                    bullets = [bullets]
                bullet_html = "".join(f"<li>{b}</li>" for b in bullets if b)
                exp_html += f"""
                <div class="entry">
                    <div class="entry-header">
                        <strong>{role}</strong> — {company}
                        <span class="dates">{dates}</span>
                    </div>
                    <ul>{bullet_html}</ul>
                </div>"""
        sections.append(f"<h2>Experience</h2>{exp_html}")

    # Education
    education = resume_data.get("education", [])
    if education:
        edu_html = ""
        for edu in education:
            if isinstance(edu, dict):
                degree = edu.get("degree", "")
                school = edu.get("institution", edu.get("school", ""))
                edu_html += f"<div class='entry'><strong>{degree}</strong> — {school}</div>"
        sections.append(f"<h2>Education</h2>{edu_html}")

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
body {{ font-family: 'Georgia', 'Times New Roman', serif; color: #1a1a1a; line-height: 1.5; padding: 40px 50px; max-width: 800px; margin: auto; font-size: 11pt; }}
h1 {{ font-size: 20pt; margin-bottom: 4px; }}
.contact {{ font-size: 9pt; color: #555; margin-bottom: 16px; }}
h2 {{ font-size: 11pt; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #333; padding-bottom: 3px; margin: 18px 0 10px; }}
.summary {{ font-size: 10pt; color: #333; margin-bottom: 12px; }}
.skills {{ font-size: 9.5pt; color: #333; }}
.entry {{ margin-bottom: 12px; }}
.entry-header {{ display: flex; justify-content: space-between; align-items: baseline; }}
.dates {{ font-size: 9pt; color: #666; }}
ul {{ padding-left: 18px; margin-top: 4px; }}
li {{ font-size: 10pt; margin-bottom: 3px; }}
</style>
</head>
<body>
<h1>{name}</h1>
<div class="contact">{' | '.join(filter(None, [email, phone]))}</div>
{'<div class="summary">' + summary + '</div>' if summary else ''}
{'<h2>Skills</h2><div class="skills">' + ', '.join(skill_list) + '</div>' if skill_list else ''}
{''.join(sections)}
</body>
</html>"""
