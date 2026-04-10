"""
markdown_parser.py — Parse Career-Ops evaluation reports into structured JSON.

Evaluation reports follow the format:
  # Evaluación: {Company} — {Role}
  **Fecha:** ...
  **Arquetipo:** ...
  **Score:** X/5
  ...
  ## A) Resumen del Rol
  ...
  ## B) Match con CV
  ...
"""

import re
from typing import Any


def parse_evaluation_report(content: str) -> dict[str, Any]:
    """
    Parse an evaluation report .md file into structured JSON.

    Returns:
        {
            "company": str,
            "role": str,
            "date": str,
            "archetype": str,
            "score": float,
            "sections": {
                "role_summary": str,
                "cv_match": str,
                "level_strategy": str,
                "compensation": str,
                "personalization_plan": str,
                "interview_plan": str,
                "application_drafts": str,
                "keywords": str
            },
            "recommendation": "apply" | "skip" | "maybe"
        }
    """
    result: dict[str, Any] = {
        "company": "",
        "role": "",
        "date": "",
        "archetype": "",
        "score": 0.0,
        "score_raw": "",
        "url": "",
        "sections": {},
        "recommendation": "maybe",
    }

    lines = content.strip().split("\n")

    # Parse header metadata
    for line in lines[:20]:  # Metadata is in the first ~20 lines
        # Title: # Evaluación: Company — Role
        title_match = re.match(r"#\s+(?:Evaluación|Evaluation):\s*(.+?)\s*[—–-]\s*(.+)", line)
        if title_match:
            result["company"] = title_match.group(1).strip()
            result["role"] = title_match.group(2).strip()

        # Date
        date_match = re.match(r"\*\*(?:Fecha|Date):\*\*\s*(.+)", line)
        if date_match:
            result["date"] = date_match.group(1).strip()

        # Archetype
        arch_match = re.match(r"\*\*(?:Arquetipo|Archetype):\*\*\s*(.+)", line)
        if arch_match:
            result["archetype"] = arch_match.group(1).strip()

        # Score
        score_match = re.match(r"\*\*Score:\*\*\s*(.+)", line)
        if score_match:
            result["score_raw"] = score_match.group(1).strip()
            num_match = re.search(r"(\d+\.?\d*)/5", result["score_raw"])
            if num_match:
                result["score"] = float(num_match.group(1))

        # URL
        url_match = re.match(r"\*\*URL:\*\*\s*(.+)", line)
        if url_match:
            result["url"] = url_match.group(1).strip()

    # Parse sections
    section_map = {
        "A": "role_summary",
        "B": "cv_match",
        "C": "level_strategy",
        "D": "compensation",
        "E": "personalization_plan",
        "F": "interview_plan",
        "G": "application_drafts",
    }

    current_section = None
    section_content: list[str] = []

    for line in lines:
        # Detect section headers: ## A) ... or ## B) ...
        section_match = re.match(r"##\s+([A-G])\)\s+", line)
        if section_match:
            # Save previous section
            if current_section:
                key = section_map.get(current_section, current_section.lower())
                result["sections"][key] = "\n".join(section_content).strip()

            current_section = section_match.group(1)
            section_content = []
            continue

        # Detect Keywords section
        if re.match(r"##\s+Keywords", line, re.IGNORECASE):
            if current_section:
                key = section_map.get(current_section, current_section.lower())
                result["sections"][key] = "\n".join(section_content).strip()
            current_section = "keywords"
            section_content = []
            continue

        if current_section:
            section_content.append(line)

    # Save last section
    if current_section:
        key = section_map.get(current_section, current_section.lower()) if current_section != "keywords" else "keywords"
        result["sections"][key] = "\n".join(section_content).strip()

    # Derive recommendation from score
    if result["score"] >= 4.0:
        result["recommendation"] = "apply"
    elif result["score"] >= 3.0:
        result["recommendation"] = "maybe"
    else:
        result["recommendation"] = "skip"

    return result
