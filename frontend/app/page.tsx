'use client';

import Link from 'next/link';
import { ArrowRight, FileText, Check, LayoutGrid, Zap } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="flex flex-col items-center">
        
        {/* HERO SECTION */}
        <section className="w-full max-w-[1200px] px-6 lg:px-8 pt-32 pb-24 border-b border-gray-200 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 border border-gray-200 rounded-none text-xs font-medium text-gray-500 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full bg-gray-900 opacity-20"></span>
              <span className="relative inline-flex h-2 w-2 bg-gray-900"></span>
            </span>
            AltResume 2.0 is now live
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-[#0a0a0a] max-w-4xl mb-6">
            Tailor your resume for every job in seconds
          </h1>
          
          <p className="text-lg text-gray-500 max-w-2xl mb-10 leading-relaxed">
            AI-powered resume optimization that improves your ATS score instantly. Clean, functional, and built for modern professionals.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link href="/signin" className="btn-primary h-12 px-8 text-[15px] flex items-center gap-2 group">
              Get Started <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="#demo" className="btn-secondary h-12 px-8 text-[15px]">
              See Demo
            </Link>
          </div>
          
          <div className="mt-16 w-full max-w-4xl aspect-[16/9] bg-gray-50 border border-gray-200 rounded-none shadow-sm overflow-hidden flex items-center justify-center">
            {/* Minimal App Preview Placeholder */}
            <div className="w-full h-full flex flex-col">
               <div className="h-12 border-b border-gray-200 flex items-center px-4 gap-2 bg-white">
                 <div className="w-3 h-3 bg-gray-200 rounded-none"></div>
                 <div className="w-3 h-3 bg-gray-200 rounded-none"></div>
                 <div className="w-3 h-3 bg-gray-200 rounded-none"></div>
               </div>
               <div className="flex-1 flex">
                 <div className="w-64 border-r border-gray-200 bg-white p-4 hidden md:block">
                   <div className="h-4 w-24 bg-gray-200 mb-6 rounded-none"></div>
                   <div className="space-y-3">
                     {[1,2,3,4,5].map(i => <div key={i} className="h-3 w-full bg-gray-100 rounded-none"></div>)}
                   </div>
                 </div>
                 <div className="flex-1 p-8 flex justify-center bg-gray-50">
                    <div className="w-full max-w-md bg-white border border-gray-200 shadow-sm p-8 space-y-4">
                       <div className="h-6 w-1/3 bg-gray-900 mb-6"></div>
                       <div className="h-2 w-full bg-gray-200"></div>
                       <div className="h-2 w-5/6 bg-gray-200 mb-8"></div>
                       
                       <div className="h-4 w-1/4 bg-gray-400 mb-4"></div>
                       <div className="h-2 w-full bg-gray-100"></div>
                       <div className="h-2 w-full bg-gray-100"></div>
                       <div className="h-2 w-4/5 bg-gray-100 mb-4"></div>
                    </div>
                 </div>
               </div>
            </div>
          </div>
          
          {/* Social Proof */}
          <div className="mt-16 flex flex-col items-center">
            <p className="text-sm text-gray-500 font-medium mb-6">Used by candidates landing offers at</p>
            <div className="flex items-center gap-8 md:gap-12 grayscale opacity-40">
              <span className="text-xl font-bold tracking-tighter">LINEAR</span>
              <span className="text-xl font-bold">stripe</span>
              <span className="text-xl font-bold tracking-tight">Vercel</span>
              <span className="text-xl font-bold tracking-tighter">Notion</span>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section id="features" className="w-full pt-24 pb-32 border-b border-gray-200 bg-gray-50/30">
          <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-[#0a0a0a] sm:text-4xl">
                Everything you need to stand out
              </h2>
              <p className="mt-4 text-gray-500 leading-relaxed">
                Purpose-built tools to craft, optimize, and organize your professional narrative.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FeatureCard 
                icon={<Zap size={20} />}
                title="AI Resume Optimization"
                desc="Instantly tailor your experience to match specific job descriptions using advanced LLMs."
              />
              <FeatureCard 
                icon={<FileText size={20} />}
                title="ATS Score Analysis"
                desc="Get real-time feedback on formatting and keyword matches before you apply."
              />
              <FeatureCard 
                icon={<LayoutGrid size={20} />}
                title="Multiple Templates"
                desc="Export pixel-perfect, minimalist PDFs that recruiters actually want to read."
              />
              <FeatureCard 
                icon={<Check size={20} />}
                title="Version Control"
                desc="Maintain multiple resume variants for different roles in one organized workspace."
              />
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="w-full py-32 border-b border-gray-200">
          <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-[#0a0a0a] mb-16 text-center">
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <StepItem 
                num="01" 
                title="Add your resume" 
                desc="Upload your existing PDF or build from scratch using our structured form." 
              />
              <StepItem 
                num="02" 
                title="Paste job description" 
                desc="Input the target role. Our AI analyzes the gaps and extracts required ATS keywords." 
              />
              <StepItem 
                num="03" 
                title="Optimize instantly" 
                desc="Generate a tailored, high-scoring resume variant ready for immediate PDF export." 
              />
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="w-full py-32 bg-white text-center">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-4xl font-bold tracking-tight text-[#0a0a0a] mb-6">
              Start building better resumes today
            </h2>
            <p className="text-gray-500 mb-10 text-lg">
              Join thousands of professionals landing interviews faster with AltResume.
            </p>
            <Link href="/signin" className="btn-primary h-12 px-8 text-[15px] inline-flex">
              Get Started for Free
            </Link>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-gray-200 bg-white py-12">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 bg-[#0a0a0a] rounded-none flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-2.5 h-2.5 text-white" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 22h20L12 2z"/></svg>
            </div>
            <span className="font-medium text-[#0a0a0a] text-sm tracking-tight">AltResume</span>
          </div>
          <div className="text-sm text-gray-500">
            © {new Date().getFullYear()} AltResume. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="#" className="hover:text-[#0a0a0a]">Twitter</Link>
            <Link href="#" className="hover:text-[#0a0a0a]">GitHub</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="card-base group hover:border-gray-300 transition-colors">
      <div className="h-10 w-10 flex items-center justify-center border border-gray-200 bg-gray-50 text-gray-900 rounded-none mb-6 group-hover:bg-gray-100 transition-colors">
        {icon}
      </div>
      <h3 className="text-[15px] font-bold text-[#0a0a0a] mb-2">{title}</h3>
      <p className="text-[14px] text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}

function StepItem({ num, title, desc }: { num: string, title: string, desc: string }) {
  return (
    <div className="flex flex-col relative pl-6 border-l border-gray-200">
      <div className="absolute left-0 top-0 w-[5px] h-full bg-gray-200 -ml-[3px] rounded-none hidden md:block group-hover:bg-gray-900 transition-colors"></div>
      <span className="text-sm font-mono text-gray-400 mb-3">{num}</span>
      <h3 className="text-lg font-bold text-[#0a0a0a] mb-2">{title}</h3>
      <p className="text-[15px] text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}
