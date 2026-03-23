"""
json_parser.py — JSON safety layer for LLM outputs.

LLMs do NOT guarantee valid JSON.  This module provides:
  1. Multi-strategy JSON extraction
  2. LLM-based JSON repair (sends broken text back to the model)
  3. Retry-aware wrapper for any generation function
"""

import re
import json
import logging
import os
from huggingface_hub import InferenceClient
from .prompt_builder import json_repair_prompt

logger = logging.getLogger(__name__)

MODEL_ID = "Qwen/Qwen2.5-7B-Instruct"
MAX_RETRIES = 2


def _get_repair_client() -> InferenceClient:
    token = os.getenv("HUGGINGFACE_API_KEY")
    return InferenceClient(model=MODEL_ID, token=token)


# ---------------------------------------------------------------------------
# Sanitization — fix common LLM JSON quirks before parsing
# ---------------------------------------------------------------------------

def _sanitize_json_text(text: str) -> str:
    """
    Fix common LLM quirks that break json.loads():
      - Literal newlines inside string values (should be \\n)
      - Trailing commas before } or ]
    """
    # Replace literal newlines inside JSON strings with escaped \\n
    # This handles the case where the model outputs:
    #   {"key": "line1\nline2"}  (invalid - literal newline)
    # We want:
    #   {"key": "line1\\nline2"} (valid - escaped)
    
    # Simple approach: try to replace newlines that appear between quotes
    # by working line-by-line is complex. Instead, just replace all
    # newlines that are NOT structural (i.e., not between } and {)
    lines = text.split('\n')
    if len(lines) > 1:
        # Try joining with escaped newlines to see if that parses
        joined = ' '.join(line.strip() for line in lines)
        try:
            json.loads(joined)
            return joined
        except json.JSONDecodeError:
            pass
    
    # Remove trailing commas: ,} or ,]
    text = re.sub(r',\s*([\]}])', r'\1', text)
    
    return text


# ---------------------------------------------------------------------------
# Core extraction — try multiple strategies before giving up
# ---------------------------------------------------------------------------

def extract_json(text: str) -> dict:
    """
    Extract the first valid JSON object from arbitrary text.

    Strategy order:
      1. Direct parse (cheapest)
      2. Direct parse after sanitization
      3. Markdown fence extraction (```json ... ```)
      4. Greedy brace matching
      5. Greedy brace matching after sanitization
    """
    if not text or not text.strip():
        raise ValueError("Empty response from model")

    cleaned = text.strip()

    # Strategy 1 — direct parse
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Strategy 2 — direct parse after sanitization
    try:
        sanitized = _sanitize_json_text(cleaned)
        return json.loads(sanitized)
    except json.JSONDecodeError:
        pass

    # Strategy 3 — markdown fence (greedy match for the JSON block)
    fence = re.search(r"```(?:json)?\s*(\{[\s\S]*\})\s*```", cleaned)
    if fence:
        try:
            return json.loads(fence.group(1))
        except json.JSONDecodeError:
            # Try sanitized version of fence content
            try:
                return json.loads(_sanitize_json_text(fence.group(1)))
            except json.JSONDecodeError:
                pass

    # Strategy 4 — greedy brace match
    start = cleaned.find("{")
    if start != -1:
        # Find the LAST matching brace
        depth = 0
        end_pos = -1
        for i in range(start, len(cleaned)):
            if cleaned[i] == "{":
                depth += 1
            elif cleaned[i] == "}":
                depth -= 1
            if depth == 0:
                end_pos = i
                break

        if end_pos != -1:
            candidate = cleaned[start:end_pos + 1]
            try:
                return json.loads(candidate)
            except json.JSONDecodeError:
                # Strategy 5 — sanitize the brace-matched block
                try:
                    return json.loads(_sanitize_json_text(candidate))
                except json.JSONDecodeError:
                    pass

    raise ValueError(f"Could not extract JSON from model output (length={len(text)})")


# ---------------------------------------------------------------------------
# LLM-based JSON repair
# ---------------------------------------------------------------------------

def repair_json(broken_text: str) -> dict:
    """
    Send broken JSON back to model with a repair prompt.
    Returns the repaired dict or raises ValueError.
    """
    client = _get_repair_client()
    prompt = json_repair_prompt(broken_text)

    try:
        repaired_text = client.chat_completion(
            messages=[{"role": "user", "content": prompt}],
            max_tokens=2000,
            temperature=0.1,
        )
        return extract_json(repaired_text.choices[0].message.content)
    except Exception as exc:
        raise ValueError(f"JSON repair also failed: {exc}") from exc


# ---------------------------------------------------------------------------
# Retry wrapper
# ---------------------------------------------------------------------------

def call_with_retry(generate_fn, max_retries: int = MAX_RETRIES) -> dict:
    """
    1. Call generate_fn() → raw text
    2. extract_json()
    3. On failure → repair_json()
    4. On failure → retry from step 1 (up to max_retries)
    """
    last_error = None

    for attempt in range(1 + max_retries):
        raw_text = None
        try:
            raw_text = generate_fn()
            return extract_json(raw_text)
        except (ValueError, json.JSONDecodeError) as exc:
            logger.warning(
                "JSON extraction failed (attempt %d/%d): %s",
                attempt + 1, 1 + max_retries, exc,
            )

            # Try LLM-based repair on the raw text
            if raw_text:
                try:
                    logger.info("Attempting LLM-based JSON repair...")
                    return repair_json(raw_text)
                except (ValueError, Exception) as repair_exc:
                    logger.warning("JSON repair failed: %s", repair_exc)

            last_error = exc

    raise ValueError(
        f"AI failed to produce valid JSON after {1 + max_retries} attempts. "
        f"Last error: {last_error}"
    )
