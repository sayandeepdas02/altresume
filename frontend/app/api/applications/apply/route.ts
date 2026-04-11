import { NextResponse } from 'next/server';

/**
 * In-memory applications store for MVP.
 * In production, this becomes a database table.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const applications: any[] = [];

/**
 * POST /api/applications/apply
 *
 * Body: { job } — the full job object
 * Creates a new tracked application.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { job } = body;

    if (!job || !job.id) {
      return NextResponse.json({ error: 'job object is required' }, { status: 400 });
    }

    // Check for duplicate
    const existing = applications.find(a => a.job_id === job.id);
    if (existing) {
      return NextResponse.json({ error: 'Already applied to this job', application: existing }, { status: 409 });
    }

    const application = {
      id: `app-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      job_id: job.id,
      job_details: {
        role: job.role,
        company: job.company,
        location: job.location,
        match_score: job.match_score,
      },
      status: 'applied',
      applied_at: new Date().toISOString(),
    };

    applications.push(application);

    return NextResponse.json(application, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

/**
 * GET /api/applications/apply
 *
 * Returns all tracked applications.
 */
export async function GET() {
  return NextResponse.json(applications);
}
