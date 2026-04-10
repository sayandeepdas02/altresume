"""
career_ops_service.py — Subprocess wrapper for Career-Ops Node.js scripts.

This is the ONLY point of contact between Python and Career-Ops.
No Career-Ops logic is imported or duplicated — all interaction
happens through subprocess calls to the Node.js scripts.

Public API:
  setup_user_workspace → Create/sync user workspace with resume and config
  scan_jobs            → Scan portals for new job listings
  generate_pdf         → Render HTML resume to ATS-optimized PDF
  verify_pipeline      → Health-check tracker integrity
  get_pipeline_status  → Parse tracker into structured JSON
  run_doctor           → Validate Career-Ops prerequisites

All functions return CareerOpsResult dataclass.
"""

import json
import logging
import os
import shutil
import subprocess
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

from .parsers.scan_output_parser import parse_scan_output
from .parsers.tracker_parser import parse_applications_tracker

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# Root of the Career-Ops repo (unmodified, read-only)
CAREER_OPS_ROOT = Path(os.getenv(
    "CAREER_OPS_ROOT",
    Path(__file__).resolve().parent.parent / "career_ops"
))

# Per-user workspace base directory
CAREER_OPS_WORKSPACES = Path(os.getenv(
    "CAREER_OPS_WORKSPACES",
    Path(__file__).resolve().parent.parent / "backend" / "career_ops_workspaces"
))

# Node.js binary — try nvm path first, then fall back to system
def _find_node_binary() -> str:
    """Find the node binary, checking nvm first."""
    nvm_dir = os.path.expanduser("~/.nvm")
    if os.path.isdir(nvm_dir):
        # Find latest node version in nvm
        versions_dir = os.path.join(nvm_dir, "versions", "node")
        if os.path.isdir(versions_dir):
            versions = sorted(os.listdir(versions_dir), reverse=True)
            for v in versions:
                node_bin = os.path.join(versions_dir, v, "bin", "node")
                if os.path.isfile(node_bin):
                    return node_bin
    return os.getenv("NODE_BIN", "node")

NODE_BIN = _find_node_binary()

# Timeouts (seconds)
SCAN_TIMEOUT = 120
PDF_TIMEOUT = 60
DEFAULT_TIMEOUT = 30


# ---------------------------------------------------------------------------
# Result dataclass
# ---------------------------------------------------------------------------

@dataclass
class CareerOpsResult:
    """Standardized result from any Career-Ops operation."""
    success: bool
    data: dict = field(default_factory=dict)
    error: Optional[str] = None
    execution_time: float = 0.0
    raw_stdout: str = ""
    raw_stderr: str = ""


# ---------------------------------------------------------------------------
# Workspace management (TASK 2 — CRITICAL)
# ---------------------------------------------------------------------------

def setup_user_workspace(user_id: str, resume_data: dict = None, profile_config: dict = None) -> Path:
    """
    Create and fully populate a user's Career-Ops workspace.

    This MUST be called before any scan/evaluation operation.
    It creates the full workspace structure and writes:
      - cv.md (from user's resume)
      - config/profile.yml (user preferences)
      - portals.yml (job sources)
      - data/* (tracker files)

    Args:
        user_id: Unique user identifier
        resume_data: Structured resume dict (from Resume.parsed_data or Resume.structured_data)
        profile_config: Career profile config dict

    Returns:
        Path to the workspace directory
    """
    workspace = CAREER_OPS_WORKSPACES / str(user_id)
    workspace.mkdir(parents=True, exist_ok=True)

    # Create required subdirectories
    for subdir in ["data", "reports", "output", "jds", "config", "batch/tracker-additions"]:
        (workspace / subdir).mkdir(parents=True, exist_ok=True)

    # --- Write cv.md from resume data ---
    if resume_data:
        cv_md = _resume_to_markdown(resume_data)
        (workspace / "cv.md").write_text(cv_md, encoding="utf-8")
        logger.info("Wrote cv.md for user %s (%d chars)", user_id, len(cv_md))

    # --- Write config/profile.yml ---
    if profile_config:
        _write_profile_yml(workspace, profile_config)
        _write_portals_config(workspace, profile_config)

    # --- Ensure data files exist ---
    _ensure_data_files(workspace)

    return workspace


