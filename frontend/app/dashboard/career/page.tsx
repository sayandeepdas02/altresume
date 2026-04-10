'use client';

import { useAuth } from '@/hooks/useAuth';
import {
  Search, Loader2, Briefcase, TrendingUp, CheckCircle2,
  AlertCircle, ArrowRight, RefreshCw, Target,
  Zap, MapPin, ExternalLink, ThumbsUp, ThumbsDown, Clock,
  BarChart3, ChevronRight, PlusCircle, X, FileText, Send
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import {
  getJobs,
  triggerScan,
  evaluateJob,
  getPipelineRuns,
  pollPipelineRun,
  type JobListing,
  type PipelineRun,
} from '@/services/careerApi';

// ---------------------------------------------------------------------------
// Score Badge — 0-100 scale with color coding
// ---------------------------------------------------------------------------

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null || score === undefined) return (
    <span className="text-xs text-gray-400 font-medium">—</span>
  );

  const getColor = (s: number) => {
    if (s >= 70) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (s >= 50) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border font-bold text-xs ${getColor(score)}`}>
      {score}%
    </span>
  );
}

// ---------------------------------------------------------------------------
// Recommendation Badge — APPLY / CONSIDER / SKIP
// ---------------------------------------------------------------------------

function RecommendationBadge({ rec }: { rec: string }) {
  const normalized = (rec || '').toUpperCase();
  const config: Record<string, { icon: typeof ThumbsUp; label: string; cls: string }> = {
    APPLY: { icon: ThumbsUp, label: 'Apply', cls: 'text-emerald-600 bg-emerald-50' },
    CONSIDER: { icon: Clock, label: 'Consider', cls: 'text-amber-600 bg-amber-50' },
    SKIP: { icon: ThumbsDown, label: 'Skip', cls: 'text-red-500 bg-red-50' },
  };
  const { icon: Icon, label, cls } = config[normalized] || config.CONSIDER || { icon: Clock, label: rec || '—', cls: 'text-gray-500 bg-gray-50' };
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${cls}`}>
      <Icon size={11} /> {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Status Pill
// ---------------------------------------------------------------------------

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    new: 'bg-blue-50 text-blue-700',
    evaluated: 'bg-purple-50 text-purple-700',
    applied: 'bg-emerald-50 text-emerald-700',
    responded: 'bg-teal-50 text-teal-700',
    interview: 'bg-indigo-50 text-indigo-700',
    offer: 'bg-green-50 text-green-800',
    rejected: 'bg-red-50 text-red-600',
    discarded: 'bg-gray-100 text-gray-500',
    skipped: 'bg-gray-100 text-gray-500',
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${colors[status] || colors.new}`}>
      {status}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Stats Card
// ---------------------------------------------------------------------------

function StatCard({ icon: Icon, label, value, accent }: {
  icon: typeof Briefcase;
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div className="card-base flex items-center gap-4 py-4 px-5">
      <div className={`h-10 w-10 flex items-center justify-center rounded-lg ${accent || 'bg-gray-100'}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-black text-[#1c1c1c] tracking-tight">{value}</p>
        <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quick Evaluate Modal — Paste JD to evaluate
// ---------------------------------------------------------------------------

function QuickEvaluateModal({ 
  isOpen, onClose, onSubmit, isLoading 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSubmit: (jd: string, company: string, role: string) => void;
  isLoading: boolean;
}) {
  const [jd, setJd] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[640px] mx-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-[#1c1c1c] flex items-center gap-2">
              <Target size={18} className="text-[#4f0f62]" /> Quick Evaluate
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Paste a job description to get AI-powered fit analysis</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Company</label>
              <input
                type="text"
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="e.g., Google"
                className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#4f0f62] transition-colors"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Role</label>
              <input
                type="text"
                value={role}
                onChange={e => setRole(e.target.value)}
                placeholder="e.g., Senior AI Engineer"
                className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#4f0f62] transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">
              Job Description *
            </label>
            <textarea
              value={jd}
              onChange={e => setJd(e.target.value)}
              placeholder="Paste the full job description here..."
              rows={12}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#4f0f62] resize-none transition-colors leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <p className="text-[11px] text-gray-400">
            {jd.length > 0 ? `${jd.length} characters` : 'Paste JD to start'}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="h-9 px-4 text-sm font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onSubmit(jd, company, role)}
              disabled={!jd.trim() || isLoading}
              className="h-9 px-5 flex items-center gap-2 text-sm font-bold text-white bg-[#4f0f62] rounded-lg hover:bg-[#3d0b4e] transition-colors disabled:opacity-50"
            >
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Evaluate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function CareerPipelinePage() {
  const { user } = useAuth();
  const router = useRouter();

  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [total, setTotal] = useState(0);
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('all');

  // Quick Evaluate modal
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [isQuickEval, setIsQuickEval] = useState(false);

  // Load data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const filterParam = filter === 'all' ? undefined : filter;
      const [jobsRes, runsRes] = await Promise.all([
        getJobs({ status: filterParam as any, limit: 50 }),
        getPipelineRuns(),
      ]);
      setJobs(jobsRes.jobs);
      setTotal(jobsRes.total);
      setRuns(runsRes);
    } catch (err: any) {
      console.error('Failed to load career data', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => { loadData(); }, [loadData]);

  // Trigger scan
  const handleScan = async () => {
    try {
      setIsScanning(true);
      setError('');
      await triggerScan();
      setTimeout(loadData, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsScanning(false);
    }
  };

  // Quick Evaluate — paste JD
  const handleQuickEvaluate = async (jd: string, company: string, role: string) => {
    try {
      setIsQuickEval(true);
      const result = await evaluateJob({
        job_description: jd,
        company: company || undefined,
        role: role || undefined,
      });
      // Poll for completion
      await pollPipelineRun(result.pipeline_run_id, 2000, 60);
      setShowEvalModal(false);
      // Navigate to the new job detail
      if (result.job_listing_id) {
        router.push(`/dashboard/career/${result.job_listing_id}`);
      } else {
        loadData();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsQuickEval(false);
    }
  };

  // Compute stats (using 0-100 match_score)
  const evaluated = jobs.filter(j => j.status === 'evaluated').length;
  const applied = jobs.filter(j => ['applied', 'interview', 'offer'].includes(j.status)).length;
  const scoredJobs = jobs.filter(j => j.match_score !== null && j.match_score !== undefined);
  const avgScore = scoredJobs.length > 0 
    ? Math.round(scoredJobs.reduce((sum, j) => sum + (j.match_score || 0), 0) / scoredJobs.length)
    : 0;
  const recommended = jobs.filter(j => {
    const rec = (j.display_recommendation || '').toUpperCase();
    return rec === 'APPLY';
  }).length;

  // Active pipeline runs
  const activeRuns = runs.filter(r => r.status === 'pending' || r.status === 'running');

  const filterTabs = [
    { key: 'all', label: 'All' },
    { key: 'new', label: 'New' },
    { key: 'evaluated', label: 'Evaluated' },
    { key: 'applied', label: 'Applied' },
    { key: 'interview', label: 'Interview' },
    { key: 'skipped', label: 'Skipped' },
  ];

  return (
    <div className="min-h-screen bg-[#f4efe9] flex flex-col font-sans">
      <Navbar />
      <div className="pt-16">
        <div className="flex-1 w-full max-w-[1200px] mx-auto px-6 py-12">

          {/* Header */}
          <header className="flex items-end justify-between mb-8 pb-6 border-b border-gray-200">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#1c1c1c] flex items-center gap-2">
                <Target size={24} className="text-[#4f0f62]" />
                Career Pipeline
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                AI-powered job discovery, evaluation, and application tracking
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadData}
                disabled={isLoading}
                className="h-9 px-3 flex items-center gap-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={() => setShowEvalModal(true)}
                className="h-9 px-4 flex items-center gap-2 text-sm font-bold text-[#4f0f62] border border-[#4f0f62] rounded-lg hover:bg-[#4f0f62]/5 transition-colors"
              >
                <PlusCircle size={14} /> Paste JD
              </button>
              <button
                onClick={handleScan}
                disabled={isScanning}
                className="h-9 px-4 flex items-center gap-2 text-sm font-bold text-white bg-[#1c1c1c] rounded-lg hover:bg-[#333] transition-colors disabled:opacity-50"
              >
                {isScanning ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                Scan Jobs
              </button>
            </div>
          </header>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
              <span className="text-red-700 text-sm flex-1">{error}</span>
              <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Active Pipeline Runs */}
          {activeRuns.length > 0 && (
            <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 size={14} className="animate-spin text-indigo-600" />
                <span className="text-sm font-bold text-indigo-700">
                  {activeRuns.length} task{activeRuns.length > 1 ? 's' : ''} running
                </span>
                <button onClick={loadData} className="ml-auto text-xs text-indigo-600 hover:underline">
                  Refresh
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeRuns.map(r => (
                  <span key={r.id} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">
                    {r.run_type} — {r.status}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={Briefcase} label="Total Jobs" value={total} accent="bg-[#4f0f62]" />
            <StatCard icon={BarChart3} label="Evaluated" value={evaluated} accent="bg-indigo-500" />
            <StatCard icon={TrendingUp} label="Avg Match" value={avgScore ? `${avgScore}%` : '—'} accent="bg-emerald-500" />
            <StatCard icon={Zap} label="Recommended" value={recommended} accent="bg-amber-500" />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 mb-6 border-b border-gray-200">
            {filterTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
                  filter === tab.key
                    ? 'text-[#1c1c1c] border-[#1c1c1c]'
                    : 'text-gray-400 border-transparent hover:text-gray-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Job Listings */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <p className="text-xs text-gray-400">Loading your pipeline...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="card-base flex flex-col items-center justify-center py-16 text-center gap-4">
              <Briefcase className="h-10 w-10 text-gray-300" />
              <div>
                <p className="text-sm font-bold text-[#1c1c1c] mb-1">No jobs found</p>
                <p className="text-xs text-gray-500 max-w-sm">
                  Get started by scanning job portals or pasting a job description to evaluate.
                </p>
              </div>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setShowEvalModal(true)}
                  className="h-9 px-4 flex items-center gap-2 text-sm font-bold text-[#4f0f62] border border-[#4f0f62] rounded-lg hover:bg-[#4f0f62]/5 transition-colors"
                >
                  <FileText size={14} /> Paste a Job Description
                </button>
                <button
                  onClick={handleScan}
                  className="h-9 px-4 flex items-center gap-2 text-sm font-bold text-white bg-[#1c1c1c] rounded-lg hover:bg-[#333] transition-colors"
                >
                  <Search size={14} /> Scan Job Portals
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map(job => (
                <Link
                  key={job.id}
                  href={`/dashboard/career/${job.id}`}
                  className="card-base flex items-center gap-4 py-4 px-5 hover:border-gray-300 transition-all group cursor-pointer"
                >
                  {/* Score */}
                  <div className="w-16 text-center shrink-0">
                    <ScoreBadge score={job.match_score} />
                  </div>

                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-[#1c1c1c] truncate">{job.role}</h3>
                      <StatusPill status={job.status} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="font-medium">{job.company}</span>
                      {job.location && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <MapPin size={10} /> {job.location}
                          </span>
                        </>
                      )}
                      <span>·</span>
                      <span>{new Date(job.discovered_at).toLocaleDateString()}</span>
                    </div>
                    {job.fit_summary && (
                      <p className="text-xs text-gray-500 mt-1.5 line-clamp-1">{job.fit_summary}</p>
                    )}
                    {/* Missing skills preview */}
                    {job.missing_skills && job.missing_skills.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-[10px] text-red-500 font-medium">Missing:</span>
                        {job.missing_skills.slice(0, 3).map((s, i) => (
                          <span key={i} className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-medium">
                            {s}
                          </span>
                        ))}
                        {job.missing_skills.length > 3 && (
                          <span className="text-[10px] text-gray-400">+{job.missing_skills.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right side */}
                  <div className="flex items-center gap-3 shrink-0">
                    <RecommendationBadge rec={job.display_recommendation || job.recommendation} />
                    {job.url && (
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="text-gray-400 hover:text-[#4f0f62] transition-colors"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* Quick Evaluate Modal */}
      <QuickEvaluateModal
        isOpen={showEvalModal}
        onClose={() => setShowEvalModal(false)}
        onSubmit={handleQuickEvaluate}
        isLoading={isQuickEval}
      />
    </div>
  );
}
