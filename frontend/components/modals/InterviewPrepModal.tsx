'use client';

import { useState, useEffect } from 'react';
import { X, BookOpen, Loader2, MessageSquare, HelpCircle, Target, Lightbulb, ChevronDown, ChevronRight } from 'lucide-react';
import { getInterviewPrep, type InterviewPrep } from '@/services/careerApi';

interface InterviewPrepModalProps {
  isOpen: boolean;
  job: any;
  onClose: () => void;
}

function CollapsibleSection({ title, icon, children, defaultOpen = false }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left">
        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
          {icon} {title}
        </span>
        {open ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}

export default function InterviewPrepModal({ isOpen, job, onClose }: InterviewPrepModalProps) {
  const [loading, setLoading] = useState(false);
  const [prep, setPrep] = useState<InterviewPrep | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !job) return;

    setLoading(true);
    setError('');
    setPrep(null);

    getInterviewPrep({
      job_description: job.raw_jd || job.description || `${job.role} at ${job.company}`,
      company_name: job.company,
    }).then(result => {
      if (result.success && result.data) {
        setPrep(result.data);
      } else {
        setError(result.error || 'Failed to generate prep materials');
      }
      setLoading(false);
    });
  }, [isOpen, job]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <BookOpen size={16} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1c1c1c]">Interview Prep</h2>
              <p className="text-xs text-gray-500">{job?.role} at {job?.company}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1 flex flex-col gap-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="animate-spin text-blue-500" size={28} />
              <p className="text-sm text-gray-500">Generating interview preparation materials...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-red-700 text-sm">{error}</div>
          ) : prep ? (
            <>
              {/* STAR Stories */}
              {prep.star_stories.length > 0 && (
                <CollapsibleSection title="STAR Stories" icon={<Target size={13} />} defaultOpen>
                  <div className="flex flex-col gap-3">
                    {prep.star_stories.map((story, i) => (
                      <div key={i} className="bg-blue-50/50 rounded-lg p-4 border border-blue-100">
                        <p className="text-xs font-bold text-blue-700 mb-2">📌 {story.requirement}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                          <div><span className="font-semibold text-gray-900">Situation:</span> {story.situation}</div>
                          <div><span className="font-semibold text-gray-900">Task:</span> {story.task}</div>
                          <div><span className="font-semibold text-gray-900">Action:</span> {story.action}</div>
                          <div><span className="font-semibold text-gray-900">Result:</span> {story.result}</div>
                        </div>
                        {story.reflection && (
                          <p className="text-xs text-gray-500 mt-2 italic">💡 {story.reflection}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              )}

              {/* Likely Questions */}
              {prep.likely_questions.length > 0 && (
                <CollapsibleSection title="Likely Questions" icon={<HelpCircle size={13} />} defaultOpen>
                  <ol className="flex flex-col gap-2 list-decimal list-inside">
                    {prep.likely_questions.map((q, i) => (
                      <li key={i} className="text-sm text-gray-700">{q}</li>
                    ))}
                  </ol>
                </CollapsibleSection>
              )}

              {/* Red Flag Responses */}
              {prep.red_flag_responses.length > 0 && (
                <CollapsibleSection title="Tricky Questions" icon={<MessageSquare size={13} />}>
                  <div className="flex flex-col gap-3">
                    {prep.red_flag_responses.map((rf, i) => (
                      <div key={i} className="bg-yellow-50/50 rounded-lg p-3 border border-yellow-100">
                        <p className="text-xs font-bold text-yellow-800 mb-1">❓ {rf.question}</p>
                        <p className="text-xs text-gray-700">{rf.suggested_response}</p>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              )}

              {/* Key Talking Points */}
              {prep.key_talking_points.length > 0 && (
                <CollapsibleSection title="Key Talking Points" icon={<Lightbulb size={13} />}>
                  <ul className="flex flex-col gap-1.5">
                    {prep.key_talking_points.map((p, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">✓</span> {p}
                      </li>
                    ))}
                  </ul>
                </CollapsibleSection>
              )}

              {/* Questions to Ask */}
              {prep.questions_to_ask.length > 0 && (
                <CollapsibleSection title="Questions to Ask Them" icon={<HelpCircle size={13} />}>
                  <ul className="flex flex-col gap-1.5">
                    {prep.questions_to_ask.map((q, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-[#4f0f62]">→</span> {q}
                      </li>
                    ))}
                  </ul>
                </CollapsibleSection>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end shrink-0">
          <button onClick={onClose} className="btn-primary h-10 px-5 text-sm">Done</button>
        </div>
      </div>
    </div>
  );
}
