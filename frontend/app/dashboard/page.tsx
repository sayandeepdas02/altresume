'use client';

import { useAuth } from '@/hooks/useAuth';
import { UploadCloud, CheckCircle2, Loader2, Zap, FileText, CheckCircle, DownloadCloud, ArrowRight, AlertCircle, Mail, FileSignature, Plus } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BillingModal } from '@/components/ui/BillingModal';
import ResumePreview from '@/components/ResumePreview';
import { getResumes, ResumeSummary, deleteResume, duplicateResume } from '@/services/resumeApi';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(true);

  // Resume builder API flow state
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState('');
  
  // Quick optimization flow payload
  const [resumeId, setResumeId] = useState<string>('');
  const [parsedData, setParsedData] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadLibrary() {
      try {
        const data = await getResumes();
        setResumes(data);
      } catch (err) {
        console.error("Failed to load resumes", err);
      } finally {
        setIsLibrary(false);
      }
    }
    loadLibrary();
  }, []);

  const setLibraryFalse = () => { setIsLoadingLibrary(false); }
  const setIsLibrary = (t: boolean) => { setIsLoadingLibrary(t); }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) handleFileUpload(e.target.files[0]);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFileUpload(e.dataTransfer.files[0]);
  };

  const handleFileUpload = async (selectedFile: File) => {
    setError(''); setFile(selectedFile); setIsUploading(true); setParsedData(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const uploadRes = await fetch('/api/resumes/upload', { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();
      if (uploadRes.status === 401) { router.push('/signin'); return; }
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed');
      
      setResumeId(uploadData.resume_id);
      setIsUploading(false); setIsParsing(true);

      const parseRes = await fetch('/api/resumes/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_id: uploadData.resume_id }),
      });
      const parseData = await parseRes.json();
      if (parseRes.status === 401) { router.push('/signin'); return; }
      if (!parseRes.ok) throw new Error(parseData.error || 'Parsing failed');

      setParsedData(parseData.parsed_data);
      
      // Navigate to builder immediately with parsed data or ATS
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
    } catch (err) {
      console.error(err);
    }
  };

  const handleDuplicate = async (id: string, title: string) => {
    try {
      await duplicateResume(id, `${title} (Copy)`);
      const data = await getResumes();
      setResumes(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />
      <div className="flex-1 w-full max-w-[1200px] mx-auto px-6 py-12">
        <header className="flex items-end justify-between mb-8 pb-6 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0a0a0a]">Workspace</h1>
            <p className="text-sm text-gray-500 mt-1">Manage and optimize your career documents</p>
          </div>
          <Link href="/builder" className="btn-primary gap-2 h-9 px-4">
            <Plus size={16} /> New Resume
          </Link>
        </header>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-none flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        {/* Top section: Library and Quick Upload */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Resume Library */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-[13px] font-bold uppercase tracking-wider text-gray-500">Resume Library</h2>
            
            {isLoadingLibrary ? (
              <div className="card-base flex items-center justify-center h-48">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : resumes.length === 0 ? (
              <div className="card-base flex items-center justify-center h-48 text-center flex-col gap-2">
                <FileText className="h-6 w-6 text-gray-300" />
                <p className="text-sm text-gray-500">No resumes found.</p>
                <Link href="/builder" className="text-sm font-medium text-[#0a0a0a] hover:underline">Create your first resume</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {resumes.map(r => (
                  <div key={r.id} className="card-base flex flex-col gap-4 group">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-none text-gray-500">
                          <FileText size={20} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-[#0a0a0a] truncate max-w-[160px]">{r.title || r.file_name || 'Untitled Resume'}</h3>
                          <p className="text-xs text-gray-500">Mapped as Version {r.version}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                      <span className="text-[11px] text-gray-400">
                        Updated {new Date(r.updated_at).toLocaleDateString()}
                      </span>
                      <div className="flex gap-2">
                        <button onClick={() => handleDelete(r.id)} className="text-xs text-gray-400 hover:text-red-600 transition-colors">Delete</button>
                        <button onClick={() => handleDuplicate(r.id, r.title)} className="text-xs text-gray-400 hover:text-[#0a0a0a] transition-colors">Duplicate</button>
                        <Link href={`/dashboard/${r.id}/ats`} className="text-xs font-medium text-[#0a0a0a] hover:underline ml-2">Optimize</Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Upload Action */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-[13px] font-bold uppercase tracking-wider text-gray-500">Quick Tools</h2>
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => !isUploading && !isParsing && fileInputRef.current?.click()}
              className="card-base text-center flex flex-col items-center justify-center hover:border-gray-400 transition-colors cursor-pointer h-48 border-dashed border-2"
            >
              <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.docx" onChange={handleFileChange} disabled={isUploading || isParsing}/>
              {isUploading || isParsing ? (
                <div className="flex flex-col items-center justify-center gap-4">
                  <Loader2 className="h-6 w-6 text-[#0a0a0a] animate-spin" />
                  <p className="text-sm font-medium text-gray-500">{isUploading ? 'Uploading...' : 'Parsing structure...'}</p>
                </div>
              ) : (
                <>
                  <UploadCloud className="h-8 w-8 text-gray-400 mb-3" />
                  <h3 className="text-sm font-bold text-[#0a0a0a] mb-1">Upload & Parse</h3>
                  <p className="text-xs text-gray-500 px-4">Drop your existing PDF/DOCX to extract into the builder.</p>
                </>
              )}
            </div>

            <div className="card-base bg-[#0a0a0a] text-white border-0 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold mb-1 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-400" /> ATS Scoring
                </h3>
                <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                  Select any resume from your library and score it against a specific job description instantly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
