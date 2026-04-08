'use client';

import { useState, useRef, useCallback } from 'react';
import { X, Download, Printer, Eye, Pencil } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Experience {
    company: string;
    role: string;
    duration: string;
    description: string;
    bullets?: string[];
}

interface Education {
    institution: string;
    degree: string;
    year?: string;
    duration?: string;
}

interface Project {
    name: string;
    description: string;
    link?: string;
}

interface ResumeData {
    name: string;
    email?: string;
    phone?: string;
    summary?: string;
    skills: string[];
    experience: Experience[];
    education: Education[];
    projects: Project[];
}

interface ResumePreviewProps {
    finalResume: ResumeData;
    onClose: () => void;
}

type TemplateName = 'modern' | 'minimal' | 'professional';

const TEMPLATES: { id: TemplateName; name: string; desc: string }[] = [
    { id: 'modern', name: 'Modern Blue', desc: 'Clean with soft blue accents' },
    { id: 'minimal', name: 'Brutalist Minimal', desc: 'High-density black & white' },
    { id: 'professional', name: 'Classic Serif', desc: 'Elegant for executive roles' },
];

// ─── Editable text helper ───────────────────────────────────────────────────

function Editable({ value, className, tag, multiline }: {
    value: string;
    className?: string;
    tag?: 'h1' | 'h2' | 'p' | 'span' | 'div' | 'li';
    multiline?: boolean;
}) {
    const Tag = tag || 'span';
    return (
        <Tag
            contentEditable
            suppressContentEditableWarning
            className={`outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1 rounded-sm transition-shadow cursor-text ${className || ''}`}
            dangerouslySetInnerHTML={{ __html: value }}
        />
    );
}

// ─── Template: Modern Blue ──────────────────────────────────────────────────

