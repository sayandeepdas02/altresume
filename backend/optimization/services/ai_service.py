import os
import json
from openai import OpenAI

def get_client():
    api_key = os.getenv("OPENAI_API_KEY")
    return OpenAI(api_key=api_key)

def analyze_jd(text):
    client = get_client()
    prompt = """Extract structured information from the following job description.

Return JSON with:
* role
* required_skills (array of strings)
* preferred_skills (array of strings)
* tools (array of strings)
* responsibilities (array of strings)
* keywords (important ATS keywords string array)

Only return valid JSON."""

    # Limit text length to prevent massive payloads
    truncated_text = text[:15000]

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "jd_schema",
                "strict": True,
                "schema": {
                    "type": "object",
                    "properties": {
                        "role": { "type": "string" },
                        "required_skills": { "type": "array", "items": { "type": "string" } },
                        "preferred_skills": { "type": "array", "items": { "type": "string" } },
                        "tools": { "type": "array", "items": { "type": "string" } },
                        "responsibilities": { "type": "array", "items": { "type": "string" } },
                        "keywords": { "type": "array", "items": { "type": "string" } }
                    },
                    "required": ["role", "required_skills", "preferred_skills", "tools", "responsibilities", "keywords"],
                    "additionalProperties": False
                }
            }
        },
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": truncated_text}
        ]
    )
    return json.loads(response.choices[0].message.content)

def match_resume(resume_data, jd_data):
    # Retrieve raw skills from parsed resume
    resume_skills = [s.lower() for s in resume_data.get('skills', [])]
    
    # Pool together all keywords from JD
    jd_skills = jd_data.get('required_skills', []) + jd_data.get('tools', []) + jd_data.get('keywords', []) + jd_data.get('preferred_skills', [])
    jd_skills_lower = [s.lower() for s in jd_skills if isinstance(s, str)]
    
    matched = []
    missing = []
    
    for s in jd_skills_lower:
        # Check simplistic substring match 
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
        "missing_keywords": list(set(missing))
    }

def rewrite_resume(resume_data, jd_text):
    client = get_client()
    prompt = """You are an expert resume optimizer.

Given:
1. A candidate's resume (structured JSON)
2. A job description

Rewrite the resume to:
* Align with the job description
* Include relevant keywords naturally
* Improve bullet points with impact and clarity
* Use action verbs
* Add measurable outcomes where possible

STRICT RULES:
* Do NOT add fake experience
* Do NOT invent skills not present in resume
* Only rephrase and optimize existing content
* Keep it ATS-friendly

Return EXACTLY IN THIS JSON FORMAT:
{
  "optimized_resume": "The full plain-text markdown or formatted string of the new combined resume.",
  "changes": [
    {
      "before": "Original bullet",
      "after": "Rewritten bullet",
      "reason": "Why it was changed natively"
    }
  ]
}"""

    truncated_jd = jd_text[:10000]
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "rewrite_schema",
                "strict": True,
                "schema": {
                    "type": "object",
                    "properties": {
                        "optimized_resume": { "type": "string" },
                        "changes": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "before": { "type": "string" },
                                    "after": { "type": "string" },
                                    "reason": { "type": "string" }
                                },
                                "required": ["before", "after", "reason"],
                                "additionalProperties": False
                            }
                        }
                    },
                    "required": ["optimized_resume", "changes"],
                    "additionalProperties": False
                }
            }
        },
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": f"RESUME JSON:\n{json.dumps(resume_data)}\n\nJOB DESCRIPTION:\n{truncated_jd}"}
        ]
    )
    
    res_json = json.loads(response.choices[0].message.content)
    return res_json
