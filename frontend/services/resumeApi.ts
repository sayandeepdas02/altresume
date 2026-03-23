/**
 * resumeApi.ts — Centralized API client for resume operations.
 *
 * All calls go through Next.js API routes which proxy to Django
 * using httpOnly cookies for auth. No direct token handling needed.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ResumeSkills {
  hard_skills: string[];
  soft_skills: string[];
}

export interface Experience {
  company: string;
  role: string;
  location: string;
  start_date: string;
  end_date: string;
  bullets: string[];
}

export interface Education {
  institution: string;
  degree: string;
  start_date: string;
  end_date: string;
  description: string;
}

export interface Project {
  name: string;
  description: string;
  tech_stack: string[];
  link: string;
}

export interface Certification {
  name: string;
  institution: string;
  date: string;
}

export interface StructuredResume {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  summary: string;
  skills: ResumeSkills;
  experience: Experience[];
  education: Education[];
  projects: Project[];
  certifications: Certification[];
}

export interface ResumeSummary {
  id: string;
  title: string;
  file_name: string;
  version: number;
  has_file: boolean;
  has_structured_data: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResumeDetail extends ResumeSummary {
  parsed_data: Record<string, unknown>;
  structured_data: StructuredResume | null;
  parent_resume_id: string | null;
  file_url?: string;
}

export interface ScoreResult {
  match_score: number;
  matching_skills: string[];
  missing_skills: string[];
  strengths: string[];
  gaps: string[];
  rationale: string;
  recommendation: string;
}

export interface OptimizationResult {
  status: string;
  optimization_id: string;
  match_score: number;
  original_score: number;
  score_improvement: number;
  parsed_resume: StructuredResume;
  ai_modifications: any;
  final_resume: StructuredResume;
  optimized_resume: StructuredResume | string;
  cover_letter: string;
  cold_email: string;
  matching_skills: string[];
  missing_skills: string[];
  matched_keywords: string[];
  missing_keywords: string[];
  strengths: string[];
  gaps: string[];
  rationale: string;
  recommendation: string;
  changes: Array<{ before: string; after: string; reason: string }>;
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `API error: ${res.status}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Resume CRUD (through Next.js proxy routes)
// ---------------------------------------------------------------------------

/** List all resumes for the authenticated user */
export async function getResumes(): Promise<ResumeSummary[]> {
  return apiFetch('/api/resumes/list');
}

/** Get a single resume by ID */
export async function getResume(id: string): Promise<ResumeDetail> {
  return apiFetch(`/api/resumes/${id}`);
}

/** Create a resume from structured form data (no file upload) */
export async function createResume(
  title: string,
  structuredData: StructuredResume
): Promise<{ resume_id: string; title: string; version: number }> {
  return apiFetch('/api/resumes/create', {
    method: 'POST',
    body: JSON.stringify({ title, structured_data: structuredData }),
  });
}

/** Update a resume's title and/or structured data */
export async function updateResume(
  id: string,
  data: { title?: string; structured_data?: StructuredResume }
): Promise<{ id: string; title: string; version: number; updated_at: string }> {
  return apiFetch(`/api/resumes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/** Delete a resume */
export async function deleteResume(id: string): Promise<void> {
  await fetch(`/api/resumes/${id}`, { method: 'DELETE', credentials: 'include' });
}

/** Duplicate a resume as a new version */
export async function duplicateResume(
  id: string,
  title?: string
): Promise<{ resume_id: string; title: string; version: number }> {
  return apiFetch(`/api/resumes/${id}/duplicate`, {
    method: 'POST',
    body: JSON.stringify(title ? { title } : {}),
  });
}

// ---------------------------------------------------------------------------
// AI Operations (through existing Next.js proxy routes)
// ---------------------------------------------------------------------------

/** Score a resume against a job description (no rewrite) */
export async function scoreResume(
  resumeId: string,
  jobDescription: string
): Promise<ScoreResult> {
  return apiFetch('/api/optimize/score', {
    method: 'POST',
    body: JSON.stringify({ resume_id: resumeId, job_description: jobDescription }),
  });
}

/** Full optimization: score → rewrite with missing-skills feedback */
export async function optimizeResume(
  resumeId: string,
  jobDescription: string,
  useAiScoring: boolean = true
): Promise<OptimizationResult> {
  return apiFetch('/api/optimize', {
    method: 'POST',
    body: JSON.stringify({ resume_id: resumeId, job_description: jobDescription, use_ai_scoring: useAiScoring }),
  });
}
