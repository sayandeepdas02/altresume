from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from optimization.models import OptimizationHistory
from .services.exporter import render_resume_pdf

class TemplatesListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        templates = [
            {"id": "modern", "name": "Modern Blue", "description": "Clean lines with soft blue accents, perfect for tech."},
            {"id": "minimal", "name": "Brutalist Minimal", "description": "High-density black and white for pure data transfer."},
            {"id": "professional", "name": "Classic Serif", "description": "Elegant serif headers for executive and traditional roles."}
        ]
        return Response(templates, status=status.HTTP_200_OK)


class ExportPDFView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        optimization_id = request.data.get('optimization_id')
        template = request.data.get('template', 'modern')
        custom_filename = request.data.get('filename')

        if not optimization_id:
            return Response({"error": "optimization_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            history = OptimizationHistory.objects.get(pk=optimization_id, user=request.user)
        except OptimizationHistory.DoesNotExist:
            return Response({"error": "Optimization record not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            # The AI logic structures it natively and passes HTML to Weasyprint
            pdf_url = render_resume_pdf(history.optimized_resume, template, custom_filename)
            
            # Since the frontend runs on localhost:3000 but the resource is generated physically 
            # within django's MEDIA_ROOT, we can request.build_absolute_uri
            full_url = request.build_absolute_uri(pdf_url)
            
            return Response({"pdf_url": full_url}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
