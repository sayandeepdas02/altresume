'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getResume, scoreResume, optimizeResume, ResumeDetail, ScoreResult, OptimizationResult } from '@/services/resumeApi';
import { ArrowLeft, Loader2, Zap, AlertCircle, CheckCircle, FileText, ArrowRight, TrendingUp } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import ResumePreview from '@/components/ResumePreview';

export default function ATSDashboard() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const resumeId = params.id as string;
  const [resume, setResume] = useState<ResumeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Job Description Input
  const [jobDescription, setJobDescription] = useState('');
  
  // AI State
  const [isScoring, setIsScoring] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [scoreData, setScoreData] = useState<ScoreResult | null>(null);
  const [optData, setOptData] = useState<OptimizationResult | null>(null);
  const [finalResume, setFinalResume] = useState<any>(null);

  // Preview Modal
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getResume(resumeId);
        setResume(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load resume');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [resumeId]);

  const handleScore = async () => {
    if (!jobDescription.trim()) return setError('Please paste a Job Description.');
    setError(''); setIsScoring(true); setScoreData(null); setOptData(null);
    try {
      const result = await scoreResume(resumeId, jobDescription);
      setScoreData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsScoring(false);
    }
  };

  const handleOptimize = async () => {
    if (!jobDescription.trim()) return setError('Please paste a Job Description.');
    setError(''); setIsOptimizing(true);
    try {
      const result = await optimizeResume(resumeId, jobDescription);
      setOptData(result);
      
      // Enforce Single Source of Truth in state
      const unifiedResume = result.final_resume || resume?.parsed_data;
      setFinalResume(unifiedResume);
      console.log("parsed_resume", resume?.parsed_data);
      console.log("ai_output", result.ai_modifications);
      console.log("final_resume", unifiedResume);
      
    } catch (err: any) {
      if (err.message.includes('402')) {
        setError('Pro tier required for optimization.'); // Ideally trigger billing modal
      } else {
        setError(err.message);
      }
    } finally {
      setIsOptimizing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!resume && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Resume Not Found</h2>
        <p className="text-gray-500 mb-6 text-sm">This resume may have been deleted.</p>
        <Link href="/dashboard" className="btn-secondary">Return to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />
      
      {/* Top Banner */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-900 transition-colors flex items-center gap-2 text-sm font-medium">
              <ArrowLeft size={16} /> Back
            </Link>
            <div className="h-4 w-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-gray-400" />
              <span className="text-sm font-bold text-[#0a0a0a] truncate max-w-[200px]">{resume?.title || 'Untitled'}</span>
              <span className="text-[11px] font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded-none border border-gray-200">v{resume?.version}</span>
            </div>
          </div>
          <div>
            <Link href={`/builder?id=${resumeId}`} className="btn-secondary h-8 text-xs shrink-0">
              Edit in Builder
            </Link>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full max-w-[1200px] mx-auto px-6 py-8 flex items-start gap-8 flex-col lg:flex-row pb-32">
        
        {/* Left Column: Job Description Input */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6 sticky top-36">
          <div className="card-base pt-5">
            <h2 className="text-sm font-bold tracking-tight text-[#0a0a0a] uppercase mb-4 flex items-center justify-between">
              Target Role
              <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-none lowercase tracking-normal">Required</span>
            </h2>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Paste the job description you are targeting. Our AI will analyze your resume against these exact requirements.
            </p>
            <textarea
              className="input-base min-h-[400px] text-xs leading-relaxed resize-none bg-gray-50 border-gray-200 shadow-inner p-4 mb-4"
              placeholder="e.g. 'We are looking for a Senior Software Engineer with 5+ years of React...'"
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              disabled={isScoring || isOptimizing}
            />
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-none flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <span className="text-[11px] text-red-700 font-medium leading-snug">{error}</span>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <button 
                className="btn-secondary h-10 text-sm justify-between group disabled:bg-gray-50"
                onClick={handleScore}
                disabled={isScoring || isOptimizing || !jobDescription.trim()}
              >
                {isScoring ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> Auditing...</span> : 'Run ATS Audit'}
                {!isScoring && <ArrowRight size={16} className="text-gray-400 group-hover:text-black transition-colors" />}
              </button>
              <button 
                className="btn-primary h-10 text-sm justify-between group disabled:bg-black/50"
                onClick={handleOptimize}
                disabled={isScoring || isOptimizing || !jobDescription.trim()}
              >
                {isOptimizing ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> Tailoring Resume...</span> : 'AI Auto-Tailor'}
                {!isOptimizing && <Zap size={16} className="text-gray-400 group-hover:text-white transition-colors" />}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Results & Analytics */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          
          {!scoreData && !optData && (
            <div className="card-base flex flex-col items-center justify-center h-[500px] text-center border-dashed border-2 bg-gray-50/50">
              <div className="h-12 w-12 bg-white border border-gray-200 rounded-xl flex items-center justify-center mb-4 shadow-sm">
                <Zap className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-[#0a0a0a] mb-2">Awaiting Analysis</h3>
              <p className="text-sm text-gray-500 max-w-sm">
                Paste a job description on the left and run an audit to see your ATS match score, or use AI Auto-Tailor to instantly rewrite your resume for the role.
              </p>
            </div>
          )}

          {/* Results View */}
          {(scoreData || optData) && (() => {
            const data = optData || scoreData!;
            const isOpt = !!optData;
            
            return (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                
                {/* Score Header */}
                <div className="card-base flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gray-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-50 z-0"></div>
                  
                  <div className="flex items-center gap-8 relative z-10 w-full sm:w-auto">
                    <div className="relative flex shrink-0">
                      <div className="w-24 h-24 rounded-full border-4 border-gray-100 flex items-center justify-center bg-white shadow-sm">
                        <div className="text-3xl font-bold tracking-tight text-[#0a0a0a]">
                          {data.match_score}%
                        </div>
                      </div>
                      <svg className="absolute inset-0 w-24 h-24 transform -rotate-90">
                        <circle cx="48" cy="48" r="44" className="text-black transition-all duration-1000 ease-out drop-shadow-sm" strokeWidth="4" fill="none" strokeDasharray="276.4" strokeDashoffset={276.4 - (276.4 * data.match_score) / 100} stroke="currentColor" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-[#0a0a0a] flex items-center gap-2">
                        {isOpt ? 'Optimization Complete' : 'ATS Audit Complete'}
                      </h2>
                      <p className="text-sm text-gray-500 mt-1 max-w-sm leading-relaxed">
                        {data.recommendation}
                      </p>
                      {isOpt && (data as OptimizationResult).score_improvement > 0 && (
                        <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-1 bg-green-50 border border-green-200 text-green-700 text-xs font-bold rounded-none">
                          <TrendingUp size={12} />
                          +{(data as OptimizationResult).score_improvement}% Improvement
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Missing Skills */}
                  <div className="card-base">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center justify-between">
                      Missing Keywords
                      <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded-none border border-red-100">{data.missing_skills.length}</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {data.missing_skills.length > 0 ? data.missing_skills.map(skill => (
                        <span key={skill} className="px-2.5 py-1 text-xs font-medium bg-white border border-red-200 text-red-700 rounded-none shadow-sm">{skill}</span>
                      )) : <span className="text-xs text-gray-500">None detected!</span>}
                    </div>
                  </div>

                  {/* Matching Skills */}
                  <div className="card-base">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center justify-between">
                      Matched Keywords
                      <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-none border border-green-100">{data.matching_skills.length}</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {data.matching_skills.length > 0 ? data.matching_skills.map(skill => (
                        <span key={skill} className="px-2.5 py-1 text-xs font-medium bg-white border border-gray-200 text-gray-700 rounded-none shadow-sm">{skill}</span>
                      )) : <span className="text-xs text-gray-500">None detected.</span>}
                    </div>
                  </div>
                </div>

                {/* Analysis Strengths & Gaps */}
                <div className="card-base space-y-6">
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-bold text-[#0a0a0a] mb-3">
                      <CheckCircle size={16} className="text-green-500" />
                      Identified Strengths
                    </h4>
                    <ul className="space-y-2">
                      {data.strengths.map((s, i) => (
                        <li key={i} className="text-[13px] text-gray-600 pl-6 relative">
                          <span className="absolute left-2 top-2 w-1 h-1 bg-gray-400 rounded-full"></span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="h-px w-full bg-gray-100" />
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-bold text-[#0a0a0a] mb-3">
                      <AlertCircle size={16} className="text-yellow-500" />
                      Areas for Improvement
                    </h4>
                    <ul className="space-y-2">
                      {data.gaps.map((g, i) => (
                        <li key={i} className="text-[13px] text-gray-600 pl-6 relative">
                          <span className="absolute left-2 top-2 w-1 h-1 bg-gray-400 rounded-full"></span>
                          {g}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Optimization Specific Output: Rewrite Diff + Preview */}
                {isOpt && (
                  <div className="card-base border-black ring-1 ring-black/5">
                    <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100">
                      <div>
                        <h3 className="text-lg font-bold text-[#0a0a0a] flex items-center gap-2">
                          <Zap size={18} className="text-black fill-black" />
                          Tailored Resume Generated
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">We created an optimized copy based on the job description.</p>
                      </div>
                      <button 
                        onClick={() => setShowPreview(true)}
                        className="btn-primary"
                      >
                        Preview & Export
                      </button>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-500">AI Modifications</h4>
                      {(data as OptimizationResult).changes.length > 0 ? (
                        <div className="space-y-3">
                          {(data as OptimizationResult).changes.map((change, i) => (
                            <div key={i} className="bg-gray-50 rounded-none border border-gray-200 overflow-hidden text-xs">
                              <div className="p-3 bg-red-50/50 text-red-800 border-b border-gray-200 line-through opacity-70 font-mono">
                                {change.before}
                              </div>
                              <div className="p-3 bg-green-50/50 text-green-900 border-b border-gray-200 font-mono font-medium">
                                {change.after}
                              </div>
                              <div className="p-2.5 bg-white text-gray-500 font-medium italic flex items-center gap-2">
                                <Zap size={12} className="text-yellow-500" /> {change.reason}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No major textual changes were necessary; structural improvements applied.</p>
                      )}
                    </div>
                  </div>
                )}
                
              </div>
            );
          })()}

        </div>
      </div>

      {showPreview && finalResume && (
        <ResumePreview
          finalResume={finalResume}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
