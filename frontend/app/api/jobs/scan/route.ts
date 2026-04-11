import { NextResponse } from 'next/server';

/**
 * POST /api/jobs/scan
 *
 * Mock job scanning endpoint.
 * Accepts: { role, location, experience }
 * Returns: a list of matched jobs with scores.
 */

const JOB_POOL = [
  {
    id: 'job-001',
    role: 'Frontend Developer',
    company: 'TechNova',
    location: 'Bangalore, IN',
    type: 'Full-time',
    salary: '₹18–25 LPA',
    posted: '2d ago',
    requiredSkills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'REST APIs'],
    description: 'Build and maintain complex, high-performance web applications with React and Next.js. Collaborate with design and backend teams.',
  },
  {
    id: 'job-002',
    role: 'Full Stack Engineer',
    company: 'StreamlineAI',
    location: 'Remote',
    type: 'Full-time',
    salary: '$120–160k',
    posted: '1d ago',
    requiredSkills: ['Node.js', 'React', 'PostgreSQL', 'Docker', 'GraphQL', 'Redis'],
    description: 'Own features end-to-end, from database schema to pixel-perfect UI. We use a modern stack built on Node and React.',
  },
  {
    id: 'job-003',
    role: 'Backend Engineer',
    company: 'DataForge',
    location: 'Hyderabad, IN',
    type: 'Full-time',
    salary: '₹22–30 LPA',
    posted: '5h ago',
    requiredSkills: ['Python', 'Django', 'Kafka', 'PostgreSQL', 'AWS', 'Celery'],
    description: 'Design and scale backend services for our real-time data platform. Strong experience with distributed systems required.',
  },
  {
    id: 'job-004',
    role: 'Software Engineer',
    company: 'NexGen Robotics',
    location: 'San Francisco, CA',
    type: 'Full-time',
    salary: '$140–180k',
    posted: '3d ago',
    requiredSkills: ['Python', 'C++', 'ROS', 'Machine Learning', 'Docker'],
    description: 'Develop software for autonomous mobile robots. Requires solid CS fundamentals and experience with real-time systems.',
  },
  {
    id: 'job-005',
    role: 'DevOps Engineer',
    company: 'CloudPeak',
    location: 'Remote',
    type: 'Contract',
    salary: '$90–120/hr',
    posted: '12h ago',
    requiredSkills: ['Kubernetes', 'Terraform', 'AWS', 'CI/CD', 'Linux', 'Docker'],
    description: 'Manage production infrastructure, build CI/CD pipelines, and improve developer productivity tooling.',
  },
  {
    id: 'job-006',
    role: 'Product Designer',
    company: 'DesignCraft',
    location: 'Mumbai, IN',
    type: 'Full-time',
    salary: '₹15–22 LPA',
    posted: '1d ago',
    requiredSkills: ['Figma', 'User Research', 'Prototyping', 'Design Systems', 'CSS'],
    description: 'Create intuitive experiences for B2B SaaS products, from wireframes through interactive prototypes.',
  },
  {
    id: 'job-007',
    role: 'ML Engineer',
    company: 'DeepSight Labs',
    location: 'Bangalore, IN',
    type: 'Full-time',
    salary: '₹25–40 LPA',
    posted: '6h ago',
    requiredSkills: ['Python', 'PyTorch', 'TensorFlow', 'MLOps', 'SQL', 'AWS'],
    description: 'Build and deploy production ML models for NLP and computer vision workloads. MLOps experience strongly preferred.',
  },
  {
    id: 'job-008',
    role: 'React Native Developer',
    company: 'AppWave',
    location: 'Remote',
    type: 'Full-time',
    salary: '$100–140k',
    posted: '4d ago',
    requiredSkills: ['React Native', 'TypeScript', 'Redux', 'REST APIs', 'Firebase'],
    description: 'Develop cross-platform mobile apps for iOS and Android. Strong understanding of mobile UX patterns required.',
  },
];

// Simulate a basic keyword matching score
function computeMatch(job: typeof JOB_POOL[0], role: string): { matchScore: number; recommendation: string } {
  const roleLower = role.toLowerCase();
  const jobRoleLower = job.role.toLowerCase();

  // Simple heuristic: keyword overlap between query role and job role/skills
  const roleWords = roleLower.split(/\s+/);
  const jobWords = [...jobRoleLower.split(/\s+/), ...job.requiredSkills.map(s => s.toLowerCase())];

  let hits = 0;
  for (const w of roleWords) {
    if (jobWords.some(jw => jw.includes(w) || w.includes(jw))) hits++;
  }

  const baseScore = Math.min(95, Math.round((hits / Math.max(roleWords.length, 1)) * 60 + Math.random() * 35));
  const recommendation = baseScore >= 70 ? 'APPLY' : baseScore >= 45 ? 'REVIEW' : 'SKIP';

  return { matchScore: baseScore, recommendation };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { role = '', location = '', experience = '' } = body;

    if (!role.trim()) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 });
    }

    // Simulate network delay
    await new Promise(r => setTimeout(r, 800));

    // Filter and score
    const results = JOB_POOL.map(job => {
      const { matchScore, recommendation } = computeMatch(job, role);
      return {
        ...job,
        match_score: matchScore,
        display_recommendation: recommendation,
        missing_skills: job.requiredSkills.slice(Math.floor(Math.random() * 2), Math.floor(Math.random() * 3) + 2),
      };
    })
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 5);

    return NextResponse.json({ jobs: results, query: { role, location, experience } });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
