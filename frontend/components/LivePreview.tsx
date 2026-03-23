'use client';

import { useResumeStore } from '@/stores/resumeStore';
import type { StructuredResume } from '@/services/resumeApi';

// ---------------------------------------------------------------------------
// Template renderers — each returns styled JSX for A4 preview
// ---------------------------------------------------------------------------

function ModernTemplate({ data }: { data: StructuredResume }) {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#1a1a1a', fontSize: '10px', lineHeight: 1.5 }}>
      {/* Header */}
      <div style={{ borderBottom: '2px solid #2563eb', paddingBottom: 12, marginBottom: 14 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#111' }}>
          {data.name || 'Your Name'}
        </h1>
        <p style={{ fontSize: 11, color: '#2563eb', margin: '4px 0 0', fontWeight: 500 }}>
          {data.summary?.slice(0, 80) || 'Professional Summary'}
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: '9px', color: '#6b7280' }}>
          {data.email && <span>{data.email}</span>}
          {data.phone && <span>{data.phone}</span>}
          {data.linkedin && <span>{data.linkedin}</span>}
          {data.github && <span>{data.github}</span>}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div style={{ marginBottom: 12 }}>
          <h2 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#2563eb', marginBottom: 4, borderBottom: '1px solid #e5e7eb', paddingBottom: 2 }}>
            Summary
          </h2>
          <p style={{ margin: 0, color: '#374151' }}>{data.summary}</p>
        </div>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <h2 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#2563eb', marginBottom: 4, borderBottom: '1px solid #e5e7eb', paddingBottom: 2 }}>
            Experience
          </h2>
          {data.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{exp.role || 'Role'}</span>
                  <span style={{ color: '#6b7280' }}> — {exp.company || 'Company'}</span>
                </div>
                <span style={{ fontSize: '9px', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                  {exp.start_date} – {exp.end_date || 'Present'}
                </span>
              </div>
              {exp.location && <div style={{ fontSize: '9px', color: '#9ca3af' }}>{exp.location}</div>}
              <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                {exp.bullets.filter(Boolean).map((b, j) => (
                  <li key={j} style={{ marginBottom: 2 }}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {data.education.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <h2 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#2563eb', marginBottom: 4, borderBottom: '1px solid #e5e7eb', paddingBottom: 2 }}>
            Education
          </h2>
          {data.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{edu.degree || 'Degree'}</span>
                  <span style={{ color: '#6b7280' }}> — {edu.institution || 'Institution'}</span>
                </div>
                <span style={{ fontSize: '9px', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                  {edu.start_date} – {edu.end_date}
                </span>
              </div>
              {edu.description && <div style={{ fontSize: '9px', color: '#6b7280', marginTop: 2 }}>{edu.description}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {(data.skills.hard_skills.length > 0 || data.skills.soft_skills.length > 0) && (
        <div style={{ marginBottom: 12 }}>
          <h2 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#2563eb', marginBottom: 4, borderBottom: '1px solid #e5e7eb', paddingBottom: 2 }}>
            Skills
          </h2>
          {data.skills.hard_skills.length > 0 && (
            <div style={{ marginBottom: 4 }}>
              <span style={{ fontWeight: 600 }}>Technical: </span>
              <span style={{ color: '#374151' }}>{data.skills.hard_skills.join(', ')}</span>
            </div>
          )}
          {data.skills.soft_skills.length > 0 && (
            <div>
              <span style={{ fontWeight: 600 }}>Soft Skills: </span>
              <span style={{ color: '#374151' }}>{data.skills.soft_skills.join(', ')}</span>
            </div>
          )}
        </div>
      )}

      {/* Projects */}
      {data.projects.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <h2 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#2563eb', marginBottom: 4, borderBottom: '1px solid #e5e7eb', paddingBottom: 2 }}>
            Projects
          </h2>
          {data.projects.map((proj, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <span style={{ fontWeight: 600 }}>{proj.name || 'Project'}</span>
              {proj.link && <span style={{ color: '#2563eb', fontSize: '9px' }}> — {proj.link}</span>}
              <div style={{ color: '#374151', marginTop: 2 }}>{proj.description}</div>
              {proj.tech_stack.length > 0 && (
                <div style={{ fontSize: '9px', color: '#9ca3af', marginTop: 2 }}>
                  Tech: {proj.tech_stack.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Certifications */}
      {data.certifications.length > 0 && (
        <div>
          <h2 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#2563eb', marginBottom: 4, borderBottom: '1px solid #e5e7eb', paddingBottom: 2 }}>
            Certifications
          </h2>
          {data.certifications.map((cert, i) => (
            <div key={i} style={{ marginBottom: 4 }}>
              <span style={{ fontWeight: 600 }}>{cert.name}</span>
              <span style={{ color: '#6b7280' }}> — {cert.institution}</span>
              {cert.date && <span style={{ fontSize: '9px', color: '#9ca3af' }}> ({cert.date})</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MinimalTemplate({ data }: { data: StructuredResume }) {
  const s = { borderColor: '#111', headingStyle: { fontSize: 10, fontWeight: 700 as const, textTransform: 'uppercase' as const, letterSpacing: '0.1em', borderBottom: '1px solid #111', paddingBottom: 2, marginBottom: 6 } };

  return (
    <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", color: '#111', fontSize: '10px', lineHeight: 1.5 }}>
      <div style={{ textAlign: 'center', marginBottom: 16, borderBottom: '2px solid #111', paddingBottom: 10 }}>
        <h1 style={{ fontSize: 20, fontWeight: 400, letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0 }}>
          {data.name || 'YOUR NAME'}
        </h1>
        <div style={{ fontSize: '9px', marginTop: 6, color: '#555', display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          {data.email && <span>{data.email}</span>}
          {data.phone && <span>{data.phone}</span>}
          {data.linkedin && <span>{data.linkedin}</span>}
        </div>
      </div>

      {data.summary && (
        <div style={{ marginBottom: 14 }}>
          <h2 style={s.headingStyle}>Profile</h2>
          <p style={{ margin: 0, color: '#333' }}>{data.summary}</p>
        </div>
      )}

      {data.experience.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <h2 style={s.headingStyle}>Experience</h2>
          {data.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{exp.role}</strong>
                <span style={{ fontSize: '9px', color: '#777' }}>{exp.start_date} — {exp.end_date || 'Present'}</span>
              </div>
              <div style={{ color: '#555', fontSize: '9px' }}>{exp.company}{exp.location ? `, ${exp.location}` : ''}</div>
              <ul style={{ margin: '4px 0 0 14px', padding: 0, listStyleType: 'disc' }}>
                {exp.bullets.filter(Boolean).map((b, j) => <li key={j} style={{ marginBottom: 1 }}>{b}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}

      {data.education.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <h2 style={s.headingStyle}>Education</h2>
          {data.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: 4 }}>
              <strong>{edu.degree}</strong> — {edu.institution}
              <span style={{ fontSize: '9px', color: '#777', marginLeft: 8 }}>{edu.start_date} — {edu.end_date}</span>
            </div>
          ))}
        </div>
      )}

      {(data.skills.hard_skills.length > 0 || data.skills.soft_skills.length > 0) && (
        <div style={{ marginBottom: 14 }}>
          <h2 style={s.headingStyle}>Skills</h2>
          <p style={{ margin: 0, color: '#333' }}>
            {[...data.skills.hard_skills, ...data.skills.soft_skills].join(' · ')}
          </p>
        </div>
      )}

      {data.projects.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <h2 style={s.headingStyle}>Projects</h2>
          {data.projects.map((proj, i) => (
            <div key={i} style={{ marginBottom: 4 }}>
              <strong>{proj.name}</strong>
              {proj.tech_stack.length > 0 && <span style={{ color: '#777', fontSize: '9px' }}> [{proj.tech_stack.join(', ')}]</span>}
              <div style={{ color: '#333' }}>{proj.description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProfessionalTemplate({ data }: { data: StructuredResume }) {
  return (
    <div style={{ fontFamily: "'Times New Roman', Georgia, serif", color: '#1a1a1a', fontSize: '10.5px', lineHeight: 1.55 }}>
      <div style={{ textAlign: 'center', marginBottom: 14 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '0.02em' }}>
          {data.name || 'Your Name'}
        </h1>
        <div style={{ fontSize: '9.5px', marginTop: 4, color: '#555' }}>
          {[data.email, data.phone, data.linkedin, data.github].filter(Boolean).join(' | ')}
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #ccc', margin: '0 0 12px 0' }} />

      {data.summary && (
        <div style={{ marginBottom: 14 }}>
          <h2 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', borderBottom: '1px solid #ccc', paddingBottom: 2, marginBottom: 6 }}>
            Professional Summary
          </h2>
          <p style={{ margin: 0, textAlign: 'justify' }}>{data.summary}</p>
        </div>
      )}

      {data.experience.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <h2 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', borderBottom: '1px solid #ccc', paddingBottom: 2, marginBottom: 6 }}>
            Professional Experience
          </h2>
          {data.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <strong>{exp.role}</strong>, <em>{exp.company}</em>
                </div>
                <span style={{ fontSize: '9.5px', color: '#777' }}>
                  {exp.start_date} – {exp.end_date || 'Present'}
                </span>
              </div>
              {exp.location && <div style={{ fontSize: '9px', color: '#888', fontStyle: 'italic' }}>{exp.location}</div>}
              <ul style={{ margin: '4px 0 0 18px', padding: 0 }}>
                {exp.bullets.filter(Boolean).map((b, j) => <li key={j} style={{ marginBottom: 2 }}>{b}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}

      {data.education.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <h2 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', borderBottom: '1px solid #ccc', paddingBottom: 2, marginBottom: 6 }}>
            Education
          </h2>
          {data.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <strong>{edu.degree}</strong>, <em>{edu.institution}</em>
                </div>
                <span style={{ fontSize: '9.5px', color: '#777' }}>{edu.start_date} – {edu.end_date}</span>
              </div>
              {edu.description && <div style={{ fontSize: '9.5px', color: '#555', marginTop: 2 }}>{edu.description}</div>}
            </div>
          ))}
        </div>
      )}

      {(data.skills.hard_skills.length > 0 || data.skills.soft_skills.length > 0) && (
        <div style={{ marginBottom: 14 }}>
          <h2 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', borderBottom: '1px solid #ccc', paddingBottom: 2, marginBottom: 6 }}>
            Skills
          </h2>
          {data.skills.hard_skills.length > 0 && (
            <div style={{ marginBottom: 4 }}>
              <strong>Technical:</strong> {data.skills.hard_skills.join(', ')}
            </div>
          )}
          {data.skills.soft_skills.length > 0 && (
            <div>
              <strong>Interpersonal:</strong> {data.skills.soft_skills.join(', ')}
            </div>
          )}
        </div>
      )}

      {data.projects.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <h2 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', borderBottom: '1px solid #ccc', paddingBottom: 2, marginBottom: 6 }}>
            Projects
          </h2>
          {data.projects.map((proj, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <strong>{proj.name}</strong>
              {proj.link && <span style={{ fontSize: '9px', color: '#555' }}> — {proj.link}</span>}
              <div style={{ marginTop: 2 }}>{proj.description}</div>
              {proj.tech_stack.length > 0 && (
                <div style={{ fontSize: '9px', color: '#888', marginTop: 2 }}>
                  Technologies: {proj.tech_stack.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {data.certifications.length > 0 && (
        <div>
          <h2 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', borderBottom: '1px solid #ccc', paddingBottom: 2, marginBottom: 6 }}>
            Certifications
          </h2>
          {data.certifications.map((cert, i) => (
            <div key={i} style={{ marginBottom: 4 }}>
              <strong>{cert.name}</strong> — {cert.institution}
              {cert.date && <span style={{ color: '#777', fontSize: '9px' }}> ({cert.date})</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// LivePreview — A4 container with active template
// ---------------------------------------------------------------------------

export default function LivePreview() {
  const { data, activeTemplate } = useResumeStore();

  const isEmpty = !data.name && !data.summary && data.experience.length === 0;

  return (
    <div
      id="resume-preview"
      style={{
        width: '210mm',
        minHeight: '297mm',
        backgroundColor: '#ffffff',
        padding: '20mm 18mm',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.04)',
        position: 'relative',
      }}
    >
      {isEmpty ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 400 }}>
          <div style={{ textAlign: 'center', color: '#9ca3af' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
            <p style={{ fontSize: 14, fontWeight: 500 }}>Start filling in the form</p>
            <p style={{ fontSize: 12 }}>Your resume preview will appear here</p>
          </div>
        </div>
      ) : activeTemplate === 'modern' ? (
        <ModernTemplate data={data} />
      ) : activeTemplate === 'minimal' ? (
        <MinimalTemplate data={data} />
      ) : (
        <ProfessionalTemplate data={data} />
      )}
    </div>
  );
}
