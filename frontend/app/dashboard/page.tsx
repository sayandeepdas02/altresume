'use client';

import { useAuth } from '@/hooks/useAuth';
import { UploadCloud, Loader2, Zap, FileText, Plus, Search, Building, Briefcase, FileSignature, CheckCircle, ExternalLink } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getResumes, ResumeSummary, deleteResume, duplicateResume } from '@/services/resumeApi';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  // States for Resume Library
  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(true);

  // States for Quick Resume Upload
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States for Jobs and Applications
  const [jobs, setJobs] = useState<any[]>([]);
  const [isJobsLoading, setIsJobsLoading] = useState(true);
  
  const [applications, setApplications] = useState<any[]>([]);
  const [isAppsLoading, setIsAppsLoading] = useState(true);

  // Load Data
  useEffect(() => {
    async function loadData() {
      try {
        const resData = await getResumes();
        setResumes(resData);
      } catch (err) {
        console.error("Failed to load resumes", err);
      } finally {
        setIsLibrary(false);
      }
      
      try {
        const token = localStorage.getItem('access_token');
        const headers = { 'Authorization': `Bearer ${token}` };
        
        // Load Jobs
        const jobsRes = await fetch('/api/career/jobs?status=new', { headers });
        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          setJobs(jobsData.jobs || []);
        }
        
        // Load Apps
        const appsRes = await fetch('/api/career/applications', { headers });
        if (appsRes.ok) {
          const appsData = await appsRes.json();
          setApplications(appsData || []);
        }
      } catch (err) {
        console.error("Failed to load career data", err);
      } finally {
        setIsJobsLoading(false);
        setIsAppsLoading(false);
      }
    }
    loadData();
  }, []);

  const setIsLibrary = (t: boolean) => { setIsLoadingLibrary(t); }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) handleFileUpload(e.target.files[0]);
  };

  const handleFileUpload = async (selectedFile: File) => {
    setError(''); setFile(selectedFile); setIsUploading(true);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const uploadRes = await fetch('/api/resumes/upload', { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();
      if (uploadRes.status === 401) { router.push('/signin'); return; }
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed');
      
      setIsUploading(false); setIsParsing(true);

      const parseRes = await fetch('/api/resumes/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_id: uploadData.resume_id }),
      });
      const parseData = await parseRes.json();
      if (parseRes.status === 401) { router.push('/signin'); return; }
      if (!parseRes.ok) throw new Error(parseData.error || 'Parsing failed');

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
    <div className="min-h-screen bg-[#f4efe9] flex flex-col font-sans">
      <Navbar />
      <div className="pt-16 pb-20">
        <div className="flex-1 w-full max-w-[1200px] mx-auto px-6 py-12">
          <header className="flex items-end justify-between mb-8 pb-6 border-b border-gray-200">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#1c1c1c]">AI Career Co-Pilot</h1>
              <p className="text-sm text-gray-500 mt-1">Manage jobs, optimize resumes, and track your applications end-to-end.</p>
            </div>
            <Link href="/builder" className="btn-primary gap-2 h-9 px-4">
              <Plus size={16} /> New Resume
            </Link>
          </header>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-10">
            {/* Section 1: Job Search */}
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-4 flex items-center gap-2">
                <Search size={18} /> Job Discovery
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card-base flex flex-col gap-3 justify-center items-center h-40 border-dashed border-2 cursor-pointer hover:border-[#4f0f62] transition-colors group">
                  <Briefcase className="h-8 w-8 text-gray-400 group-hover:text-[#4f0f62]" />
                  <h3 className="font-bold text-gray-800">Start Auto Scan</h3>
                  <p className="text-xs text-gray-500">Run AI scan against your target portals.</p>
                </div>
                <div className="card-base flex flex-col gap-3 justify-center items-center h-40 border-dashed border-2 cursor-pointer hover:border-[#4f0f62] transition-colors group">
                  <FileSignature className="h-8 w-8 text-gray-400 group-hover:text-[#4f0f62]" />
                  <h3 className="font-bold text-gray-800">Evaluate Custom JD</h3>
                  <p className="text-xs text-gray-500">Paste a Job Description manually.</p>
                </div>
              </div>
            </section>

            {/* Section 2: Recommended Jobs */}
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-4 flex items-center gap-2">
                <Zap size={18} className="text-yellow-500" /> Recommended Jobs
              </h2>
              <div className="card-base p-0 overflow-hidden">
                {isJobsLoading ? (
                  <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>
                ) : jobs.length === 0 ? (
                  <div className="p-8 text-center text-sm text-gray-500">No jobs recommended yet. Start a scan!</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {jobs.map(job => (
                      <div key={job.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div>
                          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                            {job.role}
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${job.display_recommendation === 'APPLY' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {job.display_recommendation}
                            </span>
                          </h3>
                          <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                            <Building size={12} /> {job.company}
                            {job.match_score && <span className="ml-2 font-medium text-gray-700">Fit: {job.match_score}%</span>}
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button className="text-xs font-semibold text-gray-500 hover:text-gray-900">View Details</button>
                          <button className="text-xs font-bold bg-[#4f0f62] text-white px-3 py-1.5 rounded-md hover:bg-purple-900">Optimize & Apply</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Workspace Split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              
              {/* Section 3: Resume Library */}
              <section>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 flex items-center gap-2">
                    <FileText size={18} /> Base Resumes
                  </h2>
                  <label className="text-xs font-medium text-[#4f0f62] cursor-pointer hover:underline">
                    Quick Upload
                    <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.docx" onChange={handleFileChange} disabled={isUploading || isParsing}/>
                  </label>
                </div>
                
                {isLoadingLibrary ? (
                  <div className="card-base flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : resumes.length === 0 ? (
                  <div className="card-base p-8 text-center flex flex-col items-center">
                    <FileText className="h-8 w-8 text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">No resumes found.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {resumes.map(r => (
                      <div key={r.id} className="card-base p-4 flex flex-col gap-3 group">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-md text-gray-500">
                            <FileText size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-[#1c1c1c] truncate">{r.title || r.file_name || 'Untitled Resume'}</h3>
                            <p className="text-xs text-gray-500">Version {r.version}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleDuplicate(r.id, r.title)} className="text-xs text-gray-400 hover:text-gray-900">Duplicate</button>
                            <Link href={`/builder?id=${r.id}`} className="text-xs text-[#4f0f62] hover:underline font-medium">Edit</Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Section 4: Application Tracker */}
              <section>
                 <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-4 flex items-center gap-2">
                  <CheckCircle size={18} className="text-green-600" /> Application Tracker
                </h2>
                <div className="card-base p-0 overflow-hidden">
                  {isAppsLoading ? (
                    <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>
                  ) : applications.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-500">No applications tracked yet.</div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {applications.map(app => (
                        <div key={app.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                          <div>
                            <h3 className="font-bold text-gray-900 text-sm">
                              {app.job_details?.role || 'Unknown Role'} 
                              <span className="text-gray-500 font-normal"> at {app.job_details?.company || 'Unknown'}</span>
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">Applied: {new Date(app.applied_at).toLocaleDateString()}</p>
                          </div>
                          <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 bg-gray-100 text-gray-600 rounded">
                            {app.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
