"""
json_parser.py — JSON safety layer for LLM outputs.

Mistral does NOT guarantee valid JSON.  This module provides:
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
# Core extraction — try 3 strategies before giving up
# ---------------------------------------------------------------------------

def extract_json(text: str) -> dict:
    """
    Extract the first valid JSON object from arbitrary text.

    Strategy order:
      1. Direct parse (cheapest)
      2. Markdown fence extraction (```json ... ```)
      3. Greedy brace matching (outermost { ... })
    """
    if not text or not text.strip():
        raise ValueError("Empty response from model")

    # Strategy 1 — direct parse
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        pass

    # Strategy 2 — markdown fence
    fence = re.search(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", text)
    if fence:
        try:
            return json.loads(fence.group(1))
        except json.JSONDecodeError:
            pass

    # Strategy 3 — greedy brace match
    start = text.find("{")
    if start != -1:
        depth = 0
        for i in range(start, len(text)):
            if text[i] == "{":
                depth += 1
            elif text[i] == "}":
                depth -= 1
            if depth == 0:
                try:
                    return json.loads(text[start : i + 1])
                except json.JSONDecodeError:
                    break

    raise ValueError(f"Could not extract JSON from model output (length={len(text)})")


# ---------------------------------------------------------------------------
# LLM-based JSON repair
# ---------------------------------------------------------------------------

def repair_json(broken_text: str) -> dict:
    """
    Send broken JSON back to Mistral with a repair prompt.
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
