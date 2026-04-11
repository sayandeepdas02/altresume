import { NextResponse } from 'next/server';

/**
 * Mock deep company research endpoint.
 * Returns a structured 6-axis research template.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { company, role } = body;

    if (!company) {
      return NextResponse.json({ error: 'company is required.' }, { status: 400 });
    }

    await new Promise(r => setTimeout(r, 600));

    return NextResponse.json({
      company,
      role: role || 'Unknown Role',
      research_axes: {
        ai_strategy: {
          title: 'AI & Technology Strategy',
          queries: [
            `"${company}" AI ML engineering blog`,
            `"${company}" technology stack architecture`,
            `"${company}" engineering team`,
          ],
          questions: [
            `What AI/ML products does ${company} build?`,
            `What is ${company}'s technology stack?`,
            `Do they have an engineering blog?`,
          ],
        },
        recent_moves: {
          title: 'Recent Developments (Last 6 Months)',
          queries: [
            `"${company}" funding round 2026`,
            `"${company}" product launch 2026`,
            `"${company}" hiring engineering 2026`,
          ],
          questions: [
            'Any recent funding rounds or leadership changes?',
            'New product launches or strategic pivots?',
            'Notable hires or acquisitions?',
          ],
        },
        engineering_culture: {
          title: 'Engineering Culture',
          queries: [
            `"${company}" engineering culture site:glassdoor.com`,
            `"${company}" developer experience site:teamblind.com`,
          ],
          questions: [
            'How do they ship? (deploy cadence, CI/CD)',
            'Remote-first or office-first?',
            'What do engineers say about working there?',
          ],
        },
        challenges: {
          title: 'Likely Technical Challenges',
          questions: [
            `What scaling problems does ${company} face?`,
            'Reliability, cost, or latency challenges?',
            'Any ongoing infrastructure migrations?',
          ],
        },
        competitors: {
          title: 'Competitive Landscape',
          questions: [
            `Who are ${company}'s main competitors?`,
            'What is their differentiator or moat?',
            'How do they position vs competition?',
          ],
        },
        candidate_angle: {
          title: 'Your Unique Angle',
          candidate_skills: [],
          candidate_experience: [],
          questions: [
            `What unique value do you bring to ${company}?`,
            'Which of your projects is most relevant?',
            'What story should you lead with in the interview?',
          ],
        },
      },
      status: 'success',
    });
  } catch {
    return NextResponse.json({ error: 'Research generation failed' }, { status: 500 });
  }
}