def _resume_to_markdown(resume_data: dict) -> str:
    """
    Convert structured resume JSON → cv.md (Career-Ops format).

    This generates a clean Markdown CV that Career-Ops can read
    for evaluation, PDF generation, and comparison.
    """
    lines = []

    name = resume_data.get("name", "")
    email = resume_data.get("email", "")
    phone = resume_data.get("phone", "")
    linkedin = resume_data.get("linkedin", "")
    github = resume_data.get("github", "")

    # Header
    if name:
        lines.append(f"# {name}")
    contact = []
    if email:
        contact.append(email)
    if phone:
        contact.append(phone)
    if linkedin:
        contact.append(linkedin)
    if github:
        contact.append(github)
    if contact:
        lines.append(" | ".join(contact))
    lines.append("")

    # Summary
    summary = resume_data.get("summary", "")
    if summary:
        lines.append("## Summary")
        lines.append(summary)
        lines.append("")

    # Skills
    skills = resume_data.get("skills", {})
    if skills:
        lines.append("## Skills")
        if isinstance(skills, dict):
            hard = skills.get("hard_skills", [])
            soft = skills.get("soft_skills", [])
            if hard:
                lines.append(f"**Technical:** {', '.join(hard)}")
            if soft:
                lines.append(f"**Soft Skills:** {', '.join(soft)}")
        elif isinstance(skills, list):
            lines.append(", ".join(skills))
        lines.append("")

    # Experience
    experience = resume_data.get("experience", [])
    if experience:
        lines.append("## Experience")
        for exp in experience:
            if isinstance(exp, dict):
                role = exp.get("role", exp.get("title", ""))
                company = exp.get("company", "")
                location = exp.get("location", "")
                start = exp.get("start_date", "")
                end = exp.get("end_date", "Present")
                header = f"### {role}"
                if company:
                    header += f" — {company}"
                lines.append(header)
                meta = []
                if location:
                    meta.append(location)
                if start:
                    meta.append(f"{start} – {end}")
                if meta:
                    lines.append("*" + " | ".join(meta) + "*")
                bullets = exp.get("bullets", exp.get("description", []))
                if isinstance(bullets, list):
                    for b in bullets:
                        lines.append(f"- {b}")
                elif isinstance(bullets, str) and bullets:
                    lines.append(bullets)
                lines.append("")
            elif isinstance(exp, str):
                lines.append(f"- {exp}")

    # Education
    education = resume_data.get("education", [])
    if education:
        lines.append("## Education")
        for edu in education:
            if isinstance(edu, dict):
                degree = edu.get("degree", "")
                institution = edu.get("institution", edu.get("school", ""))
                header = f"### {degree}"
                if institution:
                    header += f" — {institution}"
                lines.append(header)
                start = edu.get("start_date", "")
                end = edu.get("end_date", "")
                desc = edu.get("description", "")
                if start:
                    lines.append(f"*{start} – {end}*")
                if desc:
                    lines.append(desc)
                lines.append("")

    # Projects
    projects = resume_data.get("projects", [])
    if projects:
        lines.append("## Projects")
        for proj in projects:
            if isinstance(proj, dict):
                name_p = proj.get("name", "")
                desc = proj.get("description", "")
                tech = proj.get("tech_stack", [])
                link = proj.get("link", "")
                header = f"### {name_p}"
                if link:
                    header += f" — [{link}]({link})"
                lines.append(header)
                if desc:
                    lines.append(desc)
                if tech:
                    lines.append(f"**Tech:** {', '.join(tech)}")
                lines.append("")

    # Certifications
    certs = resume_data.get("certifications", [])
    if certs:
        lines.append("## Certifications")
        for cert in certs:
            if isinstance(cert, dict):
                lines.append(f"- {cert.get('name', '')} — {cert.get('institution', '')} ({cert.get('date', '')})")
            elif isinstance(cert, str):
                lines.append(f"- {cert}")
        lines.append("")

    return "\n".join(lines)


def _write_profile_yml(workspace: Path, config: dict):
    """Write config/profile.yml from career profile."""
    try:
        import yaml
    except ImportError:
        logger.warning("PyYAML not installed — skipping profile.yml")
        return

    profile = {
        "identity": {
            "target_roles": config.get("target_roles", []),
        },
        "preferences": {
            "salary_range": config.get("salary_range", {}),
            "location": config.get("location_preferences", {}),
        },
        "filters": {
            "excluded_keywords": config.get("excluded_keywords", []),
        },
    }

    path = workspace / "config" / "profile.yml"
    path.write_text(yaml.dump(profile, default_flow_style=False), encoding="utf-8")
    logger.info("Wrote profile.yml for workspace %s", workspace.name)


