'use client';

import { useState } from 'react';
import { X, Send, Loader2, Copy, Check, User, Linkedin, ChevronDown, ChevronRight } from 'lucide-react';
import { generateOutreach, type OutreachResult } from '@/services/careerApi';

interface OutreachModalProps {
  isOpen: boolean;
  job: any;
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
    <button onClick={copy} className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors rounded-md hover:bg-gray-100" title="Copy">
      {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
    </button>
  );
}

export default function OutreachModal({ isOpen, job, onClose }: OutreachModalProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OutreachResult | null>(null);
  const [error, setError] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('');
  const [showTargets, setShowTargets] = useState(false);

  if (!isOpen || !job) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    const res = await generateOutreach({
      job_description: job.raw_jd || job.description || `${job.role} at ${job.company}`,
      company: job.company,
      role: job.role,
      contact_name: contactName || undefined,
      contact_role: contactRole || undefined,
    });

    if (res.success && res.data) {
      setResult(res.data);
    } else {
      setError(res.error || 'Failed to generate outreach');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Linkedin size={16} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1c1c1c]">LinkedIn Outreach</h2>
              <p className="text-xs text-gray-500">{job.role} at {job.company}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1 flex flex-col gap-4">
          {!result ? (
            <>
              <p className="text-sm text-gray-600">
                Generate a personalized LinkedIn connection request and follow-up message for this role.
                Optionally specify who you&apos;re reaching out to:
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Contact Name <span className="text-gray-400">(optional)</span></label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={e => setContactName(e.target.value)}
                    placeholder="e.g. Sarah Chen"
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Their Role <span className="text-gray-400">(optional)</span></label>
                  <input
                    type="text"
                    value={contactRole}
                    onChange={e => setContactRole(e.target.value)}
                    placeholder="e.g. Engineering Manager"
                    className="input-base"
                  />
                </div>
              </div>

              {error && <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 text-sm">{error}</div>}

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="btn-primary gap-2 h-10 text-sm self-start"
              >
                {loading ? <><Loader2 size={14} className="animate-spin" /> Generating...</> : <><Send size={14} /> Generate Outreach</>}
              </button>
            </>
          ) : (
            <>
              {/* Connection Note */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Linkedin size={13} className="text-blue-600" /> Connection Request (≤300 chars)
                  </h3>
                  <CopyButton text={result.connection_note} />
                </div>
                <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100 text-sm text-gray-800 leading-relaxed">
                  {result.connection_note}
                </div>
                <p className="text-[10px] text-gray-400 mt-1">{result.connection_note.length}/300 characters</p>
              </div>

              {/* Full Message */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Follow-up Message</h3>
                  <CopyButton text={result.message} />
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {result.message}
                </div>
              </div>

              {/* Subject Line */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Subject Line</h3>
                  <CopyButton text={result.subject} />
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 text-sm text-gray-800 font-medium">
                  {result.subject}
                </div>
              </div>

              {/* Targets */}
              {result.targets && result.targets.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowTargets(!showTargets)}
                    className="flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase tracking-wider hover:text-gray-900"
                  >
                    {showTargets ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                    <User size={13} /> Suggested Targets ({result.targets.length})
                  </button>
                  {showTargets && (
                    <div className="mt-2 flex flex-col gap-2">
                      {result.targets.map((t, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <div>
                            <p className="text-sm font-bold text-gray-800">{t.name}</p>
                            <p className="text-xs text-gray-500">{t.role}</p>
                          </div>
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            t.priority === 'primary' ? 'bg-green-100 text-green-700' :
                            t.priority === 'secondary' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {t.priority}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Regenerate */}
              <button
                onClick={() => { setResult(null); setError(''); }}
                className="text-xs font-medium text-[#4f0f62] hover:underline self-start"
              >
                ← Generate again with different inputs
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end shrink-0">
          <button onClick={onClose} className="btn-primary h-10 px-5 text-sm">Done</button>
        </div>
      </div>
    </div>
  );
}
