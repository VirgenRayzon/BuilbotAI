"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Burger, Button, Divider, Drawer, Group, ScrollArea, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { useUserProfile } from "@/context/user-profile";
import { HeaderCartButton } from "@/components/ecommerce/header-cart-button";
import classes from "./header.module.css";

const navigation = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/#features" },
  { label: "Pre-builts", href: "/#prebuilts" },
  { label: "Catalog", href: "/parts" },
  { label: "About", href: "/about" },
  { label: "FAQ", href: "/faq" },
];

export function HeaderMegaMenu() {
  const pathname = usePathname();
  const { authUser, profile } = useUserProfile();
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);

  const isTabActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/parts") return pathname === "/parts" || pathname.startsWith("/parts/");
    if (href === "/#prebuilts" || href === "/pre-builts") return pathname === "/pre-builts" || pathname.startsWith("/pre-builts/");
    return pathname === href;
  };

  return (
    <header className={classes.header}>
      <div className={classes.inner}>
        <Link href="/" className="flex items-center no-underline focus:outline-none">
          <Logo />
        </Link>

        <div className="hidden lg:flex items-center gap-5">
          <nav className="flex items-center gap-1.5" aria-label="Main Navigation">
            {navigation.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className={classes.tabLink}
                data-active={isTabActive(href) || undefined}
              >
                {label}
              </Link>
            ))}
          </nav>

          <Divider orientation="vertical" h={24} className="border-slate-200 dark:border-white/10" />

          <HeaderCartButton />
          <ThemeToggle />

          {authUser ? (
            <Button
              component={Link}
              href={profile?.isSuperAdmin || profile?.isManager ? "/admin" : "/builder"}
              variant="filled"
              color="blue"
              size="sm"
              radius="md"
              className="text-xs font-semibold shadow-md shadow-blue-500/20"
            >
              {profile?.isSuperAdmin || profile?.isManager ? "Dashboard" : "Open Builder"}
            </Button>
          ) : (
            <Group gap="xs">
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
          )}
        </div>

        {/* Mobile Burger Toggle */}
        <div className="flex items-center gap-2 lg:hidden">
          <HeaderCartButton />
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
        hiddenFrom="lg"
        zIndex={100000}
        classNames={{
          content: "bg-white dark:bg-[#111722] text-slate-900 dark:text-slate-100",
          header: "bg-white dark:bg-[#111722] border-b border-slate-200 dark:border-white/10",
        }}
      >
        <ScrollArea h="calc(100vh - 80px)" mx="-md" px="md">
          <Divider my="sm" className="border-slate-100 dark:border-white/10" />

          <nav aria-label="Mobile Navigation">
            {navigation.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className={classes.drawerLink}
                data-active={isTabActive(href) || undefined}
                onClick={closeDrawer}
              >
                {label}
              </Link>
            ))}
          </nav>

          <Divider my="md" className="border-slate-100 dark:border-white/10" />

          {authUser ? (
            <Button
              component={Link}
              href={profile?.isSuperAdmin || profile?.isManager ? "/admin" : "/builder"}
              variant="filled"
              color="blue"
              size="sm"
              radius="md"
              onClick={closeDrawer}
              fullWidth
              className="text-xs font-semibold shadow-md shadow-blue-500/20"
            >
              {profile?.isSuperAdmin || profile?.isManager ? "Dashboard" : "Open Builder"}
            </Button>
          ) : (
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
          )}
        </ScrollArea>
      </Drawer>
    </header>
  );
}
