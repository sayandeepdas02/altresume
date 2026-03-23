/**
 * resumeStore.ts — Zustand store for resume builder state management.
 *
 * Manages: current resume data, active template, save state, undo stack.
 */

import { create } from 'zustand';
import type { StructuredResume, Experience, Education, Project, Certification } from '@/services/resumeApi';

// ---------------------------------------------------------------------------
// Default empty resume
// ---------------------------------------------------------------------------

export function createEmptyResume(): StructuredResume {
  return {
    name: '',
    email: '',
    phone: '',
    linkedin: '',
    github: '',
    summary: '',
    skills: { hard_skills: [], soft_skills: [] },
    experience: [],
    education: [],
    projects: [],
    certifications: [],
  };
}

export function createEmptyExperience(): Experience {
  return {
    company: '',
    role: '',
    location: '',
    start_date: '',
    end_date: '',
    bullets: ['', '', '', ''],
  };
}

export function createEmptyEducation(): Education {
  return {
    institution: '',
    degree: '',
    start_date: '',
    end_date: '',
    description: '',
  };
}

export function createEmptyProject(): Project {
  return {
    name: '',
    description: '',
    tech_stack: [],
    link: '',
  };
}

export function createEmptyCertification(): Certification {
  return {
    name: '',
    institution: '',
    date: '',
  };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

type Template = 'modern' | 'minimal' | 'professional';

interface ResumeStore {
  // Data
  resumeId: string | null;
  title: string;
  data: StructuredResume;
  activeTemplate: Template;
  isDirty: boolean;
  isSaving: boolean;

  // Actions — top level
  setResumeId: (id: string | null) => void;
  setTitle: (title: string) => void;
  setActiveTemplate: (t: Template) => void;
  setIsSaving: (v: boolean) => void;
  markClean: () => void;
  loadResume: (id: string | null, title: string, data: StructuredResume) => void;
  resetToEmpty: () => void;

  // Actions — field updates
  updateField: <K extends keyof StructuredResume>(key: K, value: StructuredResume[K]) => void;
  updatePersonal: (field: 'name' | 'email' | 'phone' | 'linkedin' | 'github' | 'summary', value: string) => void;

  // Actions — skills
  addHardSkill: (skill: string) => void;
  removeHardSkill: (index: number) => void;
  addSoftSkill: (skill: string) => void;
  removeSoftSkill: (index: number) => void;

  // Actions — experience
  addExperience: () => void;
  removeExperience: (index: number) => void;
  updateExperience: (index: number, field: keyof Experience, value: string | string[]) => void;

  // Actions — education
  addEducation: () => void;
  removeEducation: (index: number) => void;
  updateEducation: (index: number, field: keyof Education, value: string) => void;

  // Actions — projects
  addProject: () => void;
  removeProject: (index: number) => void;
  updateProject: (index: number, field: keyof Project, value: string | string[]) => void;

  // Actions — certifications
  addCertification: () => void;
  removeCertification: (index: number) => void;
  updateCertification: (index: number, field: keyof Certification, value: string) => void;
}

export const useResumeStore = create<ResumeStore>((set) => ({
  resumeId: null,
  title: 'Untitled Resume',
  data: createEmptyResume(),
  activeTemplate: 'modern',
  isDirty: false,
  isSaving: false,

  setResumeId: (id) => set({ resumeId: id }),
  setTitle: (title) => set({ title, isDirty: true }),
  setActiveTemplate: (t) => set({ activeTemplate: t }),
  setIsSaving: (v) => set({ isSaving: v }),
  markClean: () => set({ isDirty: false }),
  resetToEmpty: () => set({ resumeId: null, title: 'Untitled Resume', data: createEmptyResume(), isDirty: false }),
  loadResume: (id, title, data) => set({ resumeId: id, title, data, isDirty: false }),

  updateField: (key, value) =>
    set((state) => ({ data: { ...state.data, [key]: value }, isDirty: true })),

  updatePersonal: (field, value) =>
    set((state) => ({ data: { ...state.data, [field]: value }, isDirty: true })),

  // Skills
  addHardSkill: (skill) =>
    set((state) => ({
      data: {
        ...state.data,
        skills: { ...state.data.skills, hard_skills: [...state.data.skills.hard_skills, skill] },
      },
      isDirty: true,
    })),
  removeHardSkill: (index) =>
    set((state) => ({
      data: {
        ...state.data,
        skills: {
          ...state.data.skills,
          hard_skills: state.data.skills.hard_skills.filter((_, i) => i !== index),
        },
      },
      isDirty: true,
    })),
  addSoftSkill: (skill) =>
    set((state) => ({
      data: {
        ...state.data,
        skills: { ...state.data.skills, soft_skills: [...state.data.skills.soft_skills, skill] },
      },
      isDirty: true,
    })),
  removeSoftSkill: (index) =>
    set((state) => ({
      data: {
        ...state.data,
        skills: {
          ...state.data.skills,
          soft_skills: state.data.skills.soft_skills.filter((_, i) => i !== index),
        },
      },
      isDirty: true,
    })),

  // Experience
  addExperience: () =>
    set((state) => ({
      data: { ...state.data, experience: [...state.data.experience, createEmptyExperience()] },
      isDirty: true,
    })),
  removeExperience: (index) =>
    set((state) => ({
      data: { ...state.data, experience: state.data.experience.filter((_, i) => i !== index) },
      isDirty: true,
    })),
  updateExperience: (index, field, value) =>
    set((state) => ({
      data: {
        ...state.data,
        experience: state.data.experience.map((exp, i) =>
          i === index ? { ...exp, [field]: value } : exp
        ),
      },
      isDirty: true,
    })),

  // Education
  addEducation: () =>
    set((state) => ({
      data: { ...state.data, education: [...state.data.education, createEmptyEducation()] },
      isDirty: true,
    })),
  removeEducation: (index) =>
    set((state) => ({
      data: { ...state.data, education: state.data.education.filter((_, i) => i !== index) },
      isDirty: true,
    })),
  updateEducation: (index, field, value) =>
    set((state) => ({
      data: {
        ...state.data,
        education: state.data.education.map((edu, i) =>
          i === index ? { ...edu, [field]: value } : edu
        ),
      },
      isDirty: true,
    })),

  // Projects
  addProject: () =>
    set((state) => ({
      data: { ...state.data, projects: [...state.data.projects, createEmptyProject()] },
      isDirty: true,
    })),
  removeProject: (index) =>
    set((state) => ({
      data: { ...state.data, projects: state.data.projects.filter((_, i) => i !== index) },
      isDirty: true,
    })),
  updateProject: (index, field, value) =>
    set((state) => ({
      data: {
        ...state.data,
        projects: state.data.projects.map((proj, i) =>
          i === index ? { ...proj, [field]: value } : proj
        ),
      },
      isDirty: true,
    })),

  // Certifications
  addCertification: () =>
    set((state) => ({
      data: { ...state.data, certifications: [...state.data.certifications, createEmptyCertification()] },
      isDirty: true,
    })),
  removeCertification: (index) =>
    set((state) => ({
      data: { ...state.data, certifications: state.data.certifications.filter((_, i) => i !== index) },
      isDirty: true,
    })),
  updateCertification: (index, field, value) =>
    set((state) => ({
      data: {
        ...state.data,
        certifications: state.data.certifications.map((cert, i) =>
          i === index ? { ...cert, [field]: value } : cert
        ),
      },
      isDirty: true,
    })),
}));
