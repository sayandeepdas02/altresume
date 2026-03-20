from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from resumes.models import Resume
from .models import OptimizationHistory
from .services.ai_service import analyze_jd, match_resume, rewrite_resume
from users.models import User
from bson import ObjectId

class OptimizeResumeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        resume_id = request.data.get('resume_id')
        job_description = request.data.get('job_description')
        
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
            
            # 2. Match Score
            match_data = match_resume(resume.parsed_data, jd_data)
            
            # 3. Generate Resume + Cover Letter + Cold Email based on tier
            gen_cl = request.user.can_generate_cover_letter
            gen_ce = request.user.can_generate_cold_email
            rewrite_data = rewrite_resume(
                resume.parsed_data, job_description,
                generate_cover_letter=gen_cl, generate_cold_email=gen_ce
            )
            
            # 4. Save to DB
            history = OptimizationHistory.objects.create(
                user=request.user,
                resume=resume,
                job_description=job_description,
                optimized_resume=rewrite_data.get("optimized_resume", ""),
                cover_letter=rewrite_data.get("cover_letter", ""),
                cold_email=rewrite_data.get("cold_email", ""),
                score=match_data.get("match_score", 0),
                changes=rewrite_data.get("changes", [])
            )
            
            return Response({
                "status": "completed",
                "optimization_id": str(history.pk),
                "match_score": history.score,
                "optimized_resume": history.optimized_resume,
                "cover_letter": history.cover_letter,
                "cold_email": history.cold_email,
                "missing_keywords": match_data.get("missing_keywords", []),
                "matched_keywords": match_data.get("matched_keywords", []),
                "changes": history.changes
            }, status=status.HTTP_200_OK)
        except Exception as e:
            # Refund token on failure
            request.user.tokens_remaining += 1
            request.user.save()
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SaveOptimizationView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        resume_id = request.data.get('resume_id')
        job_description = request.data.get('job_description')
        optimized_resume = request.data.get('optimized_resume')
        score = request.data.get('score', 0)
        changes = request.data.get('changes', [])
        
        try:
            resume = Resume.objects.get(pk=ObjectId(resume_id), user=request.user)
        except Resume.DoesNotExist:
            return Response({"error": "Resume not found"}, status=status.HTTP_404_NOT_FOUND)
            
        history = OptimizationHistory.objects.create(
            user=request.user,
            resume=resume,
            job_description=job_description,
            optimized_resume=optimized_resume,
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
            data.append({
                "id": str(h.pk),
                "resume_id": str(h.resume.pk),
                "job_description": h.job_description,
                "optimized_resume": h.optimized_resume,
                "score": h.score,
                "changes": h.changes,
                "created_at": h.created_at
            })
        return Response(data, status=status.HTTP_200_OK)
