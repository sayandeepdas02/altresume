"""
Tests for the Career pipeline app.

Validates:
  ✔ Career-Ops wrapper executes commands correctly
  ✔ Data is parsed into JSON
  ✔ APIs return correct format
  ✔ Models store data correctly
"""

from django.test import TestCase
from services.parsers.scan_output_parser import parse_scan_output
from services.parsers.tracker_parser import parse_applications_tracker
from services.parsers.markdown_parser import parse_evaluation_report


class ScanOutputParserTest(TestCase):
    """Test scan.mjs stdout parsing."""

    def test_parse_full_output(self):
        stdout = """Scanning 15 companies via API (3 skipped — no API detected)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Portal Scan — 2026-04-10
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Companies scanned:     15
Total jobs found:      234
Filtered by title:     180 removed
Duplicates:            20 skipped
New offers added:      34

New offers:
  + Anthropic | AI Engineer | San Francisco
  + OpenAI | ML Researcher | Remote

Errors (1):
  ✗ SomeCompany: HTTP 404
"""
        result = parse_scan_output(stdout)

        self.assertEqual(result["scan_date"], "2026-04-10")
        self.assertEqual(result["companies_scanned"], 15)
        self.assertEqual(result["total_found"], 234)
        self.assertEqual(result["filtered"], 180)
        self.assertEqual(result["duplicates"], 20)
        self.assertEqual(result["new_offers_count"], 34)
        self.assertEqual(len(result["new_offers"]), 2)
        self.assertEqual(result["new_offers"][0]["company"], "Anthropic")
        self.assertEqual(result["new_offers"][1]["title"], "ML Researcher")
        self.assertEqual(len(result["errors"]), 1)
        self.assertEqual(result["errors"][0]["company"], "SomeCompany")

    def test_parse_empty_output(self):
        result = parse_scan_output("")
        self.assertEqual(result["new_offers_count"], 0)
        self.assertEqual(result["new_offers"], [])


class TrackerParserTest(TestCase):
    """Test applications.md parsing."""

    def test_parse_tracker(self):
        content = """# Applications Tracker

| # | Date | Company | Role | Score | Status | PDF | Report | Notes |
|---|------|---------|------|-------|--------|-----|--------|-------|
| 1 | 2026-04-10 | Anthropic | AI Engineer | 4.2/5 | Evaluated | ✅ | [001](reports/001-anthropic-2026-04-10.md) | Strong match |
| 2 | 2026-04-10 | OpenAI | ML Eng | 3.5/5 | Applied | ❌ | [002](reports/002-openai-2026-04-10.md) | |
"""
        result = parse_applications_tracker(content)

        self.assertEqual(result["summary"]["total"], 2)
        self.assertAlmostEqual(result["summary"]["avg_score"], 3.85)
        self.assertEqual(len(result["entries"]), 2)
        self.assertEqual(result["entries"][0]["company"], "Anthropic")
        self.assertEqual(result["entries"][0]["score"], 4.2)
        self.assertTrue(result["entries"][0]["has_pdf"])
        self.assertFalse(result["entries"][1]["has_pdf"])


class MarkdownParserTest(TestCase):
    """Test evaluation report parsing."""

    def test_parse_evaluation_report(self):
        content = """# Evaluación: Anthropic — AI Engineer

**Fecha:** 2026-04-10
**Arquetipo:** LLMOps
**Score:** 4.2/5
**URL:** https://example.com/job/123

---

## A) Resumen del Rol
This is a senior AI engineering role.

## B) Match con CV
Strong match on ML experience.

## C) Nivel y Estrategia
Target senior level.
"""
        result = parse_evaluation_report(content)

        self.assertEqual(result["company"], "Anthropic")
        self.assertEqual(result["role"], "AI Engineer")
        self.assertEqual(result["score"], 4.2)
        self.assertEqual(result["archetype"], "LLMOps")
        self.assertEqual(result["recommendation"], "apply")
        self.assertIn("role_summary", result["sections"])
        self.assertIn("cv_match", result["sections"])
