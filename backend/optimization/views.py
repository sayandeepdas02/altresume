from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from resumes.models import Resume
from celery.result import AsyncResult
from .models import OptimizationHistory
from .tasks import optimize_resume_task

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
                Resume.objects.get(pk=resume_id, user=request.user)
            except Resume.DoesNotExist:
                return Response({"error": "Resume not found"}, status=status.HTTP_404_NOT_FOUND)
            
        if request.user.tokens_remaining <= 0:
            return Response({"error": "Insufficient tokens. Please upgrade your plan to continue optimizing resumes."}, status=status.HTTP_402_PAYMENT_REQUIRED)
            
        request.user.tokens_remaining -= 1
        request.user.save()
        
        task = optimize_resume_task.delay(resume_id, job_description, request.user.pk)
        
        return Response({"task_id": str(task.id)}, status=status.HTTP_202_ACCEPTED)

class OptimizationStatusView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, task_id):
        task_result = AsyncResult(task_id)
        
        if task_result.state == 'FAILURE':
            return Response({"status": "failed", "error": str(task_result.info)}, status=status.HTTP_200_OK)
        elif task_result.state == 'SUCCESS':
            result = task_result.result
            if result.get("status") == "failed":
                return Response({"status": "failed", "error": result.get("error")})
            return Response(result, status=status.HTTP_200_OK)
        else:
            return Response({"status": "pending"}, status=status.HTTP_200_OK)

class SaveOptimizationView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        resume_id = request.data.get('resume_id')
        job_description = request.data.get('job_description')
        optimized_resume = request.data.get('optimized_resume')
        score = request.data.get('score', 0)
        changes = request.data.get('changes', [])
        
        try:
            resume = Resume.objects.get(pk=resume_id, user=request.user)
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
