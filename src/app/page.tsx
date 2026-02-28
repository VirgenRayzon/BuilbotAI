'use client';

import { Button } from '@/components/ui/button';
import { useUserProfile } from '@/context/user-profile';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';
import { Loader2, ArrowRight, Cpu, Sparkles, MonitorSmartphone, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function StartPage() {
  const { authUser, loading } = useUserProfile();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center overflow-hidden bg-slate-950 text-slate-50">

      {/* Abstract Glowing Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 mix-blend-screen opacity-50 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[150px] -z-10 mix-blend-screen opacity-40 animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] -z-10" />

      {/* Hero Section */}
      <div className="container relative z-10 mx-auto px-4 pt-20 pb-16 text-center lg:pt-32">

        <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Sparkles className="mr-2 h-4 w-4" />
          The future of PC building is here
        </div>

        <h1 className="mx-auto max-w-4xl font-headline text-5xl font-extrabold tracking-tight sm:text-7xl mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150">
          Build Your <span className="bg-gradient-to-r from-blue-400 via-primary to-purple-500 bg-clip-text text-transparent drop-shadow-sm">Masterpiece</span> <br className="hidden sm:block" /> with AI
        </h1>

        <p className="mx-auto max-w-2xl text-lg text-slate-400 mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
          Stop guessing if parts will fit. BuildbotAI uses advanced algorithms to guarantee physical chassis clearance, eliminate hardware bottlenecks, and actively critique your component choices.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-500">
          {authUser ? (
            <Button asChild size="lg" className="h-14 px-8 text-lg rounded-full font-semibold shadow-[0_0_30px_-5px_var(--theme-primary)] hover:shadow-[0_0_40px_-5px_var(--theme-primary)] transition-all">
              <Link href="/builder">
                Resume Building <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          ) : (
            <Button asChild size="lg" className="h-14 px-8 text-lg rounded-full font-semibold shadow-[0_0_30px_-5px_var(--theme-primary)] hover:shadow-[0_0_40px_-5px_var(--theme-primary)] transition-all">
              <Link href="/signin">
                Sign In & Build <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          )}
          <Button asChild variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full font-semibold bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white backdrop-blur-md">
            <Link href="/ai-build-advisor">
              Ask AI Advisor
            </Link>
          </Button>
        </div>
      </div>

      {/* Feature Highlight Cards (Glassmorphism) */}
      <div className="container mx-auto px-4 py-16 lg:py-24 z-10 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-700">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">

          <Card className="bg-white/5 backdrop-blur-xl border-white/10 text-slate-100 hover:bg-white/10 transition-colors duration-300 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <MonitorSmartphone className="w-24 h-24 text-primary" />
            </div>
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4 border border-primary/30 shadow-[0_0_15px_-3px_var(--theme-primary)]">
                <Cpu className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl font-headline tracking-wide">2D Clearance Engine</CardTitle>
              <CardDescription className="text-slate-400 text-sm leading-relaxed pt-2">
                We mathematically measure your exact GPU, cooler, and PSU dimensions directly against the chassis frame in real-time millimeters to guarantee precision fitment before you buy.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/5 backdrop-blur-xl border-white/10 text-slate-100 hover:bg-white/10 transition-colors duration-300 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <Zap className="w-24 h-24 text-purple-400" />
            </div>
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4 border border-purple-500/30 shadow-[0_0_15px_-3px_rgba(168,85,247,0.4)]">
                <Zap className="h-6 w-6 text-purple-400" />
              </div>
              <CardTitle className="text-xl font-headline tracking-wide">Smart Bottleneck AI</CardTitle>
              <CardDescription className="text-slate-400 text-sm leading-relaxed pt-2">
                Dynamically shift between 1080p, 1440p, and 4K workload projections. Our proprietary logic analyzes the compute tier of your CPU vs your GPU to warn you if components will choke performance.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/5 backdrop-blur-xl border-white/10 text-slate-100 hover:bg-white/10 transition-colors duration-300 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <Sparkles className="w-24 h-24 text-blue-400" />
            </div>
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4 border border-blue-500/30 shadow-[0_0_15px_-3px_rgba(59,130,246,0.4)]">
                <Sparkles className="h-6 w-6 text-blue-400" />
              </div>
              <CardTitle className="text-xl font-headline tracking-wide">AI Component Critique</CardTitle>
              <CardDescription className="text-slate-400 text-sm leading-relaxed pt-2">
                Not sure if an AIO is overkill for a Ryzen 5? Ask the Buildbot! Our LLM analyzes your entire hardware cart for value, thermal efficiency, and generational compatibility.
              </CardDescription>
            </CardHeader>
          </Card>

        </div>
      </div>
    </div>
  );
}
