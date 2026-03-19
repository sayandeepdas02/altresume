'use client';

import Link from 'next/link';
import { Inter } from 'next/font/google';
import { useState } from 'react';
import { X, CheckCircle2, ChevronDown, UploadCloud, FileText, Zap } from 'lucide-react';

const inter = Inter({ subsets: ['latin'] });

export default function LandingPage() {
    return (
        <div className={`min-h-screen bg-white text-[#0A0A0A] selection:bg-black selection:text-white font-sans overflow-x-hidden ${inter.className}`}>
            
            {/* Minimal Sticky Nav */}
            <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="flex items-center gap-10">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="h-7 w-7 bg-black rounded-lg flex items-center justify-center shadow-sm transition-transform group-hover:scale-105">
                            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 22h20L12 2z"/></svg>
                        </div>
                        <span className="font-semibold text-lg tracking-tight text-gray-900">AltResume</span>
                    </Link>
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
                        <a href="#features" className="hover:text-gray-900 transition-colors">Use cases</a>
                        <a href="#about" className="hover:text-gray-900 transition-colors">About</a>
                        <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
                    </div>
                </div>
                <div>
                    <Link href="/signin" className="text-sm font-medium px-5 py-2.5 bg-black text-white rounded-xl shadow-sm hover:opacity-90 transition-opacity">
                        Get started
                    </Link>
                </div>
            </nav>

            {/* HERO SECTION - Left Aligned, Premium 1280px container */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                {/* Subtle light background blobbiness */}
                <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[800px] h-[600px] bg-gradient-to-b from-gray-50 to-white rounded-full blur-3xl -z-10 opacity-60"></div>

                <div className="flex flex-col items-start text-left z-10">
                    <div className="inline-flex items-center gap-2 text-xs font-medium text-gray-600 mb-6 border border-gray-200 bg-gray-50 px-3 py-1 rounded-full shadow-sm">
                        <Zap className="h-3 w-3" />
                        <span>Introducing the AltResume Framework</span>
                    </div>
                    
                    <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 mb-6 leading-[1.1] max-w-xl">
                        Reimagine your application with autonomous formatting.
                    </h1>
                    
                    <p className="text-lg text-gray-600 mb-10 leading-relaxed max-w-lg">
                        Your on-demand career agent. Automate tedious formatting, seamlessly map your experience to job descriptions, and confidently export ATS-perfect PDFs.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                        <Link href="/login" className="w-full sm:w-auto px-6 py-3 bg-black text-white font-medium rounded-xl hover:opacity-90 transition-opacity shadow-md text-center">
                            Start Optimizing
                        </Link>
                        <a href="#features" className="w-full sm:w-auto px-6 py-3 bg-white text-gray-900 border border-gray-300 font-medium rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-center">
                            View use cases
                        </a>
                    </div>
                </div>

                {/* Right Visual Box - Extremely minimalist wireframe aesthetic */}
                <div className="relative w-full aspect-square max-w-lg mx-auto lg:ml-auto z-10">
                    <div className="absolute inset-0 bg-gray-50 rounded-2xl border border-gray-200 shadow-sm flex flex-col p-6 overflow-hidden">
                        {/* Fake UI Header */}
                        <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
                            <div className="h-4 w-24 bg-gray-200 rounded"></div>
                            <div className="flex gap-2">
                                <div className="h-3 w-3 rounded-full bg-red-400"></div>
                                <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
                                <div className="h-3 w-3 rounded-full bg-green-400"></div>
                            </div>
                        </div>
                        {/* Fake Document Lines */}
                        <div className="space-y-4 flex-1">
                            <div className="h-6 w-3/4 bg-gray-200 rounded"></div>
                            <div className="h-4 w-1/4 bg-gray-100 rounded mb-8"></div>
                            
                            <div className="h-4 w-full bg-gray-100 rounded"></div>
                            <div className="h-4 w-full bg-gray-100 rounded"></div>
                            <div className="h-4 w-5/6 bg-gray-100 rounded"></div>
                            
                            <div className="h-[1px] w-full bg-gray-200 my-6"></div>
                            
                            {/* AI Scanning block */}
                            <div className="relative p-4 rounded-xl border border-green-200 bg-green-50 overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center">
                                        <CheckCircle2 className="h-3 w-3 text-white" />
                                    </div>
                                    <div className="h-3 w-32 bg-green-200 rounded"></div>
                                </div>
                                <div className="h-3 w-full bg-green-100 rounded mt-2"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* TRUST / LOGOS */}
            <section className="py-12 border-y border-gray-100 bg-gray-50/50">
                <div className="max-w-[1280px] mx-auto px-6 flex flex-wrap justify-between items-center gap-8 opacity-40 grayscale filter">
                    <div className="flex items-center gap-2 font-bold text-xl tracking-tighter text-black"><div className="w-5 h-5 rounded-full bg-black"></div> Startup</div>
                    <div className="flex items-center gap-2 font-bold text-xl text-black"><div className="w-5 h-5 rounded border-2 border-black"></div> Camera</div>
                    <div className="flex items-center gap-2 font-bold text-xl text-black"><div className="w-6 h-3 bg-black rounded-full"></div> Cloudly</div>
                    <div className="flex items-center gap-2 font-bold text-xl text-black"><div className="w-5 h-5 rotate-45 border-r-2 border-b-2 border-black"></div> Techlify</div>
                    <div className="flex items-center gap-2 font-bold text-xl text-black"><div className="w-5 h-5 rounded-md bg-black"></div> Apply</div>
                </div>
            </section>

            {/* FEATURES SECTION - 3 Columns */}
            <section id="features" className="py-24 sm:py-32 px-6 max-w-[1280px] mx-auto">
                <div className="text-left mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-4">Powerful features, zero friction</h2>
                    <p className="text-lg text-gray-500 max-w-2xl leading-relaxed">Everything you need to perfectly map your existing career history to strict technical requirements instantly.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <FeatureCard 
                        icon={<UploadCloud className="h-5 w-5 text-gray-700" />} 
                        title="Universal Parsing" 
                        desc="Drop any PDF or DOCX file. Our engine flawlessly extracts your entire history formatting." 
                    />
                    <FeatureCard 
                        icon={<FileText className="h-5 w-5 text-gray-700" />} 
                        title="Intelligent Targeting" 
                        desc="Paste your Job Description. The system automatically benchmarks missing ATS keywords." 
                    />
                    <FeatureCard 
                        icon={<Zap className="h-5 w-5 text-gray-700" />} 
                        title="One-Click Rewrite" 
                        desc="Our LLM architecture rebuilds your bullets mathematically optimizing impact scores." 
                    />
                </div>
            </section>

            {/* COMPARISON SECTION */}
            <section className="py-24 sm:py-32 px-6 bg-gray-50 border-y border-gray-100">
                <div className="max-w-[1000px] mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-4">Why Choose AltResume</h2>
                        <p className="text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">Stop relying on slow, manual workflows. Automate the heavy lifting.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm">
                        <div className="p-10 border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50/50">
                            <h3 className="text-center text-gray-500 font-medium mb-8 pb-4 border-b border-gray-200">Other tools</h3>
                            <ul className="space-y-6">
                                <CompareItem text="Manual task delegation" type="cross" />
                                <CompareItem text="Static, generic keyword stuffing" type="cross" />
                                <CompareItem text="Constant hallucinated facts" type="cross" />
                                <CompareItem text="Costly review subscriptions" type="cross" />
                            </ul>
                        </div>
                        <div className="p-10">
                            <h3 className="text-center text-gray-900 font-semibold mb-8 pb-4 border-b border-gray-200 flex items-center justify-center gap-2">
                                <div className="h-4 w-4 bg-black rounded flex items-center justify-center">
                                    <svg viewBox="0 0 24 24" fill="none" className="w-2.5 h-2.5 text-white" stroke="currentColor" strokeWidth="3"><path d="M12 2L2 22h20L12 2z"/></svg>
                                </div>
                                AltResume
                            </h3>
                            <ul className="space-y-6">
                                <CompareItem text="End-to-end task automation" type="check" />
                                <CompareItem text="Unified analysis across all data" type="check" />
                                <CompareItem text="Reliable, factual AI guardrails" type="check" />
                                <CompareItem text="Free PDF exports on demand" type="check" />
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* PRICING SECTION */}
            <section id="pricing" className="py-24 sm:py-32 px-6 max-w-[1280px] mx-auto text-center">
                <span className="text-sm font-semibold tracking-wide text-gray-500 uppercase mb-4 block">Pricing</span>
                <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 mb-4">Plans built for speed and scale</h2>
                <p className="text-gray-500 mb-16">*Save 20% on yearly plans.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[900px] mx-auto text-left">
                    {/* Starter */}
                    <div className="bg-white p-10 rounded-2xl border border-gray-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-2xl font-semibold text-gray-900">Starter</h3>
                            <span className="text-xs font-medium border border-gray-200 bg-gray-50 px-3 py-1 rounded-full text-gray-500">Yearly</span>
                        </div>
                        <p className="text-gray-500 text-sm mb-8 leading-relaxed">Best for candidates running occasional tests on ATS scanners.</p>
                        <div className="mb-8">
                            <span className="text-5xl font-bold tracking-tight text-gray-900">$8</span><span className="text-gray-500 font-medium"> / mo</span>
                        </div>
                        <Link href="/signin" className="w-full text-center py-3 bg-white border border-gray-300 text-gray-900 font-medium rounded-xl hover:bg-gray-50 transition-colors mb-8 shadow-sm">
                            Get started
                        </Link>
                        <ul className="space-y-4 text-sm text-gray-600 flex-1">
                            <PricingItem text="Automate 3 core workflows" />
                            <PricingItem text="Up to 5 AI agents" />
                            <PricingItem text="Standard integrations" />
                            <PricingItem text="Basic analytics" />
                        </ul>
                    </div>

                    {/* Pro */}
                    <div className="bg-white p-10 rounded-2xl border-2 border-gray-900 shadow-lg flex flex-col relative">
                        <div className="absolute top-0 right-10 -translate-y-1/2">
                            <span className="bg-black text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">POPULAR</span>
                        </div>
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-2xl font-semibold text-gray-900">Pro</h3>
                            <span className="text-xs font-medium border border-gray-200 bg-gray-50 px-3 py-1 rounded-full text-gray-500">Yearly</span>
                        </div>
                        <p className="text-gray-500 text-sm mb-8 leading-relaxed">Best for professionals ready to fully optimize their job-seeking ops.</p>
                        <div className="mb-8">
                            <span className="text-5xl font-bold tracking-tight text-gray-900">$18</span><span className="text-gray-500 font-medium"> / mo</span>
                        </div>
                        <Link href="/signin" className="w-full text-center py-3 bg-black text-white font-medium rounded-xl hover:opacity-90 transition-opacity mb-8 shadow-sm">
                            Get started
                        </Link>
                        <ul className="space-y-4 text-sm text-gray-600 flex-1">
                            <PricingItem text="Unlimited workflows" />
                            <PricingItem text="Chrome extension access" />
                            <PricingItem text="Premium tracking analytics" />
                            <PricingItem text="Priority AI processing" />
                        </ul>
                    </div>
                </div>
            </section>

            {/* FAQ SECTION */}
            <section id="about" className="py-24 sm:py-32 px-6 bg-gray-50 border-t border-gray-200">
                <div className="max-w-[700px] mx-auto">
                    <span className="text-sm font-semibold tracking-wide text-gray-500 uppercase mb-4 block text-center">FAQ</span>
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-12 text-center">Frequently asked questions</h2>

                    <div className="border-t border-gray-200">
                        <FAQItem 
                            question="What exactly does an AI agent do?" 
                            answer="AltResume agents handle end-to-end workflows — from gathering your isolated document history to structurally binding it against your specific corporate targets — without needing constant human input." 
                            isOpen={true} 
                        />
                        <FAQItem question="How long does it take to get started?" answer="Setting up your account takes less than 30 seconds via Google OAuth. You can have your first fully tailored resume within 2 minutes." />
                        <FAQItem question="Do I need technical skills to use this?" answer="Not at all! Our intuitive dashboard requires zero coding. You just drag, drop, and paste." />
                        <FAQItem question="Is my data secure?" answer="Completely. We strictly parse objects in-memory and wipe intermediate tokens. We NEVER train base foundation models on your CV." />
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="py-12 bg-white border-t border-gray-200 px-6">
                <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 bg-black rounded flex items-center justify-center">
                            <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3 text-white" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 22h20L12 2z"/></svg>
                        </div>
                        <span className="font-semibold text-gray-900 text-sm">AltResume</span>
                    </div>
                    
                    <div className="flex items-center gap-8 text-sm text-gray-500">
                        <a href="#" className="hover:text-gray-900 transition-colors">Home</a>
                        <a href="#features" className="hover:text-gray-900 transition-colors">Use cases</a>
                        <a href="#about" className="hover:text-gray-900 transition-colors">About</a>
                        <a href="#" className="hover:text-gray-900 transition-colors">Careers</a>
                        <a href="#" className="hover:text-gray-900 transition-colors">Contact</a>
                    </div>
                    
                    <div className="flex gap-6 text-xs text-gray-400">
                        <a href="#" className="hover:text-gray-600 transition-colors">Privacy policy</a>
                        <a href="#" className="hover:text-gray-600 transition-colors">Terms & conditions</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div className="flex flex-col gap-4 p-8 rounded-2xl border border-gray-200 bg-white hover:shadow-md transition-shadow duration-200 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 border border-gray-100 group-hover:bg-gray-100 transition-colors">
                {icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-gray-500 leading-relaxed text-sm">{desc}</p>
        </div>
    );
}

