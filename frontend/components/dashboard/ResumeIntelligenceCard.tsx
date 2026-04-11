'use client';

import { useEffect, useState } from 'react';
import { Brain, Code, Briefcase, GraduationCap, FolderOpen, Award, Loader2 } from 'lucide-react';
import { getResume, type ResumeDetail } from '@/services/resumeApi';

interface ResumeIntelligenceCardProps {
  resumeId: string | null;
}

export default function ResumeIntelligenceCard({ resumeId }: ResumeIntelligenceCardProps) {
  const [data, setData] = useState<ResumeDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!resumeId) return;
    setLoading(true);
    getResume(resumeId)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [resumeId]);

  if (!resumeId) {
    return (
      <div className="card-base p-6 text-center">
        <Brain className="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">Upload a resume to see intelligence</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card-base p-8 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  const sd = data?.structured_data;
  if (!sd) {
    return (
      <div className="card-base p-6 text-center">
        <Brain className="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No parsed data available</p>
      </div>
    );
  }

  const hardSkills = sd.skills?.hard_skills || [];
  const softSkills = sd.skills?.soft_skills || [];
  const experienceCount = sd.experience?.length || 0;
  const projectCount = sd.projects?.length || 0;
  const certCount = sd.certifications?.length || 0;

  return (
    <div className="card-base p-0 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
          <Brain size={14} className="text-[#4f0f62]" /> Resume Intelligence
        </h3>
        <p className="text-[11px] text-gray-400 mt-0.5">{sd.name}</p>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <p className="text-lg font-bold text-[#1c1c1c]">{hardSkills.length + softSkills.length}</p>
            <p className="text-[10px] text-gray-500 uppercase font-medium">Skills</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <p className="text-lg font-bold text-[#1c1c1c]">{experienceCount}</p>
            <p className="text-[10px] text-gray-500 uppercase font-medium">Roles</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <p className="text-lg font-bold text-[#1c1c1c]">{projectCount}</p>
            <p className="text-[10px] text-gray-500 uppercase font-medium">Projects</p>
          </div>
        </div>

        {/* Hard Skills */}
        {hardSkills.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Code size={10} /> Technical Skills
            </p>
            <div className="flex flex-wrap gap-1">
              {hardSkills.slice(0, 12).map((skill: string) => (
                <span key={skill} className="text-[10px] bg-[#4f0f62]/5 text-[#4f0f62] border border-[#4f0f62]/15 px-2 py-0.5 rounded-full font-medium">
                  {skill}
                </span>
              ))}
              {hardSkills.length > 12 && (
                <span className="text-[10px] text-gray-400 px-1">+{hardSkills.length - 12} more</span>
              )}
            </div>
          </div>
        )}

        {/* Soft Skills */}
        {softSkills.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Briefcase size={10} /> Soft Skills
            </p>
            <div className="flex flex-wrap gap-1">
              {softSkills.slice(0, 8).map((skill: string) => (
                <span key={skill} className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Experience Summary */}
        {sd.experience && sd.experience.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Briefcase size={10} /> Experience
            </p>
            <div className="flex flex-col gap-1">
              {sd.experience.slice(0, 3).map((exp, i) => (
                <div key={i} className="text-[11px] text-gray-700 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-gray-400 shrink-0" />
                  <span className="font-medium truncate">{exp.role}</span>
                  <span className="text-gray-400">—</span>
                  <span className="text-gray-500 truncate">{exp.company}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="flex items-center gap-3 text-[10px] text-gray-400 pt-1 border-t border-gray-100">
          {certCount > 0 && <span className="flex items-center gap-0.5"><Award size={10} /> {certCount} certs</span>}
          {sd.education && sd.education.length > 0 && (
            <span className="flex items-center gap-0.5"><GraduationCap size={10} /> {sd.education.length} degree(s)</span>
          )}
          {projectCount > 0 && <span className="flex items-center gap-0.5"><FolderOpen size={10} /> {projectCount} projects</span>}
        </div>
      </div>
    </div>
  );
}
