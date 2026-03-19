import os
import json
import uuid
from django.conf import settings
from django.template.loader import render_to_string
from optimization.services.ai_service import get_client

def structure_resume_for_export(text):
    client = get_client()
    prompt = """Convert the following resume text into this exact JSON structure:
    {
      "name": "Full Name",
      "contact": { "email": "", "phone": "", "linkedin": "", "github": "", "location": "" },
      "skills": ["Skill 1", "Skill 2"],
      "experience": [ { "company": "", "role": "", "duration": "", "bullets": ["A", "B"] } ],
      "projects": [ { "name": "", "description": "...", "link": "..." } ],
      "education": [ { "institution": "", "degree": "", "duration": "" } ]
    }
    Extract everything faithfully. Leave arrays/objects empty if data is missing. Return ONLY valid JSON."""
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        response_format={ "type": "json_object" },
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": text[:10000]}
        ]
    )
    return json.loads(response.choices[0].message.content)

def render_resume_pdf(optimized_text, template_name, custom_filename=None):
    import weasyprint
    
    data = structure_resume_for_export(optimized_text)
    
    template_path = f"resumes/{template_name}.html"
    
    html_string = render_to_string(template_path, {"data": data})
    
    if custom_filename:
        # Sanitize custom filename
        safe_name = "".join([c for c in custom_filename if c.isalnum() or c in (' ', '-', '_')]).strip()
        safe_name = safe_name.replace(' ', '_')
        if not safe_name.endswith('.pdf'):
            safe_name += '.pdf'
        file_name = safe_name or f"resume_{uuid.uuid4().hex[:8]}.pdf"
    else:
        file_name = f"resume_{uuid.uuid4().hex[:8]}.pdf"
        
    save_dir = os.path.join(settings.MEDIA_ROOT, 'resumes', 'exports')
    os.makedirs(save_dir, exist_ok=True)
    file_path = os.path.join(save_dir, file_name)
    
    weasyprint.HTML(string=html_string).write_pdf(file_path)
    
    return f"{settings.MEDIA_URL}resumes/exports/{file_name}"
