import { cn } from "@/lib/utils";

interface SeparatorProps {
  className?: string;
  inverse?: boolean;
}

export function Separator({ className, inverse = false }: SeparatorProps) {
    return (
        <div className="w-full relative">
            <div
                className={cn(
                    "relative flex h-8 w-full border-x",
                    inverse ? "border-white/10" : "border-[#1c1c1c]/10",
                    "before:absolute before:-left-[100vw] before:z-0 before:h-8 before:w-[200vw]",
                    inverse
                      ? "before:bg-[repeating-linear-gradient(315deg,rgba(255,255,255,0.05)_0,rgba(255,255,255,0.05)_1px,transparent_0,transparent_50%)]"
                      : "before:bg-[repeating-linear-gradient(315deg,rgba(28,28,28,0.05)_0,rgba(28,28,28,0.05)_1px,transparent_0,transparent_50%)]",
                    "before:bg-[size:10px_10px]",
                    className
                )}
            />
        </div>
    );
}
