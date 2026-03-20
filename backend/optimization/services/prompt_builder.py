"""
prompt_builder.py — Centralized prompt templates for the AI pipeline.

All prompts use Mistral's [INST] instruction format.  Each builder returns
a fully-formatted string ready for `client.text_generation()`.
"""

# ---------------------------------------------------------------------------
# Mistral Instruction Wrapper
# ---------------------------------------------------------------------------

def format_prompt(prompt: str) -> str:
    """Wrap raw text in Mistral's required instruction tags."""
    return f"<s>[INST] {prompt.strip()} [/INST]"


# ---------------------------------------------------------------------------
# 1. JD Analyzer
# ---------------------------------------------------------------------------

def jd_analyzer_prompt(jd_text: str) -> str:
    prompt = f"""You are an expert job description analyzer.

Extract structured information from the following job description.

Return ONLY a valid JSON object with EXACTLY these keys (no extra text):
{{
  "role": "string — the job title",
  "required_skills": ["array of required technical skills"],
  "preferred_skills": ["array of nice-to-have skills"],
  "tools": ["array of tools/technologies mentioned"],
  "responsibilities": ["array of key responsibilities"],
  "keywords": ["array of important ATS keywords"]
}}

RULES:
- Return ONLY the JSON object, nothing else
- Do NOT wrap in markdown code fences
- Do NOT add any explanation before or after

JOB DESCRIPTION:
{jd_text[:12000]}"""
    return prompt


# ---------------------------------------------------------------------------
# 2. Resume Structurer
# ---------------------------------------------------------------------------

def resume_structurer_prompt(raw_text: str) -> str:
    prompt = f"""You are an expert resume parser.

Convert the following raw resume text into a clean, structured JSON object.

Return ONLY a valid JSON object with EXACTLY these keys:
{{
  "name": "candidate full name",
  "email": "email address or empty string",
  "phone": "phone number or empty string",
  "summary": "professional summary if present, else empty string",
  "skills": ["array of all skills mentioned"],
  "experience": [
    {{
      "company": "company name",
      "role": "job title",
      "duration": "time period",
      "description": "what they did"
    }}
  ],
  "education": [
    {{
      "institution": "school name",
      "degree": "degree earned",
      "year": "graduation year or period"
    }}
  ],
  "projects": [
    {{
      "name": "project name",
      "description": "what it does"
    }}
  ]
}}

RULES:
- Extract ONLY information that exists in the resume
- Do NOT invent or hallucinate any data
- If a section is missing, use an empty string or empty array
- Return ONLY the JSON, no extra text

RAW RESUME TEXT:
{raw_text[:8000]}"""
    return prompt


# ---------------------------------------------------------------------------
# 3. Match Analyzer
# ---------------------------------------------------------------------------

def match_analyzer_prompt(resume_json: str, jd_json: str) -> str:
    prompt = f"""You are an expert ATS (Applicant Tracking System) analyst.

Compare the candidate's resume against the job description and provide a detailed match analysis.

Return ONLY a valid JSON object with EXACTLY these keys:
{{
  "match_score": 0-100 integer,
  "matched_keywords": ["keywords found in both resume and JD"],
  "missing_keywords": ["keywords in JD but NOT in resume"],
  "strengths": ["what makes this candidate a good fit"],
  "gaps": ["areas where the candidate falls short"]
}}

RULES:
- Be realistic with the score
- Only flag genuinely missing skills
- Return ONLY the JSON, no extra text

RESUME:
{resume_json[:5000]}

JOB DESCRIPTION:
{jd_json[:5000]}"""
    return prompt


# ---------------------------------------------------------------------------
# 4. Resume Optimizer (CORE)
# ---------------------------------------------------------------------------

def resume_optimizer_prompt(resume_json: str, jd_text: str) -> str:
    prompt = f"""You are an expert resume optimizer and career coach.

Given a candidate's resume and a target job description, rewrite the resume to maximize ATS alignment and interview chances.

Return ONLY a valid JSON object with EXACTLY these keys:
{{
  "optimized_resume": "The full optimized resume as a clean, readable text block",
  "changes": [
    {{
      "before": "original text from resume",
      "after": "improved/rewritten text",
      "reason": "why this change improves the resume"
    }}
  ]
}}

STRICT RULES:
- Do NOT invent or fabricate any experience
- Do NOT add fake metrics or numbers
- Do NOT claim skills the candidate does not have
- ONLY rephrase, restructure, and keyword-optimize existing content
- Return ONLY the JSON, no extra text

RESUME:
{resume_json[:6000]}

JOB DESCRIPTION:
{jd_text[:8000]}"""
    return prompt


# ---------------------------------------------------------------------------
# 5. Cover Letter Generator
# ---------------------------------------------------------------------------

def cover_letter_prompt(resume_json: str, jd_text: str) -> str:
    prompt = f"""You are an expert career coach who writes compelling cover letters.

Write a professional cover letter for this candidate applying to the described position.

Return ONLY a valid JSON object:
{{
  "cover_letter": "The full cover letter text, properly formatted with paragraphs"
}}

RULES:
- Reference specific skills and experiences from the resume
- Align with the job requirements
- Professional, confident tone — not generic
- 3-4 paragraphs
- Do NOT fabricate experiences
- Return ONLY the JSON, no extra text

RESUME:
{resume_json[:4000]}

JOB DESCRIPTION:
{jd_text[:4000]}"""
    return prompt


# ---------------------------------------------------------------------------
# 6. Cold Email Generator
# ---------------------------------------------------------------------------

def cold_email_prompt(resume_json: str, jd_text: str) -> str:
    prompt = f"""You are an expert at writing punchy outreach emails to recruiters.

Write a short, professional cold email (under 150 words) that a candidate can send to the hiring manager.

Return ONLY a valid JSON object:
{{
  "cold_email": "Subject: [subject line]\\n\\n[email body]"
}}

RULES:
- Include a compelling subject line
- Reference specific matching qualifications
- Be concise, confident, and professional
- Under 150 words for the body
- Do NOT fabricate experiences
- Return ONLY the JSON, no extra text

RESUME:
{resume_json[:3000]}

JOB DESCRIPTION:
{jd_text[:3000]}"""
    return prompt


# ---------------------------------------------------------------------------
# 7. File Name Generator
# ---------------------------------------------------------------------------

def file_name_prompt(candidate_name: str, company_name: str, role: str) -> str:
    prompt = f"""Generate a professional PDF filename for a resume.

Return ONLY a valid JSON object:
{{
  "filename": "Firstname_Lastname_Role_Company"
}}

Candidate name: {candidate_name}
Company: {company_name}
Role: {role}

RULES:
- Use underscores, no spaces
- No special characters
- Keep it clean and professional
- Return ONLY the JSON, no extra text"""
    return prompt


# ---------------------------------------------------------------------------
# 8. JSON Repair Prompt (CRITICAL)
# ---------------------------------------------------------------------------

def json_repair_prompt(broken_text: str) -> str:
    prompt = f"""The following text was supposed to be valid JSON but it is malformed.

Fix it and return ONLY the corrected, valid JSON object. Do NOT add any explanation.

BROKEN TEXT:
{broken_text[:3000]}"""
    return prompt
