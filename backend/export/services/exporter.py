import os
import json
import uuid
from django.conf import settings
from django.template.loader import render_to_string
from optimization.services.ai_service import structure_resume


def structure_resume_for_export(text):
    """Convert optimized resume text into structured JSON for PDF template rendering."""
    # Use the AI pipeline's structure_resume which handles
    # Mistral prompting, JSON extraction, and retries
    result = structure_resume(text)

    # Ensure the export-specific shape with nested contact
    structured = {
        "name": result.get("name", ""),
        "contact": {
            "email": result.get("email", ""),
            "phone": result.get("phone", ""),
            "linkedin": "",
            "github": "",
            "location": "",
        },
        "skills": result.get("skills", []),
        "experience": result.get("experience", []),
        "projects": result.get("projects", []),
        "education": result.get("education", []),
    }
    return structured


def render_resume_pdf(optimized_text, template_name, custom_filename=None):
    import weasyprint

    data = structure_resume_for_export(optimized_text)

    template_path = f"resumes/{template_name}.html"

    html_string = render_to_string(template_path, {"data": data})

    if custom_filename:
        safe_name = "".join(
            [c for c in custom_filename if c.isalnum() or c in (" ", "-", "_")]
        ).strip()
        safe_name = safe_name.replace(" ", "_")
        if not safe_name.endswith(".pdf"):
            safe_name += ".pdf"
        file_name = safe_name or f"resume_{uuid.uuid4().hex[:8]}.pdf"
    else:
        file_name = f"resume_{uuid.uuid4().hex[:8]}.pdf"

    save_dir = os.path.join(settings.MEDIA_ROOT, "resumes", "exports")
    os.makedirs(save_dir, exist_ok=True)
    file_path = os.path.join(save_dir, file_name)

    weasyprint.HTML(string=html_string).write_pdf(file_path)

    return f"{settings.MEDIA_URL}resumes/exports/{file_name}"
