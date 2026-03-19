from celery import shared_task
from resumes.models import Resume
from users.models import User
from .models import OptimizationHistory
from .services.ai_service import analyze_jd, match_resume, rewrite_resume

@shared_task
def optimize_resume_task(resume_id, job_description, user_id):
    try:
        user = User.objects.get(pk=user_id)
        resume = Resume.objects.get(pk=resume_id, user=user)
        
        # 1. Pipeline Analyze JD using restricted/cached heuristics or OpenAI wrapper
        jd_data = analyze_jd(job_description)
        
        # 2. Heuristic Match Score Gen against array
        match_data = match_resume(resume.parsed_data, jd_data)
        
        # 3. Dedicated Rewrite LLM API operation (5-15 seconds process block)
        rewrite_data = rewrite_resume(resume.parsed_data, job_description)
        
        # 4. Synchronously store final generated metrics and output safely backwards into our optimization DB pipeline.
        history = OptimizationHistory.objects.create(
            user=user,
            resume=resume,
            job_description=job_description,
            optimized_resume=rewrite_data.get("optimized_resume", ""),
            score=match_data.get("match_score", 0),
            changes=rewrite_data.get("changes", [])
        )
        
        return {
            "status": "completed",
            "optimization_id": str(history.pk),
            "match_score": history.score,
            "optimized_resume": history.optimized_resume,
            "missing_keywords": match_data.get("missing_keywords", []),
            "matched_keywords": match_data.get("matched_keywords", []),
            "changes": history.changes
        }
    except Exception as e:
        # Refund token on failure
        user = User.objects.get(pk=user_id)
        user.tokens_remaining += 1
        user.save()
        
        return {
            "status": "failed",
            "error": str(e)
        }
