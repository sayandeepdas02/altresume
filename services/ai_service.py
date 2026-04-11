"""
ai_service.py — Career AI evaluation layer.

Uses HuggingFace Inference API (Mistral or Qwen) to provide:
  1. JD parsing
  2. Resume vs JD comparison
  3. Skill gap analysis
  4. Match score calculation (0-100)
  5. Resume rewriting / optimization tips

Decision Engine:
  match_score >= 70  → APPLY
  match_score >= 50  → CONSIDER
  match_score < 50   → SKIP

All outputs are strict JSON with fallback defaults.
No hallucination — low temperature, clamped scores, validated fields.
"""

import json
import logging
import os
import re
from typing import Optional

from huggingface_hub import InferenceClient

logger = logging.getLogger(__name__)

# Model — uses Mistral as specified, falls back to Qwen
MODEL_ID = os.getenv("CAREER_AI_MODEL", "mistralai/Mistral-7B-Instruct-v0.3")


def _get_client() -> InferenceClient:
    """Get HuggingFace inference client."""
    token = os.getenv("HUGGINGFACE_API_KEY")
    if not token:
        raise EnvironmentError(
            "HUGGINGFACE_API_KEY is not set. "
            "Set it in your .env file to enable AI evaluation."
        )
    return InferenceClient(model=MODEL_ID, token=token)


def _generate(prompt: str, max_tokens: int = 1500, temperature: float = 0.1) -> str:
    """Call LLM via HuggingFace chat_completion API."""
    logger.info("[AI] Calling %s (max_tokens=%d, temp=%.1f)", MODEL_ID, max_tokens, temperature)
    try:
        client = _get_client()
        response = client.chat_completion(
            messages=[{"role": "user", "content": prompt}],
            max_tokens=max_tokens,
            temperature=temperature,
        )
        content = response.choices[0].message.content
        logger.info("[AI] Response received (%d chars)", len(content))
        return content
    except Exception as exc:
        logger.error("[AI] LLM call failed: %s", exc, exc_info=True)
        raise


def _safe_json_parse(text: str) -> dict:
    """
    Extract JSON from LLM response, handling common issues.
    Returns empty dict if all extraction methods fail.
    """
    text = text.strip()

    # 1. Direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # 2. Extract from Markdown code block
    json_match = re.search(r"```(?:json)?\s*\n([\s\S]*?)\n```", text)
    if json_match:
        try:
            return json.loads(json_match.group(1).strip())
        except json.JSONDecodeError:
            pass

    # 3. Find first { to last }
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(text[start:end + 1])
        except json.JSONDecodeError:
            pass

    # 4. Try to find first [ to last ] (arrays)
    start = text.find("[")
    end = text.rfind("]")
    if start != -1 and end != -1 and end > start:
        try:
            arr = json.loads(text[start:end + 1])
            return {"items": arr}
        except json.JSONDecodeError:
            pass

    logger.warning("[AI] Failed to parse JSON from response: %s...", text[:300])
    return {}


# ---------------------------------------------------------------------------
# Decision Engine (TASK 6)
# ---------------------------------------------------------------------------

def decide_recommendation(match_score: float) -> str:
    """
    Deterministic decision engine.

    Args:
        match_score: 0-100 percentage

    Returns:
        "APPLY" | "CONSIDER" | "SKIP"
    """
    if match_score >= 70:
        return "APPLY"
    elif match_score >= 50:
        return "CONSIDER"
    else:
        return "SKIP"


# ---------------------------------------------------------------------------
# 1. JD Parsing
# ---------------------------------------------------------------------------

def parse_jd(jd_text: str) -> dict:
    """
    Parse a raw job description into structured data.

    Returns:
        {
            "job_title": str,
            "company": str,
            "location": str,
            "required_skills": [str],
            "preferred_skills": [str],
            "experience_years": str,
            "education": str,
            "responsibilities": [str],
            "benefits": [str]
        }
    """
    prompt = f"""Extract structured information from this job description.

Job Description:
{jd_text[:5000]}

Respond with ONLY valid JSON (no markdown, no explanation):
{{
    "job_title": "<role title>",
    "company": "<company name or 'Unknown'>",
    "location": "<location or 'Remote'>",
    "required_skills": ["<skill 1>", "<skill 2>", ...],
    "preferred_skills": ["<nice-to-have skill>", ...],
    "experience_years": "<e.g., '3-5 years'>",
    "education": "<degree requirement>",
    "responsibilities": ["<responsibility 1>", ...],
    "benefits": ["<benefit 1>", ...]
}}"""

    try:
        raw = _generate(prompt, max_tokens=800, temperature=0.1)
        result = _safe_json_parse(raw)

        defaults = {
            "job_title": "Unknown Role",
            "company": "Unknown",
            "location": "",
            "required_skills": [],
            "preferred_skills": [],
            "experience_years": "",
            "education": "",
            "responsibilities": [],
            "benefits": [],
        }
        for key, default in defaults.items():
            result.setdefault(key, default)

        logger.info("[AI] Parsed JD: %s at %s", result["job_title"], result["company"])
        return result

    except Exception as exc:
        logger.error("[AI] JD parsing failed: %s", exc)
        return {
            "job_title": "Unknown Role",
            "company": "Unknown",
            "location": "",
            "required_skills": [],
            "preferred_skills": [],
            "experience_years": "",
            "education": "",
            "responsibilities": [],
            "benefits": [],
            "status": "failed",
            "error": str(exc),
        }


