# AltResume - Comprehensive Project Update & Audit

This document serves as a detailed breakdown of the complete AltResume architecture, the current status of all features, areas where the system is currently breaking, and immediate required fixes.

## 1. Project Overview & Architecture
AltResume is an AI-powered SaaS built to optimize user resumes against specific Job Descriptions (JDs) to bypass Applicant Tracking Systems (ATS).

- **Frontend**: Next.js 14+ (App Router) using Tailwind CSS, Zustand, and Lucide React. UI is designed with a premium, Stripe-inspired aesthetic.
- **Backend**: Django & Django REST Framework (DRF) hooked to MongoDB via Djongo. 
- **Asynchronous Queue**: Celery backed by Redis for handling heavy LLM inference tasks.
- **AI Infrastructure**: Designed to extract JSON data, parse JDs, and rewrite resumes using sophisticated JSON extraction wrappers.

---

## 2. Detailed Feature Breakdown & Working Status

### 🟢 1. Google OAuth Authentication & User Management
- **Feature**: Users authenticate via Google OAuth. The JWT is validated and mapped to a local User model with an `ObjectId` for MongoDB.
- **Status**: **Working**. The `users` and `authentication` apps encapsulate this logic. 

### 🟢 2. Resume Ingestion & Parsing
- **Feature**: Users can upload `.pdf` or `.docx` files (up to 5MB). The files are stored in `media/` and parsed into structured JSON data.
- **Status**: **Working**. The `UploadResumeView` and `ParseResumeView` in `backend/resumes/views.py` successfully handle file ingestion, size validation, and kickoff the parsing service.

### 🟢 3. Dashboard & Resume Library System
- **Feature**: A unified Next.js dashboard grid where users can see past resumes, duplicate them (version control), delete them, or kick off a Quick Auto-Tailor from a drag-and-drop zone.
- **Status**: **Working**. State is smoothly managed in the frontend. API integrations for duplicate and delete are properly wired.

### 🟢 4. Job Description (JD) Analysis
- **Feature**: Users paste a target JD, and the backend processes it using AI to extract keywords, mandatory skills, and soft skills into structured JSON.
- **Status**: **Working**. `backend/jd/views.py` interfaces with `analyze_jd`.

### 🟡 5. ATS Auditing and Match Scoring
- **Feature**: Generates a percentage match score comparing the parsed resume and the JD. Outputs "missing skills" and "matched skills".
- **Status**: **Partially Working/Degraded**. The logic is fully built out in `frontend/app/dashboard/[id]/ats/page.tsx`, but the backend relies on brittle AI infrastructure (see "Where it is Breaking").

### 🟡 6. AI Resume Auto-Tailoring (Optimization)
- **Feature**: The core engine rewrites bullet points to include missing keywords. Uses a complex asynchronous queue via Celery to ensure the UI doesn't block.
- **Status**: **Partially Working**. Has a robust custom wrapper (`backend/optimization/services/json_parser.py`) for handling mangled LLM outputs, including a fallback repair mechanism. However, AI provider conflicts are causing runtime issues.

### 🟢 7. High-Quality PDF Exports
- **Feature**: Translates optimized JSON structure into dynamic HTML templates (Modern, Minimal, Professional) and uses `WeasyPrint` to output a binary PDF.
- **Status**: **Working**. Handled natively via `backend/export/views.py`.

---

## 3. Where It Is Breaking (Critical Issues)

Through a deep audit of the codebase, several severe discrepancies and breaking issues were discovered:

### 🔴 1. Missing Dependency Tracking (`requirements.txt` is missing)
- **The Issue**: The `backend/requirements.txt` file does not exist anywhere in the directory.
- **Impact**: Any developer checking out this repository cannot build or run the backend server. The `README.md` explicitly instructs the use of `pip install -r requirements.txt`, which immediately throws a fatal `No such file or directory` error.

### 🔴 2. AI Model Provider Conflict & Configuration Drift
- **The Issue**: The `README.md` explicitly markets the app as powered by the **OpenAI API (GPT-4o-mini)**. The backend `.env` variables expect `OPENAI_API_KEY`. However, inside `backend/optimization/services/json_parser.py`, the code is hardcoded to use the **HuggingFace InferenceClient** targeting `Qwen/Qwen2.5-7B-Instruct`, looking for a `HUGGINGFACE_API_KEY`.
- **Impact**: Optimization logic will crash in production/development because the necessary API keys (`HUGGINGFACE_API_KEY`) are entirely missing from the documented `.env` setup, and the expected OpenAI infrastructure has been ripped out or overridden for JSON repair.

### 🔴 3. Silent Failures during Token Refunds
- **The Issue**: In `backend/optimization/tasks.py`, if the Celery async optimization task fails, it attempts to refund the user's token. However, if the `User` lookup fails during the exception block, it hits a bare `except Exception: pass`.
- **Impact**: Silent failures. Users who experience a system crash may permanently lose tokens without any error log generated for the developer to debug.

---

## 4. Required Fixes (Immediate Remediation Plan)

1. **Rebuild Python Dependencies**:
   - Create a fresh Python environment.
   - Manually reinstall the required packages (Django, djangorestframework, djongo, celery, redis, weasyprint, huggingface_hub).
   - Generate a definitive `requirements.txt` via `pip freeze > requirements.txt`.

2. **Unify AI Infrastructure**:
   - **Decision Required**: Decide whether AltResume is using OpenAI or HuggingFace (Qwen). 
   - Once decided, refactor `json_parser.py` and `ai_service.py` to use a single unified provider.
   - Update `.env.example` to enforce the correct API key (`OPENAI_API_KEY` vs `HUGGINGFACE_API_KEY`).

3. **Improve Error Visibility**:
   - Remove bare `pass` blocks.
   - In `backend/optimization/tasks.py` (Line 61), replace `pass` with `logger.error(f"Failed to refund token for user {user_id}: {e}")`.

4. **Synchronize README.md**:
   - Update the architecture stack and environmental variables in the README to reflect the actual state of the application. (This has been concurrently updated).
