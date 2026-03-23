from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from resumes.models import Resume
from .models import OptimizationHistory
from .services.ai_service import analyze_jd, match_resume, score_resume, rewrite_resume
from users.models import User
from bson import ObjectId
import logging
import json
import copy

logger = logging.getLogger(__name__)


class OptimizeResumeView(APIView):
    """Full optimization pipeline: score → identify gaps → rewrite with feedback."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        resume_id = request.data.get('resume_id')
        job_description = request.data.get('job_description')
        use_ai_scoring = request.data.get('use_ai_scoring', True)
        
        if not job_description:
            return Response({"error": "job_description required"}, status=status.HTTP_400_BAD_REQUEST)
            
        if len(job_description) > 15000:
            return Response({"error": "Job Description exceeds maximum token limits."}, status=status.HTTP_400_BAD_REQUEST)
            
        if not resume_id:
            resume = Resume.objects.filter(user=request.user).order_by('-created_at').first()
            if not resume:
                return Response({"error": "No resume found. Please upload one first."}, status=status.HTTP_404_NOT_FOUND)
            resume_id = str(resume.pk)
        else:
            try:
                resume = Resume.objects.get(pk=ObjectId(resume_id), user=request.user)
            except Resume.DoesNotExist:
                return Response({"error": "Resume not found"}, status=status.HTTP_404_NOT_FOUND)
            
        if request.user.tokens_remaining <= 0:
            return Response({"error": "Insufficient tokens. Please upgrade your plan to continue optimizing resumes."}, status=status.HTTP_402_PAYMENT_REQUIRED)
            
        request.user.tokens_remaining -= 1
        request.user.save()
        
        try:
            resume = Resume.objects.get(pk=ObjectId(resume_id), user=request.user)
            
            # 1. Analyze JD
            jd_data = analyze_jd(job_description)
            
            # 2. Score — either LLM-driven (rich) or pure Python (fast)
            missing_skills = []
            if use_ai_scoring:
                score_data = score_resume(resume.parsed_data, jd_data)
                missing_skills = score_data.get("missing_skills", [])
                original_score = score_data.get("match_score", 0)
            else:
                score_data = match_resume(resume.parsed_data, jd_data)
                original_score = score_data.get("match_score", 0)
            
            # 3. Rewrite — inject missing skills for targeted optimization
            gen_cl = request.user.can_generate_cover_letter
            gen_ce = request.user.can_generate_cold_email
            rewrite_data = rewrite_resume(
                resume.parsed_data, job_description,
                missing_skills=missing_skills,
                generate_cover_letter=gen_cl,
                generate_cold_email=gen_ce,
            )
            
            ai_modifications = rewrite_data.get("optimized_resume", {})
            
            # --- DEEP MERGE LOGIC ---
            final_resume = copy.deepcopy(resume.parsed_data)
            
            if isinstance(ai_modifications, dict) and ai_modifications:
                # 1. Merge top-level string fields
                for key in ["name", "email", "phone", "linkedin", "github", "summary"]:
                    if ai_modifications.get(key):
                        final_resume[key] = ai_modifications[key]
                
                # 2. Merge Skills (combine & deduplicate)
                ai_skills = ai_modifications.get("skills", {})
                orig_skills = final_resume.get("skills", {})
                if isinstance(ai_skills, dict):
                    orig_hard = orig_skills.get("hard_skills", []) if isinstance(orig_skills, dict) else []
                    ai_hard = ai_skills.get("hard_skills", [])
                    orig_soft = orig_skills.get("soft_skills", []) if isinstance(orig_skills, dict) else []
                    ai_soft = ai_skills.get("soft_skills", [])
                    
                    final_resume["skills"] = {
                        "hard_skills": list(dict.fromkeys(orig_hard + ai_hard)),
                        "soft_skills": list(dict.fromkeys(orig_soft + ai_soft))
                    }
                    
                # 3. Merge Experience
                ai_exp = ai_modifications.get("experience", [])
                if ai_exp and isinstance(ai_exp, list):
                    orig_exp = final_resume.get("experience", [])
                    for ae in ai_exp:
                        matched = False
                        ae_comp = ae.get("company", "").lower().strip()
                        ae_role = ae.get("role", "").lower().strip()
                        for oe in orig_exp:
                            oe_comp = oe.get("company", "").lower().strip()
                            oe_role = oe.get("role", "").lower().strip()
                            if ae_comp == oe_comp or ae_role == oe_role:
                                oe.update(ae)
                                matched = True
                                break
                        if not matched:
                            orig_exp.append(ae)
                    final_resume["experience"] = orig_exp
                    
                # 4. Merge Projects
                ai_proj = ai_modifications.get("projects", [])
                if ai_proj and isinstance(ai_proj, list):
                    orig_proj = final_resume.get("projects", [])
                    for ap in ai_proj:
                        matched = False
                        ap_name = ap.get("name", "").lower().strip()
                        for op in orig_proj:
                            if ap_name == op.get("name", "").lower().strip():
                                op.update(ap)
                                matched = True
                                break
                        if not matched:
                            orig_proj.append(ap)
                    final_resume["projects"] = orig_proj
                    
                # 5. Replace Education if provided
                ai_edu = ai_modifications.get("education", [])
                if ai_edu and isinstance(ai_edu, list):
                    final_resume["education"] = ai_edu

            # 4. Save to DB
            opt_resume_str = json.dumps(final_resume)
            
            history = OptimizationHistory.objects.create(
                user=request.user,
                resume=resume,
                job_description=job_description,
                optimized_resume=opt_resume_str,
                cover_letter=rewrite_data.get("cover_letter", ""),
                cold_email=rewrite_data.get("cold_email", ""),
                score=original_score,
                original_score=original_score,
                score_improvement=0,
                matching_skills=score_data.get("matching_skills", score_data.get("matched_keywords", [])),
                missing_skills=score_data.get("missing_skills", score_data.get("missing_keywords", [])),
                strengths=score_data.get("strengths", []),
                gaps=score_data.get("gaps", []),
                rationale=score_data.get("rationale", ""),
                recommendation=score_data.get("recommendation", ""),
                changes=rewrite_data.get("changes", []),
            )
            
            return Response({
                "status": "completed",
                "optimization_id": str(history.pk),
                "match_score": history.score,
                "original_score": history.original_score,
                "score_improvement": history.score_improvement,
                "parsed_resume": resume.parsed_data,
                "ai_modifications": ai_modifications,
                "final_resume": final_resume,
                "optimized_resume": final_resume,  # Keep for backwards compat
                "cover_letter": history.cover_letter,
                "cold_email": history.cold_email,
                "matching_skills": history.matching_skills,
                "missing_skills": history.missing_skills,
                "missing_keywords": score_data.get("missing_keywords", []),
                "matched_keywords": score_data.get("matched_keywords", []),
                "strengths": history.strengths,
                "gaps": history.gaps,
                "rationale": history.rationale,
                "recommendation": history.recommendation,
                "changes": history.changes,
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error("Optimization failed: %s", e, exc_info=True)
            # Refund token on failure
            request.user.tokens_remaining += 1
            request.user.save()
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ScoreResumeView(APIView):
    """Score-only endpoint — no rewriting, just ATS analysis with rationale."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        resume_id = request.data.get('resume_id')
        job_description = request.data.get('job_description')

        if not job_description:
            return Response({"error": "job_description required"}, status=status.HTTP_400_BAD_REQUEST)

        if not resume_id:
            resume = Resume.objects.filter(user=request.user).order_by('-created_at').first()
            if not resume:
                return Response({"error": "No resume found."}, status=status.HTTP_404_NOT_FOUND)
        else:
            try:
                resume = Resume.objects.get(pk=ObjectId(resume_id), user=request.user)
            except Resume.DoesNotExist:
                return Response({"error": "Resume not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            jd_data = analyze_jd(job_description)
            score_data = score_resume(resume.parsed_data, jd_data)

            return Response({
                "match_score": score_data.get("match_score", 0),
                "matching_skills": score_data.get("matching_skills", []),
                "missing_skills": score_data.get("missing_skills", []),
                "strengths": score_data.get("strengths", []),
                "gaps": score_data.get("gaps", []),
                "rationale": score_data.get("rationale", ""),
                "recommendation": score_data.get("recommendation", ""),
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error("Scoring failed: %s", e, exc_info=True)
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SaveOptimizationView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        resume_id = request.data.get('resume_id')
        job_description = request.data.get('job_description')
        optimized_resume = request.data.get('optimized_resume')
        score = request.data.get('score', 0)
        changes = request.data.get('changes', [])
        
        opt_resume_str = json.dumps(optimized_resume) if isinstance(optimized_resume, dict) else str(optimized_resume)
        
        try:
            resume = Resume.objects.get(pk=ObjectId(resume_id), user=request.user)
        except Resume.DoesNotExist:
            return Response({"error": "Resume not found"}, status=status.HTTP_404_NOT_FOUND)
            
        history = OptimizationHistory.objects.create(
            user=request.user,
            resume=resume,
            job_description=job_description,
            optimized_resume=opt_resume_str,
            score=score,
            changes=changes
        )
        
        return Response({"id": str(history.pk)}, status=status.HTTP_201_CREATED)


class OptimizationHistoryView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        histories = OptimizationHistory.objects.filter(user=request.user).order_by('-created_at')
        data = []
        for h in histories:
            try:
                opt_res = json.loads(h.optimized_resume) if h.optimized_resume.strip().startswith("{") else h.optimized_resume
            except:
                opt_res = h.optimized_resume
                
            data.append({
                "id": str(h.pk),
                "resume_id": str(h.resume.pk),
                "job_description": h.job_description,
                "final_resume": opt_res,
                "optimized_resume": opt_res,
                "score": h.score,
                "original_score": h.original_score,
                "score_improvement": h.score_improvement,
                "matching_skills": h.matching_skills,
                "missing_skills": h.missing_skills,
                "rationale": h.rationale,
                "recommendation": h.recommendation,
                "changes": h.changes,
                "created_at": h.created_at
            })
        return Response(data, status=status.HTTP_200_OK)
