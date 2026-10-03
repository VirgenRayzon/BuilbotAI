"use client";

import React from "react";
import Link from "next/link";
import {
  Box,
  Burger,
  Button,
  Center,
  Collapse,
  Divider,
  Drawer,
  Group,
  HoverCard,
  ScrollArea,
  SimpleGrid,
  Text,
  ThemeIcon,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  ChevronDown,
  Box as BoxIcon,
  Sparkles,
  ShieldCheck,
  Layers,
  Coins,
  Activity,
  ArrowRight,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import classes from "./header-mega-menu.module.css";

const featuresData = [
  {
    icon: BoxIcon,
    color: "blue",
    title: "3D Interactive Builder",
    description: "Real-time 3D PC assembly and case visualizer with part staging",
    href: "/builder",
  },
  {
    icon: Sparkles,
    color: "cyan",
    title: "AI Build Advisor",
    description: "Intelligent component recommendations and bottleneck detection",
    href: "/ai-build-advisor",
  },
  {
    icon: ShieldCheck,
    color: "teal",
    title: "Compatibility Engine",
    description: "Automated socket, clearance, form-factor, and wattage verification",
    href: "/builder",
  },
  {
    icon: Layers,
    color: "indigo",
    title: "Curated Pre-builts",
    description: "Benchmarked, ready-to-reserve gaming and workstation rigs",
    href: "/pre-builts",
  },
  {
    icon: Coins,
    color: "amber",
    title: "Live Inventory & Pricing",
    description: "Real-time local stock, price estimations, and hardware specs",
    href: "/builder",
  },
  {
    icon: Activity,
    color: "violet",
    title: "Performance Telemetry",
    description: "Hardware bottleneck scores and expected gaming frame rates",
    href: "/ai-build-advisor",
  },
];

export function HeaderMegaMenu() {
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);
  const [linksOpened, { toggle: toggleLinks }] = useDisclosure(false);

  const featureLinks = featuresData.map((item) => (
    <UnstyledButton
      component={Link}
      href={item.href}
      className={classes.subLink}
      key={item.title}
      onClick={closeDrawer}
    >
      <Group wrap="nowrap" align="flex-start" gap="sm">
        <ThemeIcon size={36} variant="light" color={item.color} radius="md">
          <item.icon size={20} />
        </ThemeIcon>
        <div>
          <Text size="sm" fw={600} className="text-slate-900 dark:text-slate-100 leading-tight">
            {item.title}
          </Text>
          <Text size="xs" c="dimmed" className="mt-0.5 line-clamp-2">
            {item.description}
          </Text>
        </div>
      </Group>
    </UnstyledButton>
  ));

  return (
    <header className={classes.header}>
      <div className={classes.inner}>
        {/* Brand Logo with Blue Robot Icon */}
        <Link href="/" className="flex items-center no-underline focus:outline-none">
          <Logo />
        </Link>

        {/* Center / Navigation Links */}
        <Group h="100%" gap={4} visibleFrom="sm">
          <Link href="/" className={classes.link}>
            Home
          </Link>

          <HoverCard
            width={620}
            position="bottom"
            radius="lg"
            shadow="xl"
            withinPortal
            transitionProps={{ transition: "pop-top-left", duration: 150 }}
          >
            <HoverCard.Target>
              <button type="button" className={classes.link}>
                <Center inline>
                  <Box component="span" mr={5}>
                    Features
                  </Box>
                  <ChevronDown size={14} className="text-blue-500 dark:text-cyan-400" />
                </Center>
              </button>
            </HoverCard.Target>

            <HoverCard.Dropdown className="bg-white/95 dark:bg-[#111722]/95 border border-slate-200 dark:border-white/10 backdrop-blur-xl p-4 overflow-hidden rounded-xl shadow-2xl">
              <Group justify="space-between" px="xs" mb="xs">
                <Text fw={700} size="sm" className="font-headline text-slate-900 dark:text-slate-100">
                  Buildbot AI Features
                </Text>
                <Link
                  href="/builder"
                  className="text-xs font-semibold text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                >
                  Start Building <ArrowRight size={12} />
                </Link>
              </Group>

              <Divider mb="sm" className="border-slate-100 dark:border-white/10" />

              <SimpleGrid cols={2} spacing="xs">
                {featureLinks}
              </SimpleGrid>

              <div className={classes.dropdownFooter}>
                <Group justify="space-between">
                  <div>
                    <Text fw={600} size="sm" className="text-slate-900 dark:text-slate-100">
                      Ready to build your dream PC?
                    </Text>
                    <Text size="xs" c="dimmed">
                      Configure, critique, and reserve verified hardware instantly.
                    </Text>
                  </div>
                  <Button
                    component={Link}
                    href="/builder"
                    variant="filled"
                    color="blue"
                    size="xs"
                    radius="md"
                    className="font-semibold shadow-sm"
                  >
                    Get Started
                  </Button>
                </Group>
              </div>
            </HoverCard.Dropdown>
          </HoverCard>

          <Link href="/pre-builts" className={classes.link}>
            Pre-builts
          </Link>

          <Link href="/about" className={classes.link}>
            About
          </Link>

          <Link href="/faq" className={classes.link}>
            FAQ
          </Link>
        </Group>

        {/* Right CTA & Theme Toggle */}
        <Group visibleFrom="sm" gap="xs">
          <ThemeToggle />
          <Button
            component={Link}
            href="/signin"
            variant="default"
            size="sm"
            radius="md"
            className="text-xs font-semibold"
          >
            Log in
          </Button>
          <Button
            component={Link}
            href="/signup"
            variant="filled"
            color="blue"
            size="sm"
            radius="md"
            className="text-xs font-semibold shadow-md shadow-blue-500/20"
          >
            Sign up
          </Button>
        </Group>

        {/* Mobile Burger Toggle */}
        <div className="flex items-center gap-2 sm:hidden">
          <ThemeToggle />
          <Burger
            opened={drawerOpened}
            onClick={toggleDrawer}
            size="sm"
            aria-label="Toggle navigation"
          />
        </div>
      </div>

      {/* Mobile Drawer */}
      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        size="280px"
        padding="md"
        position="right"
        title={
          <div className="flex items-center gap-2">
            <Logo showText={false} />
            <Text fw={700} size="sm" className="font-headline">
              Navigation
            </Text>
          </div>
        }
        hiddenFrom="sm"
        zIndex={100000}
        classNames={{
          content: "bg-white dark:bg-[#111722] text-slate-900 dark:text-slate-100",
          header: "bg-white dark:bg-[#111722] border-b border-slate-200 dark:border-white/10",
        }}
      >
        <ScrollArea h="calc(100vh - 80px)" mx="-md" px="md">
          <Divider my="sm" className="border-slate-100 dark:border-white/10" />

          <Link href="/" className={classes.link} onClick={closeDrawer}>
            Home
          </Link>

          <UnstyledButton className={classes.link} onClick={toggleLinks}>
            <Center inline>
              <Box component="span" mr={5}>
                Features
              </Box>
              <ChevronDown
                size={14}
                className={`text-blue-500 dark:text-cyan-400 transition-transform ${
                  linksOpened ? "rotate-180" : ""
                }`}
              />
            </Center>
          </UnstyledButton>

          <Collapse in={linksOpened}>
            <div className="pl-2 space-y-1 my-2">
              {featureLinks}
            </div>
          </Collapse>

          <Link href="/pre-builts" className={classes.link} onClick={closeDrawer}>
            Pre-builts
          </Link>

          <Link href="/about" className={classes.link} onClick={closeDrawer}>
            About
          </Link>

          <Link href="/faq" className={classes.link} onClick={closeDrawer}>
            FAQ
          </Link>

          <Divider my="md" className="border-slate-100 dark:border-white/10" />

          <Group justify="center" grow pb="xl">
            <Button
              component={Link}
              href="/signin"
              variant="default"
              size="sm"
              radius="md"
              onClick={closeDrawer}
              className="text-xs font-semibold"
            >
              Log in
            </Button>
            <Button
              component={Link}
              href="/signup"
              variant="filled"
              color="blue"
              size="sm"
              radius="md"
              onClick={closeDrawer}
              className="text-xs font-semibold shadow-md shadow-blue-500/20"
            >
              Sign up
            </Button>
          </Group>
        </ScrollArea>
      </Drawer>
    </header>
  );
}
