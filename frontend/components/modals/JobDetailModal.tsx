'use client';

import { useState } from 'react';
import {
  X, Building, MapPin, DollarSign, Clock, ExternalLink, CheckCircle,
  Loader2, Zap, BookOpen, AlertTriangle, TrendingUp, Sparkles,
  Linkedin, Globe2
} from 'lucide-react';

interface JobDetailModalProps {
  isOpen: boolean;
  job: any;
  isApplied: boolean;
  onClose: () => void;
  onApply: (job: any) => void;
  onOptimize: (job: any) => void;
  onInterviewPrep: (job: any) => void;
  onOutreach: (job: any) => void;
  onDeepResearch: (job: any) => void;
}

function ScoreBadge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const color = score >= 75 ? 'text-green-700 bg-green-50 border-green-200'
    : score >= 50 ? 'text-yellow-700 bg-yellow-50 border-yellow-200'
    : 'text-red-600 bg-red-50 border-red-200';
  const textSize = size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-sm' : 'text-xs';
  return <span className={`${textSize} font-bold px-3 py-1 rounded-full border ${color}`}>{score}%</span>;
}

export default function JobDetailModal({ isOpen, job, isApplied, onClose, onApply, onOptimize, onInterviewPrep, onOutreach, onDeepResearch }: JobDetailModalProps) {
  const [applyingHere, setApplyingHere] = useState(false);

  if (!isOpen || !job) return null;

  const score = job.match_score ?? job.score ?? 0;
  const rec = job.display_recommendation || job.recommendation || '';
  const recUpper = rec.toUpperCase();
  const skills = job.requiredSkills || job.evaluation_data?.keywords || [];
  const missing = job.missing_skills || job.evaluation_data?.missing_skills || [];
  const strengths = job.evaluation_data?.strengths || [];
  const gaps = job.evaluation_data?.gaps || missing;
  const mitigations = job.evaluation_data?.gap_mitigations || [];
  const tips = job.evaluation_data?.personalization_tips || [];
  const fitSummary = job.fit_summary || job.evaluation_data?.fit_summary || job.description || '';

  const handleApply = async () => {
    setApplyingHere(true);
    await onApply(job);
    setApplyingHere(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col border border-gray-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="text-lg font-bold text-[#1c1c1c]">{job.role}</h2>
                {score > 0 && <ScoreBadge score={score} size="sm" />}
                {recUpper && (
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    recUpper === 'APPLY' ? 'bg-green-100 text-green-700' :
                    recUpper === 'REVIEW' || recUpper === 'CONSIDER' || recUpper === 'MAYBE' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {recUpper}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                <span className="flex items-center gap-1"><Building size={14} /> {job.company}</span>
                {job.location && <span className="flex items-center gap-1"><MapPin size={14} /> {job.location}</span>}
                {job.salary && <span className="flex items-center gap-1"><DollarSign size={14} /> {job.salary}</span>}
                {job.posted && <span className="flex items-center gap-1"><Clock size={14} /> {job.posted}</span>}
                {job.type && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full font-medium">{job.type}</span>}
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors shrink-0">
              <X size={18} />
            </button>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col gap-2 mt-4">
            <div className="flex items-center gap-2 flex-wrap">
              {isApplied ? (
                <span className="text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-4 py-2 rounded-md flex items-center gap-1.5">
                  <CheckCircle size={14} /> Applied
                </span>
              ) : (
                <button onClick={handleApply} disabled={applyingHere} className="text-xs font-bold bg-[#4f0f62] text-white px-4 py-2 rounded-md hover:bg-purple-900 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                  {applyingHere ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />} Apply Now
                </button>
              )}
              <button onClick={() => onOptimize(job)} className="text-xs font-semibold bg-[#ffc629] text-[#1c1c1c] px-4 py-2 rounded-md hover:bg-[#e5b022] transition-colors flex items-center gap-1.5 border border-[#1c1c1c]/10">
                <Sparkles size={14} /> Optimize Resume
              </button>
              {job.url && (
                <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 ml-auto">
                  <ExternalLink size={12} /> Original Listing
                </a>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button gap-1.5 onClick={() => onInterviewPrep(job)} className="text-xs font-semibold text-gray-700 bg-gray-100 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-1.5 border border-gray-200">
                <BookOpen size={14} /> Interview Prep
              </button>
              <button onClick={() => onDeepResearch(job)} className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-4 py-2 rounded-md hover:bg-indigo-100 transition-colors flex items-center gap-1.5 border border-indigo-200">
                <Globe2 size={14} /> Deep Research
              </button>
              <button onClick={() => onOutreach(job)} className="text-xs font-semibold text-blue-700 bg-blue-50 px-4 py-2 rounded-md hover:bg-blue-100 transition-colors flex items-center gap-1.5 border border-blue-200">
                <Linkedin size={14} /> Outreach
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1 flex flex-col gap-5">
          {/* Fit Summary */}
          {fitSummary && (
            <div>
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <TrendingUp size={13} /> Fit Summary
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-4 border border-gray-100">
                {fitSummary}
              </p>
            </div>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Required Skills</h3>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill: string) => {
                  const isMissing = missing.includes(skill);
                  return (
                    <span key={skill} className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                      isMissing
                        ? 'bg-red-50 text-red-600 border-red-200'
                        : 'bg-green-50 text-green-700 border-green-200'
                    }`}>
                      {skill}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Missing Skills (if different from required) */}
          {missing.length > 0 && skills.length === 0 && (
            <div>
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertTriangle size={13} className="text-yellow-600" /> Skill Gaps
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {missing.map((skill: string) => (
                  <span key={skill} className="text-xs bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-full font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Strengths */}
          {strengths.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle size={13} className="text-green-600" /> Your Strengths
              </h3>
              <ul className="flex flex-col gap-1.5">
                {strengths.map((s: string, i: number) => (
                  <li key={i} className="text-sm text-gray-700 bg-green-50/50 rounded-lg px-3 py-2 border border-green-100">{s}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Gap Mitigations */}
          {mitigations.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">How to Address Gaps</h3>
              <ul className="flex flex-col gap-1.5">
                {mitigations.map((m: string, i: number) => (
                  <li key={i} className="text-sm text-gray-700 bg-yellow-50/50 rounded-lg px-3 py-2 border border-yellow-100">{m}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Personalization Tips */}
          {tips.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles size={13} className="text-[#4f0f62]" /> Resume Tips for This Job
              </h3>
              <ul className="flex flex-col gap-1.5">
                {tips.map((t: string, i: number) => (
                  <li key={i} className="text-sm text-gray-700 bg-purple-50/50 rounded-lg px-3 py-2 border border-purple-100">{t}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Raw JD */}
          {job.raw_jd && (
            <div>
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Full Description</h3>
              <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-4 border border-gray-100 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                {job.raw_jd}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

