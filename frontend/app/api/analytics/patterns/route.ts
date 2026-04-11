import { NextResponse } from 'next/server';

/**
 * Mock analytics/patterns endpoint.
 * Returns realistic funnel + archetype + recommendation data.
 */
export async function GET() {
  return NextResponse.json({
    has_data: true,
    total_jobs: 24,
    total_applications: 8,
    funnel: {
      new: 6, evaluated: 8, applied: 5, interview: 2,
      offer: 1, rejected: 1, discarded: 0, skipped: 1,
    },
    score_stats: { avg: 3.4, total_scored: 18 },
    score_buckets: { high_fit: 7, medium_fit: 6, low_fit: 5 },
    recommendation_breakdown: { apply: 7, maybe: 8, skip: 9 },
    archetype_performance: {
      'Full-Stack': { total: 8, applied: 3, interview: 1, offer: 1, rejected: 0 },
      'Backend': { total: 6, applied: 2, interview: 1, offer: 0, rejected: 1 },
      'AI/ML': { total: 5, applied: 1, interview: 0, offer: 0, rejected: 0 },
      'Frontend': { total: 3, applied: 1, interview: 0, offer: 0, rejected: 0 },
      'DevOps': { total: 2, applied: 0, interview: 0, offer: 0, rejected: 0 },
    },
    top_skill_gaps: [
      { skill: 'Kubernetes', frequency: 6 },
      { skill: 'GraphQL', frequency: 4 },
      { skill: 'Rust', frequency: 3 },
      { skill: 'Terraform', frequency: 3 },
      { skill: 'Go', frequency: 2 },
    ],
    application_statuses: { applied: 5, interview: 2, offer: 1 },
    recommendations: [
      {
        action: 'Double down on "Full-Stack" roles — 62% conversion rate.',
        impact: 'high',
        reasoning: '5 of 8 Full-Stack applications led to positive outcomes (applied + interview + offer).',
      },
      {
        action: 'Address recurring skill gaps: Kubernetes, GraphQL, Rust',
        impact: 'high',
        reasoning: 'These skills appear most frequently in your missing requirements. Consider featuring Kubernetes experience more prominently or adding certifications.',
      },
      {
        action: 'Skip "AI/ML" roles below 3.5 score — 0% conversion below that threshold.',
        impact: 'medium',
        reasoning: 'No AI/ML applications below 3.5 score progressed beyond evaluation. Set a minimum score filter.',
      },
      {
        action: 'Avoid geo-restricted roles — 0% conversion across 3 applications.',
        impact: 'medium',
        reasoning: 'None of the US-only remote positions led to progress. Focus on global/regional remote roles.',
      },
    ],
  });
}
