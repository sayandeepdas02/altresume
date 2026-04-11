'use client';

import { useState } from 'react';
import { X, Globe2, Loader2, Copy, Check, ChevronDown, ChevronRight, Briefcase } from 'lucide-react';
import { getDeepResearch, type DeepResearchResult, type ResearchAxis } from '@/services/careerApi';

interface DeepResearchModalProps {
  isOpen: boolean;
  job: any;
  onClose: () => void;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors rounded-md hover:bg-gray-100" title="Copy">
      {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
    </button>
  );
}

function ResearchAxisView({ axisKey, axis, defaultOpen = false }: { axisKey: string, axis: ResearchAxis, defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">{axis.title}</span>
        {open ? <ChevronDown size={14} className="text-gray-500" /> : <ChevronRight size={14} className="text-gray-500" />}
      </button>

      {open && (
        <div className="p-4 bg-white flex flex-col gap-4">
          {axis.questions && axis.questions.length > 0 && (
            <div>
              <h4 className="text-[10px] uppercase font-bold text-gray-500 mb-2">Key Questions</h4>
              <ul className="list-disc pl-4 space-y-1">
                {axis.questions.map((q, i) => (
                  <li key={i} className="text-xs text-gray-700">{q}</li>
                ))}
              </ul>
            </div>
          )}

          {axis.queries && axis.queries.length > 0 && (
            <div>
              <h4 className="text-[10px] uppercase font-bold text-gray-500 mb-2">Suggested Search Queries</h4>
              <div className="flex flex-col gap-2">
                {axis.queries.map((q, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100">
                    <code className="text-xs text-[#4f0f62]">{q}</code>
                    <CopyButton text={q} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {axis.candidate_skills && axis.candidate_skills.length > 0 && (
            <div>
              <h4 className="text-[10px] uppercase font-bold text-gray-500 mb-2">Relevant Profile Skills</h4>
              <div className="flex flex-wrap gap-1.5">
                {axis.candidate_skills.map((s, i) => (
                  <span key={i} className="text-[10px] bg-[#4f0f62]/5 text-[#4f0f62] border border-[#4f0f62]/10 px-2 py-0.5 rounded font-medium">{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DeepResearchModal({ isOpen, job, onClose }: DeepResearchModalProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DeepResearchResult | null>(null);
  const [error, setError] = useState('');
  const [company, setCompany] = useState('');

  if (!isOpen) return null;

  const handleGenerate = async (targetCompany: string) => {
    setLoading(true);
    setError('');
    setResult(null);

    const res = await getDeepResearch({
      company: targetCompany,
      role: job?.role,
      job_listing_id: job?.id,
    });

    if (res.success && res.data) {
      setResult(res.data);
    } else {
      setError(res.error || 'Failed to generate deep research');
    }
    setLoading(false);
  };

  const initialCompany = job?.company || '';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Globe2 size={16} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1c1c1c]">Deep Company Research</h2>
              <p className="text-xs text-gray-500">{result?.company || initialCompany || 'Intelligence Gathering'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1 flex flex-col gap-4">
          {!result && !loading ? (
            <>
              <p className="text-sm text-gray-600">
                Generate a structured intelligence package for this company across 6 axes: AI Strategy, Recent Moves, Culture, Challenges, Competitors, and Your Unique Angle.
              </p>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Company Name</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={company || initialCompany}
                    onChange={e => setCompany(e.target.value)}
                    placeholder="e.g. Stripe"
                    className="input-base flex-1"
                  />
                  <button
                    onClick={() => handleGenerate(company || initialCompany)}
                    disabled={!(company || initialCompany)}
                    className="btn-primary px-4 border border-[#4f0f62]" // Ensure visible border matching dark theme
                  >
                    Generate
                  </button>
                </div>
              </div>

              {error && <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 text-sm">{error}</div>}
            </>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
               <Loader2 className="animate-spin text-indigo-600" size={28} />
               <p className="text-sm text-gray-500">Generating research framework...</p>
            </div>
          ) : result ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between mb-2">
                 <p className="text-sm text-gray-600">
                   Researching <span className="font-bold text-gray-800">{result.company}</span> for the <span className="font-bold text-gray-800">{result.role}</span> role.
                 </p>
                 <button
                    onClick={() => {
                        const fullPrompt = `## Deep Research: ${result.company} — ${result.role}\n\nContext: I am evaluating a candidacy for ${result.role} at ${result.company}. I need actionable information for the interview.\n\n` +
                          Object.entries(result.research_axes).map(([k, axis]) => `### ${axis.title}\n${axis.questions.map(q => `- ${q}`).join('\n')}`).join('\n\n');
                        navigator.clipboard.writeText(fullPrompt);
                    }}
                    className="text-xs font-medium text-indigo-600 hover:underline flex items-center gap-1"
                 >
                    <Copy size={12} /> Copy Full AI Prompt
                 </button>
              </div>

              {Object.entries(result.research_axes).map(([key, axis], i) => (
                <ResearchAxisView key={key} axisKey={key} axis={axis} defaultOpen={i === 0 || i === 5} />
              ))}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {result && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end shrink-0">
             <button onClick={onClose} className="btn-primary h-10 px-5 text-sm border border-[#4f0f62]">Done</button>
          </div>
        )}
      </div>
    </div>
  );
}
