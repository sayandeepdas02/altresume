'use client';

import { useState, KeyboardEvent } from 'react';
import { useResumeStore } from '@/stores/resumeStore';
import { Plus, Trash2, GripVertical } from 'lucide-react';

// ---------------------------------------------------------------------------
// Shared input components (B&W minimal design system)
// ---------------------------------------------------------------------------

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 transition-colors"
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 text-sm border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 transition-colors resize-none"
      />
    </div>
  );
}

function TagInput({
  label,
  tags,
  onAdd,
  onRemove,
  placeholder,
}: {
  label: string;
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (index: number) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      onAdd(input.trim());
      setInput('');
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      onRemove(tags.length - 1);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>
      <div className="flex flex-wrap gap-1.5 p-2 border border-gray-200 bg-white min-h-[38px]">
        {tags.map((tag, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-700 border border-gray-200"
          >
            {tag}
            <button onClick={() => onRemove(i)} className="text-gray-400 hover:text-gray-900">
              ×
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] text-sm bg-transparent outline-none text-gray-900 placeholder:text-gray-400"
        />
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  onAdd,
  count,
}: {
  title: string;
  onAdd: () => void;
  count: number;
}) {
  return (
    <div className="flex items-center justify-between pt-6 pb-2 border-b border-gray-200">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
        {title}
        {count > 0 && <span className="ml-2 text-gray-400 font-normal">({count})</span>}
      </h3>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-400 transition-colors"
      >
        <Plus size={12} /> Add
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ResumeForm component
// ---------------------------------------------------------------------------

export default function ResumeForm() {
  const store = useResumeStore();
  const { data } = store;

  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* ——————— Personal Info ——————— */}
      <div className="pb-2 border-b border-gray-200">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">
          Personal Information
        </h3>
      </div>

      <Input label="Full Name" value={data.name} onChange={(v) => store.updatePersonal('name', v)} placeholder="John Doe" />

      <div className="grid grid-cols-2 gap-3">
        <Input label="Email" value={data.email} onChange={(v) => store.updatePersonal('email', v)} placeholder="john@example.com" type="email" />
        <Input label="Phone" value={data.phone} onChange={(v) => store.updatePersonal('phone', v)} placeholder="+1 (555) 123-4567" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="LinkedIn" value={data.linkedin} onChange={(v) => store.updatePersonal('linkedin', v)} placeholder="linkedin.com/in/johndoe" />
        <Input label="GitHub" value={data.github} onChange={(v) => store.updatePersonal('github', v)} placeholder="github.com/johndoe" />
      </div>

      <TextArea
        label="Professional Summary"
        value={data.summary}
        onChange={(v) => store.updatePersonal('summary', v)}
        placeholder="Experienced software engineer with 5+ years building scalable web applications..."
        rows={3}
      />

      {/* ——————— Skills ——————— */}
      <SectionHeader title="Skills" onAdd={() => {}} count={data.skills.hard_skills.length + data.skills.soft_skills.length} />

      <TagInput
        label="Technical Skills"
        tags={data.skills.hard_skills}
        onAdd={store.addHardSkill}
        onRemove={store.removeHardSkill}
        placeholder="Type a skill and press Enter..."
      />
      <TagInput
        label="Soft Skills"
        tags={data.skills.soft_skills}
        onAdd={store.addSoftSkill}
        onRemove={store.removeSoftSkill}
        placeholder="Leadership, Communication, ..."
      />

      {/* ——————— Experience ——————— */}
      <SectionHeader title="Experience" onAdd={store.addExperience} count={data.experience.length} />

      {data.experience.map((exp, i) => (
        <div key={i} className="relative border border-gray-200 p-4 flex flex-col gap-3 group">
          <button
            onClick={() => store.removeExperience(i)}
            className="absolute top-3 right-3 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 size={14} />
          </button>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Job Title" value={exp.role} onChange={(v) => store.updateExperience(i, 'role', v)} placeholder="Software Engineer" />
            <Input label="Company" value={exp.company} onChange={(v) => store.updateExperience(i, 'company', v)} placeholder="Acme Corp" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Location" value={exp.location} onChange={(v) => store.updateExperience(i, 'location', v)} placeholder="San Francisco, CA" />
            <Input label="Start Date" value={exp.start_date} onChange={(v) => store.updateExperience(i, 'start_date', v)} placeholder="Jan 2022" />
            <Input label="End Date" value={exp.end_date} onChange={(v) => store.updateExperience(i, 'end_date', v)} placeholder="Present" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Key Achievements (4 bullets)</label>
            {exp.bullets.map((bullet, j) => (
              <div key={j} className="flex items-start gap-2">
                <span className="text-gray-300 mt-2 text-xs">•</span>
                <input
                  value={bullet}
                  onChange={(e) => {
                    const newBullets = [...exp.bullets];
                    newBullets[j] = e.target.value;
                    store.updateExperience(i, 'bullets', newBullets);
                  }}
                  placeholder={`Achievement ${j + 1}...`}
                  className="flex-1 px-2 py-1.5 text-sm border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 transition-colors"
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {data.experience.length === 0 && (
        <p className="text-sm text-gray-400 py-3 text-center border border-dashed border-gray-200">
          No experience entries yet. Click "Add" to start.
        </p>
      )}

      {/* ——————— Education ——————— */}
      <SectionHeader title="Education" onAdd={store.addEducation} count={data.education.length} />

      {data.education.map((edu, i) => (
        <div key={i} className="relative border border-gray-200 p-4 flex flex-col gap-3 group">
          <button
            onClick={() => store.removeEducation(i)}
            className="absolute top-3 right-3 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 size={14} />
          </button>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Institution" value={edu.institution} onChange={(v) => store.updateEducation(i, 'institution', v)} placeholder="MIT" />
            <Input label="Degree" value={edu.degree} onChange={(v) => store.updateEducation(i, 'degree', v)} placeholder="B.S. Computer Science" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start Date" value={edu.start_date} onChange={(v) => store.updateEducation(i, 'start_date', v)} placeholder="Sep 2018" />
            <Input label="End Date" value={edu.end_date} onChange={(v) => store.updateEducation(i, 'end_date', v)} placeholder="May 2022" />
          </div>
          <Input label="Description" value={edu.description} onChange={(v) => store.updateEducation(i, 'description', v)} placeholder="GPA: 3.8, Dean's List" />
        </div>
      ))}

      {data.education.length === 0 && (
        <p className="text-sm text-gray-400 py-3 text-center border border-dashed border-gray-200">
          No education entries yet. Click "Add" to start.
        </p>
      )}

      {/* ——————— Projects ——————— */}
      <SectionHeader title="Projects" onAdd={store.addProject} count={data.projects.length} />

      {data.projects.map((proj, i) => (
        <div key={i} className="relative border border-gray-200 p-4 flex flex-col gap-3 group">
          <button
            onClick={() => store.removeProject(i)}
            className="absolute top-3 right-3 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 size={14} />
          </button>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Project Name" value={proj.name} onChange={(v) => store.updateProject(i, 'name', v)} placeholder="My App" />
            <Input label="Link" value={proj.link} onChange={(v) => store.updateProject(i, 'link', v)} placeholder="https://github.com/..." />
          </div>
          <TextArea
            label="Description"
            value={proj.description}
            onChange={(v) => store.updateProject(i, 'description', v)}
            placeholder="Built a full-stack web app for..."
            rows={2}
          />
          <TagInput
            label="Tech Stack"
            tags={proj.tech_stack}
            onAdd={(tag) => store.updateProject(i, 'tech_stack', [...proj.tech_stack, tag])}
            onRemove={(idx) => store.updateProject(i, 'tech_stack', proj.tech_stack.filter((_, j) => j !== idx))}
            placeholder="React, Node.js, ..."
          />
        </div>
      ))}

      {data.projects.length === 0 && (
        <p className="text-sm text-gray-400 py-3 text-center border border-dashed border-gray-200">
          No projects yet. Click "Add" to start.
        </p>
      )}

      {/* ——————— Certifications ——————— */}
      <SectionHeader title="Certifications" onAdd={store.addCertification} count={data.certifications.length} />

      {data.certifications.map((cert, i) => (
        <div key={i} className="relative border border-gray-200 p-4 flex flex-col gap-3 group">
          <button
            onClick={() => store.removeCertification(i)}
            className="absolute top-3 right-3 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 size={14} />
          </button>

          <div className="grid grid-cols-3 gap-3">
            <Input label="Certification" value={cert.name} onChange={(v) => store.updateCertification(i, 'name', v)} placeholder="AWS Certified" />
            <Input label="Institution" value={cert.institution} onChange={(v) => store.updateCertification(i, 'institution', v)} placeholder="Amazon" />
            <Input label="Date" value={cert.date} onChange={(v) => store.updateCertification(i, 'date', v)} placeholder="2023" />
          </div>
        </div>
      ))}

      {data.certifications.length === 0 && (
        <p className="text-sm text-gray-400 py-3 text-center border border-dashed border-gray-200">
          No certifications yet. Click "Add" to start.
        </p>
      )}
    </div>
  );
}
