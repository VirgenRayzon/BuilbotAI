"use client";

import { LensDemo } from "@/components/lens-demo";
import { AppLayout } from "@/components/app-layout";
import { SectionHeader } from "@/components/landing/section-header";
import { useTheme } from "@/context/theme-provider";
import { cn } from "@/lib/utils";

export default function LensPage() {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    return (
        <AppLayout>
            <div className={cn(
                "min-h-screen py-20 px-4",
                isDark ? "bg-background" : "bg-slate-50"
            )}>
                <div className="max-w-4xl mx-auto">
                    <SectionHeader 
                        badge="New UI Feature"
                        title="Neural Lens Technology"
                        subtitle="Experience our new premium magnification lens designed for architectural precision."
                    />
                    
                    <div className="mt-12">
                        <LensDemo />
                    </div>

                    <div className="mt-20 grid gap-8 md:grid-cols-2">
                        <div className={cn(
                            "p-8 rounded-3xl border backdrop-blur-xl",
                            isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-xl"
                        )}>
                            <h3 className="text-xl font-bold font-headline uppercase mb-4">Precision Zoom</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Our new lens uses neural scaling to maintain clarity even at high magnification levels, perfect for inspecting PCB traces and hardware details.
                            </p>
                        </div>
                        <div className={cn(
                            "p-8 rounded-3xl border backdrop-blur-xl",
                            isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-xl"
                        )}>
                            <h3 className="text-xl font-bold font-headline uppercase mb-4">Fluid Motion</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Built on top of Framer Motion, the lens provides buttery smooth tracking and interactive responses that feel premium and responsive.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
