"""
ai_service.py — AI orchestration layer.

Delegates to:
  prompt_builder  → prompt construction
  json_parser     → safe JSON extraction, repair, retry

Public API (backwards-compatible):
  analyze_jd, match_resume, rewrite_resume

Extended API:
  structure_resume, generate_cover_letter, generate_cold_email, generate_file_name
"""

import os
import json
import logging
from huggingface_hub import InferenceClient

from .prompt_builder import (
    jd_analyzer_prompt,
    resume_structurer_prompt,
    match_analyzer_prompt,
    resume_optimizer_prompt,
    cover_letter_prompt,
    cold_email_prompt,
    file_name_prompt,
)
from .json_parser import call_with_retry

logger = logging.getLogger(__name__)

MODEL_ID = "Qwen/Qwen2.5-7B-Instruct"


def _get_client() -> InferenceClient:
    token = os.getenv("HUGGINGFACE_API_KEY")
    if not token:
        raise EnvironmentError("HUGGINGFACE_API_KEY is not set.")
    return InferenceClient(model=MODEL_ID, token=token)


# ---------------------------------------------------------------------------
# Internal helper — wraps a prompt in a generation call
# ---------------------------------------------------------------------------

def _generate(prompt: str, max_tokens: int = 1500, temperature: float = 0.2) -> str:
    """Call Mistral via HuggingFace chat_completion API."""
    client = _get_client()
    response = client.chat_completion(
        messages=[{"role": "user", "content": prompt}],
        max_tokens=max_tokens,
        temperature=temperature,
    )
    return response.choices[0].message.content


# ---------------------------------------------------------------------------
# 1. JD Analyzer
# ---------------------------------------------------------------------------

def analyze_jd(text: str) -> dict:
    """Parse a job description into structured JSON."""
    prompt = jd_analyzer_prompt(text)

    result = call_with_retry(lambda: _generate(prompt, max_tokens=800, temperature=0.1))

    # Ensure all expected keys
    defaults = {
        "role": "",
        "required_skills": [],
        "preferred_skills": [],
        "tools": [],
        "responsibilities": [],
        "keywords": [],
    }
    for key, default in defaults.items():
        result.setdefault(key, default)

    return result


# ---------------------------------------------------------------------------
# 2. Resume Structurer
# ---------------------------------------------------------------------------

def structure_resume(raw_text: str) -> dict:
    """Convert raw resume text into structured JSON."""
    prompt = resume_structurer_prompt(raw_text)

    result = call_with_retry(lambda: _generate(prompt, max_tokens=1500, temperature=0.1))

    defaults = {
        "name": "",
        "email": "",
        "phone": "",
        "summary": "",
        "skills": [],
        "experience": [],
        "education": [],
        "projects": [],
    }
    for key, default in defaults.items():
        result.setdefault(key, default)

    return result


# ---------------------------------------------------------------------------
# 3. Match Resume (pure Python — no AI calls, fast)
# ---------------------------------------------------------------------------

def match_resume(resume_data: dict, jd_data: dict) -> dict:
    """
    Compute ATS match score between resume and JD using keyword overlap.
    Pure Python — no network calls, instant.
    """
    resume_skills = [s.lower() for s in resume_data.get("skills", [])]

    jd_skills = (
        jd_data.get("required_skills", [])
        + jd_data.get("tools", [])
        + jd_data.get("keywords", [])
        + jd_data.get("preferred_skills", [])
    )
    jd_skills_lower = [s.lower() for s in jd_skills if isinstance(s, str)]

    matched, missing = [], []
    for s in jd_skills_lower:
        if any(s in rs or rs in s for rs in resume_skills):
            if s not in matched:
                matched.append(s)
        else:
            if s not in missing:
                missing.append(s)

    total = len(set(jd_skills_lower))
    score = int((len(matched) / total) * 100) if total > 0 else 100

    return {
        "match_score": min(100, score),
        "matched_keywords": list(set(matched)),
        "missing_keywords": list(set(missing)),
    }


# ---------------------------------------------------------------------------
# 4. Resume Optimizer / Rewriter (CORE)
# ---------------------------------------------------------------------------

def rewrite_resume(
    resume_data: dict,
    jd_text: str,
    generate_cover_letter: bool = False,
    generate_cold_email: bool = False,
) -> dict:
    """
    Rewrite a resume to align with a JD.  Optionally generates cover letter
    and cold email in parallel within the same response pipeline.

    Returns dict with: optimized_resume, changes, cover_letter?, cold_email?
    """
    resume_json = json.dumps(resume_data, indent=2)[:6000]
    prompt = resume_optimizer_prompt(resume_json, jd_text)

    result = call_with_retry(lambda: _generate(prompt, max_tokens=2000, temperature=0.3))

    result.setdefault("optimized_resume", "")
    result.setdefault("changes", [])

    # Generate cover letter as separate call (if requested)
    if generate_cover_letter:
        try:
            cl = _generate_cover_letter_internal(resume_json, jd_text)
            result["cover_letter"] = cl.get("cover_letter", "")
        except Exception as exc:
            logger.error("Cover letter generation failed: %s", exc)
            result["cover_letter"] = ""

    # Generate cold email as separate call (if requested)
    if generate_cold_email:
        try:
            ce = _generate_cold_email_internal(resume_json, jd_text)
            result["cold_email"] = ce.get("cold_email", "")
        except Exception as exc:
            logger.error("Cold email generation failed: %s", exc)
            result["cold_email"] = ""

    return result


# Alias for the extended API
optimize_resume = rewrite_resume


# ---------------------------------------------------------------------------
# 5. Cover Letter Generator
# ---------------------------------------------------------------------------

def _generate_cover_letter_internal(resume_json: str, jd_text: str) -> dict:
    prompt = cover_letter_prompt(resume_json, jd_text)
    return call_with_retry(lambda: _generate(prompt, max_tokens=1200, temperature=0.3))


def generate_cover_letter(resume_data: dict, jd_text: str) -> str:
    """Public API — returns just the cover letter text."""
    resume_json = json.dumps(resume_data, indent=2)[:4000]
    result = _generate_cover_letter_internal(resume_json, jd_text)
    return result.get("cover_letter", "")


# ---------------------------------------------------------------------------
# 6. Cold Email Generator
# ---------------------------------------------------------------------------

def _generate_cold_email_internal(resume_json: str, jd_text: str) -> dict:
    prompt = cold_email_prompt(resume_json, jd_text)
    return call_with_retry(lambda: _generate(prompt, max_tokens=500, temperature=0.3))


def generate_cold_email(resume_data: dict, jd_text: str) -> str:
    """Public API — returns just the cold email text."""
    resume_json = json.dumps(resume_data, indent=2)[:3000]
    result = _generate_cold_email_internal(resume_json, jd_text)
    return result.get("cold_email", "")


# ---------------------------------------------------------------------------
# 7. File Name Generator
# ---------------------------------------------------------------------------

def generate_file_name(candidate_name: str, company_name: str, role: str) -> str:
    """Generate a professional PDF filename."""
    prompt = file_name_prompt(candidate_name, company_name, role)
    try:
        result = call_with_retry(lambda: _generate(prompt, max_tokens=100, temperature=0.1))
        return result.get("filename", f"{candidate_name.replace(' ', '_')}_Resume")
    except Exception:
        # Deterministic fallback — never fail on filename
        safe_name = candidate_name.replace(" ", "_")
        safe_role = role.replace(" ", "_")
        return f"{safe_name}_{safe_role}_Resume"
