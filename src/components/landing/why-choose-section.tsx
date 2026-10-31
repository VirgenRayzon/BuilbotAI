import Image from 'next/image';
import { Paper } from '@mantine/core';
import { CreditCard, Headset, ShieldCheck, Truck } from 'lucide-react';
import netcodexLogo from '@/assets/branding/netcodex_cc_2026_white.png.webp';

const reasons = [
  {
    title: 'Nationwide Shipping',
    description: 'Order from anywhere in the Philippines. Review available delivery and pickup options when you check out.',
    icon: Truck,
  },
  {
    title: 'Authorized Dealer',
    description: 'Shop brand-new, authentic PC hardware with clear product details and manufacturer warranty information.',
    icon: ShieldCheck,
  },
  {
    title: 'Secure Transactions',
    description: 'Review your order and payment choices in one checkout flow before you place your order.',
    icon: CreditCard,
  },
  {
    title: 'Top-notch Support',
    description: 'Get help choosing components, planning a build, or following up on a purchase from the Netcodex team.',
    icon: Headset,
  },
] as const;

export function WhyChooseSection() {
  return (
    <section aria-labelledby="why-netcodex-heading" className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div className="relative mx-auto w-full max-w-[1320px]">
        <div className="relative mx-auto mb-12 max-w-3xl text-center sm:mb-14">
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-12 mx-auto h-40 opacity-[0.07] dark:opacity-[0.12] sm:h-48">
            <Image
              src={netcodexLogo}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, 768px"
              className="object-contain brightness-0 dark:brightness-100"
            />
          </div>
          <div className="relative z-10 pt-16 sm:pt-20">
            <h2 id="why-netcodex-heading" className="font-headline text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl lg:text-5xl">
              Why Choose Netcodex?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
              Find the right hardware, order with confidence, and get help from people who know PCs.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {reasons.map(({ title, description, icon: Icon }) => (
            <Paper
              key={title}
              withBorder
              radius="lg"
              shadow="sm"
              p={{ base: 'md', sm: 'lg' }}
              className="h-full border-slate-200 bg-white/85 dark:border-white/10 dark:bg-[#141a23]/90"
            >
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
                <Icon size={28} strokeWidth={2} aria-hidden="true" />
              </div>
              <h3 className="font-headline text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:text-base">{description}</p>
            </Paper>
          ))}
        </div>
      </div>
    </section>
  );
}
