'use client';

import { useState } from 'react';
import { X, FileSignature, Loader2, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';

interface EvalResult {
  score: number;
  recommendation: string;
  matched_skills: string[];
  missing_skills: string[];
  suggestions: string[];
  total_jd_skills: number;
}

interface EvaluateJDModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EvaluateJDModal({ isOpen, onClose }: EvaluateJDModalProps) {
  const [jdText, setJdText] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<EvalResult | null>(null);

  if (!isOpen) return null;

  const handleEvaluate = async () => {
    if (!jdText.trim()) {
      setError('Please paste a job description.');
      return;
    }

    setError('');
    setIsEvaluating(true);
    setResult(null);

    try {
      const res = await fetch('/api/jd/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_description: jdText }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Evaluation failed');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setJdText('');
    setError('');
    onClose();
  };

  const scoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-500';
  };

  const scoreBg = (score: number) => {
    if (score >= 75) return 'bg-green-50 border-green-200';
    if (score >= 50) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-gray-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#4f0f62]/10 flex items-center justify-center">
              <FileSignature size={16} className="text-[#4f0f62]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1c1c1c]">Evaluate JD</h2>
              <p className="text-xs text-gray-500">Paste a job description to analyze fit</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {!result ? (
            <>
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                  Job Description
                </label>
                <textarea
                  value={jdText}
                  onChange={e => setJdText(e.target.value)}
                  placeholder="Paste the full job description here..."
                  className="input-base min-h-[200px] resize-y"
                  disabled={isEvaluating}
                />
                <p className="text-[11px] text-gray-400 mt-1">{jdText.length} characters</p>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Score Badge */}
              <div className={`flex items-center justify-between p-4 rounded-xl border ${scoreBg(result.score)}`}>
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Match Score</p>
                  <p className={`text-3xl font-black ${scoreColor(result.score)}`}>{result.score}%</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                    result.recommendation === 'STRONG MATCH' ? 'bg-green-100 text-green-700' :
                    result.recommendation === 'MODERATE MATCH' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {result.recommendation}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{result.total_jd_skills} skills detected</p>
                </div>
              </div>

              {/* Matched Skills */}
              {result.matched_skills.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                    <CheckCircle size={13} className="text-green-600" /> Matched Skills
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {result.matched_skills.map(skill => (
                      <span key={skill} className="text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Skills */}
              {result.missing_skills.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                    <AlertTriangle size={13} className="text-yellow-600" /> Missing Skills
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {result.missing_skills.map(skill => (
                      <span key={skill} className="text-xs bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-full font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {result.suggestions.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                    <TrendingUp size={13} className="text-[#4f0f62]" /> Suggestions
                  </h3>
                  <ul className="flex flex-col gap-1.5">
                    {result.suggestions.map((s, i) => (
                      <li key={i} className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3 shrink-0">
          {result ? (
            <>
              <button onClick={() => setResult(null)} className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors">
                Evaluate Another
              </button>
              <button onClick={handleClose} className="btn-primary h-10 px-5 text-sm">
                Done
              </button>
            </>
          ) : (
            <>
              <button onClick={handleClose} className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors" disabled={isEvaluating}>
                Cancel
              </button>
              <button
                onClick={handleEvaluate}
                disabled={isEvaluating}
                className="btn-primary gap-2 h-10 px-5 text-sm"
              >
                {isEvaluating ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Analyzing...
                  </>
                ) : (
                  <>
                    <FileSignature size={14} /> Evaluate
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
