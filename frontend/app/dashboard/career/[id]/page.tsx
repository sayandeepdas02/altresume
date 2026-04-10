'use client';

import { useAuth } from '@/hooks/useAuth';
import {
  Loader2, ArrowLeft, ExternalLink, MapPin, Calendar,
  ThumbsUp, ThumbsDown, Clock, FileText, Download,
  CheckCircle2, AlertTriangle, Lightbulb, MessageSquare,
  ChevronDown, ChevronUp, Target, Zap, AlertCircle, Sparkles
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import {
  getJob,
  evaluateJob,
  optimizeJob,
  updateJobStatus,
  pollPipelineRun,
  type JobListing,
  type JobStatus,
} from '@/services/careerApi';

// ---------------------------------------------------------------------------
// Section Accordion
// ---------------------------------------------------------------------------

function EvalSection({ title, icon: Icon, children, defaultOpen = false, count }: {
  title: string;
  icon: typeof FileText;
  children: React.ReactNode;
  defaultOpen?: boolean;
  count?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-5 py-3.5 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-[#1c1c1c]">
          <Icon size={16} className="text-[#4f0f62]" /> {title}
          {count !== undefined && (
            <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full font-bold">{count}</span>
          )}
        </span>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>
      {open && <div className="px-5 py-4 text-sm text-gray-700 leading-relaxed">{children}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Score Ring — circular progress for match_score
// ---------------------------------------------------------------------------

function ScoreRing({ score, size = 80 }: { score: number | null; size?: number }) {
  if (score === null || score === undefined) return (
    <div className="flex flex-col items-center">
      <p className="text-3xl text-gray-300 font-bold">—</p>
      <p className="text-[10px] text-gray-400 font-medium">Not scored</p>
    </div>
  );

  const getColor = (s: number) => {
    if (s >= 70) return { text: 'text-emerald-600', stroke: '#059669', bg: 'bg-emerald-50' };
    if (s >= 50) return { text: 'text-amber-600', stroke: '#D97706', bg: 'bg-amber-50' };
    return { text: 'text-red-600', stroke: '#DC2626', bg: 'bg-red-50' };
  };

  const color = getColor(score);
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - score / 100);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth="4" />
          <circle
            cx={size/2} cy={size/2} r={radius} fill="none"
            stroke={color.stroke} strokeWidth="4" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-black ${color.text}`}>{score}</span>
        </div>
      </div>
      <span className={`text-[10px] font-bold uppercase tracking-wider ${color.text} ${color.bg} px-2 py-0.5 rounded-full`}>
        {score >= 70 ? 'Strong Fit' : score >= 50 ? 'Moderate' : 'Weak Fit'}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function JobDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<JobListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await getJob(jobId);
        setJob(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [jobId]);

  const handleEvaluate = async () => {
    if (!job) return;
    try {
      setIsEvaluating(true);
      setError('');
      const result = await evaluateJob({ job_listing_id: job.id });
      await pollPipelineRun(result.pipeline_run_id, 2000, 60);
      const updated = await getJob(jobId);
      setJob(updated);
      setSuccessMsg('Evaluation complete!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleOptimize = async () => {
    if (!job) return;
    try {
      setIsOptimizing(true);
      setError('');
      const result = await optimizeJob({ job_listing_id: job.id });
      await pollPipelineRun(result.pipeline_run_id, 2000, 90);
      const updated = await getJob(jobId);
      setJob(updated);
      setSuccessMsg('Resume optimized! Download your tailored PDF below.');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleStatusChange = async (newStatus: JobStatus) => {
    if (!job) return;
    try {
      const updated = await updateJobStatus(job.id, newStatus);
      setJob(updated);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const evalData = job?.evaluation_data;
  const matchScore = job?.match_score ?? (evalData?.match_score || null);
  const displayRec = job?.display_recommendation || (evalData?.recommendation || '').toUpperCase();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f4efe9] flex flex-col items-center justify-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <p className="text-xs text-gray-400">Loading job details...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-[#f4efe9] flex flex-col items-center justify-center gap-3">
        <AlertCircle className="h-8 w-8 text-gray-300" />
        <p className="text-gray-500">Job not found.</p>
        <Link href="/dashboard/career" className="text-sm text-[#4f0f62] hover:underline">Back to Pipeline</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4efe9] flex flex-col font-sans">
      <Navbar />
      <div className="pt-16">
        <div className="flex-1 w-full max-w-[900px] mx-auto px-6 py-12">

          {/* Back link */}
          <Link
            href="/dashboard/career"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[#1c1c1c] mb-6 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Pipeline
          </Link>

          {/* Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              <span className="text-emerald-700 text-sm font-medium">{successMsg}</span>
            </div>
          )}

          {/* Header Card */}
          <div className="card-base p-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    job.status === 'new' ? 'bg-blue-50 text-blue-700' :
                    job.status === 'evaluated' ? 'bg-purple-50 text-purple-700' :
                    job.status === 'applied' ? 'bg-emerald-50 text-emerald-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {job.status}
                  </span>
                  {job.archetype && (
                    <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {job.archetype}
                    </span>
                  )}
                  {displayRec && displayRec !== '—' && (
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      displayRec === 'APPLY' ? 'bg-emerald-100 text-emerald-700' :
                      displayRec === 'CONSIDER' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {displayRec}
                    </span>
                  )}
                </div>
                <h1 className="text-xl font-black text-[#1c1c1c] tracking-tight mb-0.5">{job.role}</h1>
                <p className="text-sm text-gray-600 font-medium">{job.company}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  {job.location && (
                    <span className="flex items-center gap-1"><MapPin size={11} /> {job.location}</span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar size={11} /> {new Date(job.discovered_at).toLocaleDateString()}
                  </span>
                  {job.source && <span className="text-gray-400">via {job.source}</span>}
                </div>
              </div>

              {/* Score Ring */}
              <div className="shrink-0 ml-6">
                <ScoreRing score={matchScore} />
              </div>
            </div>

            {/* Action bar */}
            <div className="flex items-center gap-3 mt-5 pt-5 border-t border-gray-100 flex-wrap">
              {job.url && (
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-8 px-3 flex items-center gap-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <ExternalLink size={12} /> View Listing
                </a>
              )}

              {job.status === 'new' && (
                <button
                  onClick={handleEvaluate}
                  disabled={isEvaluating}
                  className="h-8 px-4 flex items-center gap-1.5 text-xs font-bold text-white bg-[#4f0f62] rounded-md hover:bg-[#3d0b4e] transition-colors disabled:opacity-50"
                >
                  {isEvaluating ? <Loader2 size={12} className="animate-spin" /> : <Target size={12} />}
                  Evaluate Fit
                </button>
              )}

              {job.status === 'evaluated' && (
                <>
                  <button
                    onClick={handleOptimize}
                    disabled={isOptimizing}
                    className="h-8 px-4 flex items-center gap-1.5 text-xs font-bold text-white bg-[#4f0f62] rounded-md hover:bg-[#3d0b4e] transition-colors disabled:opacity-50"
                  >
                    {isOptimizing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    Optimize Resume
                  </button>
                  <button
                    onClick={() => handleStatusChange('applied')}
                    className="h-8 px-3 flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors"
                  >
                    <ThumbsUp size={12} /> Mark Applied
                  </button>
                  <button
                    onClick={() => handleStatusChange('skipped')}
                    className="h-8 px-3 flex items-center gap-1.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <ThumbsDown size={12} /> Skip
                  </button>
                </>
              )}

              {job.resume_pdf_url && (
                <a
                  href={job.resume_pdf_url}
                  download
                  className="h-8 px-3 flex items-center gap-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors ml-auto"
                >
                  <Download size={12} /> Download PDF
                </a>
              )}
            </div>
          </div>

          {/* Fit Summary */}
          {job.fit_summary && (
            <div className="card-base p-5 mb-6 bg-gradient-to-r from-gray-50 to-white">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Fit Summary</h2>
              <p className="text-sm text-[#1c1c1c] leading-relaxed">{job.fit_summary}</p>
            </div>
          )}

          {/* Missing Skills (prominent display) */}
          {evalData && (evalData.missing_skills?.length > 0 || evalData.gaps?.length > 0) && (
            <div className="card-base p-5 mb-6 border-l-4 border-amber-400">
              <h2 className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-3 flex items-center gap-1.5">
                <AlertTriangle size={14} /> Skills Gap
              </h2>
              <div className="flex flex-wrap gap-2">
                {(evalData.missing_skills || evalData.gaps || []).map((s: string, i: number) => (
                  <span key={i} className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Evaluation Details */}
          {evalData && Object.keys(evalData).length > 0 && (
            <div className="space-y-3">
              {evalData.strengths && evalData.strengths.length > 0 && (
                <EvalSection title="Strengths" icon={CheckCircle2} defaultOpen count={evalData.strengths.length}>
                  <ul className="space-y-2">
                    {evalData.strengths.map((s: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </EvalSection>
              )}

              {evalData.gap_mitigations && evalData.gap_mitigations.length > 0 && (
                <EvalSection title="How to Address Gaps" icon={Lightbulb} count={evalData.gap_mitigations.length}>
                  <ol className="space-y-2 list-decimal list-inside">
                    {evalData.gap_mitigations.map((tip: string, i: number) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ol>
                </EvalSection>
              )}

              {evalData.personalization_tips && evalData.personalization_tips.length > 0 && (
                <EvalSection title="Resume Optimization Tips" icon={Sparkles} count={evalData.personalization_tips.length}>
                  <ol className="space-y-2 list-decimal list-inside">
                    {evalData.personalization_tips.map((tip: string, i: number) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ol>
                </EvalSection>
              )}

              {evalData.interview_stories && evalData.interview_stories.length > 0 && (
                <EvalSection title="Interview STAR Stories" icon={MessageSquare} count={evalData.interview_stories.length}>
                  <div className="space-y-4">
                    {evalData.interview_stories.map((story: any, i: number) => (
                      <div key={i} className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs font-bold text-[#4f0f62] uppercase tracking-wider mb-1">
                          {story.requirement}
                        </p>
                        <p className="text-sm">{story.story}</p>
                      </div>
                    ))}
                  </div>
                </EvalSection>
              )}

              {evalData.keywords && evalData.keywords.length > 0 && (
                <EvalSection title="ATS Keywords" icon={FileText} count={evalData.keywords.length}>
                  <div className="flex flex-wrap gap-2">
                    {evalData.keywords.map((kw: string, i: number) => (
                      <span
                        key={i}
                        className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full font-medium"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </EvalSection>
              )}
            </div>
          )}

          {/* Not evaluated — CTA */}
          {(!evalData || Object.keys(evalData).length === 0) && job.status === 'new' && (
            <div className="card-base flex flex-col items-center justify-center py-16 text-center">
              <Target size={36} className="text-gray-300 mb-4" />
              <h3 className="text-sm font-bold text-[#1c1c1c] mb-1">Not Evaluated Yet</h3>
              <p className="text-xs text-gray-500 mb-5 max-w-sm">
                Run an AI evaluation to get fit scoring, gap analysis, resume optimization tips, and interview prep materials.
              </p>
              <button
                onClick={handleEvaluate}
                disabled={isEvaluating}
                className="h-10 px-6 flex items-center gap-2 text-sm font-bold text-white bg-[#4f0f62] rounded-lg hover:bg-[#3d0b4e] transition-colors disabled:opacity-50"
              >
                {isEvaluating ? <Loader2 size={14} className="animate-spin" /> : <Target size={14} />}
                Evaluate This Job
              </button>
            </div>
          )}

          {/* What to do next — guidance */}
          {job.status === 'evaluated' && (
            <div className="card-base p-5 mt-6 bg-gradient-to-r from-[#4f0f62]/5 to-transparent border-l-4 border-[#4f0f62]">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#4f0f62] mb-2 flex items-center gap-1.5">
                <Zap size={14} /> What to do next
              </h2>
              <div className="text-sm text-gray-700 leading-relaxed space-y-1.5">
                {displayRec === 'APPLY' && (
                  <>
                    <p>✅ <strong>Strong match!</strong> Your profile aligns well with this role.</p>
                    <p>→ Click <strong>Optimize Resume</strong> to tailor your CV for this specific position.</p>
                    <p>→ Then <strong>Mark Applied</strong> to track your application.</p>
                  </>
                )}
                {displayRec === 'CONSIDER' && (
                  <>
                    <p>⚡ <strong>Moderate match.</strong> You have some relevant skills but gaps to address.</p>
                    <p>→ Review the <strong>Skills Gap</strong> section and optimization tips above.</p>
                    <p>→ Click <strong>Optimize Resume</strong> to fill the gap, then decide.</p>
                  </>
                )}
                {displayRec === 'SKIP' && (
                  <>
                    <p>⚠️ <strong>Weak match.</strong> This role may not be the best fit right now.</p>
                    <p>→ Consider focusing on roles that match your current skill set.</p>
                    <p>→ Click <strong>Skip</strong> to move on, or <strong>Optimize</strong> if you want to try anyway.</p>
                  </>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
