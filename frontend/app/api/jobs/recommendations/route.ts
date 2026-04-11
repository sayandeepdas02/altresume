import { NextResponse } from 'next/server';

/**
 * GET /api/jobs/recommendations
 *
 * Returns the last set of scanned jobs stored in memory.
 * In the MVP phase, the scan endpoint populates a shared store.
 * If no scan has been run yet, returns an empty list.
 */

// NOTE: In a real app, this would query a database.
// For the MVP, the scan route returns jobs directly to the client
// and the client caches them in React state, so this route acts as
// a simple "ping" that returns empty until we add persistence.

export async function GET() {
  return NextResponse.json({
    jobs: [],
    message: 'Run a job scan first to populate recommendations.',
  });
}
