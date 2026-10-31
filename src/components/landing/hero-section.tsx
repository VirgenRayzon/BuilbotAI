"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CircuitBoard, PackageCheck } from "lucide-react";
import { Button, Paper } from "@mantine/core";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import prismPoster from "@/assets/landing/prism5-poster.webp";
import kingPoster from "@/assets/landing/king45-poster.webp";
import builderImage from "@/assets/landing/hero-custom-v2.webp";
import bottleneckImage from "@/assets/landing/feature-1.webp";
import critiqueImage from "@/assets/landing/feature-2.webp";
import generationImage from "@/assets/landing/feature-3.webp";

const slides = [
  {
    name: "Prism 5",
    eyebrow: "Featured build",
    description: "A clear view of every component. Explore the Prism 5 and find the setup that fits your space.",
    href: "/pre-builts/PRD-000390",
    video: "/landing-video/prism5",
    poster: prismPoster,
    imageAlt: "Netcodex Prism 5 PC",
    kicker: "Netcodex systems",
    action: "Shop Now",
  },
  {
    name: "King 45",
    eyebrow: "Featured build",
    description: "Make room for your next upgrade. Meet the King 45 and see what goes into the build.",
    href: "/pre-builts/PRD-000360",
    video: "/landing-video/king45",
    poster: kingPoster,
    imageAlt: "Netcodex King 45 PC",
    kicker: "Netcodex systems",
    action: "Shop Now",
  },
  {
    name: "Bottleneck Analysis",
    eyebrow: "Buildbot feature",
    description: "Compare CPU and GPU performance at 1080p, 1440p, and 4K before you commit to a build.",
    href: "/builder",
    poster: bottleneckImage,
    imageAlt: "Bottleneck Analysis",
    kicker: "Performance balance",
    action: "Open Builder",
  },
  {
    name: "Buildbot Build Critique",
    eyebrow: "Buildbot feature",
    description: "Review your parts for value, thermal efficiency, compatibility, and upgrade opportunities.",
    href: "/signin?returnTo=%2Fbuilder",
    poster: critiqueImage,
    imageAlt: "Buildbot Build Critique",
    kicker: "AI build review",
    action: "Sign In to Review",
  },
  {
    name: "Instant AI Build Generation",
    eyebrow: "Buildbot feature",
    description: "Share your budget, target resolution, and performance goals to get a matched PC from live inventory.",
    href: "/signin",
    poster: generationImage,
    imageAlt: "AI Build Generation",
    kicker: "Guided PC planning",
    action: "Sign In to Start",
  },
] as const;

interface HeroSectionProps {
  isDark: boolean;
}

type ProductSlide = Extract<(typeof slides)[number], { video: string }>;

function ProductVideoLayer({
  slide,
  active,
  motionAllowed,
  ready,
  onPlaying,
}: {
  slide: ProductSlide;
  active: boolean;
  motionAllowed: boolean;
  ready: boolean;
  onPlaying: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !motionAllowed) return;
    if (active) {
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }, [active, motionAllowed]);

  return (
    <div
      aria-hidden={!active}
      className={cn(
        "absolute inset-0 transition-opacity duration-200 ease-in-out",
        active ? "opacity-100" : "pointer-events-none opacity-0"
      )}
    >
      <Image
        src={slide.poster}
        alt={active ? slide.imageAlt : ""}
        fill
        priority={slide.name === "Prism 5"}
        fetchPriority={slide.name === "Prism 5" ? "high" : undefined}
        sizes="(max-width: 1023px) 100vw, 66vw"
        className="object-cover"
      />
      {motionAllowed && (
        <video
          ref={videoRef}
          data-hero-video={slide.name}
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          onPlaying={onPlaying}
          className={cn("absolute inset-0 h-full w-full object-cover", ready ? "opacity-100" : "opacity-0")}
        >
          <source src={slide.video} type="video/mp4" />
        </video>
      )}
    </div>
  );
}

