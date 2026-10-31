import Image from 'next/image';
import Link from 'next/link';
import { Button, Paper } from '@mantine/core';
import { ArrowRight } from 'lucide-react';
import prebuiltPcs from '@/assets/landing/prebuilt-pcs.png';
import customBuilderParts from '@/assets/landing/custom-builder-parts.png';

export function ShoppingPathsSection() {
  return (
    <section aria-label="Choose how to build your PC" className="relative px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5">
        <Paper
          withBorder
          radius="lg"
          shadow="sm"
          p={{ base: 'md', sm: 'lg' }}
          className="overflow-hidden border-slate-200 bg-white/85 dark:border-white/10 dark:bg-[#111722]/90"
        >
          <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-10">
            <div className="relative min-h-[230px] sm:min-h-[300px] lg:min-h-[390px]">
              <div className="absolute inset-x-5 bottom-5 top-10 rounded-2xl border border-cyan-300/50 bg-cyan-50/40 dark:border-cyan-400/15 dark:bg-cyan-400/[0.03]" aria-hidden="true" />
              <Image
                src={prebuiltPcs}
                alt="Four prebuilt gaming PCs"
                fill
                sizes="(max-width: 1023px) 100vw, 50vw"
                className="object-contain object-bottom"
              />
            </div>
            <div className="flex flex-col items-start gap-5 px-1 py-2 sm:px-4 lg:py-8">
              <h2 className="font-headline text-3xl font-black uppercase leading-tight tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
                Prebuilt Gaming PCs
              </h2>
              <p className="max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
                Find a ready-built PC for gaming, work, or both. Compare complete systems and choose the one that fits your plans.
              </p>
              <Button
                component={Link}
                href="/pre-builts"
                color="cyan"
                radius="md"
                size="lg"
                rightSection={<ArrowRight size={18} />}
                className="h-12 min-w-40 font-headline font-bold uppercase tracking-wide shadow-lg"
              >
                Shop Prebuilts
              </Button>
            </div>
          </div>
        </Paper>

        <Paper
          withBorder
          radius="lg"
          shadow="sm"
          p={{ base: 'md', sm: 'lg' }}
          className="overflow-hidden border-slate-200 bg-white/85 dark:border-white/10 dark:bg-[#111722]/90"
        >
          <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-10">
            <div className="flex flex-col items-start gap-5 px-1 py-2 sm:px-4 lg:py-8">
              <h2 className="font-headline text-3xl font-black uppercase leading-tight tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
                Easy Custom Builder
              </h2>
              <p className="max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
                Choose your parts and see compatibility feedback as your build comes together. You can start building before signing in.
              </p>
              <Button
                component={Link}
                href="/builder"
                color="cyan"
                radius="md"
                size="lg"
                rightSection={<ArrowRight size={18} />}
                className="h-12 min-w-40 font-headline font-bold uppercase tracking-wide shadow-lg"
              >
                Start Building
              </Button>
            </div>
            <div className="relative min-h-[270px] sm:min-h-[340px] lg:min-h-[390px]">
              <div className="absolute inset-x-8 bottom-5 top-10 rounded-2xl border border-cyan-300/50 bg-cyan-50/40 dark:border-cyan-400/15 dark:bg-cyan-400/[0.03]" aria-hidden="true" />
              <Image
                src={customBuilderParts}
                alt="PC case and components for a custom build"
                fill
                sizes="(max-width: 1023px) 100vw, 50vw"
                className="object-contain object-bottom"
              />
            </div>
          </div>
        </Paper>
      </div>
    </section>
  );
}
