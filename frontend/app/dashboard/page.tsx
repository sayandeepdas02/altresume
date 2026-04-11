'use client';

import { useAuth } from '@/hooks/useAuth';
import {
  Loader2, Zap, FileText, Plus, Search, Building, Briefcase,
  FileSignature, CheckCircle, MapPin, DollarSign, Clock,
  AlertTriangle, ExternalLink, User, Trash2, Sparkles, Brain, Settings,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getResumes, ResumeSummary, deleteResume, duplicateResume } from '@/services/resumeApi';
import {
  scanJobs, evaluateJob, applyToJob, getApplications,
  type Application, type JobListing,
} from '@/services/careerApi';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

// Modals
import ScanJobModal from '@/components/modals/ScanJobModal';
import EvaluateJDModal from '@/components/modals/EvaluateJDModal';
import CareerProfileModal from '@/components/modals/CareerProfileModal';
import JobDetailModal from '@/components/modals/JobDetailModal';
import InterviewPrepModal from '@/components/modals/InterviewPrepModal';
import BatchProcessModal from '@/components/modals/BatchProcessModal';
import DeepResearchModal from '@/components/modals/DeepResearchModal';
import OutreachModal from '@/components/modals/OutreachModal';
import OptimizationResultModal from '@/components/modals/OptimizationResultModal';

// Dashboard Components
import ResumeIntelligenceCard from '@/components/dashboard/ResumeIntelligenceCard';
import AnalyticsDashboard from '@/components/dashboard/AnalyticsDashboard';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  draft:     { label: 'Draft',     color: 'text-gray-600',   bg: 'bg-gray-50 border-gray-200' },
  applied:   { label: 'Applied',   color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200' },
  interview: { label: 'Interview', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  rejected:  { label: 'Rejected',  color: 'text-red-600',    bg: 'bg-red-50 border-red-200' },
  offer:     { label: 'Offer',     color: 'text-green-700',  bg: 'bg-green-50 border-green-200' },
  withdrawn: { label: 'Withdrawn', color: 'text-gray-500',   bg: 'bg-gray-50 border-gray-200' },
};

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 75 ? 'text-green-700 bg-green-50 border-green-200'
    : score >= 50 ? 'text-yellow-700 bg-yellow-50 border-yellow-200'
    : 'text-red-600 bg-red-50 border-red-200';
  return <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${color}`}>{score}% fit</span>;
}

function RecBadge({ rec }: { rec: string }) {
  const r = rec.toUpperCase();
  const style = r === 'APPLY' ? 'bg-green-100 text-green-700'
    : r === 'REVIEW' || r === 'CONSIDER' || r === 'MAYBE' ? 'bg-yellow-100 text-yellow-700'
    : 'bg-gray-100 text-gray-500';
  return <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${style}`}>{r}</span>;
}