def _write_portals_config(workspace: Path, user_config: dict) -> Path:
    """
    Write a portals.yml from user's career profile config.
    """
    try:
        import yaml
    except ImportError:
        logger.warning("PyYAML not installed — skipping portals.yml")
        return workspace / "portals.yml"

    portals = {
        "title_filter": {
            "positive": user_config.get("target_roles", []),
            "negative": user_config.get("excluded_keywords", []),
        },
        "tracked_companies": user_config.get("target_companies", []),
    }

    portals_path = workspace / "portals.yml"
    portals_path.write_text(yaml.dump(portals, default_flow_style=False), encoding="utf-8")
    return portals_path


def _ensure_data_files(workspace: Path):
    """Ensure all required data files exist in workspace."""
    # pipeline.md
    pipeline_file = workspace / "data" / "pipeline.md"
    if not pipeline_file.exists():
        pipeline_file.write_text(
            "# Pipeline\n\n## Pendientes\n\n## Procesadas\n",
            encoding="utf-8",
        )

    # applications.md
    apps_file = workspace / "data" / "applications.md"
    if not apps_file.exists():
        apps_file.write_text(
            "# Applications Tracker\n\n"
            "| # | Date | Company | Role | Score | Status | PDF | Report | Notes |\n"
            "|---|------|---------|------|-------|--------|-----|--------|-------|\n",
            encoding="utf-8",
        )

    # scan-history.tsv
    scan_history = workspace / "data" / "scan-history.tsv"
    if not scan_history.exists():
        scan_history.write_text(
            "url\tfirst_seen\tportal\ttitle\tcompany\tstatus\n",
            encoding="utf-8",
        )


# ---------------------------------------------------------------------------
# Subprocess execution
# ---------------------------------------------------------------------------

def _run_script(
    script_name: str,
    args: list = None,
    cwd: str = None,
    timeout: int = DEFAULT_TIMEOUT,
    env_extra: dict = None,
) -> CareerOpsResult:
    """
    Execute a Career-Ops Node.js script via subprocess.
    """
    script_path = CAREER_OPS_ROOT / script_name
    if not script_path.exists():
        logger.error("Career-Ops script not found: %s", script_path)
        return CareerOpsResult(
            success=False,
            error=f"Script not found: {script_path}",
        )

    cmd = [NODE_BIN, str(script_path)]
    if args:
        cmd.extend(args)

    env = os.environ.copy()
    # Ensure nvm node is on PATH
    node_dir = os.path.dirname(NODE_BIN)
    env["PATH"] = node_dir + ":" + env.get("PATH", "")
    if env_extra:
        env.update(env_extra)

    work_dir = cwd or str(CAREER_OPS_ROOT)

    logger.info("[Career-Ops] Executing: %s (cwd=%s, timeout=%ds)", " ".join(cmd), work_dir, timeout)
    start = time.monotonic()

    try:
        result = subprocess.run(
            cmd,
            cwd=work_dir,
            capture_output=True,
            text=True,
            timeout=timeout,
            env=env,
        )

        elapsed = time.monotonic() - start

        if result.returncode != 0:
            logger.warning(
                "[Career-Ops] Script failed (exit=%d): %s\nstdout: %s\nstderr: %s",
                result.returncode, script_name,
                result.stdout[:500], result.stderr[:500],
            )

        return CareerOpsResult(
            success=result.returncode == 0,
            raw_stdout=result.stdout,
            raw_stderr=result.stderr,
            execution_time=elapsed,
            error=result.stderr.strip() if result.returncode != 0 else None,
        )

    except subprocess.TimeoutExpired:
        elapsed = time.monotonic() - start
        logger.error("[Career-Ops] Timed out after %ds: %s", timeout, script_name)
        return CareerOpsResult(success=False, error=f"Script timed out after {timeout}s", execution_time=elapsed)
    except FileNotFoundError:
        logger.error("[Career-Ops] Node.js binary not found at: %s", NODE_BIN)
        return CareerOpsResult(success=False, error=f"Node.js binary not found at: {NODE_BIN}")
    except Exception as exc:
        elapsed = time.monotonic() - start
        logger.error("[Career-Ops] Execution error: %s", exc, exc_info=True)
        return CareerOpsResult(success=False, error=str(exc), execution_time=elapsed)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def scan_jobs(user_id: str, user_config: dict, dry_run: bool = False) -> CareerOpsResult:
    """
    Scan job portals for new listings.
    Workspace is set up automatically.
    """
    try:
        workspace = setup_user_workspace(user_id, profile_config=user_config)
    except Exception as exc:
        logger.error("[Career-Ops] Workspace setup failed: %s", exc)
        return CareerOpsResult(success=False, error=f"Workspace setup failed: {exc}")

    args = []
    if dry_run:
        args.append("--dry-run")

    result = _run_script(
        "scan.mjs",
        args=args,
        cwd=str(workspace),
        timeout=SCAN_TIMEOUT,
    )

    if result.success:
        try:
            result.data = parse_scan_output(result.raw_stdout)
        except Exception as exc:
            logger.error("[Career-Ops] Scan output parsing failed: %s", exc)
            result.data = {"new_offers": [], "errors": [{"error": str(exc)}]}

    return result