# ---------------------------------------------------------------------------
# 2. Full Job Evaluation (0-100 scoring + decision engine)
# ---------------------------------------------------------------------------

def evaluate_job(resume_data: dict, jd_text: str) -> dict:
    """
    Full evaluation: resume vs JD comparison with scoring.

    Returns normalized output:
    {
        "match_score": 0-100,
        "job_score": 0-5 (legacy),
        "recommendation": "APPLY" | "CONSIDER" | "SKIP",
        "job_title": str,
        "company": str,
        "archetype": str,
        "fit_summary": str,
        "strengths": [str],
        "gaps": [str],   (= missing_skills)
        "missing_skills": [str],
        "gap_mitigations": [str],
        "personalization_tips": [str],
        "interview_stories": [{requirement, story}],
        "keywords": [str],
        "status": "success" | "failed"
    }
    """
    resume_json = json.dumps(resume_data, indent=2)[:5000]

    prompt = f"""You are an expert career advisor. Evaluate how well this candidate matches this job.

## Candidate Resume:
{resume_json}

## Job Description:
{jd_text[:4000]}

## Scoring Rules:
- Score on a 0-100 scale where 100 = perfect match
- 70+ = strong match (should apply)
- 50-69 = moderate match (consider carefully)
- Below 50 = weak match (likely skip)
- Be honest and accurate. Do NOT inflate scores.

Respond with ONLY valid JSON (no markdown, no explanation):
{{
    "match_score": <int 0-100>,
    "job_title": "<extracted job title>",
    "company": "<extracted company>",
    "archetype": "<role category: Backend, Frontend, AI/ML, DevOps, PM, Data, Design, etc.>",
    "fit_summary": "<2-3 sentence honest assessment of fit>",
    "strengths": ["<matching strength 1>", "<strength 2>"],
    "missing_skills": ["<missing required skill 1>", "<missing skill 2>"],
    "gap_mitigations": ["<how to address missing skill 1>"],
    "personalization_tips": ["<specific CV change 1>", "<CV change 2>"],
    "interview_stories": [
        {{"requirement": "<JD requirement>", "story": "<STAR story outline>"}}
    ],
    "keywords": ["<ATS keyword 1>", "<keyword 2>"]
}}"""

    try:
        raw = _generate(prompt, max_tokens=2000, temperature=0.15)
        result = _safe_json_parse(raw)

        if not result:
            raise ValueError("AI returned empty or unparseable response")

        # --- Normalize and validate ---

        # Score: clamp to 0-100
        match_score = max(0, min(100, int(result.get("match_score", 0))))
        result["match_score"] = match_score

        # Legacy 0-5 score
        result["job_score"] = round(match_score / 20, 1)

        # Decision engine
        result["recommendation"] = decide_recommendation(match_score)

        # Ensure all fields exist
        defaults = {
            "job_title": "Unknown Role",
            "company": "Unknown",
            "archetype": "Unknown",
            "fit_summary": "",
            "strengths": [],
            "missing_skills": [],
            "gaps": [],
            "gap_mitigations": [],
            "personalization_tips": [],
            "interview_stories": [],
            "keywords": [],
        }
        for key, default in defaults.items():
            result.setdefault(key, default)

        # Alias: gaps = missing_skills for backward compat
        if not result["gaps"] and result["missing_skills"]:
            result["gaps"] = result["missing_skills"]
        elif not result["missing_skills"] and result["gaps"]:
            result["missing_skills"] = result["gaps"]

        result["status"] = "success"
        result["summary"] = result["fit_summary"]  # Aliases for output contract

        logger.info(
            "[AI] Evaluation complete: score=%d, rec=%s, title=%s",
            match_score, result["recommendation"], result.get("job_title", "?")
        )
        return result

    except Exception as exc:
        logger.error("[AI] Job evaluation failed: %s", exc, exc_info=True)
        return {
            "match_score": 0,
            "job_score": 0.0,
            "job_title": "Unknown",
            "company": "Unknown",
            "archetype": "Unknown",
            "fit_summary": f"Evaluation failed: {str(exc)}",
            "summary": f"Evaluation failed: {str(exc)}",
            "recommendation": "SKIP",
            "strengths": [],
            "missing_skills": [],
            "gaps": [],
            "gap_mitigations": [],
            "personalization_tips": [],
            "interview_stories": [],
            "keywords": [],
            "status": "failed",
            "error": str(exc),
        }


