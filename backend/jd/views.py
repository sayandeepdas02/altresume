from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from optimization.services.ai_service import analyze_jd

class AnalyzeJDView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        job_description = request.data.get('job_description')
        if not job_description:
            return Response({"error": "job_description is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Analyze JD
            jd_data = analyze_jd(job_description)
            return Response(jd_data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
