"use client";

import React from "react";
import type { Build } from "@/lib/types";
import { ComponentCard } from "./component-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThumbsUp, Sparkles, AlertTriangle, MonitorPlay, Gamepad2, Zap, Bot, Info, Loader2, DollarSign, Wallet, Cpu, Server, CircuitBoard, MemoryStick, Database, Power, RectangleVertical, Wind, Heart } from "lucide-react";
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
  const [loadingStep, setLoadingStep] = React.useState(0);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isSaved, setIsSaved] = React.useState(false);
  const user = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

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
                        <div className="relative group">
                            <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full animate-pulse group-hover:bg-red-500/20 transition-colors" />
                            <div className="relative z-10 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-xl group-hover:border-red-500/20 transition-colors">
                                <Loader2 className="h-12 w-12 animate-spin text-emerald-500 group-hover:text-red-500 transition-colors" />
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
                                    <div>
                                        <h4 className="font-headline font-bold uppercase tracking-wider text-sm">Build Design Ready</h4>
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