function CompareItem({ text, type }: { text: string, type: 'check' | 'cross' }) {
    return (
        <li className="flex items-center gap-3 text-sm">
            <div className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${type === 'check' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'}`}>
                {type === 'check' ? (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                ) : (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                )}
            </div>
            <span className={type === 'check' ? 'text-gray-900 font-medium' : 'text-gray-500'}>{text}</span>
        </li>
    );
}

function PricingItem({ text }: { text: string }) {
    return (
        <li className="flex items-center gap-3">
            <CheckCircle2 className="h-4 w-4 text-gray-900 shrink-0" />
            <span>{text}</span>
        </li>
    );
}

function FAQItem({ question, answer, isOpen = false }: { question: string, answer?: string, isOpen?: boolean }) {
    const [open, setOpen] = useState(isOpen);
    return (
        <div className="border-b border-gray-200">
            <button 
                onClick={() => setOpen(!open)} 
                className="w-full py-6 flex flex-col items-start gap-4 text-left focus:outline-none group hover:bg-white transition-colors"
            >
                <div className="w-full flex justify-between items-center text-gray-900">
                    <span className="font-semibold text-lg">{question}</span>
                    <span className="text-gray-400 group-hover:text-gray-900 transition-colors">
                        {open ? <X className="h-5 w-5"/> : <span className="text-2xl font-light leading-none">+</span>}
                    </span>
                </div>
                {open && answer && (
                    <div className="text-gray-500 leading-relaxed pr-8 text-base">
                        {answer}
                    </div>
                )}
            </button>
        </div>
    );
}
