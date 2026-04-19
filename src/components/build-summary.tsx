"use client";

import React from "react";
import type { Build } from "@/lib/types";
import { ComponentCard } from "./component-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ThumbsUp, Sparkles, AlertTriangle, MonitorPlay, Gamepad2, Zap, Bot, Info, Loader2, DollarSign, Wallet, Cpu, Server, CircuitBoard, MemoryStick, Database, Power, RectangleVertical, Wind } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Skeleton } from "./ui/skeleton";

interface BuildSummaryProps {
  build: Build | null;
  isPending: boolean;
  elapsedTime?: number;
  finalResponseTime?: number | null;
  totalPrice?: number;
}

const componentIcons = {
  "CPU": Cpu,
  "Graphics Card": Server,
  "Motherboard": CircuitBoard,
  "RAM": MemoryStick,
  "Storage": Database,
  "Power Supply": Power,
  "Case": RectangleVertical,
  "Cooler": Wind,
};

const LOADING_STEPS = [
    { title: "CALIBRATING NEURAL ENGINE", sub: "Optimizing for your budget..." },
    { title: "ARCHITECTING SYSTEM", sub: "Balancing CPU and GPU performance..." },
    { title: "VALIDATING COMPATIBILITY", sub: "Checking sockets and dimensions..." },
    { title: "FINALIZING BUILD", sub: "Sourcing best market prices..." }
];

export function BuildSummary({ build, isPending, elapsedTime, finalResponseTime, totalPrice }: BuildSummaryProps) {
  const [loadingStep, setLoadingStep] = React.useState(0);

  React.useEffect(() => {
    if (!isPending) return;
    const interval = setInterval(() => {
        setLoadingStep(s => (s + 1) % LOADING_STEPS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isPending]);

  if (isPending) {
    return (
      <div className="space-y-6">
        <div className="bg-emerald-500/5 rounded-3xl p-12 border border-emerald-500/10 relative overflow-hidden flex flex-col items-center justify-center text-center space-y-8 min-h-[400px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/5 via-transparent to-transparent" />
            
            <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full animate-pulse" />
                <div className="relative z-10 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-xl">
                    <Loader2 className="h-12 w-12 animate-spin text-emerald-500" />
                </div>
            </div>

            <div className="space-y-3 relative z-10">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={loadingStep}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-1"
                    >
                        <div className="flex items-center justify-center gap-3">
                            <p className="text-sm font-black font-headline text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]">
                                {LOADING_STEPS[loadingStep].title}…
                            </p>
                            <span className="text-[10px] font-mono text-emerald-600/80 font-bold bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/10">
                                {elapsedTime}s
                            </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground font-medium tracking-wide">
                            {LOADING_STEPS[loadingStep].sub}
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 w-full opacity-40">
                <Skeleton className="h-48 rounded-3xl" />
                <Skeleton className="h-48 rounded-3xl" />
                <Skeleton className="h-48 rounded-3xl" />
            </div>
        </div>
      </div>
    );
  }

  if (!build) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-8 border-2 border-dashed border-muted-foreground/20 rounded-3xl bg-muted/5 space-y-6">
        <div className="p-5 rounded-3xl bg-primary/5 border border-primary/10">
            <Bot className="h-20 w-20 text-muted-foreground/30" />
        </div>
        <div className="text-center space-y-3">
            <h3 className="text-2xl font-headline font-semibold tracking-tight uppercase">Awaiting Parameters</h3>
            <p className="text-muted-foreground max-w-sm mx-auto text-lg leading-relaxed">
                Submit your requirements on the left to initialize the build generation process.
            </p>
        </div>
      </div>
    );
  }

  const components = [
    { name: "CPU", data: build.cpu },
    { name: "Graphics Card", data: build.gpu },
    { name: "Motherboard", data: build.motherboard },
    { name: "RAM", data: build.ram },
    { name: "Storage", data: build.storage },
    { name: "Power Supply", data: build.psu },
    { name: "Case", data: build.case },
    { name: "Cooler", data: build.cooler },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <div className="bg-emerald-500/10 rounded-3xl p-8 border border-emerald-500/20 relative overflow-hidden group shadow-2xl shadow-emerald-500/5">
          <div className="absolute top-0 right-0 p-4 flex items-center gap-3">
            {finalResponseTime && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-md transition-all group-hover:scale-105">
                    <Bot className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">Generated in {finalResponseTime}s</span>
                </div>
            )}
            {totalPrice && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/30 backdrop-blur-md transition-all group-hover:scale-105">
                    <Wallet className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">₱{totalPrice.toLocaleString()} Total</span>
                </div>
            )}
          </div>

          <div className="flex items-center gap-3 mb-6 text-emerald-600 dark:text-emerald-400">
            <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
                <Bot className="h-6 w-6" />
            </div>
            <div>
                <h3 className="font-headline font-black uppercase tracking-tighter text-2xl">Buildbot <span className="italic opacity-80">Summary</span></h3>
                <div className="h-1 w-12 bg-emerald-500 mt-1 rounded-full" />
            </div>
          </div>

          <div className="relative">
            <p className="text-lg text-foreground/90 leading-relaxed font-medium italic pl-4 border-l-2 border-emerald-500/30">
                "{build.summary}"
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {components.map((component, index) => (
            <motion.div
              key={component.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <ComponentCard 
                name={component.name} 
                component={component.data} 
                icon={componentIcons[component.name as keyof typeof componentIcons] || Cpu}
              />
            </motion.div>
          ))}
        </div>

        <div className="flex items-center justify-center pt-8 border-t border-border/50">
            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 flex items-center gap-6 max-w-lg w-full">
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                    <DollarSign className="w-8 h-8 text-primary" />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 mb-1">Estimated Build Total</p>
                    <p className="text-4xl font-black font-headline tracking-tighter text-primary">
                        ₱{totalPrice?.toLocaleString() || "0.00"}
                    </p>
                </div>
            </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
