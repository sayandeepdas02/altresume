import { NextResponse } from 'next/server';

/**
 * POST /api/jd/evaluate
 *
 * Takes a raw job description text and returns a mock evaluation:
 * - match_score
 * - missing_skills
 * - suggestions
 * - matched_skills
 */

const COMMON_SKILLS = [
  'React', 'Next.js', 'TypeScript', 'Node.js', 'Python', 'Django',
  'PostgreSQL', 'MongoDB', 'Redis', 'Kafka', 'Docker', 'Kubernetes',
  'AWS', 'GCP', 'CI/CD', 'GraphQL', 'REST APIs', 'Tailwind CSS',
  'Machine Learning', 'TensorFlow', 'PyTorch', 'Git', 'Linux',
  'Java', 'Go', 'Rust', 'C++', 'SQL', 'NoSQL', 'Figma',
];

function extractMentioned(text: string): string[] {
  const lower = text.toLowerCase();
  return COMMON_SKILLS.filter(skill => lower.includes(skill.toLowerCase()));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { job_description } = body;

    if (!job_description || !job_description.trim()) {
      return NextResponse.json({ error: 'job_description is required' }, { status: 400 });
    }

    // Simulate processing time
    await new Promise(r => setTimeout(r, 1200));

    const mentionedSkills = extractMentioned(job_description);

    // Simulate user's resume skills (in a real app, we'd load from DB)
    const userSkills = ['React', 'Next.js', 'TypeScript', 'Node.js', 'Python', 'Git', 'REST APIs', 'Tailwind CSS'];

    const matchedSkills = mentionedSkills.filter(s => userSkills.includes(s));
    const missingSkills = mentionedSkills.filter(s => !userSkills.includes(s));

    const score = mentionedSkills.length > 0
      ? Math.round((matchedSkills.length / mentionedSkills.length) * 100)
      : 50;

    const suggestions: string[] = [];
    if (missingSkills.length > 0) {
      suggestions.push(`Add projects demonstrating ${missingSkills.slice(0, 2).join(' and ')}.`);
    }
    if (score < 60) {
      suggestions.push('Consider tailoring your summary to emphasize relevant experience.');
    }
    if (missingSkills.includes('Docker') || missingSkills.includes('Kubernetes')) {
      suggestions.push('Include any DevOps or containerization experience you have.');
    }
    if (missingSkills.includes('AWS') || missingSkills.includes('GCP')) {
      suggestions.push('Mention any cloud platform certifications or deployments.');
    }
    if (suggestions.length === 0) {
      suggestions.push('Your resume is a strong match! Consider adding quantifiable impact metrics.');
    }

    const recommendation = score >= 75 ? 'STRONG MATCH' : score >= 50 ? 'MODERATE MATCH' : 'WEAK MATCH';

    return NextResponse.json({
      score,
      recommendation,
      matched_skills: matchedSkills,
      missing_skills: missingSkills,
      suggestions,
      total_jd_skills: mentionedSkills.length,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
