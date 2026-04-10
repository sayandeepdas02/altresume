"use client";
import { Panel, PanelHeader, PanelTitle, PanelTitleSup } from "@/components/ui/panel";
import { Upload, Zap, Download } from "lucide-react";

export function MinimalHowToUse() {
    const steps = [
        {
            title: "Connect your resume",
            desc: "Upload a PDF or DOCX file to seed your profile data.",
            icon: Upload
        },
        {
            title: "Input target job",
            desc: "Paste the role you want. We identify missing ATS keywords automatically.",
            icon: Zap
        },
        {
            title: "Export & Apply",
            desc: "Download a perfectly tailored PDF variant and apply instantly.",
            icon: Download
        }
    ];

    return (
        <Panel id="how-to-use">
            <PanelHeader>
                <PanelTitle>How to Use <PanelTitleSup>(03)</PanelTitleSup></PanelTitle>
            </PanelHeader>
            <div className="flex flex-col sm:flex-row">
                {steps.map((step, i) => (
                    <div key={i} className="flex-1 p-6 border-b sm:border-b-0 sm:border-r border-dashed border-[#1c1c1c]/20 last:border-0 hover:bg-[#1c1c1c]/5 transition-colors">
                        <div className="size-8 rounded-full border border-[#1c1c1c]/20 text-[#1c1c1c] text-xs font-bold flex items-center justify-center mb-4 bg-white/50">{i + 1}</div>
                        <h3 className="font-semibold text-sm mb-2 text-[#1c1c1c]">{step.title}</h3>
                        <p className="text-sm text-[#1c1c1c]/70 leading-relaxed text-balance">{step.desc}</p>
                    </div>
                ))}
            </div>
        </Panel>
    );
}
