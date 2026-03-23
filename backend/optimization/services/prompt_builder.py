"""
prompt_builder.py — Centralized prompt templates for the AI pipeline.

Enhanced with MyResumo's ATS optimization techniques:
  - Missing-skills injection for targeted optimization
  - Structured JSON output schema (hard/soft skills, 4-task experiences)
  - ATS-specific optimization checklist
  - Ethical guidelines
"""


# ---------------------------------------------------------------------------
# 1. JD Analyzer
# ---------------------------------------------------------------------------

def jd_analyzer_prompt(jd_text: str) -> str:
    return f"""You are an expert job description analyzer.

Extract structured information from the following job description.

Return ONLY a valid JSON object with EXACTLY these keys (no extra text):
{{
  "role": "string — the job title",
  "required_skills": ["array of required technical skills"],
  "preferred_skills": ["array of nice-to-have skills"],
  "tools": ["array of tools/technologies mentioned"],
  "responsibilities": ["array of key responsibilities"],
  "keywords": ["array of important ATS keywords"],
  "experience_years": "minimum years of experience required or null",
  "domains": ["industries or domains mentioned"]
}}

RULES:
- Return ONLY the JSON object, nothing else
- Do NOT wrap in markdown code fences
- Do NOT add any explanation before or after
- Be comprehensive — extract ALL skills including implied ones

JOB DESCRIPTION:
{jd_text[:12000]}"""


# ---------------------------------------------------------------------------
# 2. Resume Structurer
# ---------------------------------------------------------------------------

def resume_structurer_prompt(raw_text: str) -> str:
    return f"""You are an expert resume parser.

Convert the following raw resume text into a clean, structured JSON object.

Return ONLY a valid JSON object with EXACTLY these keys:
{{
  "name": "candidate full name",
  "email": "email address or empty string",
  "phone": "phone number or empty string",
  "linkedin": "linkedin URL or empty string",
  "github": "github URL or empty string",
  "summary": "professional summary if present, else empty string",
  "skills": {{
    "hard_skills": ["array of technical/professional skills"],
    "soft_skills": ["array of interpersonal/soft skills"]
  }},
  "experience": [
    {{
      "company": "company name",
      "role": "job title",
      "location": "location or empty string",
      "start_date": "start date",
      "end_date": "end date or Present",
      "bullets": ["exactly 4 key responsibilities/achievements"]
    }}
  ],
  "education": [
    {{
      "institution": "school name",
      "degree": "degree earned",
      "start_date": "start date or empty string",
      "end_date": "graduation year or period",
      "description": "additional details or empty string"
    }}
  ],
  "projects": [
    {{
      "name": "project name",
      "description": "what it does",
      "tech_stack": ["technologies used"],
      "link": "project URL or empty string"
    }}
  ],
  "certifications": [
    {{
      "name": "certification name",
      "institution": "issuing body",
      "date": "date obtained"
    }}
  ]
}}

RULES:
- Extract ONLY information that exists in the resume
- Do NOT invent or hallucinate any data
- If a section is missing, use an empty string or empty array
- For experience bullets, create exactly 4 per entry from the description
- Split skills into hard_skills (technical) and soft_skills (interpersonal)
- Return ONLY the JSON, no extra text

RAW RESUME TEXT:
{raw_text[:8000]}"""


# ---------------------------------------------------------------------------
# 3. ATS Match Scorer (LLM-Driven)
# ---------------------------------------------------------------------------

def match_scorer_prompt(resume_json: str, jd_json: str) -> str:
    return f"""You are an expert ATS (Applicant Tracking System) analyzer and recruiter.

Compare the candidate's resume against the job description and provide a comprehensive match analysis.

Return ONLY a valid JSON object with EXACTLY these keys:
{{
  "match_score": 0-100 integer,
  "matched_keywords": ["keywords found in both resume and JD"],
  "missing_keywords": ["keywords in JD but NOT in resume"],
  "matching_skills": ["skills the candidate has that match the job"],
  "missing_skills": ["skills required by the job that the candidate lacks"],
  "strengths": ["what makes this candidate a good fit"],
  "gaps": ["areas where the candidate falls short"],
  "recommendation": "brief recommendation about the candidate's fit",
  "rationale": "explanation of why this score was given"
}}

SCORING GUIDELINES:
- Score 90-100: Candidate meets nearly all core and preferred requirements
- Score 75-89: Candidate meets most core requirements and some preferred
- Score 60-74: Candidate meets core requirements but missing desired skills
- Score 40-59: Candidate meets some requirements but has significant gaps
- Score 0-39: Candidate lacks most core requirements

Be fair and optimistic. Consider:
- Transferable skills and synonyms
- Implied experience from described work
- Related technologies (e.g., React implies JavaScript)
- Educational qualifications and certifications

RULES:
- Be realistic with the score
- Only flag genuinely missing skills
- Include rationale explaining the score
- Return ONLY the JSON, no extra text

RESUME:
{resume_json[:5000]}

JOB DESCRIPTION:
{jd_json[:5000]}"""


