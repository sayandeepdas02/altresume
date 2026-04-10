'use client';

import Navbar from '@/components/Navbar';
import { MinimalHero } from '@/components/MinimalHero';
import { MinimalFeatures } from '@/components/MinimalFeatures';
import { MinimalHowToUse } from '@/components/MinimalHowToUse';
import { MinimalPricing } from '@/components/MinimalPricing';
import { MinimalTestimonial } from '@/components/MinimalTestimonial';
import { MinimalCTA } from '@/components/MinimalCTA';
import { MinimalFooter } from '@/components/MinimalFooter';

import { Separator } from '@/components/ui/separator';

export default function LandingPage() {
  return (
    <div suppressHydrationWarning className="min-h-screen bg-[#f4efe9] text-[#1c1c1c] selection:bg-[#ffc629]/30 font-sans">
      <main className="mx-auto max-w-7xl w-full flex flex-col">
        <Navbar />
        <MinimalHero />
        <Separator />
        <MinimalFeatures />
        <Separator />
        <MinimalHowToUse />
        <Separator />
        <MinimalPricing />
        <Separator />
        <MinimalTestimonial />
        <Separator />
        <MinimalCTA />
        <Separator />
        <MinimalFooter />
      </main>
    </div>
  );
}
