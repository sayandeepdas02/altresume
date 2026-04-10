# Alt Resume × Career-Ops — System Context Document

> **Single Source of Truth** for the AI Career Co-Pilot platform.
> Last updated: 2026-04-10

---

## 1. Product Vision

### What Alt Resume Is Becoming

Alt Resume is evolving from a **resume optimization tool** into a **full-stack AI Career Co-Pilot** — a unified platform that helps job seekers across the entire career search lifecycle:

| Capability | Before | After |
|---|---|---|
| Resume Optimization | ✅ AI-powered ATS scoring + rewriting | ✅ Same, enhanced |
| JD Analysis | ✅ Structured parsing | ✅ Same |
| Job Discovery | ❌ Manual | ✅ Auto-scan 45+ company portals |
| Job Evaluation | ❌ None | ✅ A-F scoring with fit analysis |
| Application Tracking | ❌ None | ✅ Full pipeline tracker |
| Outreach Assistance | ❌ None | ✅ LinkedIn message drafts |
| Interview Prep | ❌ None | ✅ STAR stories + company research |
| PDF Generation | ✅ Basic export | ✅ ATS-optimized via Playwright |

### Role of Career-Ops

[Career-Ops](https://github.com/santifer/career-ops) (29k GitHub stars) is an open-source AI-powered job search pipeline built on Claude Code. In this integration, it serves as:

> **A background AI job pipeline engine** — NOT direct UI logic, NOT inline business logic.

Career-Ops provides:
- **Portal scanning** — Greenhouse, Ashby, Lever API integration
- **PDF generation** — Playwright-based ATS-optimized CV rendering
- **Pipeline integrity** — Tracker verification, dedup, normalization
- **Data structure** — YAML config, Markdown reports, TSV tracking

Career-Ops does **NOT** handle:
- User authentication or sessions
- Direct API responses to users
- AI evaluation (this is reimplemented in Django's AI layer)

---

## 2. System Architecture

### Full Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Dashboard    │  │   Builder    │  │  Career Pipeline         │  │
│  │  (Resumes)    │  │  (Editor)    │  │  (Jobs + Evaluation)     │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────────┘  │
│         │                 │                      │                  │
│         └────────┬────────┴──────────┬───────────┘                  │
│                  │  Next.js API      │                              │
│                  │  Routes (proxy)   │                              │
└──────────────────┼───────────────────┼──────────────────────────────┘
                   │                   │
                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     BACKEND (Django REST API)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  resumes     │  │  optimization│  │  career                  │  │
│  │  (CRUD)      │  │  (AI scoring)│  │  (pipeline + evaluation) │  │
│  └──────────────┘  └──────────────┘  └──────────┬───────────────┘  │
│                                                  │                  │
│                         ┌────────────────────────┤                  │
│                         │  Celery Workers        │                  │
│                         │  (async tasks)         │                  │
│                         └────────────┬───────────┘                  │
└──────────────────────────────────────┼──────────────────────────────┘
                                       │
                   ┌───────────────────┼───────────────────┐
                   │                   │                   │
                   ▼                   ▼                   ▼
┌──────────────────────┐ ┌──────────────────┐ ┌──────────────────────┐
│  WRAPPER SERVICE     │ │  AI SERVICE      │ │  CAREER-OPS          │
│  (career_ops_service)│ │  (HF/Qwen)      │ │  (Node.js - isolated)│
│                      │ │                  │ │                      │
│  • subprocess calls  │ │  • evaluate_job  │ │  • scan.mjs          │
│  • workspace mgmt   │ │  • fit_summary   │ │  • generate-pdf.mjs  │
│  • output parsing    │ │  • outreach      │ │  • verify-pipeline   │
│                      │ │  • interview_prep│ │  • doctor.mjs        │
└───────────┬──────────┘ └──────────────────┘ └──────────────────────┘
            │                                          ▲
            └──────────────────────────────────────────┘
                         subprocess.run()
```

### Layer Responsibilities

| Layer | Responsibility | Technology |
|---|---|---|
| **Frontend** | UI rendering, user interaction, API consumption | Next.js, TypeScript, React |
| **Backend API** | Auth, business logic, data persistence, job dispatch | Django, DRF, MongoDB |
| **Celery Workers** | Async execution of slow operations | Celery + Redis |
| **Wrapper Service** | Bridge between Python and Career-Ops | Python subprocess |
| **AI Service** | Job evaluation, scoring, outreach generation | HuggingFace Qwen 2.5-7B |
| **Career-Ops** | Portal scanning, PDF generation, pipeline tools | Node.js, Playwright |

---

## 3. Integration Strategy

### Why Career-Ops Is Isolated

1. **Language boundary** — Career-Ops is Node.js; Alt Resume backend is Python/Django. No cross-language imports.
2. **Update independence** — Career-Ops follows its own release cycle (currently v1.2.0). Isolation means we can pull upstream updates without breaking integration.
3. **Data contract** — Career-Ops has a documented [DATA_CONTRACT.md](../career_ops/DATA_CONTRACT.md) separating user data from system data. We respect this boundary.
4. **No side effects** — Career-Ops scripts exit after execution. No long-running processes or state leakage.
5. **Testability** — Each layer can be tested independently.

### How It Communicates

```
Django Career App
    │
    ├─── career_ops_service.py ──── subprocess.run([node, script.mjs, ...args])
    │         │
    │         ├── Passes: CLI arguments, environment variables
    │         ├── Captures: stdout, stderr, exit code
    │         └── Parses: stdout → structured JSON via parsers/
    │
    └─── ai_service.py ──── HuggingFace API (existing infrastructure)
              │
              └── No Career-Ops dependency (pure Python)
```

### Per-User Workspaces

Career-Ops writes to local files (`data/`, `reports/`, `output/`). For multi-tenant SaaS:

```
backend/career_ops_workspaces/
  ├── {user_id_1}/
  │   ├── portals.yml        (generated from CareerProfile model)
  │   ├── data/
  │   │   ├── applications.md
  │   │   ├── pipeline.md
  │   │   └── scan-history.tsv
  │   ├── reports/
  │   └── output/
  └── {user_id_2}/
      └── ...
```

---

## 4. Data Flow

### Resume → JD → Evaluation → Optimization → Output

```
User uploads resume
    │
    ▼
[Alt Resume: resumes app]
    │ parsed_data (JSON)
    ▼
User triggers "Scan Jobs"
    │
    ▼
[Celery: scan_jobs_task]
    │
    ├──→ [career_ops_service.scan_jobs()]
    │        │
    │        ├──→ subprocess: node scan.mjs
    │        │    (reads portals.yml, hits Greenhouse/Ashby/Lever APIs)
    │        │
    │        └──→ returns: new offers as JSON
    │
    └──→ [Django: stores JobListing records in MongoDB]
             │
             ▼
User selects job → "Evaluate"
    │
    ▼
[Celery: evaluate_job_task]
    │
    ├──→ [ai_service.evaluate_job()]
    │        │
    │        ├──→ HuggingFace Qwen 2.5-7B
    │        │    (resume_data + jd_text → structured evaluation)
    │        │
    │        └──→ returns: {job_score, strengths, gaps, recommendation, ...}
    │
    └──→ [Django: updates JobListing with evaluation_data]
             │
             ▼
User clicks "Generate PDF"
    │
    ▼
[Celery: generate_career_pdf_task]
    │
    ├──→ [career_ops_service.generate_pdf()]
    │        │
    │        ├──→ subprocess: node generate-pdf.mjs
    │        │    (Playwright headless Chromium → HTML to PDF)
    │        │
    │        └──→ returns: {output_path, page_count, size_kb}
    │
    └──→ [Django: stores PDF URL in JobListing.resume_pdf_url]
```

---

## 5. API Contracts

### Career Pipeline Endpoints

| Method | Path | Input | Output |
|---|---|---|---|
| `GET` | `/api/career/profile` | — | `CareerProfile` JSON |
| `POST` | `/api/career/profile` | `{target_roles, target_companies, ...}` | `CareerProfile` JSON |
| `POST` | `/api/career/scan` | `{dry_run?: bool}` | `{pipeline_run_id, task_id, status}` |
| `POST` | `/api/career/evaluate` | `{job_listing_id \| job_url \| job_description}` | `{pipeline_run_id, task_id}` |
| `POST` | `/api/career/optimize` | `{job_listing_id, resume_id?}` | `{pipeline_run_id, task_id}` |
| `POST` | `/api/career/apply` | `{job_listing_id, resume_id?}` | `Application` JSON |
| `GET` | `/api/career/applications`| — | `[Application]` |
| `POST` | `/api/extension/optimize` | `{job_description, resume_id?}` | `{match_score, recommendation, ...}` |
| `GET` | `/api/career/pipeline` | — | `[PipelineRun]` |
| `GET` | `/api/career/pipeline/{id}` | — | `PipelineRun` |
| `GET` | `/api/career/jobs` | `?status=&min_score=&company=` | `{total, jobs: [JobListing]}` |
| `GET` | `/api/career/jobs/{id}` | — | `JobListing` (full evaluation_data) |
| `PATCH` | `/api/career/jobs/{id}` | `{status}` | `JobListing` |

### Job Evaluation Output Schema

```json
{
  "job_score": 4.2,
  "archetype": "AI/ML",
  "fit_summary": "Strong match on ML experience with minor gaps in distributed systems.",
  "strengths": ["3+ years ML engineering", "Production deployment experience"],
  "gaps": ["No Kubernetes experience mentioned"],
  "gap_mitigations": ["Docker experience is transferable; can highlight container orchestration knowledge"],
  "recommendation": "apply",
  "personalization_tips": ["Add distributed systems keywords to summary", "Highlight ML pipeline work"],
  "interview_stories": [
    {"requirement": "ML model deployment", "story": "At CompanyX, deployed real-time inference..."}
  ],
  "keywords": ["machine learning", "PyTorch", "AWS SageMaker", "MLOps"]
}
```

### Pipeline Run Status Schema

```json
{
  "id": "...",
  "run_type": "scan",
  "status": "completed",
  "celery_task_id": "...",
  "input_data": {},
  "output_data": {
    "companies_scanned": 15,
    "new_offers_count": 8,
    "execution_time": 12.3
  },
  "error": "",
  "started_at": "2026-04-10T10:00:00Z",
  "completed_at": "2026-04-10T10:00:12Z"
}
```

---

## 6. Constraints

### No Hallucination
- AI evaluation uses structured prompts with explicit JSON output format
- All scores are clamped to valid ranges (0-5 for Career-Ops scale, 0-100 for ATS)
- Missing data returns explicit defaults, never fabricated content

### JSON-Only Outputs
- All API responses are structured JSON
- Career-Ops native formats (Markdown, TSV) are converted by parsers
- No raw text or HTML in API responses

### Async Processing
- All Career-Ops operations are non-blocking
- Celery tasks with configurable timeouts (scan: 300s, evaluate: 120s, PDF: 60s)
- Frontend polls pipeline status at 2-second intervals
- Active run indicators in the dashboard

### Error Handling

| Scenario | Handling |
|---|---|
| Invalid job URL | Return error in evaluation_data, score = 0 |
| Missing resume | 404 response with clear message |
| Broken scraper | scan_jobs_task captures stderr, logs error, partial results returned |
| Empty scan results | Success with `new_offers_count: 0` |
| LLM timeout | Retry with backoff (max 2 retries) |
| Node.js not found | CareerOpsResult with `error: "Node.js binary not found"` |
| Playwright missing | Detected by `doctor.mjs`, returned in diagnostics |

---

## 7. Future Roadmap

### Phase 1: Current (v1.0) ✅
- Multi-Model Database constraints (`UserProfile`, `Application`, `ApplicationAssets`)
- Career-Ops integration via subprocess
- Job scanning, evaluation, PDF generation
- Smart Chrome extension endpoint (`/api/extension/optimize`)
- Career pipeline dashboard (Search, Recommend, Library, Tracker)
- Async processing via Celery

### Phase 2: Chrome Extension Integration
- Extend existing `/extension` to detect job listings on career pages
- One-click "Evaluate with Alt Resume" from any job posting
- Auto-extract JD text and send to `/api/career/evaluate`

### Phase 3: Scaling Strategy
- Replace subprocess with Express API microservice (Option B)
- Deploy Career-Ops as containerized service (Docker)
- Add WebSocket for real-time pipeline status updates
- S3-backed storage for PDFs and reports

### Phase 4: Multi-LLM Support
- Add Mistral, GPT-4, Claude as evaluation options
- User-selectable AI provider in career profile
- A/B evaluation comparison across models
- Fine-tuned evaluation model for domain-specific scoring

### Phase 5: Advanced Features
- Batch evaluation (evaluate 10+ jobs in parallel)
- Automated application submission (with user approval)
- Salary negotiation intelligence
- Interview scheduling integration
- Portfolio project suggestion engine

---

## Appendix: File Structure

```
/altresume
├── frontend/                      # Next.js 15 (existing)
│   ├── app/
│   │   ├── dashboard/
│   │   │   ├── career/            # NEW — Career pipeline pages
│   │   │   │   ├── page.tsx       # Pipeline dashboard
│   │   │   │   └── [id]/page.tsx  # Job detail view
│   │   │   └── ...
│   │   └── api/career/            # NEW — Proxy routes
│   └── services/
│       ├── resumeApi.ts           # Existing
│       └── careerApi.ts           # NEW — Career API client
│
├── backend/                       # Django (existing)
│   ├── core/                      # Settings, URLs, Celery
│   ├── users/                     # Existing (added UserProfile)
│   ├── career/                    # NEW — Career Django app
│   │   ├── models.py              # JobListing, Application, ApplicationAssets, CareerProfile, PipelineRun
│   │   ├── views.py               # 11 API endpoints
│   │   ├── tasks.py               # Celery async tasks
│   │   ├── serializers.py         # DRF serializers
│   │   └── urls.py                # URL routing
│   ├── resumes/                   # Existing
│   ├── optimization/              # Existing (AI scoring + rewriting)
│   └── career_ops_workspaces/     # Per-user workspace directories
│
├── services/                      # NEW — Wrapper layer
│   ├── career_ops_service.py      # Subprocess wrapper
│   ├── ai_service.py              # Career AI functions
│   └── parsers/                   # Format converters
│       ├── scan_output_parser.py
│       ├── tracker_parser.py
│       └── markdown_parser.py
│
├── career_ops/                    # Career-Ops repo (isolated, unmodified)
│   ├── scan.mjs                   # Portal scanner
│   ├── generate-pdf.mjs           # PDF generator
│   ├── verify-pipeline.mjs        # Integrity checker
│   ├── modes/                     # 14 skill modes
│   └── ...
│
└── docs/
    └── context.md                 # THIS FILE
```
