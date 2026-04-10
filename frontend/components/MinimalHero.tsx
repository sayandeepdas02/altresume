"use client";

import Link from "next/link";
import { Panel, PanelContent } from "@/components/ui/panel";

export function MinimalHero() {
    return (
        <Panel id="hero" className="border-b border-[#1c1c1c]/10">
            <PanelContent className="pt-24 pb-16 flex flex-col justify-end">
                <div className="flex items-center gap-2 mb-6">
                    <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ffc629] opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ffc629]" />
                    </span>
                    <p className="text-sm font-mono text-[#4f0f62] font-semibold uppercase tracking-wider">
                        Auto-Apply Engine
                    </p>
                </div>
                
                <h1 className="text-4xl md:text-5xl font-semibold text-[#1c1c1c] tracking-tight text-balance mb-6">
                    Apply to 100+ jobs automatically — <span className="text-[#4f0f62]">while you sleep.</span>
                </h1>
                
                <p className="text-[#1c1c1c]/70 text-lg max-w-xl mb-10 text-balance leading-relaxed">
                    Atlresume customizes your resume and auto-applies to jobs for you — 
                    so you never have to manually apply again. Trusted by 1,200+ candidates landing offers at Stripe, Linear, and Vercel.
                </p>
                
                <div className="flex items-center gap-4">
                    <Link 
                        href="/signin" 
                        className="inline-flex items-center justify-center px-6 py-2.5 bg-[#4f0f62] text-[#f4efe9] text-sm font-medium rounded-md hover:bg-[#3d0b4d] transition-colors focus:ring-2 focus:ring-[#4f0f62] focus:ring-offset-2 ring-offset-[#f4efe9]"
                    >
                        Start Applying Automatically
                    </Link>
                    <Link 
                        href="#demo"
                        className="inline-flex items-center justify-center px-6 py-2.5 bg-transparent text-[#1c1c1c] border border-[#1c1c1c]/20 text-sm font-medium rounded-md hover:bg-[#1c1c1c]/5 transition-colors focus:ring-2 focus:ring-[#1c1c1c]/20 focus:ring-offset-2 ring-offset-[#f4efe9]"
                    >
                        Watch Demo
                    </Link>
                </div>
            </PanelContent>
        </Panel>
    );
}
