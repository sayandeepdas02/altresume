"use client";

import { ArrowRight, CircleCheck } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

interface PricingFeature {
  text: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: string;
  yearlyPrice: string;
  features: PricingFeature[];
  button: {
    text: string;
    url: string;
  };
}

export interface Pricing2Props {
  heading?: string;
  description?: string;
  plans?: PricingPlan[];
}

export const Pricing2 = ({
  heading = "Pricing",
  description = "Check out our affordable pricing plans",
  plans = [],
}: Pricing2Props) => {
  const [isYearly, setIsYearly] = useState(false);
  return (
    <div className="flex flex-col items-center gap-6 text-center w-full">
      <div className="flex items-center gap-3 text-sm font-medium mb-4">
        Monthly
        <Switch
          checked={isYearly}
          onCheckedChange={() => setIsYearly(!isYearly)}
        />
        Yearly
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full items-stretch">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className="flex flex-col justify-between text-left h-full"
          >
            <CardHeader>
              <CardTitle>
                <span>{plan.name}</span>
              </CardTitle>
              <p className="text-sm text-[#1c1c1c]/70 min-h-[40px]">
                {plan.description}
              </p>
              <span className="text-4xl font-bold mt-2">
                {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
              </span>
              <p className="text-sm text-[#1c1c1c]/60 mt-1">
                Billed{" "}
                {isYearly
                  ? `$${Number(plan.yearlyPrice.slice(1)) * 12}`
                  : `$${Number(plan.monthlyPrice.slice(1)) * 12}`}{" "}
                annually
              </p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <hr className="mb-6 border-[#1c1c1c]/10" />
              {plan.id === "pro" && (
                <p className="mb-3 font-semibold text-sm text-[#4f0f62]">
                  Everything in Plus, and:
                </p>
              )}
              <ul className="space-y-4 mb-auto">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-[#1c1c1c]/80 text-sm">
                    <CircleCheck className="size-4 shrink-0 mt-0.5 text-[#4f0f62]" />
                    <span>{feature.text}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="mt-4">
              <Button asChild className="w-full" variant={plan.id === 'pro' ? 'default' : 'outline'}>
                <a href={plan.button.url} target="_blank">
                  {plan.button.text}
                  <ArrowRight className="ml-2 size-4" />
                </a>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};
