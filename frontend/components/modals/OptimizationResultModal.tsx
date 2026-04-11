'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, Copy, Check, ArrowRight, Zap, AlertTriangle, TrendingUp } from 'lucide-react';
import { getOptimizationResults, type OptimizationResult } from '@/services/careerApi';

interface OptimizationResultModalProps {
  isOpen: boolean;
  job: any;
  resumeId: string | null;
  onClose: () => void;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="p-1 text-gray-400 hover:text-gray-700 transition-colors rounded hover:bg-gray-100" title="Copy">
      {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
    </button>
  );
}

export default function OptimizationResultModal({ isOpen, job, resumeId, onClose }: OptimizationResultModalProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !job) return;
    setLoading(true);
    setError('');
    setResult(null);

    getOptimizationResults({
      job_description: job.raw_jd || job.description || `${job.role} at ${job.company}`,
      resume_id: resumeId || undefined,
    }).then(res => {
      if (res.success && res.data) {
        setResult(res.data);
      } else {
        setError(res.error || 'Optimization failed');
      }
      setLoading(false);
    });
  }, [isOpen, job, resumeId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#ffc629]/20 flex items-center justify-center">
              <Sparkles size={16} className="text-[#b8860b]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1c1c1c]">Resume Optimization</h2>
              <p className="text-xs text-gray-500">{job?.role} at {job?.company}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1 flex flex-col gap-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="animate-spin text-[#4f0f62]" size={28} />
              <p className="text-sm text-gray-500">Analyzing your resume against the JD...</p>
              <p className="text-xs text-gray-400">Generating AI-powered optimization suggestions</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <AlertTriangle size={16} /> {error}
            </div>
          ) : result ? (
            <>
              {/* Strategy Overview */}
              <div>
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <TrendingUp size={13} /> Overall Strategy
                </h3>
                <div className="bg-gradient-to-r from-purple-50 to-amber-50 rounded-lg p-4 border border-purple-100 text-sm text-gray-800 leading-relaxed">
                  {result.overall_strategy}
                </div>
              </div>

              {/* Optimized Summary */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={13} className="text-[#4f0f62]" /> Optimized Professional Summary
                  </h3>
                  <CopyButton text={result.optimized_summary} />
                </div>
                <div className="bg-green-50/50 rounded-lg p-4 border border-green-100 text-sm text-gray-800 leading-relaxed">
                  {result.optimized_summary}
                </div>
              </div>

              {/* Bullet Rewrites */}
              {result.bullet_rewrites.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Bullet Point Rewrites
                  </h3>
                  <div className="flex flex-col gap-3">
                    {result.bullet_rewrites.map((rewrite, i) => (
                      <div key={i} className="rounded-lg border border-gray-200 overflow-hidden">
                        <div className="px-3 py-1.5 bg-gray-50 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                          {rewrite.section}
                        </div>
                        <div className="p-3 flex flex-col gap-2">
                          <div className="flex items-start gap-2">
                            <span className="text-xs font-bold text-red-400 mt-1 shrink-0">BEFORE</span>
                            <p className="text-xs text-gray-400 line-through">{rewrite.original}</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-xs font-bold text-green-600 mt-1 shrink-0">AFTER</span>
                            <div className="flex items-start gap-1 flex-1">
                              <p className="text-xs text-gray-800 font-medium">{rewrite.optimized}</p>
                              <CopyButton text={rewrite.optimized} />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ATS Keywords */}
              {result.ats_keywords_to_add.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Zap size={13} className="text-yellow-600" /> ATS Keywords to Add
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {result.ats_keywords_to_add.map(kw => (
                      <span key={kw} className="text-xs bg-yellow-50 text-yellow-800 border border-yellow-200 px-2.5 py-1 rounded-full font-medium">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Skill Additions */}
              {result.skill_additions.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Skills to Highlight
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {result.skill_additions.map(skill => (
                      <span key={skill} className="text-xs bg-[#4f0f62]/5 text-[#4f0f62] border border-[#4f0f62]/15 px-2.5 py-1 rounded-full font-medium">
                        + {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3 shrink-0">
          <button onClick={onClose} className="btn-primary h-10 px-5 text-sm">Done</button>
        </div>
      </div>
    </div>
  );
}
