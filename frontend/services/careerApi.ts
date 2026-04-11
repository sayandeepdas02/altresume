/**
 * careerApi.ts — Unified Career Pipeline API client.
 *
 * Strategy: Calls real Django backend via /api/career/* proxy.
 * Falls back to local mock endpoints if Django is unavailable.
 * All public functions are safe — they never throw unhandled errors.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CareerProfile {
  id?: string;
  target_roles: string[];
  target_companies: CompanyConfig[];
  excluded_keywords: string[];
  salary_range: SalaryRange;
  location_preferences: LocationPrefs;
  created_at?: string;
  updated_at?: string;
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
  raw_jd: string;
  status: string;
  score: number | null;
  match_score: number | null;
  fit_summary: string;
  recommendation: string;
  display_recommendation: string;
  missing_skills: string[];
  archetype: string;
  evaluation_data?: EvaluationData;
  resume_pdf_url: string;
  discovered_at: string;
  evaluated_at: string | null;
  // Fields from mock
  type?: string;
  salary?: string;
  posted?: string;
  requiredSkills?: string[];
  description?: string;
}

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
  celery_task_id?: string;
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown>;
  error: string;
  started_at: string;
  completed_at: string | null;
}

export interface Application {
  id: string;
  job_id?: string;
  job?: JobListing;
  job_details?: {
    role: string;
    company: string;
    location: string;
    match_score?: number;
  };
  status: string;
  applied_at: string;
  created_at?: string;
}

export interface EvaluationResult {
  score: number;
  recommendation: string;
  match_score?: number;
  matched_skills: string[];
  missing_skills: string[];
  suggestions: string[];
  fit_summary?: string;
  strengths?: string[];
  gaps?: string[];
  total_jd_skills?: number;
}

export interface OptimizationResult {
  optimized_summary: string;
  skill_additions: string[];
  bullet_rewrites: Array<{ section: string; original: string; optimized: string }>;
  ats_keywords_to_add: string[];
  overall_strategy: string;
  match_score?: number;
  recommendation?: string;
  pdf_url?: string;
  status: string;
}

export interface InterviewPrep {
  star_stories: Array<{
    requirement: string;
    situation: string;
    task: string;
    action: string;
    result: string;
    reflection?: string;
  }>;
  likely_questions: string[];
  red_flag_responses: Array<{ question: string; suggested_response: string }>;
  key_talking_points: string[];
  questions_to_ask: string[];
  status: string;
}

export interface AsyncResult {
  pipeline_run_id: string;
  task_id: string;
  status: string;
  message: string;
  job_listing_id?: string;
}

type ApiResult<T> = { success: boolean; data: T | null; error: string | null };

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

async function safeFetch<T>(url: string, options?: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      ...options,
    });
    if (res.status === 401) return { success: false, data: null, error: 'Unauthorized' };
    const data = await res.json().catch(() => null);
    if (!res.ok) return { success: false, data: null, error: data?.error || data?.detail || `Error ${res.status}` };
    return { success: true, data: data as T, error: null };
  } catch (err: any) {
    return { success: false, data: null, error: err.message || 'Network error' };
  }
}

// ---------------------------------------------------------------------------
// Career Profile
// ---------------------------------------------------------------------------

export async function getCareerProfile(): Promise<ApiResult<CareerProfile>> {
  return safeFetch('/api/career/profile');
}

export async function saveCareerProfile(data: Partial<CareerProfile>): Promise<ApiResult<CareerProfile>> {
  return safeFetch('/api/career/profile', { method: 'POST', body: JSON.stringify(data) });
}

// ---------------------------------------------------------------------------
// Job Scanning — Real backend with mock fallback
// ---------------------------------------------------------------------------

export async function scanJobs(params: { role?: string; location?: string; experience?: string }): Promise<ApiResult<any> & { source: 'backend' | 'mock' }> {
  // Try real backend
  const real = await safeFetch<AsyncResult>('/api/career/scan', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  if (real.success) return { ...real, source: 'backend' };

  // Fallback: mock
  const mock = await safeFetch<any>('/api/jobs/scan', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  return { ...mock, source: 'mock' };
}

// ---------------------------------------------------------------------------
// Job Listings
// ---------------------------------------------------------------------------

export async function getJobs(filters?: Record<string, string | number>): Promise<ApiResult<{ jobs: JobListing[]; total: number }>> {
  const params = new URLSearchParams();
  if (filters) Object.entries(filters).forEach(([k, v]) => v != null && params.set(k, String(v)));
  return safeFetch(`/api/career/jobs${params.toString() ? `?${params}` : ''}`);
}

export async function getJobDetail(id: string): Promise<ApiResult<JobListing>> {
  return safeFetch(`/api/career/jobs/${id}`);
}

export async function updateJobStatus(id: string, status: string): Promise<ApiResult<JobListing>> {
  return safeFetch(`/api/career/jobs/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
}

// ---------------------------------------------------------------------------
// Evaluation — Real backend with mock fallback
// ---------------------------------------------------------------------------

export async function evaluateJob(params: {
  job_listing_id?: string;
  job_description?: string;
  company?: string;
  role?: string;
  resume_id?: string;
}): Promise<ApiResult<any> & { source: 'backend' | 'mock' }> {
  const real = await safeFetch<AsyncResult>('/api/career/evaluate', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  if (real.success) return { ...real, source: 'backend' };

  if (params.job_description) {
    const mock = await safeFetch<any>('/api/jd/evaluate', {
      method: 'POST',
      body: JSON.stringify({ job_description: params.job_description }),
    });
    return { ...mock, source: 'mock' };
  }

  return { success: false, data: null, error: real.error || 'Evaluation failed', source: 'backend' };
}

// ---------------------------------------------------------------------------
// Optimization Pipeline
// ---------------------------------------------------------------------------

export async function optimizeForJob(params: { job_listing_id: string; resume_id?: string }): Promise<ApiResult<AsyncResult>> {
  return safeFetch('/api/career/optimize', { method: 'POST', body: JSON.stringify(params) });
}

// ---------------------------------------------------------------------------
// Pipeline Polling
// ---------------------------------------------------------------------------

export async function getPipelineRun(id: string): Promise<ApiResult<PipelineRun>> {
  return safeFetch(`/api/career/pipeline/${id}`);
}

export async function pollPipelineRun(
  id: string,
  onUpdate: (run: PipelineRun) => void,
  maxAttempts = 60,
  intervalMs = 2000,
): Promise<PipelineRun | null> {
  for (let i = 0; i < maxAttempts; i++) {
    const r = await getPipelineRun(id);
    if (r.success && r.data) {
      onUpdate(r.data);
      if (r.data.status === 'completed' || r.data.status === 'failed') return r.data;
    }
    await new Promise(res => setTimeout(res, intervalMs));
  }
  return null;
}

// ---------------------------------------------------------------------------
// Applications — Real backend with mock fallback
// ---------------------------------------------------------------------------

export async function applyToJob(params: { job_listing_id?: string; job?: any; resume_id?: string }): Promise<ApiResult<Application> & { source: 'backend' | 'mock' }> {
  if (params.job_listing_id) {
    const real = await safeFetch<Application>('/api/career/apply', {
      method: 'POST',
      body: JSON.stringify({ job_listing_id: params.job_listing_id, resume_id: params.resume_id }),
    });
    if (real.success) return { ...real, source: 'backend' };
  }
  const mock = await safeFetch<Application>('/api/applications/apply', {
    method: 'POST',
    body: JSON.stringify({ job: params.job }),
  });
  return { ...mock, source: 'mock' };
}

export async function getApplications(): Promise<ApiResult<Application[]> & { source: 'backend' | 'mock' }> {
  const real = await safeFetch<Application[]>('/api/career/applications');
  if (real.success) return { ...real, source: 'backend' };
  const mock = await safeFetch<Application[]>('/api/applications/apply');
  return { ...mock, source: 'mock' };
}

// ---------------------------------------------------------------------------
// Interview Prep (mock for now — backend has the service but no endpoint)
// ---------------------------------------------------------------------------

const KNOWN_SKILLS = [
  'React','Next.js','TypeScript','JavaScript','Node.js','Python','Django',
  'PostgreSQL','MongoDB','Redis','Kafka','Docker','Kubernetes','AWS','GCP',
  'GraphQL','REST APIs','Tailwind CSS','Machine Learning','TensorFlow',
  'PyTorch','SQL','Git','Linux','Terraform','Go','Rust','Java','C++',
];

function extractSkills(text: string): string[] {
  const l = text.toLowerCase();
  return KNOWN_SKILLS.filter(s => l.includes(s.toLowerCase()));
}

export async function getInterviewPrep(params: {
  job_description: string;
  company_name?: string;
}): Promise<ApiResult<InterviewPrep>> {
  await new Promise(r => setTimeout(r, 1500));
  const skills = extractSkills(params.job_description);
  return {
    success: true,
    error: null,
    data: {
      star_stories: skills.slice(0, 3).map(s => ({
        requirement: `Experience with ${s}`,
        situation: `In my previous role, the team needed a ${s}-based solution for a critical product feature.`,
        task: `I was tasked with designing and delivering the ${s} implementation within a tight deadline.`,
        action: `I researched best practices, created a proof-of-concept, gathered team feedback, and led the full implementation.`,
        result: `Delivered 2 weeks ahead of schedule, resulting in a 30% improvement in the target metric.`,
        reflection: `This reinforced the importance of prototyping and iterative feedback loops.`,
      })),
      likely_questions: [
        `Tell me about your experience with ${skills[0] || 'this stack'}.`,
        `Describe a challenging technical problem you solved recently.`,
        `How do you handle tight deadlines and competing priorities?`,
        `Walk me through your approach to code review and quality.`,
        `Why are you interested in ${params.company_name || 'this company'}?`,
        `Where do you see yourself in 3 years?`,
      ],
      red_flag_responses: [
        { question: 'What\'s your biggest weakness?', suggested_response: 'Pick a genuine growth area with concrete steps you\'re taking. E.g., "I used to under-delegate — now I use sprint planning to assign ownership explicitly."' },
        { question: 'Why are you leaving your current role?', suggested_response: 'Focus on growth and alignment: "I\'m looking for deeper ownership of [X], which aligns perfectly with this role."' },
      ],
      key_talking_points: [
        `Strong foundation in ${skills.slice(0, 3).join(', ') || 'full-stack development'}`,
        `Track record of shipping production systems at scale`,
        `Collaborative approach and strong written communication`,
      ],
      questions_to_ask: [
        'What does the first 90 days look like for this role?',
        'How does the team prioritize technical debt vs new features?',
        'What\'s the biggest engineering challenge the team is facing?',
        'How is success measured for this position?',
      ],
      status: 'success',
    },
  };
}

// ---------------------------------------------------------------------------
// LinkedIn Outreach — Backend-first, mock-fallback
// ---------------------------------------------------------------------------

export interface OutreachResult {
  connection_note: string;
  message: string;
  subject: string;
  targets: Array<{ name: string; role: string; priority: string }>;
  status: string;
}

export async function generateOutreach(params: {
  job_description?: string;
  job_listing_id?: string;
  contact_name?: string;
  contact_role?: string;
  company?: string;
  role?: string;
}): Promise<ApiResult<OutreachResult> & { source: 'backend' | 'mock' }> {
  const real = await safeFetch<OutreachResult>('/api/career/outreach', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  if (real.success) return { ...real, source: 'backend' };

  const mock = await safeFetch<OutreachResult>('/api/outreach/generate', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  return { ...mock, source: 'mock' };
}

// ---------------------------------------------------------------------------
// Application Analytics — Backend-first, mock-fallback
// ---------------------------------------------------------------------------

export interface AnalyticsData {
  has_data: boolean;
  total_jobs: number;
  total_applications: number;
  funnel: Record<string, number>;
  score_stats: { avg: number; total_scored: number };
  score_buckets: Record<string, number>;
  recommendation_breakdown: Record<string, number>;
  archetype_performance: Record<string, {
    total: number; applied: number; interview: number; offer: number; rejected: number;
  }>;
  top_skill_gaps: Array<{ skill: string; frequency: number }>;
  application_statuses: Record<string, number>;
  recommendations: Array<{ action: string; impact: string; reasoning: string }>;
}

export async function getAnalytics(): Promise<ApiResult<AnalyticsData> & { source: 'backend' | 'mock' }> {
  const real = await safeFetch<AnalyticsData>('/api/career/analytics');
  if (real.success) return { ...real, source: 'backend' };

  const mock = await safeFetch<AnalyticsData>('/api/analytics/patterns');
  return { ...mock, source: 'mock' };
}

// ---------------------------------------------------------------------------
// Batch Evaluation — Backend-first, mock-fallback
// ---------------------------------------------------------------------------

export interface BatchResult {
  total: number;
  completed?: number;
  queued?: number;
  results: Array<{
    index: number;
    role: string;
    company: string;
    match_score?: number;
    recommendation?: string;
    matched_skills?: string[];
    missing_skills?: string[];
    fit_summary?: string;
    pipeline_run_id?: string;
    task_id?: string;
    status: string;
    error?: string;
  }>;
  message?: string;
}

export async function batchEvaluate(
  jobDescriptions: Array<{ role: string; company: string; description: string }>
): Promise<ApiResult<BatchResult> & { source: 'backend' | 'mock' }> {
  const real = await safeFetch<BatchResult>('/api/career/batch-evaluate', {
    method: 'POST',
    body: JSON.stringify({ job_descriptions: jobDescriptions }),
  });
  if (real.success) return { ...real, source: 'backend' };

  const mock = await safeFetch<BatchResult>('/api/batch/evaluate', {
    method: 'POST',
    body: JSON.stringify({ job_descriptions: jobDescriptions }),
  });
  return { ...mock, source: 'mock' };
}

// ---------------------------------------------------------------------------
// Deep Company Research — Backend-first, mock-fallback
// ---------------------------------------------------------------------------

export interface ResearchAxis {
  title: string;
  queries?: string[];
  questions: string[];
  candidate_skills?: string[];
  candidate_experience?: string[];
}

export interface DeepResearchResult {
  company: string;
  role: string;
  research_axes: Record<string, ResearchAxis>;
  status: string;
}

export async function getDeepResearch(params: {
  company: string;
  role?: string;
  job_listing_id?: string;
}): Promise<ApiResult<DeepResearchResult> & { source: 'backend' | 'mock' }> {
  const real = await safeFetch<DeepResearchResult>('/api/career/deep-research', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  if (real.success) return { ...real, source: 'backend' };

  const mock = await safeFetch<DeepResearchResult>('/api/research/deep', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  return { ...mock, source: 'mock' };
}

// ---------------------------------------------------------------------------
// Resume Optimization Results — Backend-first
// ---------------------------------------------------------------------------

export async function getOptimizationResults(params: {
  job_listing_id?: string;
  job_description?: string;
  resume_id?: string;
}): Promise<ApiResult<OptimizationResult>> {
  const result = await safeFetch<any>('/api/career/optimize', {
    method: 'POST',
    body: JSON.stringify(params),
  });

  if (result.success && result.data) {
    return result as ApiResult<OptimizationResult>;
  }

  // Mock fallback
  await new Promise(r => setTimeout(r, 1200));
  const jd = params.job_description || '';
  const skills = extractSkills(jd);
  return {
    success: true,
    error: null,
    data: {
      optimized_summary: `Results-driven engineer with deep expertise in ${skills.slice(0, 3).join(', ') || 'full-stack development'}, specializing in building production-grade systems at scale. Proven track record of shipping AI-powered applications used by thousands of users.`,
      skill_additions: skills.filter((_, i) => i % 2 === 0).slice(0, 4),
      bullet_rewrites: [
        {
          section: 'Experience',
          original: 'Built web applications using modern frameworks',
          optimized: `Architected and shipped ${skills[0] || 'production'}-powered platform, reducing page load time by 40% and increasing user engagement by 25%`,
        },
        {
          section: 'Experience',
          original: 'Implemented backend services',
          optimized: `Designed and deployed ${skills[1] || 'microservices'} architecture handling 10K+ RPM with 99.9% uptime SLA`,
        },
      ],
      ats_keywords_to_add: skills.slice(0, 6),
      overall_strategy: `Focus on quantifying impact. Lead with ${skills[0] || 'your primary stack'} experience since it is the #1 requirement. Reframe backend work as system design.`,
      match_score: 72,
      recommendation: 'APPLY',
      status: 'success',
    },
  };
}

