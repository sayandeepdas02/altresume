"use client";
import { Panel, PanelContent } from "@/components/ui/panel";
import Link from 'next/link';

export function MinimalCTA() {
    return (
        <Panel id="cta" className="bg-[#4f0f62] text-white border-[#f4efe9]/10">
            <PanelContent className="py-20 text-center flex flex-col items-center justify-center">
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-xs font-semibold text-white mb-6">
                 <span className="flex h-2 w-2 relative">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ffc629] opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ffc629]"></span>
                 </span>
                 Apply while you sleep
               </div>
               <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
                 Ready to automate your applications?
               </h2>
               <p className="text-xl text-white/80 max-w-xl mb-10 text-balance">
                 Stop spending hours tailoring resumes manually.
               </p>
               <Link href="/signin" className="inline-flex items-center justify-center px-8 py-4 bg-[#ffc629] text-[#1c1c1c] font-bold rounded-md hover:bg-[#e5b022] hover:-translate-y-1 transition-all text-sm shadow-[0_4px_0_0_#d59f13]">
                 Get Started Free
               </Link>
            </PanelContent>
        </Panel>
    );
}