function DataSourceBadge({ source }: { source: string }) {
  if (source === 'backend') {
    return <span className="text-[9px] font-semibold text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full">AI Backend</span>;
  }
  return <span className="text-[9px] font-semibold text-gray-400 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded-full">Mock</span>;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  // --- Modal states ---
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isJDModalOpen, setIsJDModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isJobDetailOpen, setIsJobDetailOpen] = useState(false);
  const [isInterviewPrepOpen, setIsInterviewPrepOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isDeepResearchOpen, setIsDeepResearchOpen] = useState(false);
  const [isOutreachOpen, setIsOutreachOpen] = useState(false);
  const [isOptimizationOpen, setIsOptimizationOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  // --- Resume Library ---
  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(true);

  // --- Quick Upload ---
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Jobs ---
  const [jobs, setJobs] = useState<any[]>([]);
  const [isJobsLoading, setIsJobsLoading] = useState(false);
  const [lastScanQuery, setLastScanQuery] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'backend' | 'mock' | null>(null);

  // --- Applications ---
  const [applications, setApplications] = useState<Application[]>([]);
  const [isAppsLoading, setIsAppsLoading] = useState(false);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);

  // --- Expanded Job ---
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Load Data
  // ---------------------------------------------------------------------------
  useEffect(() => {
    async function loadData() {
      // Resumes
      try {
        const resData = await getResumes();
        setResumes(resData);
      } catch (err) {
        console.error("Failed to load resumes", err);
      } finally {
        setIsLoadingLibrary(false);
      }

      // Applications
      try {
        setIsAppsLoading(true);
        const result = await getApplications();
        if (result.success && result.data) {
          setApplications(result.data);
        }
      } catch (err) {
        console.error("Failed to load applications", err);
      } finally {
        setIsAppsLoading(false);
      }
    }
    loadData();
  }, []);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleScanComplete = (scannedJobs: any[]) => {
    setJobs(scannedJobs);
    setLastScanQuery(new Date().toLocaleTimeString());
  };

  const handleApply = async (job: any) => {
    if (applyingJobId) return;
    setApplyingJobId(job.id);

    try {
      const result = await applyToJob({
        job_listing_id: job._id || undefined,
        job,
      });

      if (!result.success) {
        if (result.error?.includes('Already applied') || result.error?.includes('409')) {
          setError(`Already applied to ${job.role} at ${job.company}`);
        } else {
          setError(result.error || 'Apply failed');
        }
        setTimeout(() => setError(''), 3000);
        return;
      }

      if (result.data) {
        setApplications(prev => [result.data!, ...prev]);
      }
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setApplyingJobId(null);
    }
  };

  const isApplied = (jobId: string) => applications.some(a => a.job_id === jobId || (a.job && (a.job as any).id === jobId));

  const openJobDetail = (job: any) => {
    setSelectedJob(job);
    setIsJobDetailOpen(true);
  };

  const openInterviewPrep = (job: any) => {
    setSelectedJob(job);
    setIsJobDetailOpen(false);
    setIsInterviewPrepOpen(true);
  };

  const handleOptimize = (job: any) => {
    setSelectedJob(job);
    setIsJobDetailOpen(false);
    setIsOptimizationOpen(true);
  };

  const handleDeepResearch = (job: any) => {
    setSelectedJob(job);
    setIsJobDetailOpen(false);
    setIsDeepResearchOpen(true);
  };

  const handleOutreach = (job: any) => {
    setSelectedJob(job);
    setIsJobDetailOpen(false);
    setIsOutreachOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) handleFileUpload(e.target.files[0]);
  };

  const handleFileUpload = async (selectedFile: File) => {
    setError(''); setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const uploadRes = await fetch('/api/resumes/upload', { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();
      if (uploadRes.status === 401) { router.push('/signin'); return; }
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed');

      setIsUploading(false); setIsParsing(true);

      const parseRes = await fetch('/api/resumes/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_id: uploadData.resume_id }),
      });
      const parseData = await parseRes.json();
      if (parseRes.status === 401) { router.push('/signin'); return; }
      if (!parseRes.ok) throw new Error(parseData.error || 'Parsing failed');

      router.push(`/builder?id=${uploadData.resume_id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false); setIsParsing(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteResume(id);
      setResumes(resumes.filter(r => r.id !== id));
    } catch (err) { console.error(err); }
  };

  const handleDuplicate = async (id: string, title: string) => {
    try {
      await duplicateResume(id, `${title} (Copy)`);
      const data = await getResumes();
      setResumes(data);
    } catch (err) { console.error(err); }
  };

  // Primary resume for intelligence card
  const primaryResumeId = resumes.length > 0 ? resumes[0].id : null;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#f4efe9] flex flex-col font-sans">
      <Navbar />

      {/* All Modals */}
      <ScanJobModal isOpen={isScanModalOpen} onClose={() => setIsScanModalOpen(false)} onScanComplete={handleScanComplete} />
      <EvaluateJDModal isOpen={isJDModalOpen} onClose={() => setIsJDModalOpen(false)} />
      <CareerProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} onSaved={() => {}} />
      <JobDetailModal
        isOpen={isJobDetailOpen}
        job={selectedJob}
        isApplied={selectedJob ? isApplied(selectedJob.id) : false}
        onClose={() => setIsJobDetailOpen(false)}
        onApply={handleApply}
        onOptimize={handleOptimize}
        onInterviewPrep={openInterviewPrep}
      />
      <InterviewPrepModal isOpen={isInterviewPrepOpen} job={selectedJob} onClose={() => setIsInterviewPrepOpen(false)} />

      <div className="pt-16 pb-20">
        <div className="flex-1 w-full max-w-[1200px] mx-auto px-6 py-12">

          {/* Header */}
          <header className="flex items-end justify-between mb-8 pb-6 border-b border-gray-200">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#1c1c1c]">AI Career Co-Pilot</h1>
              <p className="text-sm text-gray-500 mt-1">Discover jobs, optimize resumes, prep interviews, track applications.</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setIsProfileModalOpen(true)} className="btn-secondary gap-2 h-9 px-4 text-xs">
                <Settings size={14} /> Career Profile
              </button>
              <Link href="/builder" className="btn-primary gap-2 h-9 px-4 text-xs">
                <Plus size={14} /> New Resume
              </Link>
            </div>
          </header>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          <div className="flex flex-col gap-10">

            {/* ================================================================ */}
            {/* SECTION 1: Job Discovery */}
            {/* ================================================================ */}
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-4 flex items-center gap-2">
                <Search size={18} /> Job Discovery
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={() => setIsScanModalOpen(true)}
                  className="card-base flex flex-col gap-3 justify-center items-center h-40 border-dashed border-2 cursor-pointer hover:border-[#4f0f62] transition-all group text-left"
                  id="start-auto-scan"
                >
                  <Briefcase className="h-8 w-8 text-gray-400 group-hover:text-[#4f0f62] transition-colors" />
                  <h3 className="font-bold text-gray-800">Start Auto Scan</h3>
                  <p className="text-xs text-gray-500">AI finds and ranks jobs matching your profile.</p>
                </button>

                <button
                  onClick={() => setIsJDModalOpen(true)}
                  className="card-base flex flex-col gap-3 justify-center items-center h-40 border-dashed border-2 cursor-pointer hover:border-[#4f0f62] transition-all group text-left"
                  id="evaluate-custom-jd"
                >
                  <FileSignature className="h-8 w-8 text-gray-400 group-hover:text-[#4f0f62] transition-colors" />
                  <h3 className="font-bold text-gray-800">Evaluate Custom JD</h3>
                  <p className="text-xs text-gray-500">Paste a Job Description to analyze fit.</p>
                </button>
              </div>
            </section>

            {/* ================================================================ */}
            {/* SECTION 2: Recommended Jobs */}
            {/* ================================================================ */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 flex items-center gap-2">
                  <Zap size={18} className="text-yellow-500" /> Recommended Jobs
                  {lastScanQuery && (
                    <span className="text-[11px] font-normal text-gray-400 ml-2">Last scan: {lastScanQuery}</span>
                  )}
                  {dataSource && <DataSourceBadge source={dataSource} />}
                </h2>
                {jobs.length > 0 && (
                  <button onClick={() => setIsScanModalOpen(true)} className="text-xs font-medium text-[#4f0f62] hover:underline flex items-center gap-1">
                    <Search size={12} /> Re-scan
                  </button>
                )}
              </div>

              <div className="card-base p-0 overflow-hidden">
                {isJobsLoading ? (
                  <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>
                ) : jobs.length === 0 ? (
                  <div className="p-10 text-center flex flex-col items-center gap-3">
                    <Briefcase className="h-10 w-10 text-gray-300" />
                    <p className="text-sm text-gray-500">No jobs recommended yet.</p>
                    <button onClick={() => setIsScanModalOpen(true)} className="btn-primary gap-2 h-9 px-4 text-sm">
                      <Search size={14} /> Start Your First Scan
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {jobs.map(job => {
                      const applied = isApplied(job.id);
                      const score = job.match_score ?? job.score ?? 0;
                      const isExpanded = expandedJobId === job.id;

                      return (
                        <div key={job.id} className="hover:bg-gray-50/50 transition-colors">
                          <div className="p-4 flex items-center justify-between gap-4">
                            <div
                              className="flex-1 min-w-0 cursor-pointer"
                              onClick={() => openJobDetail(job)}
                            >
                              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 flex-wrap">
                                {job.role}
                                {job.display_recommendation && <RecBadge rec={job.display_recommendation} />}
                                {score > 0 && <ScoreBadge score={score} />}
                              </h3>
                              <div className="text-xs text-gray-500 flex items-center gap-3 mt-1.5 flex-wrap">
                                <span className="flex items-center gap-1"><Building size={12} /> {job.company}</span>
                                {job.location && <span className="flex items-center gap-1"><MapPin size={12} /> {job.location}</span>}
                                {job.salary && <span className="flex items-center gap-1"><DollarSign size={12} /> {job.salary}</span>}
                                {job.posted && <span className="flex items-center gap-1"><Clock size={12} /> {job.posted}</span>}
                              </div>

                              {job.missing_skills && job.missing_skills.length > 0 && (
                                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                  <span className="text-[10px] font-semibold text-gray-400 uppercase">Gaps:</span>
                                  {job.missing_skills.slice(0, 4).map((skill: string) => (
                                    <span key={skill} className="text-[10px] bg-red-50 text-red-500 border border-red-100 px-1.5 py-0.5 rounded font-medium">{skill}</span>
                                  ))}
                                  {job.missing_skills.length > 4 && (
                                    <span className="text-[10px] text-gray-400">+{job.missing_skills.length - 4}</span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 shrink-0">
                              <button onClick={() => openJobDetail(job)} className="text-xs font-medium text-gray-500 hover:text-gray-900 px-2 py-1.5 rounded-md hover:bg-gray-100 transition-colors">
                                Details
                              </button>
                              {applied ? (
                                <span className="text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-md flex items-center gap-1">
                                  <CheckCircle size={12} /> Applied
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleApply(job)}
                                  disabled={applyingJobId === job.id}
                                  className="text-xs font-bold bg-[#4f0f62] text-white px-3 py-1.5 rounded-md hover:bg-purple-900 transition-colors disabled:opacity-50 flex items-center gap-1"
                                >
                                  {applyingJobId === job.id ? <Loader2 size={12} className="animate-spin" /> : <ExternalLink size={12} />}
                                  Apply
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* ================================================================ */}
            {/* WORKSPACE SPLIT: Resume + Intelligence | Application Tracker */}
            {/* ================================================================ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

              {/* LEFT: Resume Library + Intelligence */}
              <div className="flex flex-col gap-6">
                {/* Resume Library */}
                <section>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 flex items-center gap-2">
                      <FileText size={18} /> Base Resumes
                    </h2>
                    <label className="text-xs font-medium text-[#4f0f62] cursor-pointer hover:underline">
                      Quick Upload
                      <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.docx" onChange={handleFileChange} disabled={isUploading || isParsing} />
                    </label>
                  </div>

                  {(isUploading || isParsing) && (
                    <div className="card-base p-4 mb-3 flex items-center gap-3 bg-purple-50/50 border-purple-200">
                      <Loader2 className="h-4 w-4 animate-spin text-[#4f0f62]" />
                      <span className="text-sm text-[#4f0f62] font-medium">
                        {isUploading ? 'Uploading...' : 'Parsing with AI...'}
                      </span>
                    </div>
                  )}

                  {isLoadingLibrary ? (
                    <div className="card-base flex items-center justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  ) : resumes.length === 0 ? (
                    <div className="card-base p-8 text-center flex flex-col items-center gap-2">
                      <FileText className="h-8 w-8 text-gray-300" />
                      <p className="text-sm text-gray-500">No resumes found.</p>
                      <Link href="/builder" className="text-xs text-[#4f0f62] font-medium hover:underline mt-1">Create your first resume →</Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {resumes.map(r => (
                        <div key={r.id} className="card-base p-4 flex flex-col gap-3 group">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-md text-gray-500">
                              <FileText size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-bold text-[#1c1c1c] truncate">{r.title || r.file_name || 'Untitled Resume'}</h3>
                              <p className="text-xs text-gray-500">Version {r.version}</p>
                            </div>
                            <div className="flex gap-2 items-center">
                              <button onClick={() => handleDuplicate(r.id, r.title)} className="text-xs text-gray-400 hover:text-gray-900">Duplicate</button>
                              <button onClick={() => handleDelete(r.id)} className="text-xs text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={13} /></button>
                              <Link href={`/builder?id=${r.id}`} className="text-xs text-[#4f0f62] hover:underline font-medium">Edit</Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Chrome Extension Download Card */}
                <section>
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-100 p-5 flex flex-col sm:flex-row gap-4 items-center sm:items-start justify-between">
                     <div className="flex flex-col gap-1.5">
                       <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                         🚀 Live Application Assist Extension
                       </h3>
                       <p className="text-xs text-gray-600 leading-relaxed max-w-sm">
                         Auto-scan LinkedIn postings and magically auto-fill Greenhouse, Lever, and Workday forms with your exact optimized resume context.
                       </p>
                     </div>
                     <div className="shrink-0 flex flex-col gap-2 w-full sm:w-auto">
                       <a href="/extension.zip" download className="text-xs font-bold bg-[#4f0f62] text-white px-4 py-2 rounded-md hover:bg-purple-900 transition-colors text-center shadow-sm">
                         Download Unpacked (.zip)
                       </a>
                       <button onClick={() => alert('To install: \\n1. Unzip the downloaded file.\\n2. Open chrome://extensions\\n3. Enable Developer Mode\\n4. Click "Load unpacked" and select the folder.')} className="text-[10px] text-gray-500 hover:text-gray-900 underline text-center">
                         Installation Instructions
                       </button>
                     </div>
                  </div>
                </section>

                {/* Analytics Dashboard Replaces Resume Intelligence */}
                <section>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-4 flex items-center gap-2">
                    <Brain size={18} className="text-[#4f0f62]" /> Pattern Analytics
                  </h2>
                  <AnalyticsDashboard />
                </section>
              </div>

              {/* RIGHT: Application Tracker */}
              <section>
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-4 flex items-center gap-2">
                  <CheckCircle size={18} className="text-green-600" /> Application Tracker
                  {applications.length > 0 && (
                    <span className="text-[11px] font-normal text-gray-400">({applications.length})</span>
                  )}
                </h2>

                {/* Status Summary */}
                {applications.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {(['applied', 'interview', 'offer', 'rejected'] as const).map(s => {
                      const count = applications.filter(a => a.status === s).length;
                      const cfg = statusConfig[s] || statusConfig.applied;
                      return (
                        <div key={s} className={`text-center p-2 rounded-lg border ${cfg.bg}`}>
                          <p className={`text-lg font-bold ${cfg.color}`}>{count}</p>
                          <p className="text-[10px] text-gray-500 uppercase font-medium">{cfg.label}</p>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="card-base p-0 overflow-hidden">
                  {isAppsLoading ? (
                    <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>
                  ) : applications.length === 0 ? (
                    <div className="p-10 text-center flex flex-col items-center gap-3">
                      <CheckCircle className="h-10 w-10 text-gray-300" />
                      <p className="text-sm text-gray-500">No applications tracked yet.</p>
                      <p className="text-xs text-gray-400">Apply to a recommended job to start tracking.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {applications.map(app => {
                        const cfg = statusConfig[app.status] || statusConfig.applied;
                        const details = app.job_details || (app.job ? { role: (app.job as any).role, company: (app.job as any).company, location: (app.job as any).location } : null);

                        return (
                          <div key={app.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div className="min-w-0">
                              <h3 className="font-bold text-gray-900 text-sm">
                                {details?.role || 'Unknown Role'}
                                <span className="text-gray-500 font-normal"> at {details?.company || 'Unknown'}</span>
                              </h3>
                              <div className="flex items-center gap-3 mt-1">
                                <p className="text-xs text-gray-400">
                                  {app.applied_at ? new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                </p>
                                {details?.match_score && <ScoreBadge score={details.match_score} />}
                              </div>
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>
                              {cfg.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
