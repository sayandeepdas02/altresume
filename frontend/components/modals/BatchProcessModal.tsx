'use client';

import { useState } from 'react';
import {
  X, Layers, Loader2, Plus, Trash2, Play, CheckCircle, AlertTriangle,
  Building, TrendingUp,
} from 'lucide-react';
import { batchEvaluate, type BatchResult } from '@/services/careerApi';

interface BatchProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (results: BatchResult) => void;
}

interface JDEntry {
  id: string;
  role: string;
  company: string;
  description: string;
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? 'text-green-700 bg-green-50 border-green-200'
    : score >= 50 ? 'text-yellow-700 bg-yellow-50 border-yellow-200'
    : 'text-red-600 bg-red-50 border-red-200';
  return <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${color}`}>{score}%</span>;
}

function RecBadge({ rec }: { rec: string }) {
  const r = rec.toUpperCase();
  const style = r === 'APPLY' ? 'bg-green-100 text-green-700'
    : r === 'REVIEW' ? 'bg-yellow-100 text-yellow-700'
    : 'bg-gray-100 text-gray-500';
  return <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${style}`}>{r}</span>;
}

export default function BatchProcessModal({ isOpen, onClose, onComplete }: BatchProcessModalProps) {
  const [entries, setEntries] = useState<JDEntry[]>([
    { id: crypto.randomUUID(), role: '', company: '', description: '' },
  ]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<BatchResult | null>(null);
  const [error, setError] = useState('');
  const [pasteMode, setPasteMode] = useState(false);
  const [bulkPaste, setBulkPaste] = useState('');

  if (!isOpen) return null;

  const addEntry = () => setEntries([...entries, {
    id: crypto.randomUUID(), role: '', company: '', description: '',
  }]);

  const removeEntry = (id: string) => setEntries(entries.filter(e => e.id !== id));

  const updateEntry = (id: string, field: keyof JDEntry, value: string) => {
    setEntries(entries.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const parseBulkPaste = () => {
    const blocks = bulkPaste.split(/\n---\n|\n\n\n/).filter(Boolean);
    const newEntries: JDEntry[] = blocks.map(block => {
      const lines = block.trim().split('\n');
      const firstLine = lines[0] || '';
      const parts = firstLine.split(/\s*(?:at|@|-|,)\s*/i);
      return {
        id: crypto.randomUUID(),
        role: parts[0]?.trim() || '',
        company: parts[1]?.trim() || '',
        description: lines.slice(1).join('\n').trim() || block.trim(),
      };
    });
    if (newEntries.length > 0) {
      setEntries(newEntries);
      setPasteMode(false);
      setBulkPaste('');
    }
  };

  const handleProcess = async () => {
    const valid = entries.filter(e => e.description.trim());
    if (valid.length === 0) {
      setError('Add at least one job description.');
      return;
    }

    setProcessing(true);
    setError('');
    setResults(null);

    const res = await batchEvaluate(valid.map(e => ({
      role: e.role || 'Unknown Role',
      company: e.company || 'Unknown',
      description: e.description,
    })));

    if (res.success && res.data) {
      setResults(res.data);
      onComplete?.(res.data);
    } else {
      setError(res.error || 'Batch evaluation failed');
    }
    setProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center">
              <Layers size={16} className="text-orange-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1c1c1c]">Batch Evaluation</h2>
              <p className="text-xs text-gray-500">Evaluate multiple job descriptions at once</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1 flex flex-col gap-4">
          {!results ? (
            <>
              {/* Mode Toggle */}
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => setPasteMode(false)}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${!pasteMode ? 'bg-[#4f0f62] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  Individual Entry
                </button>
                <button
                  onClick={() => setPasteMode(true)}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${pasteMode ? 'bg-[#4f0f62] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  Bulk Paste
                </button>
              </div>

              {pasteMode ? (
                <div>
                  <p className="text-xs text-gray-500 mb-2">
                    Paste multiple JDs separated by <code className="bg-gray-100 px-1 py-0.5 rounded text-[10px]">---</code> or blank lines.
                    First line = Role at Company.
                  </p>
                  <textarea
                    value={bulkPaste}
                    onChange={e => setBulkPaste(e.target.value)}
                    placeholder={`Frontend Developer at Google\nWe are looking for...\n---\nBackend Engineer at Stripe\nBuilding payment infrastructure...`}
                    className="input-base h-48 resize-none font-mono text-xs"
                  />
                  <button onClick={parseBulkPaste} disabled={!bulkPaste.trim()} className="btn-primary h-9 px-4 text-xs mt-2">
                    Parse {bulkPaste.split(/\n---\n|\n\n\n/).filter(Boolean).length || 0} JDs
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {entries.map((entry, idx) => (
                    <div key={entry.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-gray-500">JD #{idx + 1}</span>
                        {entries.length > 1 && (
                          <button onClick={() => removeEntry(entry.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <input
                          type="text"
                          value={entry.role}
                          onChange={e => updateEntry(entry.id, 'role', e.target.value)}
                          placeholder="Role title"
                          className="input-base text-sm"
                        />
                        <input
                          type="text"
                          value={entry.company}
                          onChange={e => updateEntry(entry.id, 'company', e.target.value)}
                          placeholder="Company"
                          className="input-base text-sm"
                        />
                      </div>
                      <textarea
                        value={entry.description}
                        onChange={e => updateEntry(entry.id, 'description', e.target.value)}
                        placeholder="Paste the job description here..."
                        className="input-base h-24 resize-none text-xs"
                      />
                    </div>
                  ))}

                  <button onClick={addEntry} className="text-xs font-medium text-[#4f0f62] hover:underline flex items-center gap-1 self-start">
                    <Plus size={12} /> Add another JD
                  </button>
                </div>
              )}

              {error && <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 text-sm">{error}</div>}
            </>
          ) : (
            /* Results */
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="text-green-600" size={20} />
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    {results.completed || results.results.length} of {results.total} evaluated
                  </p>
                  <p className="text-xs text-gray-500">Results sorted by match score</p>
                </div>
              </div>

              {[...results.results]
                .sort((a, b) => (b.match_score || 0) - (a.match_score || 0))
                .map(r => (
                <div key={r.index} className={`border rounded-lg p-4 ${r.error ? 'border-red-200 bg-red-50/50' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-gray-900 truncate">{r.role}</h4>
                      {r.recommendation && <RecBadge rec={r.recommendation} />}
                      {r.match_score != null && <ScoreBadge score={r.match_score} />}
                    </div>
                    <span className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
                      <Building size={11} /> {r.company}
                    </span>
                  </div>

                  {r.error ? (
                    <p className="text-xs text-red-600 mt-2 flex items-center gap-1"><AlertTriangle size={12} /> {r.error}</p>
                  ) : (
                    <>
                      {r.fit_summary && <p className="text-xs text-gray-600 mt-2">{r.fit_summary}</p>}

                      {r.missing_skills && r.missing_skills.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <span className="text-[10px] font-semibold text-gray-400">Gaps:</span>
                          {r.missing_skills.map(s => (
                            <span key={s} className="text-[10px] bg-red-50 text-red-500 border border-red-100 px-1.5 py-0.5 rounded font-medium">{s}</span>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between shrink-0">
          {!results ? (
            <>
              <p className="text-[11px] text-gray-400">
                {entries.filter(e => e.description.trim()).length} of {entries.length} ready
              </p>
              <button
                onClick={handleProcess}
                disabled={processing || entries.filter(e => e.description.trim()).length === 0}
                className="btn-primary gap-2 h-10 px-5 text-sm"
              >
                {processing ? <><Loader2 size={14} className="animate-spin" /> Processing...</> : <><Play size={14} /> Evaluate All</>}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { setResults(null); setError(''); }} className="text-xs font-medium text-[#4f0f62] hover:underline">
                ← Evaluate more
              </button>
              <button onClick={onClose} className="btn-primary h-10 px-5 text-sm">Done</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
