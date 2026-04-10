"""
scan_output_parser.py — Parse scan.mjs stdout into structured JSON.

Production-hardened: handles inconsistent formats, missing fields,
empty outputs, and logs all failures.
"""

import logging
import re
from typing import Any, Dict

logger = logging.getLogger(__name__)


def parse_scan_output(stdout: str) -> Dict[str, Any]:
    """
    Parse the stdout from scan.mjs into structured data.

    Always returns a valid result dict — never raises.

    Returns:
        {
            "scan_date": str,
            "companies_scanned": int,
            "total_found": int,
            "filtered": int,
            "duplicates": int,
            "new_offers_count": int,
            "new_offers": [{company, title, location, url?, source?}, ...],
            "errors": [{company, error}, ...],
            "status": "success" | "empty" | "partial"
        }
    """
    result = {
        "scan_date": "",
        "companies_scanned": 0,
        "total_found": 0,
        "filtered": 0,
        "duplicates": 0,
        "new_offers_count": 0,
        "new_offers": [],
        "errors": [],
        "status": "success",
    }

    if not stdout or not stdout.strip():
        result["status"] = "empty"
        logger.warning("[Parser] Scan output is empty")
        return result

    try:
        lines = stdout.strip().split("\n")

        for line in lines:
            line_stripped = line.strip()

            # Skip empty / decoration lines
            if not line_stripped or set(line_stripped) <= {"━", "─", "−", "=", "-"}:
                continue

            try:
                # Parse date
                date_match = re.search(r"(?:Portal Scan|Scan)\s*[—–\-]\s*(\d{4}-\d{2}-\d{2})", line_stripped)
                if date_match:
                    result["scan_date"] = date_match.group(1)
                    continue

                # Parse summary stats (flexible matching)
                if "Companies scanned:" in line_stripped or "companies scanned:" in line_stripped.lower():
                    result["companies_scanned"] = _extract_int(line_stripped)
                elif "Total jobs found:" in line_stripped or "total jobs" in line_stripped.lower():
                    result["total_found"] = _extract_int(line_stripped)
                elif "Filtered by title:" in line_stripped or "filtered" in line_stripped.lower():
                    result["filtered"] = _extract_int(line_stripped)
                elif "Duplicates:" in line_stripped or "duplicates" in line_stripped.lower():
                    result["duplicates"] = _extract_int(line_stripped)
                elif "New offers added:" in line_stripped or "new offers" in line_stripped.lower():
                    result["new_offers_count"] = _extract_int(line_stripped)

                # Parse new offers (lines starting with +)
                offer_match = re.match(r"\s*\+\s*(.+?)\s*\|\s*(.+?)(?:\s*\|\s*(.+))?$", line_stripped)
                if offer_match:
                    offer = {
                        "company": offer_match.group(1).strip(),
                        "title": offer_match.group(2).strip(),
                        "location": (offer_match.group(3) or "").strip(),
                        "url": "",
                        "source": "scan",
                    }
                    result["new_offers"].append(offer)
                    continue

                # Parse errors (lines starting with ✗ or x or !)
                error_match = re.match(r"\s*[✗✘!x]\s*(.+?):\s*(.+)", line_stripped)
                if error_match:
                    result["errors"].append({
                        "company": error_match.group(1).strip(),
                        "error": error_match.group(2).strip(),
                    })
                    continue

            except Exception as line_exc:
                logger.debug("[Parser] Error parsing line '%s': %s", line_stripped[:80], line_exc)
                continue

        # Reconcile counts
        if result["new_offers"] and result["new_offers_count"] == 0:
            result["new_offers_count"] = len(result["new_offers"])

        if result["errors"]:
            result["status"] = "partial"

    except Exception as exc:
        logger.error("[Parser] Scan output parsing failed: %s", exc, exc_info=True)
        result["status"] = "failed"
        result["errors"].append({"company": "parser", "error": str(exc)})

    logger.info(
        "[Parser] Scan parsed: %d companies, %d new offers, %d errors",
        result["companies_scanned"], result["new_offers_count"], len(result["errors"])
    )
    return result


def _extract_int(line: str) -> int:
    """Extract the first integer from a line (after the colon)."""
    try:
        after_colon = line.split(":")[-1]
        match = re.search(r"(\d+)", after_colon)
        return int(match.group(1)) if match else 0
    except Exception:
        return 0
