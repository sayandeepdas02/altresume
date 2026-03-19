'use client';

import { useAuth } from '@/hooks/useAuth';
import { UploadCloud, CheckCircle2, Loader2, Zap, Briefcase, FileText, SplitSquareHorizontal, CheckCircle, DownloadCloud, ArrowRight, AlertCircle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { BillingModal } from '@/components/ui/BillingModal';

export default function DashboardPage() {
    const { user } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [error, setError] = useState('');
    
    // Core payload from Backend DB
    const [resumeId, setResumeId] = useState<string>('');
    const [parsedData, setParsedData] = useState<any>(null);
    
    // Optimization payload
    const [jobDescription, setJobDescription] = useState<string>('');
    const [optimizedData, setOptimizedData] = useState<any>(null);
    const [optimizationId, setOptimizationId] = useState<string>('');

    // Export payload
    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('modern');
    const [exportFilename, setExportFilename] = useState<string>('');
    const [isExporting, setIsExporting] = useState(false);
    
    // Billing Modal
    const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch templates on load
    useEffect(() => {
        fetch('/api/export/templates')
            .then(res => res.json())
            .then(data => {
                if(Array.isArray(data)) setTemplates(data);
            }).catch(e => console.error("Failed to load templates", e));
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) handleFileUpload(e.target.files[0]);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFileUpload(e.dataTransfer.files[0]);
    };

    const handleFileUpload = async (selectedFile: File) => {
        setError(''); setFile(selectedFile); setIsUploading(true); setParsedData(null); setOptimizedData(null); setOptimizationId('');

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const uploadRes = await fetch('/api/resumes/upload', { method: 'POST', body: formData });
            const uploadData = await uploadRes.json();
            if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed');
            
            setResumeId(uploadData.resume_id);
            setIsUploading(false); setIsParsing(true);

            const parseRes = await fetch('/api/resumes/parse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resume_id: uploadData.resume_id }),
            });
            const parseData = await parseRes.json();
            if (!parseRes.ok) throw new Error(parseData.error || 'Parsing failed');

            setParsedData(parseData.parsed_data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsUploading(false); setIsParsing(false);
        }
    };

    const handleOptimize = async () => {
        if (!jobDescription.trim()) return setError("Please paste a Job Description first.");
        setError(''); setIsOptimizing(true);
        try {
            const res = await fetch('/api/optimize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resume_id: resumeId, job_description: jobDescription })
            });
            const data = await res.json();
            
            if (res.status === 402) {
                setIsBillingModalOpen(true);
                throw new Error(data.error || 'Upgrade required to continue optimizing.');
            }
            if (!res.ok) throw new Error(data.error || 'Failed to dispatch AI queue.');
            
            const taskId = data.task_id;
            
            const poll = setInterval(async () => {
                try {
                    const statusRes = await fetch(`/api/optimize/status?task_id=${taskId}`);
                    const statusData = await statusRes.json();
                    
                    if (statusData.status === 'completed') {
                        clearInterval(poll);
                        setOptimizedData(statusData);
                        setOptimizationId(statusData.optimization_id);
                        setIsOptimizing(false);
                    } else if (statusData.status === 'failed') {
                        clearInterval(poll);
                        setError(statusData.error || 'Optimization pipeline failed.');
                        setIsOptimizing(false);
                    }
                } catch (e: any) {
                    clearInterval(poll);
                    setError('Error pinging server status.');
                    setIsOptimizing(false);
                }
            }, 2500);

        } catch (err: any) {
            setError(err.message);
            setIsOptimizing(false);
        }
    };

    const handleExport = async () => {
        if (!optimizationId) return setError("Optimization ID missing. Please refresh and try again.");
        setError(''); setIsExporting(true);
        try {
            const res = await fetch('/api/export/pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ optimization_id: optimizationId, template: selectedTemplate, filename: exportFilename })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to generate PDF');
            
            window.open(data.pdf_url, '_blank');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="flex-1 bg-gray-50 min-h-[calc(100vh-4rem)] p-4 sm:p-8 flex justify-center text-gray-900 font-sans pb-32">
            <div className={`w-full ${parsedData ? 'max-w-[1280px]' : 'max-w-[1000px]'} space-y-8 mt-4 transition-all duration-500`}>
                
                {/* Minimal Header */}
                <header className="flex flex-col sm:flex-row sm:items-end justify-between pb-6 border-b border-gray-200">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{parsedData ? 'AI Workspace' : 'Dashboard'}</h1>
                        <p className="text-gray-500 mt-2 text-sm">Welcome back, <span className="text-gray-900 font-medium">{user?.name}</span></p>
                    </div>
                    {parsedData && (
                        <button onClick={() => { setParsedData(null); setOptimizedData(null); setOptimizationId(''); }} className="mt-4 sm:mt-0 text-sm font-medium text-gray-500 hover:text-black transition-colors flex items-center gap-1 bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-sm hover:bg-gray-50">
                            Start New Session
                        </button>
                    )}
                </header>

                {error && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                        <span className="text-red-700 text-sm font-medium">{error}</span>
                    </div>
                )}

                {/* Uplading Empty State (Like Stripe Dashboard Dropzone) */}
                {!parsedData && (
                    <main className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                        <div className="lg:col-span-3">
                            <div 
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className="rounded-2xl border-2 border-dashed border-gray-300 bg-white p-12 text-center flex flex-col items-center justify-center hover:bg-gray-50 hover:border-gray-400 transition-all cursor-pointer min-h-[440px] shadow-sm"
                            >
                                <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.docx" onChange={handleFileChange} disabled={isUploading || isParsing}/>
                                {isUploading || isParsing ? (
                                    <div className="flex flex-col items-center justify-center gap-6">
                                        <Loader2 className="h-10 w-10 text-black animate-spin" />
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">{isUploading ? 'Uploading file...' : 'Extracting structure...'}</h3>
                                            <p className="text-sm text-gray-500 mt-1">This takes about 5 seconds.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="h-16 w-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-6 shadow-sm group-hover:scale-105 transition-transform">
                                            <UploadCloud className="h-8 w-8 text-black" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-2">Upload Resume</h3>
                                        <p className="text-sm text-gray-500 max-w-sm mb-6 leading-relaxed">Drag and drop your PDF or DOCX file here, or click to browse your computer.</p>
                                        <div className="px-5 py-2.5 bg-black text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity pointer-events-none">
                                            Select File
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Right Context Module */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm h-full flex flex-col justify-center">
                                <div className="h-10 w-10 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center mb-6">
                                    <Zap className="h-5 w-5 text-gray-900" />
                                </div>
                                <h2 className="text-xl font-bold tracking-tight text-gray-900 mb-4">How it works</h2>
                                <p className="text-gray-600 leading-relaxed text-sm mb-6">
                                    Simply drop your resume. Our parsing engine extracts your professional history and maps it instantly into our unified data structure.
                                </p>
                                <ul className="space-y-4">
                                    <li className="flex items-center gap-3 text-sm text-gray-700">
                                        <CheckCircle2 className="h-4 w-4 text-black shrink-0" />
                                        Secure data extraction
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-gray-700">
                                        <CheckCircle2 className="h-4 w-4 text-black shrink-0" />
                                        Automatic formatting cleanup
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-gray-700">
                                        <CheckCircle2 className="h-4 w-4 text-black shrink-0" />
                                        Prepares for ATS matching
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </main>
                )}

                {/* Optimizer Engine */}
                {parsedData && (
                    <main className="flex flex-col gap-8 animate-in fade-in zoom-in-95 duration-300">
                        
                        {/* Target Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm relative overflow-hidden flex flex-col">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold tracking-tight text-gray-900">Target Job Description</h2>
                                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Step 2 of 3</span>
                                </div>
                                <p className="text-sm text-gray-500 mb-6">Paste the raw text of the job description. The AI will benchmark your extracted resume against these exact requirements.</p>
                                
                                <textarea 
                                    value={jobDescription}
                                    onChange={(e) => setJobDescription(e.target.value)}
                                    placeholder="e.g. 'We are looking for a Senior Frontend Engineer with 5+ years of React experience...'"
                                    className="w-full flex-1 min-h-[160px] bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-y mb-6 shadow-inner"
                                />
                                
                                <div className="flex justify-end">
                                    <button
                                        onClick={handleOptimize}
                                        disabled={isOptimizing}
                                        className={`px-6 py-3 rounded-xl font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center gap-2 ${isOptimizing ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' : 'bg-black text-white hover:opacity-90 hover:scale-[1.02]'}`}
                                    >
                                        {isOptimizing ? (
                                            <><Loader2 className="h-4 w-4 animate-spin"/> Processing Analysis...</>
                                        ) : (
                                            <>Optimize against JD <ArrowRight className="h-4 w-4"/></>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Minimal Analytics Block */}
                            {optimizedData && (
                                <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm flex flex-col items-center justify-center text-center">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-6">Alignment Score</span>
                                    
                                    <div className="relative mb-6">
                                        <div className="w-32 h-32 rounded-full border-8 border-gray-50 flex items-center justify-center">
                                            <div className="text-4xl font-extrabold tracking-tight text-gray-900">
                                                {optimizedData.match_score}%
                                            </div>
                                        </div>
                                        {/* Fake SVG Stroke representation */}
                                        <svg className="absolute inset-0 w-32 h-32 transform -rotate-90">
                                            <circle cx="64" cy="64" r="56" className="text-black transition-all duration-1000 ease-out" strokeWidth="8" fill="none" strokeDasharray="351.8" strokeDashoffset={351.8 - (351.8 * optimizedData.match_score) / 100} stroke="currentColor" strokeLinecap="round"/>
                                        </svg>
                                    </div>
                                    
                                    <div className="w-full text-left bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <div className="text-xs font-bold text-gray-900 mb-3 uppercase tracking-wider">Missing Keywords Detected</div>
                                        <div className="flex flex-wrap gap-2">
                                            {optimizedData.missing_keywords?.slice(0, 10).map((kw: string) => (
                                                <span key={kw} className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 shadow-sm">{kw}</span>
                                            ))}
                                            {optimizedData.missing_keywords?.length === 0 && <span className="text-green-700 font-medium text-xs flex items-center gap-1"><CheckCircle className="h-3 w-3"/> Perfect keyword match!</span>}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Split Comparison UI (Vercel Style diffs) */}
                        {optimizedData && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                
                                {/* L: Original Data */}
                                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm flex flex-col h-[700px] overflow-hidden">
                                    <div className="p-6 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between pointer-events-none">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                                                <FileText className="h-4 w-4 text-gray-500" />
                                            </div>
                                            <h2 className="text-base font-semibold text-gray-900">Original Resume</h2>
                                        </div>
                                        <span className="text-xs font-medium bg-gray-200 text-gray-600 px-2 py-1 rounded border border-gray-300">Read-Only</span>
                                    </div>
                                    
                                    <div className="p-8 overflow-y-auto space-y-8 flex-1 text-sm text-gray-700 custom-scrollbar bg-white">
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-3 tracking-snug">Skills Recognized</h4>
                                            <p className="leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">{parsedData.skills?.join(', ') || 'None found.'}</p>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-3 tracking-snug">Professional Experience</h4>
                                            {parsedData.experience?.map((exp: any, i: number) => (
                                                <div key={i} className="mb-6 pb-6 border-b border-gray-100 last:border-0 last:pb-0 last:mb-0">
                                                    <p className="font-semibold text-gray-900">{exp.role}</p>
                                                    <p className="text-gray-500 text-sm mb-3 font-medium">{exp.company} • {exp.duration}</p>
                                                    <p className="whitespace-pre-wrap leading-relaxed text-gray-600">{exp.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* R: Optimized Output */}
                                <div className="rounded-2xl border border-gray-200 bg-white shadow-lg flex flex-col h-[700px] overflow-hidden relative ring-1 ring-black/5">
                                    <div className="p-6 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between pointer-events-none">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-black text-white flex items-center justify-center shadow-sm">
                                                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 22h20L12 2z"/></svg>
                                            </div>
                                            <h2 className="text-base font-semibold text-gray-900">AI Tailored Result</h2>
                                        </div>
                                        <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded border border-green-200">Generated</span>
                                    </div>

                                    <div className="p-8 overflow-y-auto space-y-8 flex-1 custom-scrollbar">
                                        {optimizedData.changes && optimizedData.changes.length > 0 && (
                                            <div className="bg-white border text-sm border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 text-xs font-bold text-gray-700 uppercase tracking-widest flex items-center justify-between">
                                                    Targeted Rewrites
                                                    <span className="bg-white border border-gray-200 text-gray-500 rounded px-2 py-0.5">{optimizedData.changes.length} Edits</span>
                                                </div>
                                                <div className="p-4 space-y-6">
                                                    {optimizedData.changes.map((change: any, i: number) => (
                                                        <div key={i} className="space-y-2 last:mb-0">
                                                            <div className="p-3 bg-red-50 text-red-800 border-l-2 border-red-500 rounded-r-lg font-mono text-xs">
                                                                <span className="line-through opacity-70">{change.before}</span>
                                                            </div>
                                                            <div className="p-3 bg-green-50 text-green-900 border-l-2 border-green-500 rounded-r-lg font-mono text-xs shadow-sm">
                                                                {change.after}
                                                            </div>
                                                            <div className="text-gray-500 text-xs italic flex items-center gap-1.5 font-medium mt-2"><Zap className="h-3 w-3 text-yellow-500"/> {change.reason}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-3 tracking-snug">Final Document Model</h4>
                                            <div className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed bg-white border border-gray-200 p-6 rounded-xl shadow-inner font-serif">
                                                {optimizedData.optimized_resume}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Export Section */}
                        {optimizedData && optimizationId && (
                            <div className="rounded-2xl border border-gray-200 bg-white p-10 shadow-sm mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col md:flex-row items-center justify-between gap-12">
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-2 flex items-center gap-2">Ready for Export</h2>
                                    <p className="text-gray-500 text-base leading-relaxed max-w-xl mb-6">Your data is structured and optimized. Select a canonical template to inject the payload into a strictly formatted, ATS-compliant PDF.</p>
                                    
                                    <div className="flex flex-wrap gap-4 mb-8">
                                        {templates.map(tmp => (
                                            <div 
                                                key={tmp.id} 
                                                onClick={() => setSelectedTemplate(tmp.id)}
                                                className={`px-5 py-4 rounded-xl border transition-all cursor-pointer flex items-center gap-4 ${selectedTemplate === tmp.id ? 'border-black bg-gray-50 ring-1 ring-black shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'}`}
                                            >
                                                <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${selectedTemplate === tmp.id ? 'border-black' : 'border-gray-300'}`}>
                                                    {selectedTemplate === tmp.id && <div className="h-2 w-2 bg-black rounded-full" />}
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-semibold text-gray-900">{tmp.name}</h3>
                                                    <p className="text-xs text-gray-500">{tmp.description?.slice(0, 40)}...</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <div className="mt-2 border-t pt-6 border-gray-100">
                                        <label className="block text-sm font-semibold tracking-snug text-gray-900 mb-2">Custom Filename <span className="text-gray-400 font-normal ml-1">(Optional)</span></label>
                                        <div className="flex items-center shadow-sm">
                                            <input 
                                                type="text" 
                                                value={exportFilename} 
                                                onChange={e => setExportFilename(e.target.value)} 
                                                placeholder="e.g. John_Doe_Resume_2026" 
                                                className="flex-1 appearance-none bg-white border border-gray-200 rounded-l-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black text-gray-900 placeholder-gray-400"
                                            />
                                            <div className="bg-gray-50 border border-l-0 border-gray-200 rounded-r-xl px-4 py-3 font-mono text-sm text-gray-500">
                                                .pdf
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="w-full md:w-auto flex shrink-0 border-t border-gray-100 md:border-t-0 md:border-l pt-8 md:pt-0 md:pl-12">
                                    <button
                                        onClick={handleExport}
                                        disabled={isExporting}
                                        className={`w-full md:w-auto px-10 py-4 rounded-xl font-bold text-base shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center gap-2 ${isExporting ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed' : 'bg-black text-white hover:opacity-90 hover:scale-[1.02]'}`}
                                    >
                                        {isExporting ? <><Loader2 className="h-5 w-5 animate-spin"/> Generating PDF...</> : <><DownloadCloud className="h-5 w-5"/> Download PDF</>}
                                    </button>
                                </div>
                            </div>
                        )}
                    </main>
                )}
            </div>
        </div>
    );
}