# ---------------------------------------------------------------------------
# 3. Resume Optimization (rewrite for specific JD)
# ---------------------------------------------------------------------------

def optimize_resume(resume_data: dict, jd_text: str, evaluation: dict = None) -> dict:
    """
    Generate an optimized resume tailored for a specific JD.

    Uses evaluation data (if available) to focus on gap areas.

    Returns:
        {
            "optimized_summary": str,
            "skill_additions": [str],
            "bullet_rewrites": [{section, original, optimized}],
            "ats_keywords_to_add": [str],
            "overall_strategy": str,
            "status": "success" | "failed"
        }
    """
    resume_json = json.dumps(resume_data, indent=2)[:4000]

    eval_context = ""
    if evaluation:
        gaps = evaluation.get("missing_skills", evaluation.get("gaps", []))
        tips = evaluation.get("personalization_tips", [])
        eval_context = f"""
## Evaluation Context:
- Match Score: {evaluation.get('match_score', 'N/A')}
- Missing Skills: {', '.join(gaps) if gaps else 'None identified'}
- Optimization Tips: {', '.join(tips) if tips else 'None'}
"""

    prompt = f"""You are an expert resume optimizer. Rewrite and optimize this resume for the specific job.

## Current Resume:
{resume_json}

## Target Job Description:
{jd_text[:3000]}
{eval_context}

## Rules:
- Keep all truthful content — do NOT fabricate experience
- Rewrite bullets to highlight relevant experience using JD language
- Add missing ATS keywords naturally
- Optimize summary for the specific role
- Suggest skill additions that the candidate likely has but didn't list

Respond with ONLY valid JSON:
{{
    "optimized_summary": "<rewritten professional summary targeting this role>",
    "skill_additions": ["<skill to add>", ...],
    "bullet_rewrites": [
        {{
            "section": "<Experience/Projects/etc>",
            "original": "<original bullet text>",
            "optimized": "<rewritten bullet with JD keywords>"
        }}
    ],
    "ats_keywords_to_add": ["<keyword>", ...],
    "overall_strategy": "<1-2 sentence optimization strategy>"
}}"""

    try:
        raw = _generate(prompt, max_tokens=2000, temperature=0.2)
        result = _safe_json_parse(raw)

        defaults = {
            "optimized_summary": "",
            "skill_additions": [],
            "bullet_rewrites": [],
            "ats_keywords_to_add": [],
            "overall_strategy": "",
        }
        for key, default in defaults.items():
            result.setdefault(key, default)

        result["status"] = "success"
        logger.info("[AI] Resume optimization complete (%d bullet rewrites)", len(result["bullet_rewrites"]))
        return result

    except Exception as exc:
        logger.error("[AI] Resume optimization failed: %s", exc)
        return {
            "optimized_summary": "",
            "skill_additions": [],
            "bullet_rewrites": [],
            "ats_keywords_to_add": [],
            "overall_strategy": "",
            "status": "failed",
            "error": str(exc),
        }


# ---------------------------------------------------------------------------
# 4. Fit Summary (lightweight batch scoring)
# ---------------------------------------------------------------------------

def generate_fit_summary(resume_data: dict, jd_data: dict) -> dict:
    """Quick fit summary — lighter than full evaluation."""
    resume_json = json.dumps(resume_data, indent=2)[:3000]
    jd_json = json.dumps(jd_data, indent=2)[:2000]

    prompt = f"""Quickly assess job fit. Resume skills vs job requirements.

Resume: {resume_json}
Job: {jd_json}

Respond with ONLY valid JSON:
{{
    "match_score": <int 0-100>,
    "fit_summary": "<1-2 sentences>",
    "recommendation": "<APPLY|CONSIDER|SKIP>",
    "top_matches": ["<matching skill 1>", ...],
    "critical_gaps": ["<missing requirement 1>", ...]
}}"""

    try:
        raw = _generate(prompt, max_tokens=500, temperature=0.1)
        result = _safe_json_parse(raw)

        score = max(0, min(100, int(result.get("match_score", 0))))
        result["match_score"] = score
        result["recommendation"] = decide_recommendation(score)
        result.setdefault("fit_summary", "")
        result.setdefault("top_matches", [])
        result.setdefault("critical_gaps", [])
        result["status"] = "success"
        return result
    except Exception as exc:
        logger.error("[AI] Fit summary failed: %s", exc)
        return {
            "match_score": 0,
            "fit_summary": str(exc),
            "recommendation": "SKIP",
            "top_matches": [],
            "critical_gaps": [],
            "status": "failed",
        }