def generate_pdf(
    input_html: str,
    output_pdf: str,
    page_format: str = "a4",
) -> CareerOpsResult:
    """Generate an ATS-optimized PDF from HTML using Career-Ops Playwright engine."""
    if not os.path.exists(input_html):
        return CareerOpsResult(success=False, error=f"HTML file not found: {input_html}")

    os.makedirs(os.path.dirname(output_pdf), exist_ok=True)

    args = [input_html, output_pdf, f"--format={page_format}"]
    result = _run_script("generate-pdf.mjs", args=args, timeout=PDF_TIMEOUT)

    if result.success:
        data = {"output_path": output_pdf, "page_count": 1, "size_kb": 0.0}
        if os.path.exists(output_pdf):
            data["size_kb"] = round(os.path.getsize(output_pdf) / 1024, 1)
        # Parse stdout
        for line in result.raw_stdout.split("\n"):
            if "Pages:" in line:
                try:
                    data["page_count"] = int(line.split("Pages:")[1].strip())
                except (ValueError, IndexError):
                    pass
        result.data = data
    return result


def verify_pipeline(user_id: str) -> CareerOpsResult:
    """Run pipeline health checks on a user's workspace."""
    workspace = setup_user_workspace(user_id)
    result = _run_script("verify-pipeline.mjs", cwd=str(workspace), timeout=DEFAULT_TIMEOUT)

    data = {"errors": 0, "warnings": 0, "status": "clean"}
    for line in result.raw_stdout.split("\n"):
        if "errors" in line and "warnings" in line:
            try:
                parts = line.split()
                for i, p in enumerate(parts):
                    if p == "errors," or p == "errors":
                        data["errors"] = int(parts[i - 1])
                    if p == "warnings":
                        data["warnings"] = int(parts[i - 1])
            except (ValueError, IndexError):
                pass

    if data["errors"] > 0:
        data["status"] = "errors"
    elif data["warnings"] > 0:
        data["status"] = "warnings"

    result.data = data
    return result


def get_pipeline_status(user_id: str) -> CareerOpsResult:
    """Parse the user's application tracker into structured JSON."""
    workspace = setup_user_workspace(user_id)
    apps_file = workspace / "data" / "applications.md"

    if not apps_file.exists():
        return CareerOpsResult(
            success=True,
            data={"entries": [], "summary": {"total": 0, "by_status": {}, "avg_score": 0.0}},
        )

    try:
        content = apps_file.read_text(encoding="utf-8")
        parsed = parse_applications_tracker(content)
        return CareerOpsResult(success=True, data=parsed)
    except Exception as exc:
        logger.error("[Career-Ops] Tracker parsing failed: %s", exc)
        return CareerOpsResult(success=False, error=str(exc))


def run_doctor() -> CareerOpsResult:
    """Validate Career-Ops prerequisites."""
    result = _run_script("doctor.mjs", timeout=DEFAULT_TIMEOUT)
    if result.success:
        result.data = {"diagnostics": result.raw_stdout, "healthy": True}
    else:
        result.data = {"diagnostics": result.raw_stdout + result.raw_stderr, "healthy": False}
    return result
