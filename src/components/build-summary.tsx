"use client";

import React from "react";
import type { Build } from "@/lib/types";
import { ComponentCard } from "./component-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    }, 3000);
    return () => clearInterval(interval);
  }, [isPending]);

  return (
    <Card className="w-full bg-gradient-to-br from-card to-secondary/10 border-primary/20 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-primary to-emerald-500 animate-pulse z-20" />
        
        <CardHeader>
            <CardTitle className="flex items-center justify-between font-headline text-2xl">
                <div className="flex items-center gap-2">
                    <Bot className="h-6 w-6 text-emerald-500" />
                    Buildbot Build Architect
                </div>
                {finalResponseTime && !isPending && (
                    <div className="flex items-center gap-1.5 opacity-40 hover:opacity-100 transition-opacity">
                        <Zap className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Architected in {finalResponseTime}s</span>
                    </div>
                )}
            </CardTitle>
            <CardDescription>
                Generate a professional component list based on your specific requirements.
            </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
            <AnimatePresence mode="wait">
                {isPending ? (
                    <motion.div 
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-12 space-y-8"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full animate-pulse" />
                            <div className="relative z-10 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-xl">
                                <Loader2 className="h-12 w-12 animate-spin text-emerald-500" />
                            </div>
                        </div>

                        <div className="text-center h-16 flex flex-col items-center justify-center overflow-hidden">
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

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 w-full opacity-20">
                            <Skeleton className="h-40 rounded-2xl" />
                            <Skeleton className="h-40 rounded-2xl" />
                            <Skeleton className="h-40 rounded-2xl" />
                        </div>
                    </motion.div>
                ) : !build ? (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-16 px-8 border-2 border-dashed border-muted-foreground/20 rounded-xl bg-muted/5 space-y-6"
                    >
                        <Bot className="h-20 w-20 text-muted-foreground/30" />
                        <div className="text-center space-y-3">
                            <h3 className="text-2xl font-headline font-semibold tracking-tight uppercase">System Offline</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto text-lg leading-relaxed">
                                Submit your requirements on the left to initialize the build generation process.
                            </p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="content"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        {/* Summary Section */}
                        <div className="bg-emerald-500/10 rounded-2xl p-6 border border-emerald-500/20 relative overflow-hidden group">
                            <div className="flex items-center gap-3 mb-4 text-emerald-600 dark:text-emerald-400">
                                <Sparkles className="h-5 w-5" />
                                <h4 className="font-headline font-bold uppercase tracking-widest text-sm">Architect's Summary</h4>
                            </div>
                            <p className="text-base text-foreground/90 leading-relaxed italic pl-4 border-l-2 border-emerald-500/40">
                                "{build.summary}"
                            </p>
                        </div>

                        {/* Components Grid */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { name: "CPU", data: build.cpu },
                                { name: "Graphics Card", data: build.gpu },
                                { name: "Motherboard", data: build.motherboard },
                                { name: "RAM", data: build.ram },
                                { name: "Storage", data: build.storage },
                                { name: "Power Supply", data: build.psu },
                                { name: "Case", data: build.case },
                                { name: "Cooler", data: build.cooler },
                            ].map((component, index) => (
                                <motion.div
                                    key={component.name}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                >
                                    <ComponentCard 
                                        name={component.name} 
                                        component={component.data} 
                                        icon={componentIcons[component.name as keyof typeof componentIcons] || Cpu}
                                    />
                                </motion.div>
                            ))}
                        </div>

                        {/* Price Footer */}
                        {totalPrice && (
                            <div className="flex items-center justify-center pt-8 border-t border-border/50">
                                <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 flex items-center gap-6 max-w-lg w-full shadow-inner">
                                    <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                                        <DollarSign className="w-8 h-8 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 mb-1">Estimated Configuration Total</p>
                                        <p className="text-4xl font-black font-headline tracking-tighter text-primary">
                                            ₱{totalPrice.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </CardContent>
    </Card>
  );
}
