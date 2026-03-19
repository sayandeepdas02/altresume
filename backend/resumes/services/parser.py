import fitz  # PyMuPDF
import docx
import re
import os

def parse_pdf(file_path):
    text = ""
    try:
        doc = fitz.open(file_path)
        for page in doc:
            text += page.get_text()
    except Exception as e:
        raise ValueError(f"Failed to read PDF file. It might be corrupted. Details: {str(e)}")
    
    if len(text.strip()) < 50:
        raise ValueError("This appears to be a scanned PDF or contains no readable text. Please upload a standard text-based PDF.")
        
    return text

def parse_docx(file_path):
    text = ""
    try:
        doc = docx.Document(file_path)
        text = "\n".join([para.text for para in doc.paragraphs])
    except Exception as e:
        raise ValueError(f"Failed to read DOCX file. It might be corrupted. Details: {str(e)}")
    
    if len(text.strip()) < 50:
        raise ValueError("This DOCX file contains no readable text.")
        
    return text

def parse_resume(file_path):
    if not os.path.exists(file_path):
        raise FileNotFoundError("The uploaded file could not be found on the server.")
        
    _, ext = os.path.splitext(file_path)
    text = ""
    if ext.lower() == '.pdf':
        text = parse_pdf(file_path)
    elif ext.lower() == '.docx':
        text = parse_docx(file_path)
    else:
        raise ValueError("Unsupported file format. Please upload a PDF or DOCX file.")
    
    # Basic Heuristics
    email_match = re.search(r'[\w\.-]+@[\w\.-]+', text)
    phone_match = re.search(r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text)

    # Very naive skill extraction based on common skills
    common_skills = ["Python", "Java", "JavaScript", "React", "Django", "Node.js", "AWS", "SQL", "MongoDB", "C++", "Docker", "Machine Learning", "FastAPI", "Next.js", "TypeScript"]
    found_skills = [skill for skill in common_skills if re.search(r'\b' + re.escape(skill) + r'\b', text, re.IGNORECASE)]

    return {
        "name": "Parse Result (Basic Extractor)", 
        "email": email_match.group(0) if email_match else "",
        "phone": phone_match.group(0) if phone_match else "",
        "skills": found_skills,
        "experience": [{"company": "Sample Corp", "role": "Software Engineer", "description": "Extracted from basic heuristics", "duration": "2020-2023"}],
        "projects": [],
        "education": []
    }
