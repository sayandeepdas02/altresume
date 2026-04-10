"""
tracker_parser.py — Parse Career-Ops applications.md into structured JSON.

Production-hardened: handles malformed tables, missing columns,
inconsistent formatting, and never raises.
"""

import logging
import re
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


def parse_applications_tracker(content: str) -> Dict[str, Any]:
    """
    Parse applications.md content into structured data.

    Always returns valid result — never raises.

    Returns:
        {
            "entries": [{num, date, company, role, score, status, ...}],
            "summary": {total, by_status, avg_score},
            "status": "success" | "empty" | "failed"
        }
    """
    result = {
        "entries": [],
        "summary": {"total": 0, "by_status": {}, "avg_score": 0.0},
        "status": "success",
    }

    if not content or not content.strip():
        result["status"] = "empty"
        return result

    try:
        entries = []
        lines = content.strip().split("\n")

        for line in lines:
            if not line.startswith("|"):
                continue

            try:
                parts = [p.strip() for p in line.split("|")]
                parts = [p for p in parts if p]  # Remove empty strings from pipes

                if len(parts) < 5:
                    continue

                # Skip header and separator rows
                try:
                    num = int(parts[0])
                except (ValueError, IndexError):
                    continue

                entry = {
                    "num": num,
                    "date": _safe_get(parts, 1, ""),
                    "company": _safe_get(parts, 2, "Unknown"),
                    "role": _safe_get(parts, 3, "Unknown Role"),
                    "score": _parse_score(_safe_get(parts, 4, "")),
                    "score_raw": _safe_get(parts, 4, ""),
                    "status": _clean_status(_safe_get(parts, 5, "")),
                    "has_pdf": "✅" in _safe_get(parts, 6, ""),
                    "report_link": _extract_link(_safe_get(parts, 7, "")),
                    "notes": _safe_get(parts, 8, ""),
                }
                entries.append(entry)

            except Exception as line_exc:
                logger.debug("[Parser] Error parsing tracker line: %s", line_exc)
                continue

        result["entries"] = entries

        # Build summary
        scores = [e["score"] for e in entries if e["score"] is not None]
        status_counts: Dict[str, int] = {}
        for e in entries:
            s = e["status"].lower()
            status_counts[s] = status_counts.get(s, 0) + 1

        result["summary"] = {
            "total": len(entries),
            "by_status": status_counts,
            "avg_score": round(sum(scores) / len(scores), 2) if scores else 0.0,
        }

        logger.info("[Parser] Tracker parsed: %d entries, avg score %.1f",
                     len(entries), result["summary"]["avg_score"])

    except Exception as exc:
        logger.error("[Parser] Tracker parsing failed: %s", exc, exc_info=True)
        result["status"] = "failed"

    return result


def _safe_get(lst: list, idx: int, default: str = "") -> str:
    """Safely get a list element by index."""
    try:
        return lst[idx] if idx < len(lst) else default
    except (IndexError, TypeError):
        return default


def _parse_score(raw: str) -> Optional[float]:
    """Parse score from format 'X.X/5' or 'N/A'."""
    try:
        raw = raw.replace("**", "").strip()
        match = re.match(r"(\d+\.?\d*)/5", raw)
        if match:
            return float(match.group(1))
        # Try plain number
        match = re.match(r"(\d+\.?\d*)", raw)
        if match:
            val = float(match.group(1))
            if val <= 5:
                return val
        return None
    except Exception:
        return None


def _clean_status(raw: str) -> str:
    """Remove markdown bold and trailing dates from status."""
    try:
        status = raw.replace("**", "").strip()
        status = re.sub(r"\s+\d{4}-\d{2}-\d{2}.*$", "", status)
        return status or "Unknown"
    except Exception:
        return "Unknown"


def _extract_link(raw: str) -> str:
    """Extract URL from markdown link [text](url)."""
    try:
        match = re.search(r"\]\(([^)]+)\)", raw)
        return match.group(1) if match else ""
    except Exception:
        return ""