export function HeroSection({ isDark }: HeroSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [motionAllowed, setMotionAllowed] = useState(false);
  const [readyVideos, setReadyVideos] = useState<ReadonlySet<string>>(() => new Set());
  const slide = slides[activeIndex];

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setMotionAllowed(!preference.matches && !document.hidden);
    updateMotion();
    preference.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateMotion);
    return () => {
      preference.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateMotion);
    };
  }, []);

  useEffect(() => {
    if (!motionAllowed) return;
    const timeout = window.setTimeout(() => setActiveIndex(index => (index + 1) % slides.length), 9000);
    return () => window.clearTimeout(timeout);
  }, [activeIndex, motionAllowed]);

  return (
    <section aria-label="Featured PCs and ways to shop" className="relative overflow-hidden px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <div className="mx-auto grid w-full max-w-[1500px] grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.85fr)_minmax(320px,0.9fr)] lg:gap-5">
        <div className="relative isolate flex min-h-[480px] overflow-hidden rounded-2xl bg-slate-950 shadow-xl sm:min-h-[560px] lg:min-h-[630px]">
          {slides.filter((item): item is ProductSlide => "video" in item).map(item => (
            <ProductVideoLayer
              key={item.name}
              slide={item}
              active={slide.name === item.name}
              motionAllowed={motionAllowed}
              ready={readyVideos.has(item.name)}
              onPlaying={() => setReadyVideos(current => {
                if (current.has(item.name)) return current;
                const next = new Set(current);
                next.add(item.name);
                return next;
              })}
            />
          ))}

          <AnimatePresence initial={false} mode="sync">
            <motion.div
              key={slide.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: motionAllowed ? 0.2 : 0, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              {!("video" in slide) && (
                <Image
                  src={slide.poster}
                  alt={slide.imageAlt}
                  fill
                  sizes="(max-width: 1023px) 100vw, 66vw"
                  className="object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/45 to-transparent" aria-hidden="true" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" aria-hidden="true" />

              <div className="relative z-10 flex h-full w-full flex-col justify-between p-5 text-white sm:p-8 lg:p-10">
                <div className="w-fit rounded-full border border-white/45 bg-black/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] backdrop-blur-sm">
                  {slide.eyebrow}
                </div>

                <div className="max-w-xl pb-20">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">{slide.kicker}</p>
                  <h1 className="max-w-3xl font-headline text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-6xl xl:text-7xl">
                    {slide.name}
                  </h1>
                  <p className="mt-5 max-w-md text-sm font-medium leading-relaxed text-slate-100 sm:text-base">{slide.description}</p>
                  <Button component={Link} href={slide.href} size="lg" radius="md" color="cyan" rightSection={<ArrowRight size={18} />} className="mt-6 h-12 min-w-40 font-headline font-bold uppercase tracking-wide shadow-lg">
                    {slide.action}
                  </Button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center sm:bottom-5" role="group" aria-label="Choose hero slide">
            {slides.map((item, index) => (
              <button
                key={item.name}
                type="button"
                aria-label={`Show ${item.name}`}
                aria-pressed={activeIndex === index}
                onClick={() => setActiveIndex(index)}
                className="group/dot flex h-11 min-w-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                <span className={cn(
                  "block h-2.5 w-2.5 rounded-full border border-white/15 shadow-sm transition-all duration-200 group-hover/dot:scale-125",
                  activeIndex === index ? "bg-cyan-400 ring-2 ring-cyan-300/20" : "bg-white/35"
                )} />
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 lg:grid-rows-2 lg:gap-5">
          <Paper component={Link} href="/builder" withBorder radius="lg" shadow="sm" className="group relative isolate flex min-h-[260px] overflow-hidden border-slate-200 bg-slate-900 p-3 text-white transition-transform hover:-translate-y-1 dark:border-white/10 sm:min-h-[300px] lg:min-h-0">
            <Image src={builderImage} alt="" fill sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw" className="object-cover object-right opacity-65 transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/55 to-slate-950/10" aria-hidden="true" />
            <div className="absolute inset-3 z-10 flex flex-col items-start justify-between rounded-lg border border-white/20 p-3">
              <CircuitBoard size={24} className="text-cyan-200" aria-hidden="true" />
              <div>
                <h2 className="font-headline text-2xl font-black uppercase leading-tight sm:text-3xl">Build Your Dream PC</h2>
                <p className="mt-2 max-w-[270px] text-sm text-slate-100">Choose your parts and check compatibility as you build.</p>
                <span className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-md bg-cyan-500 px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-950">Start building <ArrowRight size={15} /></span>
              </div>
            </div>
          </Paper>

          <Paper component={Link} href="/parts" withBorder radius="lg" shadow="sm" className={cn(
            "group relative isolate flex min-h-[260px] overflow-hidden p-3 transition-transform hover:-translate-y-1 sm:min-h-[300px] lg:min-h-0",
            isDark ? "border-white/10 bg-[#111722] text-slate-100" : "border-slate-200 bg-white/90 text-slate-900"
          )}>
            <div className="absolute -right-10 -top-12 h-52 w-52 rounded-full border-[28px] border-cyan-500/10" aria-hidden="true" />
            <div className="absolute -bottom-24 right-8 h-48 w-48 rounded-full border-[24px] border-slate-400/10" aria-hidden="true" />
            <div className="absolute inset-3 z-10 flex flex-col items-start justify-between rounded-lg border border-slate-200 p-3 dark:border-white/10">
              <PackageCheck size={24} className="text-cyan-600 dark:text-cyan-300" aria-hidden="true" />
              <div>
                <h2 className="font-headline text-2xl font-black uppercase leading-tight sm:text-3xl">Ship Ready Deals</h2>
                <p className="mt-2 max-w-[270px] text-sm text-slate-600 dark:text-slate-300">Explore parts in stock and find your next upgrade.</p>
                <span className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white dark:bg-slate-100 dark:text-slate-950">Shop catalog <ArrowRight size={15} /></span>
              </div>
            </div>
          </Paper>
        </div>
      </div>
    </section>
  );
}