# ---------------------------------------------------------------------------
# 4. Resume Optimizer (CORE) — with missing-skills injection
# ---------------------------------------------------------------------------

def resume_optimizer_prompt(
    resume_json: str,
    jd_text: str,
    missing_skills: list = None,
) -> str:
    """Build the optimization prompt, optionally injecting missing skills for targeted rewriting."""

    missing_skills_section = ""
    if missing_skills and len(missing_skills) > 0:
        skills_list = ", ".join([f"'{s}'" for s in missing_skills])
        missing_skills_section = f"""

## RECOMMENDED SKILLS TO ADDRESS

The following skills were identified as missing from the resume but required by the job:

{skills_list}

If the candidate has ANY experience with these skills, even minor exposure:
- Highlight them prominently in the skills section
- Reframe past experience to showcase these skills where truthful
- Use the exact terminology from the job description
- Do NOT fabricate experience — only surface genuine, related skills
"""

    return f"""You are an expert ATS Resume Optimization Specialist with deep knowledge of resume writing, keyword optimization, and applicant tracking systems.

## TASK
Transform the candidate's resume into an ATS-optimized version tailored to the job description. Maximize ATS compatibility while maintaining honesty.

## OPTIMIZATION PROCESS

1. **ANALYZE** — Extract key requirements, skills, and exact phrasing from the JD
2. **EVALUATE** — Compare resume content against requirements, identify gaps
3. **OPTIMIZE** — Rewrite with ATS-friendly formatting, relevant keywords, quantified achievements
4. **FORMAT** — Use standard section headings, consistent bullet points, clear structure
{missing_skills_section}

## ATS FORMATTING RULES
- Use standard section headings (Summary, Experience, Skills, Education, Projects)
- Use standard bullet points only
- Include keywords in context, not keyword-stuffed
- Use both spelled-out terms and acronyms where applicable
- Quantify achievements with metrics where possible

## ETHICAL GUIDELINES
- Only include truthful information from the original resume
- Do NOT fabricate experience, skills, or qualifications
- Reframe existing experience to highlight relevant skills
- Optimize language and presentation while maintaining accuracy

## OUTPUT FORMAT

Return ONLY a valid JSON object:
{{
  "optimized_resume": {{
    "name": "candidate name",
    "email": "email",
    "phone": "phone",
    "linkedin": "linkedin",
    "github": "github",
    "summary": "optimized professional summary",
    "skills": {{
      "hard_skills": ["..."],
      "soft_skills": ["..."]
    }},
    "experience": [
      {{
        "company": "company name",
        "role": "optimized job title",
        "location": "location",
        "start_date": "start date",
        "end_date": "end date",
        "bullets": ["optimized ATS-friendly achievement 1", "achievement 2", "achievement 3", "achievement 4"]
      }}
    ],
    "education": [
      {{
        "institution": "school name",
        "degree": "degree",
        "start_date": "start",
        "end_date": "end",
        "description": "extras"
      }}
    ],
    "projects": [
      {{
        "name": "project",
        "description": "description",
        "tech_stack": ["tech"],
        "link": "url"
      }}
    ],
    "certifications": [
      {{
        "name": "cert",
        "institution": "org",
        "date": "date"
      }}
    ]
  }},
  "changes": [
    {{
      "before": "original text from resume",
      "after": "improved/rewritten text",
      "reason": "why this change improves the resume"
    }}
  ]
}}

RULES:
- Return ONLY the JSON, no extra text
- Do NOT wrap in markdown code fences

RESUME:
{resume_json[:6000]}

JOB DESCRIPTION:
{jd_text[:8000]}"""


# ---------------------------------------------------------------------------
# 5. Cover Letter Generator
# ---------------------------------------------------------------------------

def cover_letter_prompt(resume_json: str, jd_text: str) -> str:
    return f"""You are an expert career coach who writes compelling cover letters.

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


# ---------------------------------------------------------------------------
# 6. Cold Email Generator
# ---------------------------------------------------------------------------

def cold_email_prompt(resume_json: str, jd_text: str) -> str:
    return f"""You are an expert at writing punchy outreach emails to recruiters.

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


# ---------------------------------------------------------------------------
# 7. File Name Generator
# ---------------------------------------------------------------------------

def file_name_prompt(candidate_name: str, company_name: str, role: str) -> str:
    return f"""Generate a professional PDF filename for a resume.

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


# ---------------------------------------------------------------------------
# 8. JSON Repair Prompt (CRITICAL)
# ---------------------------------------------------------------------------

def json_repair_prompt(broken_text: str) -> str:
    return f"""The following text was supposed to be valid JSON but it is malformed.

Fix it and return ONLY the corrected, valid JSON object. Do NOT add any explanation.

BROKEN TEXT:
{broken_text[:3000]}"""