function ModernTemplate({ data }: { data: ResumeData }) {
    return (
        <div className="font-['Inter',sans-serif] text-[11pt] text-gray-800 leading-relaxed">
            {/* Header */}
            <div className="text-center border-b-2 border-blue-500 pb-4 mb-5">
                <Editable tag="h1" value={data.name} className="text-[24pt] font-bold text-gray-900 tracking-wider uppercase m-0" />
                <div className="text-gray-500 text-[10pt] mt-1 space-x-2">
                    {data.email && <Editable tag="span" value={data.email} />}
                    {data.phone && <><span>•</span> <Editable tag="span" value={data.phone} /></>}
                </div>
            </div>

            {/* Summary */}
            {data.summary && (
                <div className="mb-5">
                    <h2 className="text-[14pt] text-blue-500 border-b border-gray-200 pb-1 mb-3 uppercase tracking-wider font-semibold">Summary</h2>
                    <Editable tag="p" value={data.summary} className="text-gray-700 leading-relaxed" />
                </div>
            )}

            {/* Skills */}
            {data.skills.length > 0 && (
                <div className="mb-5">
                    <h2 className="text-[14pt] text-blue-500 border-b border-gray-200 pb-1 mb-3 uppercase tracking-wider font-semibold">Skills</h2>
                    <div className="flex flex-wrap gap-2">
                        {data.skills.map((skill, i) => (
                            <Editable key={i} tag="span" value={skill} className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded text-[10pt] font-medium" />
                        ))}
                    </div>
                </div>
            )}

            {/* Experience */}
            {data.experience.length > 0 && (
                <div className="mb-5">
                    <h2 className="text-[14pt] text-blue-500 border-b border-gray-200 pb-1 mb-3 uppercase tracking-wider font-semibold">Experience</h2>
                    {data.experience.map((exp, i) => (
                        <div key={i} className="mb-4 break-inside-avoid">
                            <div className="flex justify-between items-baseline mb-1">
                                <div>
                                    <Editable tag="span" value={exp.role} className="font-semibold text-[12pt] text-gray-900" />
                                    <span className="italic text-gray-500"> at </span>
                                    <Editable tag="span" value={exp.company} className="italic text-gray-500" />
                                </div>
                                <Editable tag="span" value={exp.duration || ''} className="text-[10pt] text-gray-400 font-medium shrink-0 ml-4" />
                            </div>
                            {exp.bullets && exp.bullets.length > 0 ? (
                                <ul className="list-disc pl-5 mt-1 space-y-1">
                                    {exp.bullets.map((b, j) => (
                                        <Editable key={j} tag="li" value={b} className="text-justify" />
                                    ))}
                                </ul>
                            ) : exp.description ? (
                                <Editable tag="p" value={exp.description} className="mt-1 text-gray-600" />
                            ) : null}
                        </div>
                    ))}
                </div>
            )}

            {/* Projects */}
            {data.projects.length > 0 && (
                <div className="mb-5">
                    <h2 className="text-[14pt] text-blue-500 border-b border-gray-200 pb-1 mb-3 uppercase tracking-wider font-semibold">Projects</h2>
                    {data.projects.map((proj, i) => (
                        <div key={i} className="mb-3 break-inside-avoid">
                            <Editable tag="span" value={proj.name} className="font-semibold text-[12pt] text-gray-900" />
                            <Editable tag="p" value={proj.description} className="mt-1 text-gray-600" />
                        </div>
                    ))}
                </div>
            )}

            {/* Education */}
            {data.education.length > 0 && (
                <div className="mb-5">
                    <h2 className="text-[14pt] text-blue-500 border-b border-gray-200 pb-1 mb-3 uppercase tracking-wider font-semibold">Education</h2>
                    {data.education.map((edu, i) => (
                        <div key={i} className="mb-2 break-inside-avoid flex justify-between items-baseline">
                            <div>
                                <Editable tag="span" value={edu.degree} className="font-semibold text-gray-900" />
                                <span className="text-gray-500">, </span>
                                <Editable tag="span" value={edu.institution} className="italic text-gray-500" />
                            </div>
                            <Editable tag="span" value={edu.year || edu.duration || ''} className="text-[10pt] text-gray-400 shrink-0 ml-4" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Template: Brutalist Minimal ────────────────────────────────────────────

function MinimalTemplate({ data }: { data: ResumeData }) {
    return (
        <div className="font-['Helvetica_Neue',Helvetica,Arial,sans-serif] text-[10pt] text-black leading-snug">
            {/* Header */}
            <div className="border-b border-black pb-2 mb-5">
                <Editable tag="h1" value={data.name} className="text-[26pt] font-normal tracking-tight m-0" />
                <div className="text-[9pt] mt-2 space-x-3">
                    {data.email && <Editable tag="span" value={data.email} />}
                    {data.phone && <><span>|</span> <Editable tag="span" value={data.phone} /></>}
                </div>
            </div>

            {/* Skills */}
            {data.skills.length > 0 && (
                <div className="mb-4">
                    <h2 className="text-[12pt] uppercase font-bold border-b border-gray-300 pb-0.5 mb-2 tracking-widest">Skills</h2>
                    <Editable tag="p" value={data.skills.join(', ')} className="text-black" />
                </div>
            )}

            {/* Experience */}
            {data.experience.length > 0 && (
                <div className="mb-4">
                    <h2 className="text-[12pt] uppercase font-bold border-b border-gray-300 pb-0.5 mb-2 tracking-widest">Experience</h2>
                    {data.experience.map((exp, i) => (
                        <div key={i} className="mb-3 break-inside-avoid">
                            <div className="flex justify-between mb-1">
                                <div>
                                    <Editable tag="span" value={exp.role} className="font-bold text-[11pt]" />
                                    <Editable tag="span" value={exp.company} className="italic ml-1.5" />
                                </div>
                                <Editable tag="span" value={exp.duration || ''} className="text-[10pt] text-gray-600 shrink-0" />
                            </div>
                            {exp.bullets && exp.bullets.length > 0 ? (
                                <ul className="list-disc pl-4 space-y-0.5">
                                    {exp.bullets.map((b, j) => (
                                        <Editable key={j} tag="li" value={b} />
                                    ))}
                                </ul>
                            ) : exp.description ? (
                                <Editable tag="p" value={exp.description} className="text-gray-800" />
                            ) : null}
                        </div>
                    ))}
                </div>
            )}

            {/* Projects */}
            {data.projects.length > 0 && (
                <div className="mb-4">
                    <h2 className="text-[12pt] uppercase font-bold border-b border-gray-300 pb-0.5 mb-2 tracking-widest">Projects</h2>
                    {data.projects.map((proj, i) => (
                        <div key={i} className="mb-2 break-inside-avoid">
                            <Editable tag="span" value={proj.name} className="font-bold" />
                            <Editable tag="p" value={proj.description} className="mt-0.5" />
                        </div>
                    ))}
                </div>
            )}

            {/* Education */}
            {data.education.length > 0 && (
                <div className="mb-4">
                    <h2 className="text-[12pt] uppercase font-bold border-b border-gray-300 pb-0.5 mb-2 tracking-widest">Education</h2>
                    {data.education.map((edu, i) => (
                        <div key={i} className="mb-1 flex justify-between break-inside-avoid">
                            <div>
                                <Editable tag="span" value={edu.degree} className="font-bold" />
                                <Editable tag="span" value={edu.institution} className="italic ml-1.5" />
                            </div>
                            <Editable tag="span" value={edu.year || edu.duration || ''} className="text-gray-600 shrink-0" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Template: Classic Professional ─────────────────────────────────────────

function ProfessionalTemplate({ data }: { data: ResumeData }) {
    return (
        <div className="font-['Open_Sans',sans-serif] text-[10.5pt] text-gray-800 leading-relaxed">
            {/* Header */}
            <div className="text-center mb-6">
                <Editable tag="h1" value={data.name} className="font-['Merriweather',serif] text-[28pt] font-bold text-black m-0" />
                <div className="text-gray-500 text-[10pt] mt-1 space-x-3">
                    {data.email && <Editable tag="span" value={data.email} />}
                    {data.phone && <><span>|</span> <Editable tag="span" value={data.phone} /></>}
                </div>
            </div>

            {/* Summary */}
            {data.summary && (
                <div className="mb-5">
                    <h2 className="font-['Merriweather',serif] text-[13pt] text-black border-b-2 border-black pb-1 mb-3 uppercase tracking-wider">Professional Summary</h2>
                    <Editable tag="p" value={data.summary} className="text-gray-700 leading-relaxed" />
                </div>
            )}

            {/* Skills */}
            {data.skills.length > 0 && (
                <div className="mb-5">
                    <h2 className="font-['Merriweather',serif] text-[13pt] text-black border-b-2 border-black pb-1 mb-3 uppercase tracking-wider">Technical Skills</h2>
                    <p><strong>Core Competencies:</strong> <Editable tag="span" value={data.skills.join(', ')} /></p>
                </div>
            )}

            {/* Experience */}
            {data.experience.length > 0 && (
                <div className="mb-5">
                    <h2 className="font-['Merriweather',serif] text-[13pt] text-black border-b-2 border-black pb-1 mb-3 uppercase tracking-wider">Professional Experience</h2>
                    {data.experience.map((exp, i) => (
                        <div key={i} className="mb-4 break-inside-avoid">
                            <div className="flex justify-between items-end mb-1">
                                <div>
                                    <Editable tag="span" value={exp.role} className="font-semibold text-[11.5pt] text-black" />
                                    <span className="text-gray-500 italic">, </span>
                                    <Editable tag="span" value={exp.company} className="italic text-gray-500" />
                                </div>
                                <Editable tag="span" value={exp.duration || ''} className="text-[10pt] text-gray-500 italic shrink-0 ml-4" />
                            </div>
                            {exp.bullets && exp.bullets.length > 0 ? (
                                <ul className="list-disc pl-5 mt-1 space-y-1">
                                    {exp.bullets.map((b, j) => (
                                        <Editable key={j} tag="li" value={b} className="text-justify" />
                                    ))}
                                </ul>
                            ) : exp.description ? (
                                <Editable tag="p" value={exp.description} className="mt-1 text-gray-600" />
                            ) : null}
                        </div>
                    ))}
                </div>
            )}

            {/* Projects */}
            {data.projects.length > 0 && (
                <div className="mb-5">
                    <h2 className="font-['Merriweather',serif] text-[13pt] text-black border-b-2 border-black pb-1 mb-3 uppercase tracking-wider">Selected Projects</h2>
                    {data.projects.map((proj, i) => (
                        <div key={i} className="mb-3 break-inside-avoid">
                            <Editable tag="span" value={proj.name} className="font-semibold text-black" />
                            <Editable tag="p" value={proj.description} className="mt-1 text-gray-600" />
                        </div>
                    ))}
                </div>
            )}

            {/* Education */}
            {data.education.length > 0 && (
                <div className="mb-5">
                    <h2 className="font-['Merriweather',serif] text-[13pt] text-black border-b-2 border-black pb-1 mb-3 uppercase tracking-wider">Education</h2>
                    {data.education.map((edu, i) => (
                        <div key={i} className="mb-2 break-inside-avoid flex justify-between items-baseline">
                            <div>
                                <Editable tag="span" value={edu.degree} className="font-semibold text-black" />
                                <span className="text-gray-500"> — </span>
                                <Editable tag="span" value={edu.institution} className="italic text-gray-500" />
                            </div>
                            <Editable tag="span" value={edu.year || edu.duration || ''} className="text-[10pt] text-gray-500 italic shrink-0 ml-4" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Main Preview Component ─────────────────────────────────────────────────

export default function ResumePreview({ finalResume, onClose }: ResumePreviewProps) {
    const [template, setTemplate] = useState<'modern' | 'minimal' | 'professional'>('modern');
    const [isEditing, setIsEditing] = useState(false); // Kept as isEditing based on usage in JSX
    const printRef = useRef<HTMLDivElement>(null);

    // The final resume data is determined entirely by the backend's deep merge.
    let resumeData: ResumeData;
    let normalizedSkills: string[] = [];
    if (Array.isArray(finalResume?.skills)) {
        normalizedSkills = finalResume.skills;
    } else if (finalResume?.skills && typeof finalResume.skills === 'object') {
        const h = (finalResume.skills as any).hard_skills || [];
        const s = (finalResume.skills as any).soft_skills || [];
        normalizedSkills = [...h, ...s];
    }

    resumeData = {
        ...finalResume,
        skills: normalizedSkills,
        experience: finalResume?.experience || [],
        education: finalResume?.education || [],
        projects: finalResume?.projects || []
    };

    const handlePrint = useCallback(() => {
        // Create a new window for printing to avoid dashboard chrome
        const printWindow = window.open('', '_blank', 'width=794,height=1123');
        if (!printWindow || !printRef.current) return;

        const content = printRef.current.innerHTML;

        printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Resume</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Merriweather:ital,wght@0,300;0,400;0,700;1,400&family=Open+Sans:wght@400;600&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"><\/script>
    <style>
        @page { size: A4; margin: 20mm 15mm; }
        @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            * { box-shadow: none !important; }
        }
        body { margin: 0; padding: 20mm 15mm; }
        [contenteditable] { outline: none; }
    </style>
</head>
<body>
    ${content}
    <script>
        setTimeout(() => { window.print(); window.close(); }, 500);
    <\/script>
</body>
</html>`);
        printWindow.document.close();
    }, []);

    const TemplateComponent = {
        modern: ModernTemplate,
        minimal: MinimalTemplate,
        professional: ProfessionalTemplate,
    }[template];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto py-8 px-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="w-full max-w-[900px] animate-in fade-in zoom-in-95 duration-300">

                {/* Toolbar */}
                <div className="bg-white rounded-none border border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        <Eye className="h-5 w-5 text-gray-400" />
                        <h2 className="text-lg font-bold text-gray-900">Resume Preview</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-none text-sm font-medium transition-all ${
                                isEditing
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                            }`}
                        >
                            <Pencil className="h-3.5 w-3.5" />
                            {isEditing ? 'Editing Active' : 'Edit Mode'}
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-black text-white rounded-none text-sm font-bold hover:opacity-90 transition-opacity shadow-sm"
                        >
                            <Download className="h-3.5 w-3.5" />
                            Download PDF
                        </button>
                        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-none transition-colors">
                            <X className="h-5 w-5 text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Template Switcher */}
                <div className="bg-gray-50 border-x border-gray-200 px-6 py-3 flex gap-3">
                    {TEMPLATES.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTemplate(t.id)}
                            className={`flex-1 px-4 py-3 rounded-none text-left transition-all ${
                                template === t.id
                                    ? 'bg-white border-2 border-black shadow-sm'
                                    : 'bg-white border border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <div className="text-sm font-bold text-gray-900">{t.name}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{t.desc}</div>
                        </button>
                    ))}
                </div>

                {/* Edit hint */}
                {isEditing && (
                    <div className="bg-blue-50 border-x border-gray-200 px-6 py-2 text-xs text-blue-700 font-medium flex items-center gap-2">
                        <Pencil className="h-3 w-3" />
                        Click any text to edit it directly. Changes will reflect in the downloaded PDF.
                    </div>
                )}

                {/* A4 Resume Page */}
                <div className="bg-gray-100 border-x border-b border-gray-200 rounded-none p-8 flex justify-center">
                    <div
                        ref={printRef}
                        className={`bg-white shadow-xl w-[210mm] min-h-[297mm] p-[20mm_15mm] rounded-sm ${
                            !isEditing ? '[&_[contenteditable]]:cursor-default [&_[contenteditable]]:pointer-events-none' : ''
                        }`}
                        style={{ maxWidth: '794px' }}
                    >
                        <TemplateComponent data={resumeData} />
                    </div>
                </div>
            </div>
        </div>
    );
}
