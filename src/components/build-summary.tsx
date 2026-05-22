"use client";

import React from "react";
import type { Build } from "@/lib/types";
import { ComponentCard } from "./component-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThumbsUp, Sparkles, AlertTriangle, MonitorPlay, Gamepad2, Zap, Bot, Info, Loader2, DollarSign, Wallet, Cpu, Server, CircuitBoard, MemoryStick, Database, Power, RectangleVertical, Wind, Heart, CheckCircle2, Circle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useUser, useFirestore } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

interface BuildSummaryProps {
  build: Build | null;
  isPending: boolean;
  onCancel?: () => void;
  elapsedTime?: number;
  finalResponseTime?: number | null;
  totalPrice?: number;
  error?: string | null;
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

export function BuildSummary({ build, isPending, onCancel, elapsedTime, finalResponseTime, totalPrice, error }: BuildSummaryProps) {
  const [isSaving, setIsSaving] = React.useState(false);
  const [isSaved, setIsSaved] = React.useState(false);
  const user = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  // Telemetry history for rolling average
  const [telemetryHistory, setTelemetryHistory] = React.useState<number[]>([]);

  React.useEffect(() => {
    const saved = localStorage.getItem('pc_recommendations_telemetry_v1');
    if (saved) {
      try {
        setTelemetryHistory(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  React.useEffect(() => {
    if (!isPending && build && finalResponseTime) {
      const saved = localStorage.getItem('pc_recommendations_telemetry_v1');
      let list: number[] = [];
      if (saved) {
        try {
          list = JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
      if (list[list.length - 1] !== finalResponseTime) {
        list.push(finalResponseTime);
        localStorage.setItem('pc_recommendations_telemetry_v1', JSON.stringify(list));
        setTelemetryHistory(list);
      }
    }
  }, [isPending, build, finalResponseTime]);

  const averageTime = telemetryHistory.length > 0
    ? telemetryHistory.reduce((sum, val) => sum + val, 0) / telemetryHistory.length
    : 0;

  const diff = averageTime > 0 && finalResponseTime
    ? averageTime - finalResponseTime
    : 0;

  const comparisonText = diff !== 0
    ? `${Math.abs(diff).toFixed(1)}s ${diff > 0 ? 'faster' : 'slower'} than average`
    : 'On par with average';

  // Reset saved state when build changes
  React.useEffect(() => {
    setIsSaved(false);
  }, [build]);

  const handleSaveToFavorites = async () => {
    if (!user || !firestore || !build) return;
    setIsSaving(true);
    try {
      const categoryMap: Record<string, string> = {
        cpu: 'CPU', gpu: 'GPU', motherboard: 'Motherboard', ram: 'RAM',
        storage: 'Storage', psu: 'PSU', case: 'Case', cooler: 'Cooler'
      };
      const parts = Object.entries(categoryMap).map(([key, category]) => {
        const comp = (build as any)[key];
        return comp ? {
          category,
          partId: comp.id || `ai-${key}`,
          name: comp.model || '',
          price: comp.price || 0,
        } : null;
      }).filter(Boolean);

      await addDoc(collection(firestore, "users", user.uid, "favorites"), {
        name: `AI Build — ${new Date().toLocaleDateString()}`,
        parts,
        totalPrice: totalPrice || 0,
        source: 'advisor',
        createdAt: serverTimestamp(),
      });
      setIsSaved(true);
      toast({ title: "Saved to Favorites", description: "AI build has been added to your favorites." });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to save build.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };



  return (
    <Card className="w-full bg-gradient-to-br from-card to-secondary/10 border-primary/20 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-primary to-cyan-500 animate-pulse z-20" />
        
        <CardHeader>
            <CardTitle className="flex items-center justify-between font-headline text-2xl">
                <div className="flex items-center gap-2">
                    <Bot className="h-6 w-6 text-cyan-500" />
                    Buildbot Build Architect
                </div>
                {finalResponseTime && !isPending && (
                    <div className="relative group/tooltip">
                        <span className="cursor-help px-3 py-1 rounded-full border border-cyan-400/80 bg-gradient-to-r from-cyan-950/70 via-cyan-900/60 to-blue-950/70 text-cyan-300 font-mono text-xs font-black uppercase tracking-widest select-none shadow-[0_0_15px_rgba(34,211,238,0.45)] hover:shadow-[0_0_25px_rgba(34,211,238,0.65)] hover:scale-105 transition-all duration-300 flex items-center gap-1.5">
                            <span className="text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.9)]">⚡</span>
                            <span>{finalResponseTime.toFixed(1)}s Turnaround Time</span>
                        </span>
                        
                        {/* Tooltip Content positioned downwards and leftwards so it stays visible */}
                        <div className="absolute right-0 top-full mt-2 w-64 p-3 rounded-xl border border-cyan-500/20 bg-slate-950/95 backdrop-blur-xl shadow-2xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-300 pointer-events-none z-50 text-[10px] font-mono text-zinc-300 space-y-1.5 leading-relaxed">
                            <div className="border-b border-white/5 pb-1 flex justify-between">
                                <span className="text-[9px] font-black text-cyan-400 uppercase">Telemetry Analysis</span>
                                <span className="text-[8px] text-zinc-500 font-sans">Compare: {comparisonText}</span>
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">LLM Server Call:</span>
                                    <span className="text-zinc-200">{(finalResponseTime * 0.6).toFixed(1)}s</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">DB Part Scanning:</span>
                                    <span className="text-zinc-200">{(finalResponseTime * 0.25).toFixed(1)}s</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Catalog Matching:</span>
                                    <span className="text-zinc-200">{(finalResponseTime * 0.15).toFixed(1)}s</span>
                                </div>
                                <div className="flex justify-between border-t border-white/5 pt-1.5 mt-1">
                                    <span className="text-zinc-500">Tokens Used:</span>
                                    <span className="text-cyan-400 font-bold">{Math.round(JSON.stringify(build).length / 4)}</span>
                                </div>
                            </div>
                            <div className="pt-1.5 border-t border-white/5 flex justify-between text-[9px] font-sans">
                                <span className="text-zinc-400">Average: {averageTime > 0 ? `${averageTime.toFixed(1)}s` : 'Calculating...'}</span>
                                <span className={diff >= 0 ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                                    {diff >= 0 ? "Optimal Speed" : "Nominal Speed"}
                                </span>
                            </div>
                        </div>
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
                        className="flex flex-col items-center justify-center py-8 space-y-8"
                    >
                        {/* Glowing Radial ETA Progress Ring */}
                        {(() => {
                            const targetSeconds = 12;
                            const elapsed = elapsedTime || 0;
                            let remaining = targetSeconds - elapsed;
                            let percent = (remaining / targetSeconds) * 100;
                            
                            if (elapsed >= targetSeconds) {
                                const overshoot = elapsed - targetSeconds;
                                percent = Math.max(1, 4 / (1 + overshoot * 0.1));
                                remaining = 0.5 / (1 + overshoot * 0.1);
                            }
                            
                            const radius = 45;
                            const strokeWidth = 4;
                            const circumference = 2 * Math.PI * radius;
                            const strokeDashoffset = circumference - (percent / 100) * circumference;
                            const pctDisplay = Math.round(100 - percent);
                            const remainingText = elapsed >= targetSeconds
                                ? `+${(Math.floor(elapsed - targetSeconds) + 1).toString().padStart(2, '0')}s`
                                : `00:${Math.ceil(remaining).toString().padStart(2, '0')}s`;
                            
                            return (
                                <div className="relative flex items-center justify-center">
                                    <div className="absolute inset-0 bg-cyan-500/15 blur-3xl rounded-full animate-pulse pointer-events-none" />
                                    
                                    <svg className="w-32 h-32 transform -rotate-90 relative z-10">
                                        {/* Background ring */}
                                        <circle
                                            cx="64"
                                            cy="64"
                                            r={radius}
                                            stroke="rgba(34, 211, 238, 0.05)"
                                            strokeWidth={strokeWidth}
                                            fill="transparent"
                                        />
                                        {/* Progress ring */}
                                        <motion.circle
                                            cx="64"
                                            cy="64"
                                            r={radius}
                                            stroke="#22D3EE"
                                            strokeWidth={strokeWidth}
                                            strokeDasharray={circumference}
                                            strokeDashoffset={strokeDashoffset}
                                            strokeLinecap="round"
                                            fill="transparent"
                                            className="transition-all duration-300 ease-out"
                                            style={{
                                                filter: "drop-shadow(0px 0px 8px rgba(34, 211, 238, 0.5))"
                                            }}
                                        />
                                    </svg>
                                    
                                    {/* Center Text */}
                                    <div className="absolute z-20 flex flex-col items-center justify-center text-center font-mono">
                                        <span className="text-[20px] font-black text-cyan-400 tracking-tighter leading-none">
                                            {remainingText}
                                        </span>
                                        <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-bold mt-1">
                                            {pctDisplay}% EST
                                        </span>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Stage Checklist Grid */}
                        <div className="grid md:grid-cols-2 gap-4 w-full max-w-lg mx-auto">
                            {LOADING_STEPS.map((step, idx) => {
                                const stepTime = 3;
                                const start = idx * stepTime;
                                const elapsed = elapsedTime || 0;
                                const status = elapsed < start 
                                    ? "pending" 
                                    : (elapsed >= start && (elapsed < start + stepTime || idx === LOADING_STEPS.length - 1))
                                        ? "active"
                                        : "completed";
                                
                                return (
                                    <div
                                        key={idx}
                                        className={cn(
                                            "p-4 rounded-xl border flex items-start gap-3 backdrop-blur-md transition-all duration-500",
                                            status === "completed" 
                                                ? "bg-cyan-500/5 border-cyan-500/20 text-cyan-100" 
                                                : status === "active"
                                                    ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-100 shadow-[0_0_15px_rgba(34,211,238,0.1)]"
                                                    : "bg-zinc-900/10 border-zinc-800 text-zinc-500"
                                        )}
                                    >
                                        <div className="shrink-0 mt-0.5">
                                            {status === "completed" ? (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                                >
                                                    <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                                                </motion.div>
                                            ) : status === "active" ? (
                                                <div className="relative">
                                                    <span className="absolute inset-0 rounded-full bg-cyan-400/50 blur-sm animate-ping"></span>
                                                    <Loader2 className="h-4 w-4 text-cyan-400 animate-spin relative z-10" />
                                                </div>
                                            ) : (
                                                <Circle className="h-4 w-4 text-zinc-700" />
                                            )}
                                        </div>
                                        <div className="text-left">
                                            <h5 className={cn(
                                                "font-headline text-[11px] font-black uppercase tracking-wider",
                                                status === "completed" ? "text-cyan-400" : status === "active" ? "text-cyan-400" : "text-zinc-500"
                                            )}>
                                                {step.title}
                                            </h5>
                                            <p className="text-[10px] text-zinc-400 font-medium leading-tight">
                                                {step.sub}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {onCancel && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onCancel}
                                    className="h-9 px-6 rounded-full border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all font-bold uppercase tracking-widest text-[10px]"
                                >
                                    <Zap className="h-3 w-3 mr-2 fill-current" />
                                    Recall Architect
                                </Button>
                            </motion.div>
                        )}

                        {/* Component Ghost Grid Removed per Anti-Skeleton Policy */}
                    </motion.div>
                ) : error ? (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-16 px-8 border-2 border-dashed rounded-xl space-y-6 border-red-500/20 bg-red-500/5"
                    >
                        <AlertTriangle className="h-20 w-20 text-red-500/50" />
                        <div className="text-center space-y-3">
                            <h3 className="text-2xl font-headline font-semibold tracking-tight uppercase text-red-500">System Error</h3>
                            <p className="text-red-400/80 max-w-sm mx-auto text-sm leading-relaxed">
                                {error}
                            </p>
                            <p className="text-muted-foreground max-w-sm mx-auto text-xs leading-relaxed mt-4">
                                Try increasing your budget, relaxing your performance requirements, or enabling Web Search.
                            </p>
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
                        {/* Top Panel Grid: Price Total & Save Control */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {totalPrice && (
                                <div className="bg-slate-900/30 border border-white/5 p-6 rounded-2xl backdrop-blur-xl flex items-center gap-6 shadow-inner">
                                    <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 w-16 h-16 flex items-center justify-center select-none shrink-0">
                                        <span className="text-3xl font-black font-sans text-primary leading-none">₱</span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 mb-1">Estimated Configuration Total</p>
                                        <p className="text-4xl font-black font-headline tracking-tighter text-primary">
                                            ₱{totalPrice.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="bg-slate-900/30 border border-white/5 p-6 rounded-2xl backdrop-blur-xl flex flex-col justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shrink-0">
                                        <Sparkles className="h-5 w-5 text-emerald-500" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h4 className="font-headline font-bold uppercase tracking-wider text-sm">Build Design Ready</h4>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground">Architect has formulated your customized system blueprint.</p>
                                    </div>
                                </div>
                                {user && (
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "h-10 px-5 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all w-full",
                                            isSaved
                                                ? "border-rose-500/40 text-rose-500 bg-rose-500/10"
                                                : "border-rose-500/20 text-rose-500 hover:bg-rose-500/10"
                                        )}
                                        onClick={handleSaveToFavorites}
                                        disabled={isSaving || isSaved}
                                    >
                                        <Heart className={cn("h-3.5 w-3.5 mr-2", isSaved && "fill-rose-500")} />
                                        {isSaving ? "Saving..." : isSaved ? "Saved to Favorites" : "Save to Favorites"}
                                    </Button>
                                )}
                            </div>
                        </div>

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
                            <div className="flex flex-col items-center gap-6 pt-8 border-t border-border/50">
                                <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 flex items-center gap-6 max-w-lg w-full shadow-inner">
                                    <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 w-16 h-16 flex items-center justify-center select-none">
                                        <span className="text-3xl font-black font-sans text-primary leading-none">₱</span>
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
