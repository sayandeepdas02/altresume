import { NextResponse } from 'next/server';

/**
 * Mock batch evaluation endpoint.
 * Returns instant mock results for each JD in the batch.
 */

const SKILLS_DB = [
  'React','Next.js','TypeScript','Python','Node.js','Docker','AWS',
  'PostgreSQL','MongoDB','Redis','GraphQL','REST APIs','CI/CD',
  'Kubernetes','Terraform','Go','Java','Machine Learning','TensorFlow',
];

function mockScore() { return Math.floor(Math.random() * 45) + 40; }
function mockRec(score: number) { return score >= 70 ? 'APPLY' : score >= 50 ? 'REVIEW' : 'SKIP'; }
function pickRandom<T>(arr: T[], n: number): T[] { return [...arr].sort(() => Math.random() - 0.5).slice(0, n); }

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { job_descriptions } = body;

    if (!Array.isArray(job_descriptions) || job_descriptions.length === 0) {
      return NextResponse.json({ error: 'Provide job_descriptions as a non-empty array.' }, { status: 400 });
    }

    if (job_descriptions.length > 20) {
      return NextResponse.json({ error: 'Maximum 20 JDs per batch.' }, { status: 400 });
    }

    await new Promise(r => setTimeout(r, 1000));

    const results = job_descriptions.map((jd: any, idx: number) => {
      const score = mockScore();
      const matched = pickRandom(SKILLS_DB, Math.floor(Math.random() * 5) + 3);
      const missing = pickRandom(SKILLS_DB.filter(s => !matched.includes(s)), Math.floor(Math.random() * 4) + 1);

      return {
        index: idx,
        role: jd.role || `Role ${idx + 1}`,
        company: jd.company || 'Unknown',
        match_score: score,
        recommendation: mockRec(score),
        matched_skills: matched,
        missing_skills: missing,
        fit_summary: `${score >= 70 ? 'Strong' : score >= 50 ? 'Moderate' : 'Weak'} match for ${jd.role || 'this role'} at ${jd.company || 'the company'}. Key strengths in ${matched.slice(0, 2).join(' and ')}.`,
        status: 'completed',
      };
    });

    return NextResponse.json({
      total: job_descriptions.length,
      completed: results.length,
      results,
    });
  } catch {
    return NextResponse.json({ error: 'Batch evaluation failed' }, { status: 500 });
  }
}
