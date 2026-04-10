/**
 * careerApi.ts — Frontend API client for Career Pipeline.
 *
 * All calls go through Next.js API routes which proxy to Django
 * using httpOnly cookies for auth.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CareerProfile {
  target_roles: string[];
  target_companies: CompanyConfig[];
  excluded_keywords: string[];
  salary_range: SalaryRange;
  location_preferences: LocationPrefs;
  created_at: string;
  updated_at: string;
}

export interface CompanyConfig {
  name: string;
  careers_url: string;
  api?: string;
  enabled: boolean;
}

export interface SalaryRange {
  min?: number;
  max?: number;
  currency?: string;
}

export interface LocationPrefs {
  remote?: boolean;
  cities?: string[];
  countries?: string[];
}

export interface JobListing {
  id: string;
  company: string;
  role: string;
  url: string;
  location: string;
  source: string;
  raw_jd?: string;
  status: JobStatus;
  score: number | null;
  match_score: number | null;         // 0-100 normalized
  fit_summary: string;
  recommendation: 'apply' | 'skip' | 'maybe';
  display_recommendation: string;     // "APPLY" | "CONSIDER" | "SKIP"
  missing_skills: string[];
  archetype: string;
  evaluation_data?: EvaluationData;
  resume_pdf_url: string;
  discovered_at: string;
  evaluated_at: string | null;
}

export type JobStatus =
  | 'new'
  | 'evaluated'
  | 'applied'
  | 'responded'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'discarded'
  | 'skipped';

export interface EvaluationData {
  match_score: number;
  job_score: number;
  archetype: string;
  fit_summary: string;
  strengths: string[];
  gaps: string[];
  missing_skills: string[];
  gap_mitigations: string[];
  recommendation: string;
  personalization_tips: string[];
  interview_stories: { requirement: string; story: string }[];
  keywords: string[];
  status: string;
}

export interface PipelineRun {
  id: string;
  run_type: 'scan' | 'evaluate' | 'pdf' | 'batch' | 'optimize';
  status: 'pending' | 'running' | 'completed' | 'failed';
  celery_task_id: string;
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown>;
  error: string;
  started_at: string;
  completed_at: string | null;
}

export interface JobListResponse {
  total: number;
  limit: number;
  offset: number;
  jobs: JobListing[];
}

export interface AsyncResult {
  pipeline_run_id: string;
  task_id: string;
  status: string;
  message: string;
  job_listing_id?: string;
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
// Career Profile
// ---------------------------------------------------------------------------

export async function getCareerProfile(): Promise<CareerProfile> {
  return apiFetch('/api/career/profile');
}

export async function saveCareerProfile(data: Partial<CareerProfile>): Promise<CareerProfile> {
  return apiFetch('/api/career/profile', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ---------------------------------------------------------------------------
// Job Scanning
// ---------------------------------------------------------------------------

export async function triggerScan(dryRun = false): Promise<AsyncResult> {
  return apiFetch('/api/career/scan', {
    method: 'POST',
    body: JSON.stringify({ dry_run: dryRun }),
  });
}

// ---------------------------------------------------------------------------
// Job Evaluation
// ---------------------------------------------------------------------------

/** Evaluate an existing job listing or a pasted JD */
export async function evaluateJob(params: {
  job_listing_id?: string;
  job_url?: string;
  job_description?: string;
  company?: string;
  role?: string;
  resume_id?: string;
}): Promise<AsyncResult> {
  return apiFetch('/api/career/evaluate', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/** Full pipeline: evaluate + optimize + PDF */
export async function optimizeJob(params: {
  job_listing_id: string;
  resume_id?: string;
}): Promise<AsyncResult> {
  return apiFetch('/api/career/optimize', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// ---------------------------------------------------------------------------
// Pipeline Status
// ---------------------------------------------------------------------------

export async function getPipelineRuns(): Promise<PipelineRun[]> {
  return apiFetch('/api/career/pipeline');
}

export async function getPipelineRun(id: string): Promise<PipelineRun> {
  return apiFetch(`/api/career/pipeline/${id}`);
}

/**
 * Poll a pipeline run until completion.
 */
export async function pollPipelineRun(
  id: string,
  intervalMs = 2000,
  maxAttempts = 60
): Promise<PipelineRun> {
  for (let i = 0; i < maxAttempts; i++) {
    const run = await getPipelineRun(id);
    if (run.status === 'completed' || run.status === 'failed') {
      return run;
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  throw new Error('Pipeline run polling timed out');
}

// ---------------------------------------------------------------------------
// Job Listings
// ---------------------------------------------------------------------------

export async function getJobs(params?: {
  status?: JobStatus;
  recommendation?: string;
  min_score?: number;
  company?: string;
  limit?: number;
  offset?: number;
}): Promise<JobListResponse> {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.set(key, String(value));
      }
    });
  }
  const query = searchParams.toString();
  return apiFetch(`/api/career/jobs${query ? `?${query}` : ''}`);
}

export async function getJob(id: string): Promise<JobListing> {
  return apiFetch(`/api/career/jobs/${id}`);
}

export async function updateJobStatus(id: string, status: JobStatus): Promise<JobListing> {
  return apiFetch(`/api/career/jobs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
