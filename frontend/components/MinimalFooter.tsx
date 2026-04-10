"use client";
import { Panel, PanelContent } from "@/components/ui/panel";
import Link from "next/link";
import { Twitter, Github, Linkedin } from "lucide-react";

export function MinimalFooter() {
    const currentYear = new Date().getFullYear();

    const footerLinks = [
        {
            title: "Product",
            links: [
                { title: "Features", href: "#features" },
                { title: "Pricing", href: "#pricing" },
                { title: "How it Works", href: "#how-to-use" },
                { title: "Changelog", href: "#" },
            ],
        },
        {
            title: "Resources",
            links: [
                { title: "Resume Templates", href: "#" },
                { title: "ATS Guide", href: "#" },
                { title: "Blog", href: "#" },
                { title: "Help Center", href: "#" },
            ],
        },
        {
            title: "Company",
            links: [
                { title: "About", href: "#" },
                { title: "Careers", href: "#", badge: "Hiring" },
                { title: "Contact", href: "#" },
                { title: "Partners", href: "#" },
            ],
        },
        {
            title: "Legal",
            links: [
                { title: "Privacy Policy", href: "#" },
                { title: "Terms of Service", href: "#" },
                { title: "Cookie Policy", href: "#" },
            ],
        },
    ];

    return (
        <Panel className="border-b-0!">
            <PanelContent className="pt-16 pb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 mb-16">
                    <div className="lg:col-span-2">
                        <Link href="/" className="inline-flex items-center gap-2 group mb-6">
                            <div className="h-6 w-6 bg-[#ffc629] rounded-md flex items-center justify-center transition-transform group-hover:scale-110 border border-[#1c1c1c]/10 shadow-sm">
                                <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 text-[#1c1c1c]" stroke="currentColor" strokeWidth="3"><path d="M12 2L2 22h20L12 2z"/></svg>
                            </div>
                            <span className="font-bold text-[#4f0f62] text-xl tracking-tight text-balance">AltResume</span>
                        </Link>
                        <p className="text-[#1c1c1c]/70 text-sm mb-6 max-w-sm leading-relaxed">
                            Apply to 100+ jobs automatically while you sleep. The most advanced AI ATS-optimization engine for serious candidates.
                        </p>
                        <div className="flex items-center gap-4">
                            <a href="#" className="p-2 border border-[#1c1c1c]/10 rounded-md text-[#1c1c1c]/60 hover:text-[#4f0f62] hover:border-[#4f0f62]/30 hover:bg-[#4f0f62]/5 transition-all">
                                <Twitter className="size-4" />
                            </a>
                            <a href="#" className="p-2 border border-[#1c1c1c]/10 rounded-md text-[#1c1c1c]/60 hover:text-[#4f0f62] hover:border-[#4f0f62]/30 hover:bg-[#4f0f62]/5 transition-all">
                                <Github className="size-4" />
                            </a>
                            <a href="#" className="p-2 border border-[#1c1c1c]/10 rounded-md text-[#1c1c1c]/60 hover:text-[#4f0f62] hover:border-[#4f0f62]/30 hover:bg-[#4f0f62]/5 transition-all">
                                <Linkedin className="size-4" />
                            </a>
                        </div>
                    </div>

                    <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-8">
                        {footerLinks.map((section) => (
                            <div key={section.title}>
                                <h3 className="font-semibold text-sm text-[#1c1c1c] mb-4">{section.title}</h3>
                                <ul className="space-y-3">
                                    {section.links.map((link) => (
                                        <li key={link.title}>
                                            <Link href={link.href} className="text-sm text-[#1c1c1c]/60 hover:text-[#4f0f62] transition-colors inline-flex items-center gap-2">
                                                {link.title}
                                                {link.badge && (
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#ffc629]/20 text-[#e5b022] border border-[#ffc629]/30">
                                                        {link.badge}
                                                    </span>
                                                )}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-8 border-t border-dashed border-[#1c1c1c]/20 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-[#1c1c1c]/60">
                        © {currentYear} AltResume Inc. All rights reserved.
                    </p>
                    <div className="flex items-center gap-1 text-sm text-[#1c1c1c]/60">
                        <span className="flex h-2 w-2 relative mr-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                        </span>
                        All systems operational
                    </div>
                </div>
            </PanelContent>
        </Panel>
    )
}