# ---------------------------------------------------------------------------
# 5. Outreach Message Generator
# ---------------------------------------------------------------------------

def generate_outreach(
    resume_data: dict,
    jd_text: str,
    contact_name: Optional[str] = None,
    contact_role: Optional[str] = None,
) -> dict:
    """Generate a LinkedIn outreach message for a job listing."""
    resume_json = json.dumps(resume_data, indent=2)[:3000]
    contact_info = ""
    if contact_name:
        contact_info = f"\nRecipient: {contact_name}"
        if contact_role:
            contact_info += f" ({contact_role})"

    prompt = f"""Write a concise, professional LinkedIn outreach message for this job opportunity.
{contact_info}

Resume: {resume_json}

Job Description: {jd_text[:2000]}

Rules:
- Keep it under 300 characters for connection note, under 1000 characters for full message
- Be specific about why you're a fit
- Don't be generic or desperate
- Professional but human tone

Respond with ONLY valid JSON:
{{
    "connection_note": "<short note, max 300 chars>",
    "message": "<full outreach message>",
    "subject": "<message subject line>"
}}"""

    try:
        raw = _generate(prompt, max_tokens=800, temperature=0.4)
        result = _safe_json_parse(raw)
        result.setdefault("connection_note", "")
        result.setdefault("message", "")
        result.setdefault("subject", "")
        result["status"] = "success"
        return result
    except Exception as exc:
        logger.error("[AI] Outreach generation failed: %s", exc)
        return {"connection_note": "", "message": "", "subject": "", "status": "failed"}


# ---------------------------------------------------------------------------
# 6. Interview Preparation
# ---------------------------------------------------------------------------

def prepare_interview(resume_data: dict, jd_text: str, company_name: str = "") -> dict:
    """Generate interview preparation materials."""
    resume_json = json.dumps(resume_data, indent=2)[:4000]

    prompt = f"""You are an interview coach. Prepare interview materials.
Company: {company_name or 'the company'}

Resume: {resume_json}

Job Description: {jd_text[:3000]}

Generate STAR+R stories mapped to JD requirements, likely questions, and talking points.

Respond with ONLY valid JSON:
{{
    "star_stories": [
        {{
            "requirement": "<JD requirement>",
            "situation": "<context>",
            "task": "<what needed to be done>",
            "action": "<what the candidate did>",
            "result": "<outcome with metrics>",
            "reflection": "<lesson learned>"
        }}
    ],
    "likely_questions": ["<question 1>", ...],
    "red_flag_responses": [
        {{"question": "<tricky question>", "suggested_response": "<how to answer>"}}
    ],
    "key_talking_points": ["<point 1>", ...],
    "questions_to_ask": ["<question to ask interviewer>", ...]
}}"""

    try:
        raw = _generate(prompt, max_tokens=2500, temperature=0.3)
        result = _safe_json_parse(raw)
        result.setdefault("star_stories", [])
        result.setdefault("likely_questions", [])
        result.setdefault("red_flag_responses", [])
        result.setdefault("key_talking_points", [])
        result.setdefault("questions_to_ask", [])
        result["status"] = "success"
        return result
    except Exception as exc:
        logger.error("[AI] Interview prep failed: %s", exc)
        return {
            "star_stories": [],
            "likely_questions": [],
            "red_flag_responses": [],
            "key_talking_points": [],
            "questions_to_ask": [],
            "status": "failed",
        }

# ---------------------------------------------------------------------------
# 7. Form Application Assist
# ---------------------------------------------------------------------------

def generate_form_answers(resume_data: dict, form_fields: list, company_name: str = "", job_role: str = "") -> dict:
    """Generate exact string answers to inject into web forms."""
    resume_json = json.dumps(resume_data, indent=2)[:4000]
    fields_json = json.dumps(form_fields, indent=2)

    prompt = f"""You are an AI assistant helping a candidate auto-fill an online job application form for {job_role} at {company_name}.
    
Resume: {resume_json}

Available Form Fields: {fields_json}

Rules:
- For each field, return a single string representing the best answer based on the resume.
- For select dropdowns or radio buttons, attempt to exactly match one of the available options if provided.
- If a field asks for years of experience, return a number string (e.g., "5").
- If the resume lacks the information, return a blank string "".
- Provide ONLY valid JSON mapping the field id or name to the answer.

Example Response format:
{{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "linkedin_url": "https://linkedin.com/in/johndoe",
    "q_12345": "Yes, I am authorized to work in the US without sponsorship."
}}
"""

    try:
        raw = _generate(prompt, max_tokens=1500, temperature=0.1)
        result = _safe_json_parse(raw)
        return result
    except Exception as exc:
        logger.error("[AI] Form generation failed: %s", exc)
        return {}
