"use client";

import { Panel, PanelHeader, PanelTitle, PanelTitleSup, PanelContent } from "@/components/ui/panel";
import { FileText, Wand2, Rocket } from "lucide-react";

export function MinimalFeatures() {
    const features = [
        {
            title: "Add your resume",
            description: "Upload your existing PDF or build from scratch using our structured form.",
            icon: FileText,
            color: "text-[#4f0f62]",
            bg: "bg-[#4f0f62]/10",
            tags: ["PDF parsing", "Structured JSON"]
        },
        {
            title: "Paste job description",
            description: "Input the target role. Our AI analyzes the gaps and extracts required ATS keywords.",
            icon: Wand2,
            color: "text-[#e5b022]",
            bg: "bg-[#ffc629]/20",
            tags: ["Keyword extraction", "Gap analysis"]
        },
        {
            title: "Optimize instantly",
            description: "Generate a tailored, high-scoring resume variant ready for immediate auto-application.",
            icon: Rocket,
            color: "text-green-700",
            bg: "bg-green-100",
            tags: ["Auto-apply", "1-click export"]
        }
    ];

    return (
        <Panel id="features">
            <PanelHeader>
                <PanelTitle>
                    Features
                    <PanelTitleSup>(03)</PanelTitleSup>
                </PanelTitle>
            </PanelHeader>

            <div>
                {features.map((feat, index) => (
                    <div
                        key={index}
                        className="flex items-start hover:bg-[#1c1c1c]/5 transition-colors"
                    >
                        {/* Icon Node */}
                        <div className={`mx-4 mt-4 flex size-8 shrink-0 items-center justify-center rounded-lg border border-[#1c1c1c]/10 ${feat.bg} ${feat.color} ring-1 ring-[#1c1c1c]/5 ring-offset-1 ring-offset-[#f4efe9]`}>
                            <feat.icon className="size-4" />
                        </div>

                        <div className="flex-1 border-l border-dashed border-[#1c1c1c]/20">
                            <div className="p-4">
                                <h3 className="mb-1 leading-snug font-medium text-balance text-[#1c1c1c]">
                                    {feat.title}
                                </h3>
                                <p className="text-sm text-[#1c1c1c]/70 text-balance mb-3">
                                    {feat.description}
                                </p>

                                {/* Tags */}
                                <div className="flex flex-wrap gap-1.5 border-t border-[#1c1c1c]/5 pt-3">
                                    {feat.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="px-2 py-0.5 text-xs rounded border border-[#1c1c1c]/10 bg-[#1c1c1c]/5 text-[#1c1c1c]/70 font-mono"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Panel>
    );
}
