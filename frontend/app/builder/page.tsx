'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useResumeStore } from '@/stores/resumeStore';
import ResumeForm from '@/components/ResumeForm';
import LivePreview from '@/components/LivePreview';
import { createResume, updateResume } from '@/services/resumeApi';
import { Save, FileDown, ArrowLeft, Loader2 } from 'lucide-react';

export default function BuilderPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const store = useResumeStore();
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/signin');
    }
  }, [user, isLoading, router]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveMessage('');
    try {
      if (store.resumeId) {
        await updateResume(store.resumeId, {
          title: store.title,
          structured_data: store.data,
        });
      } else {
        const result = await createResume(store.title, store.data);
        store.setResumeId(result.resume_id);
      }
      store.markClean();
      setSaveMessage('Saved');
      setTimeout(() => setSaveMessage(''), 2000);
    } catch {
      setSaveMessage('Save failed');
    } finally {
      setSaving(false);
    }
  }, [store]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-gray-400" size={24} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* ——— Top Bar ——— */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white shrink-0 print:hidden shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={16} /> Dashboard
          </button>
          <div className="w-px h-5 bg-gray-200" />
          <div className="flex items-center gap-2">
            <input
              value={store.title}
              onChange={(e) => store.setTitle(e.target.value)}
              className="text-sm font-medium text-gray-900 bg-transparent border-none outline-none focus:ring-0 w-64 placeholder:text-gray-400"
              placeholder="Untitled Resume"
            />
            {store.isDirty && (
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded-none border border-gray-200">Unsaved</span>
            )}
            {saveMessage && (
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-none border ${saveMessage === 'Saved' ? 'text-green-700 bg-green-50 border-green-200' : 'text-red-700 bg-red-50 border-red-200'}`}>
                {saveMessage}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Template selector */}
          <div className="flex bg-gray-50 border border-gray-200 rounded-none text-xs p-1 shadow-inner">
            {(['modern', 'minimal', 'professional'] as const).map((t) => (
              <button
                key={t}
                onClick={() => store.setActiveTemplate(t)}
                className={`px-3 py-1.5 capitalize transition-all rounded-none font-medium ${
                  store.activeTemplate === t
                    ? 'bg-white text-[#0a0a0a] shadow-sm ring-1 ring-black/5'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-gray-200" />

          <button
            onClick={handleSave}
            disabled={saving || !store.isDirty}
            className="btn-secondary h-8 px-4 py-0 text-xs gap-1.5"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Progress
          </button>

          <button
            onClick={handlePrint}
            className="btn-primary h-8 px-4 py-0 text-xs gap-1.5"
          >
            <FileDown size={14} /> Export PDF
          </button>
        </div>
      </div>

      {/* ——— Split Layout ——— */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Form */}
        <div className="w-[480px] shrink-0 border-r border-gray-200 overflow-y-auto bg-white px-6 py-4 print:hidden">
          <ResumeForm />
        </div>

        {/* Right: Live Preview */}
        <div className="flex-1 overflow-y-auto bg-gray-50 flex justify-center py-8 print:bg-white print:p-0">
          <LivePreview />
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          nav { display: none !important; }
          body { margin: 0; padding: 0; background: white; }
        }
      `}</style>
    </div>
  );
}
