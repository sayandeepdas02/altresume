import { NextResponse } from 'next/server';

/**
 * Mock LinkedIn outreach generation.
 * Falls back here when Django backend isn't available.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { job_description, contact_name, contact_role, company, role } = body;

    const companyName = company || 'the company';
    const roleName = role || 'the role';

    // Simulate AI processing
    await new Promise(r => setTimeout(r, 800));

    return NextResponse.json({
      connection_note: `Hi${contact_name ? ` ${contact_name}` : ''} — I noticed ${companyName} is building at the intersection of AI and product. I recently shipped a production system that handles similar challenges. Would love to exchange ideas in a quick call.`,
      message: `Hi${contact_name ? ` ${contact_name}` : ''},\n\nI came across the ${roleName} role at ${companyName} and it caught my attention — specifically the focus on ${job_description ? 'the technical challenges described' : 'scaling AI systems'}.\n\nI recently built and shipped a production AI system that handles similar problem spaces. The experience gave me deep exposure to the exact stack and challenges your team is tackling.\n\nI'd love to share what I learned and hear about your team's approach. Would you be open to a 15-minute chat?\n\nBest regards`,
      subject: `Re: ${roleName} at ${companyName} — Background in relevant systems`,
      targets: [
        { name: contact_name || 'Hiring Manager', role: contact_role || 'Engineering Manager', priority: 'primary' },
        { name: 'Team Recruiter', role: 'Technical Recruiter', priority: 'secondary' },
        { name: 'Senior Engineer', role: 'Senior Software Engineer', priority: 'peer' },
      ],
      status: 'success',
    });
  } catch {
    return NextResponse.json({ error: 'Failed to generate outreach' }, { status: 500 });
  }
}
