"use client";

import { Panel, PanelHeader, PanelTitle, PanelTitleSup, PanelContent } from "@/components/ui/panel";
import { Pricing2, PricingPlan } from "@/components/ui/pricing2";

export function MinimalPricing() {
    const plans: PricingPlan[] = [
        {
            id: "basic",
            name: "Basic Plan",
            description: "Essential tools for optimizing your resume.",
            monthlyPrice: "$10",
            yearlyPrice: "$8",
            features: [
                { text: "Up to 3 resume variations" },
                { text: "Basic keyword matching" },
                { text: "Standard PDF exports" },
                { text: "Email support" },
            ],
            button: {
                text: "Select Basic",
                url: "/signin?plan=basic-plan"
            }
        },
        {
            id: "pro",
            name: "Pro Plan",
            description: "Advanced automation features for serious job seekers.",
            monthlyPrice: "$25",
            yearlyPrice: "$19",
            features: [
                { text: "Unlimited resume variations" },
                { text: "Deep ATS keyword optimization" },
                { text: "Automated job applications" },
                { text: "Cover letter generation" },
                { text: "Priority support" },
            ],
            button: {
                text: "Select Pro",
                url: "/signin?plan=pro-plan"
            }
        },
        {
            id: "lifetime",
            name: "Lifetime",
            description: "Never pay monthly subscriptions again.",
            monthlyPrice: "$149",
            yearlyPrice: "$149",
            features: [
                { text: "All Pro Plan features forever" },
                { text: "Lifetime updates to ATS algorithm" },
                { text: "Dedicated account manager" },
            ],
            button: {
                text: "Get Lifetime",
                url: "/signin?plan=lifetime"
            }
        }
    ];

    return (
        <Panel id="pricing">
            <PanelHeader>
                <PanelTitle>
                    Pricing
                    <PanelTitleSup>({plans.length})</PanelTitleSup>
                </PanelTitle>
            </PanelHeader>

            <PanelContent className="pt-8 flex justify-center">
                <Pricing2 plans={plans} />
            </PanelContent>
        </Panel>
    );
}
