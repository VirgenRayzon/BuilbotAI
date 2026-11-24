"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BadgeCheck,
  Archive,
  Bot,
  ChevronRight,
  ChevronsUpDown,
  LogOut,
  PackagePlus,
  PanelLeft,
  PieChart,
  Settings2,
  Shield,
  ShoppingBag,
  SquareTerminal,
  type LucideIcon,
} from "lucide-react";
import {
  ActionIcon,
  Avatar,
  Box,
  Button,
  Collapse,
  Drawer,
  Group,
  Menu,
  Modal,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
  UnstyledButton,
  VisuallyHidden,
} from "@mantine/core";
import { signOut } from "firebase/auth";
import { useAuth } from "@/firebase";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import netcodexEmblem from "@/assets/branding/netcodex-emblem.png";
import netcodexLogoWhite from "@/assets/branding/netcodex_cc_2026_white.png.webp";

const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_WIDTH_ICON = "3rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

type AdminSidebarContextProps = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean | ((open: boolean) => boolean)) => void;
  openMobile: boolean;
  setOpenMobile: React.Dispatch<React.SetStateAction<boolean>>;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const AdminSidebarContext = React.createContext<AdminSidebarContextProps | null>(
  null
);

export function useAdminSidebar() {
  const context = React.useContext(AdminSidebarContext);
  if (!context) {
    throw new Error(
      "useAdminSidebar must be used within an AdminSidebarProvider."
    );
  }
  return context;
}

export const useSidebar = useAdminSidebar;

export interface AdminSidebarProviderProps extends React.ComponentProps<"div"> {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const AdminSidebarProvider = React.forwardRef<
  HTMLDivElement,
  AdminSidebarProviderProps
>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const isMobile = useIsMobile();
    const [openMobile, setOpenMobile] = React.useState(false);

    const [_open, _setOpen] = React.useState(defaultOpen);
    const open = openProp ?? _open;
    const setOpen = React.useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === "function" ? value(open) : value;
        if (setOpenProp) {
          setOpenProp(openState);
        } else {
          _setOpen(openState);
        }
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
      },
      [setOpenProp, open]
    );

    const toggleSidebar = React.useCallback(() => {
      return isMobile
        ? setOpenMobile((prev) => !prev)
        : setOpen((prev) => !prev);
    }, [isMobile, setOpen]);

    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault();
          toggleSidebar();
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [toggleSidebar]);

    const state = open ? "expanded" : "collapsed";

    const contextValue = React.useMemo<AdminSidebarContextProps>(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      }),
      [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
    );

    return (
      <AdminSidebarContext.Provider value={contextValue}>
        <Box
          ref={ref}
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH,
              "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
              ...style,
            } as React.CSSProperties
          }
          className={cn(
            "group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-sidebar",
            className
          )}
          {...props}
        >
          {children}
        </Box>
      </AdminSidebarContext.Provider>
    );
  }
);
AdminSidebarProvider.displayName = "AdminSidebarProvider";

export const SidebarProvider = AdminSidebarProvider;

export const AdminSidebarInset = React.forwardRef<
  HTMLElement,
  React.ComponentProps<"main">
>(({ className, ...props }, ref) => {
  return (
    <Box
      component="main"
      ref={ref}
      className={cn(
        "relative flex w-full flex-1 flex-col bg-background",
        "md:peer-data-[variant=inset]:m-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow",
        className
      )}
      {...props}
    />
  );
});
AdminSidebarInset.displayName = "AdminSidebarInset";

export const SidebarInset = AdminSidebarInset;

export const AdminSidebarTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<"button">
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useAdminSidebar();

  return (
    <ActionIcon
      ref={ref}
      unstyled
      data-sidebar="trigger"
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
        className
      )}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      <PanelLeft />
      <VisuallyHidden>Toggle Sidebar</VisuallyHidden>
    </ActionIcon>
  );
});
AdminSidebarTrigger.displayName = "AdminSidebarTrigger";

export const SidebarTrigger = AdminSidebarTrigger;

export type AdminTabKey =
  | "stock"
  | "prebuilts"
  | "add-part"
  | "add-system"
  | "orders"
  | "sales"
  | "archive"
  | "audit"
  | "management"
  | "ai";

interface AdminSidebarProps extends React.ComponentProps<"div"> {
  currentTab?: AdminTabKey | "prebuilt-builder" | string;
  onSelectTab?: (tab: AdminTabKey) => void;
  aiSubTab?: "intelligence" | "prompts";
  onSelectAiSubTab?: (sub: "intelligence" | "prompts") => void;
  salesSubTab?: "overview" | "popularity";
  onSelectSalesSubTab?: (sub: "overview" | "popularity") => void;
  profile?: {
    isManager?: boolean;
    isSuperAdmin?: boolean;
    name?: string;
    username?: string;
    email?: string;
    photoURL?: string;
  } | null;
  authUser?: {
    displayName?: string | null;
    email?: string | null;
    photoURL?: string | null;
  } | null;
  partsCount?: number;
  prebuiltsCount?: number;
  pendingOrdersCount?: number;
  orderStageCounts?: {
    orderPlaced: number;
    assembling: number;
    outForDelivery: number;
    delivered: number;
    cancelled: number;
  };
  auditLogsCount?: number;
  intelligenceBadge?: string;
  intelligenceBadgeColor?: string;
}

export function AdminSidebar({
  currentTab = "stock",
  onSelectTab,
  aiSubTab = "intelligence",
  onSelectAiSubTab,
  salesSubTab = "overview",
  onSelectSalesSubTab,
  profile,
  authUser,
  partsCount = 0,
  prebuiltsCount = 0,
  pendingOrdersCount = 0,
  orderStageCounts,
  auditLogsCount = 0,
  intelligenceBadge,
  intelligenceBadgeColor,
  className,
  ...props
}: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const archiveSubTab = searchParams.get("sub") === "reservations" ? "orders" : searchParams.get("sub") || "parts";
  const currentOrderStage = searchParams.get("stage");
  const auth = useAuth();
  const { toast } = useToast();
  const { isMobile, state, openMobile, setOpenMobile, toggleSidebar } =
    useAdminSidebar();
  const [isSignOutOpen, setIsSignOutOpen] = React.useState(false);

  const isCollapsed = state === "collapsed" && !isMobile;
  const isSuperAdmin = Boolean(profile?.isSuperAdmin);
  const isPrebuiltBuilderRoute =
    pathname?.startsWith("/admin/prebuilt-builder") ||
    currentTab === "prebuilt-builder";

  const handleNavigateTab = (tab: AdminTabKey) => {
    if (onSelectTab && !isPrebuiltBuilderRoute) {
      onSelectTab(tab);
    } else {
      router.push(`/admin?tab=${tab}`);
    }
  };

  const handleNavigateAiSubTab = (sub: "intelligence" | "prompts") => {
    if (onSelectTab && !isPrebuiltBuilderRoute) {
      onSelectTab("ai");
      onSelectAiSubTab?.(sub);
    } else {
      router.push(`/admin?tab=ai&sub=${sub}`);
    }
  };

  const handleNavigateSalesSubTab = (sub: "overview" | "popularity") => {
    if (onSelectTab && !isPrebuiltBuilderRoute) {
      onSelectTab("sales");
      onSelectSalesSubTab?.(sub);
    } else {
      router.push(`/admin?tab=sales&sub=${sub}`);
    }
  };

  const handleConfirmSignOut = async () => {
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
      if (auth) {
        await signOut(auth);
      }
      setIsSignOutOpen(false);
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
      router.replace("/signin");
      router.refresh();
    } catch {
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: "There was a problem signing you out. Please try again.",
      });
    }
  };

  const displayName =
    profile?.name ||
    profile?.username ||
    authUser?.displayName ||
    authUser?.email?.split("@")[0] ||
    "Administrator";
  const displayEmail =
    profile?.email || authUser?.email || "admin@buildbot.ai";
  const avatarUrl = profile?.photoURL || authUser?.photoURL || "";
  const userInitials = displayName.slice(0, 2).toUpperCase();

  const navMain: {
    title: string;
    icon: LucideIcon;
    isActive: boolean;
    defaultTab: AdminTabKey;
    badge?: string | number;
    items?: {
      title: string;
      isActive: boolean;
      badge?: string | number;
      onClick: () => void;
    }[];
  }[] = [
      {
        title: "Inventory",
        icon: SquareTerminal,
        isActive:
          !isPrebuiltBuilderRoute &&
          (currentTab === "stock" || currentTab === "prebuilts"),
        defaultTab: "stock",
        items: [
          {
            title: "Manage Stock",
            isActive: !isPrebuiltBuilderRoute && currentTab === "stock",
            badge: partsCount > 0 ? partsCount : undefined,
            onClick: () => handleNavigateTab("stock"),
          },
          {
            title: "Manage Prebuilts",
            isActive: !isPrebuiltBuilderRoute && currentTab === "prebuilts",
            badge: prebuiltsCount > 0 ? prebuiltsCount : undefined,
            onClick: () => handleNavigateTab("prebuilts"),
          },
        ],
      },
      {
        title: "Catalog Builder",
        icon: PackagePlus,
        isActive:
          isPrebuiltBuilderRoute ||
          currentTab === "add-part" ||
          currentTab === "add-system",
        defaultTab: "add-part",
        items: [
          {
            title: "Add Part",
            isActive: !isPrebuiltBuilderRoute && currentTab === "add-part",
            onClick: () => handleNavigateTab("add-part"),
          },
          {
            title: "Add System",
            isActive: !isPrebuiltBuilderRoute && currentTab === "add-system",
            onClick: () => handleNavigateTab("add-system"),
          },
          {
            title: "Prebuilt Builder",
            isActive: isPrebuiltBuilderRoute,
            onClick: () => router.push("/admin/prebuilt-builder"),
          },
        ],
      },
      {
        title: "Archive",
        icon: Archive,
        isActive: !isPrebuiltBuilderRoute && currentTab === "archive",
        defaultTab: "archive",
        items: [
          {
            title: "Parts",
            isActive: !isPrebuiltBuilderRoute && currentTab === "archive" && archiveSubTab === "parts",
            onClick: () => router.push("/admin?tab=archive&sub=parts"),
          },
          {
            title: "Prebuilts",
            isActive: !isPrebuiltBuilderRoute && currentTab === "archive" && archiveSubTab === "prebuilts",
            onClick: () => router.push("/admin?tab=archive&sub=prebuilts"),
          },
          {
            title: "Orders",
            isActive: !isPrebuiltBuilderRoute && currentTab === "archive" && archiveSubTab === "orders",
            onClick: () => router.push("/admin?tab=archive&sub=orders"),
          },
        ],
      },
      {
        title: "Orders",
        icon: ShoppingBag,
        isActive: !isPrebuiltBuilderRoute && currentTab === "orders",
        defaultTab: "orders",
        badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
        items: [
          {
            title: "Order Placed",
            isActive: !isPrebuiltBuilderRoute && currentTab === "orders" && (currentOrderStage === "order_placed" || !currentOrderStage),
            badge: orderStageCounts?.orderPlaced
              ? orderStageCounts.orderPlaced
              : undefined,
            onClick: () => router.push("/admin?tab=orders&stage=order_placed"),
          },
          {
            title: "Assembling",
            isActive: !isPrebuiltBuilderRoute && currentTab === "orders" && currentOrderStage === "assembling_testing",
            badge: orderStageCounts?.assembling
              ? orderStageCounts.assembling
              : undefined,
            onClick: () => router.push("/admin?tab=orders&stage=assembling_testing"),
          },
          {
            title: "Out for Delivery",
            isActive: !isPrebuiltBuilderRoute && currentTab === "orders" && currentOrderStage === "out_for_delivery",
            badge: orderStageCounts?.outForDelivery
              ? orderStageCounts.outForDelivery
              : undefined,
            onClick: () => router.push("/admin?tab=orders&stage=out_for_delivery"),
          },
          {
            title: "Delivered",
            isActive: !isPrebuiltBuilderRoute && currentTab === "orders" && currentOrderStage === "delivered",
            badge: orderStageCounts?.delivered
              ? orderStageCounts.delivered
              : undefined,
            onClick: () => router.push("/admin?tab=orders&stage=delivered"),
          },
          {
            title: "Cancelled",
            isActive: !isPrebuiltBuilderRoute && currentTab === "orders" && currentOrderStage === "cancelled",
            badge: orderStageCounts?.cancelled
              ? orderStageCounts.cancelled
              : undefined,
            onClick: () => router.push("/admin?tab=orders&stage=cancelled"),
          },
        ],
      },
      ...(isSuperAdmin
        ? [
          {
            title: "Sales & Analytics",
            icon: PieChart,
            isActive: !isPrebuiltBuilderRoute && currentTab === "sales",
            defaultTab: "sales" as AdminTabKey,
            items: [
              {
                title: "Performance & Revenue",
                isActive:
                  !isPrebuiltBuilderRoute &&
                  currentTab === "sales" &&
                  salesSubTab === "overview",
                onClick: () => handleNavigateSalesSubTab("overview"),
              },
              {
                title: "Popularity Matrix",
                isActive:
                  !isPrebuiltBuilderRoute &&
                  currentTab === "sales" &&
                  salesSubTab === "popularity",
                onClick: () => handleNavigateSalesSubTab("popularity"),
              },
            ],
          },
          {
            title: "Models & AI",
            icon: Bot,
            isActive: !isPrebuiltBuilderRoute && currentTab === "ai",
            defaultTab: "ai" as AdminTabKey,
            items: [
              {
                title: "Model Intelligence",
                isActive:
                  !isPrebuiltBuilderRoute &&
                  currentTab === "ai" &&
                  aiSubTab === "intelligence",
                badge: intelligenceBadge || undefined,
                onClick: () => handleNavigateAiSubTab("intelligence"),
              },
              {
                title: "System Prompts",
                isActive:
                  !isPrebuiltBuilderRoute &&
                  currentTab === "ai" &&
                  aiSubTab === "prompts",
                onClick: () => handleNavigateAiSubTab("prompts"),
              },
            ],
          },
        ]
        : []),
      {
        title: "Management",
        icon: Shield,
        isActive:
          !isPrebuiltBuilderRoute &&
          (currentTab === "management" || currentTab === "audit"),
        defaultTab: isSuperAdmin ? "management" : "audit",
        items: [
          ...(isSuperAdmin
            ? [
              {
                title: "Management Portal",
                isActive:
                  !isPrebuiltBuilderRoute && currentTab === "management",
                onClick: () => handleNavigateTab("management"),
              },
            ]
            : []),
          {
            title: "Audit Logs",
            isActive: !isPrebuiltBuilderRoute && currentTab === "audit",
            badge: auditLogsCount > 0 ? auditLogsCount : undefined,
            onClick: () => handleNavigateTab("audit"),
          },
        ],
      },
    ];

  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>(
    () => ({
      Inventory: true,
      "Catalog Builder":
        isPrebuiltBuilderRoute ||
        currentTab === "add-part" ||
        currentTab === "add-system",
      Orders: !isPrebuiltBuilderRoute && currentTab === "orders",
      Archive: !isPrebuiltBuilderRoute && currentTab === "archive",
      "Sales & Analytics":
        !isPrebuiltBuilderRoute && currentTab === "sales",
      "Models & AI": !isPrebuiltBuilderRoute && currentTab === "ai",
      Management:
        !isPrebuiltBuilderRoute &&
        (currentTab === "management" || currentTab === "audit"),
    })
  );

  React.useEffect(() => {
    if (
      isPrebuiltBuilderRoute ||
      currentTab === "add-part" ||
      currentTab === "add-system"
    ) {
      setOpenGroups((prev) =>
        prev["Catalog Builder"] ? prev : { ...prev, "Catalog Builder": true }
      );
    } else if (currentTab === "stock" || currentTab === "prebuilts") {
      setOpenGroups((prev) =>
        prev.Inventory ? prev : { ...prev, Inventory: true }
      );
    }
  }, [currentTab, isPrebuiltBuilderRoute]);

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [title]: !(prev[title] ?? false),
    }));
  };

  const brandLink = (
    <Tooltip
      label="Netcodex Admin"
      position="right"
      withArrow
      disabled={!isCollapsed}
    >
      <UnstyledButton
        unstyled
        component={Link}
        href="/admin"
        data-sidebar="menu-button"
        data-size="default"
        data-active="false"
        className="peer/menu-button flex h-8 w-full items-center justify-center gap-2 overflow-hidden rounded-md !p-0 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-transparent focus-visible:ring-2 active:bg-transparent group-data-[collapsible=icon]:!size-8"
      >
        <div className="hidden group-data-[collapsible=icon]:flex aspect-square size-8 items-center justify-center rounded-lg bg-slate-900 dark:bg-[#071322] border border-slate-700 dark:border-cyan-400/40 p-1 shrink-0">
          <Image
            src={netcodexEmblem}
            alt="Netcodex Emblem"
            width={24}
            height={24}
            unoptimized
            priority
            className="size-full object-contain"
          />
        </div>

        <div className="flex h-8 w-full items-center justify-center rounded-lg bg-slate-900 dark:bg-[#071322] border border-slate-700 dark:border-cyan-400/40 px-3 overflow-hidden group-data-[collapsible=icon]:hidden">
          <Image
            src={netcodexLogoWhite}
            alt="Netcodex Computer Center"
            width={128}
            height={22}
            unoptimized
            priority
            className="h-5 w-auto object-contain"
          />
        </div>
      </UnstyledButton>
    </Tooltip>
  );

  const sidebarBody = (
    <Box
      data-sidebar="sidebar"
      className={cn(
        "relative flex w-full flex-col bg-sidebar text-sidebar-foreground",
        isMobile ? "min-h-0 !flex-1" : "h-full"
      )}
    >
      {!isMobile && (
        <Box
          data-sidebar="header"
          className="flex h-12 flex-col justify-center gap-2 p-2"
        >
          <Box
            component="ul"
            data-sidebar="menu"
            className="m-0 flex w-full min-w-0 list-none flex-col gap-1 p-0"
          >
            <Box
              component="li"
              data-sidebar="menu-item"
              className="group/menu-item relative"
            >
              {brandLink}
            </Box>
          </Box>
        </Box>
      )}

      <Box
        data-sidebar="content"
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
          isMobile && "pb-16"
        )}
      >
        <Box data-sidebar="group" className="relative flex w-full min-w-0 flex-col p-2">
          <Text
            unstyled
            component="div"
            data-sidebar="group-label"
            className="flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 outline-none ring-sidebar-ring transition-[margin,opacity] duration-200 ease-linear group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0"
          >
            Platform
          </Text>

          <Box
            component="ul"
            data-sidebar="menu"
            className="m-0 flex w-full min-w-0 list-none flex-col gap-1 p-0"
          >
            {navMain.map((item) => {
              const Icon = item.icon;
              const isGroupOpen = Boolean(openGroups[item.title]);

              if (item.items) {
                return (
                  <Box
                    key={item.title}
                    component="li"
                    data-sidebar="menu-item"
                    data-state={isGroupOpen ? "open" : "closed"}
                    className="group/menu-item group/collapsible relative"
                  >
                    <Tooltip
                      label={item.title}
                      position="right"
                      withArrow
                      disabled={!isCollapsed}
                    >
                      <UnstyledButton
                        unstyled
                        type="button"
                        data-sidebar="menu-button"
                        data-size="default"
                        data-active={isCollapsed && item.isActive ? "true" : "false"}
                        data-state={isGroupOpen ? "open" : "closed"}
                        onClick={() => {
                          if (isCollapsed) {
                            item.items?.[0]?.onClick();
                          } else {
                            toggleGroup(item.title);
                          }
                        }}
                        className="peer/menu-button flex h-8 w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm text-sidebar-foreground outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0"
                      >
                        <Icon />
                        <span>{item.title}</span>
                        {item.badge !== undefined && (
                          <Text
                            unstyled
                            component="span"
                            className="ml-auto rounded-md bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-300 group-data-[collapsible=icon]:hidden"
                          >
                            {item.badge}
                          </Text>
                        )}
                        <ChevronRight
                          className={cn(
                            "transition-transform duration-200",
                            item.badge === undefined && "ml-auto",
                            isGroupOpen && "rotate-90"
                          )}
                        />
                      </UnstyledButton>
                    </Tooltip>

                    <Collapse in={isGroupOpen && !isCollapsed}>
                      <Box
                        component="ul"
                        data-sidebar="menu-sub"
                        className="mx-3.5 my-0 flex min-w-0 translate-x-px list-none flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5 group-data-[collapsible=icon]:hidden"
                      >
                        {item.items.map((subItem) => (
                          <Box
                            key={subItem.title}
                            component="li"
                            data-sidebar="menu-sub-item"
                          >
                            <UnstyledButton
                              unstyled
                              type="button"
                              data-sidebar="menu-sub-button"
                              data-size="md"
                              data-active={subItem.isActive ? "true" : "false"}
                              onClick={subItem.onClick}
                              className="flex h-7 w-full min-w-0 -translate-x-px items-center justify-between gap-2 overflow-hidden rounded-md px-2 text-left text-sm text-sidebar-foreground outline-none ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground group-data-[collapsible=icon]:hidden [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0"
                            >
                              <span className="truncate">{subItem.title}</span>
                              {subItem.badge !== undefined && (
                                <Text
                                  unstyled
                                  component="span"
                                  className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-semibold leading-none tabular-nums text-slate-600 dark:bg-white/10 dark:text-slate-300"
                                >
                                  {subItem.badge}
                                </Text>
                              )}
                            </UnstyledButton>
                          </Box>
                        ))}
                      </Box>
                    </Collapse>
                  </Box>
                );
              }

              return (
                <Box
                  key={item.title}
                  component="li"
                  data-sidebar="menu-item"
                  className="group/menu-item relative"
                >
                  <Tooltip
                    label={item.title}
                    position="right"
                    withArrow
                    disabled={!isCollapsed}
                  >
                    <UnstyledButton
                      unstyled
                      type="button"
                      data-sidebar="menu-button"
                      data-size="default"
                      data-active={item.isActive ? "true" : "false"}
                      onClick={() => handleNavigateTab(item.defaultTab)}
                      className="peer/menu-button flex h-8 w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm text-sidebar-foreground outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0"
                    >
                      <Icon />
                      <span>{item.title}</span>
                    </UnstyledButton>
                  </Tooltip>
                  {item.badge !== undefined && (
                    <Box
                      data-sidebar="menu-badge"
                      className="pointer-events-none absolute right-1 top-1.5 flex h-5 min-w-5 select-none items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums text-sidebar-foreground peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground group-data-[collapsible=icon]:hidden"
                    >
                      {item.badge}
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>

      <Box
        data-sidebar="footer"
        className={cn(
          "mt-auto flex shrink-0 flex-col gap-2 bg-sidebar p-2",
          isMobile && "absolute inset-x-0 bottom-0 z-10"
        )}
      >
        <Box
          component="ul"
          data-sidebar="menu"
          className="m-0 flex w-full min-w-0 list-none flex-col gap-1 p-0"
        >
          <Box component="li" data-sidebar="menu-item" className="group/menu-item relative">
            <Menu
              position={isMobile ? "bottom-end" : "right-end"}
              offset={4}
              width={224}
              radius="md"
              shadow="md"
              withinPortal
            >
              <Menu.Target>
                <UnstyledButton
                  unstyled
                  type="button"
                  data-sidebar="menu-button"
                  data-size="lg"
                  aria-label="User account menu"
                  className="peer/menu-button flex h-12 w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm text-sidebar-foreground outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground data-[expanded]:bg-sidebar-accent data-[expanded]:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-0 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0"
                >
                  <Avatar
                    src={avatarUrl || null}
                    alt={displayName}
                    radius="md"
                    size={32}
                    className="h-8 w-8 rounded-lg shrink-0"
                  >
                    {userInitials}
                  </Avatar>
                  <div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-semibold">{displayName}</span>
                    <span className="truncate text-xs">{displayEmail}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 shrink-0 group-data-[collapsible=icon]:hidden" />
                </UnstyledButton>
              </Menu.Target>

              <Menu.Dropdown className="min-w-56 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md">
                <Menu.Label className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm text-foreground">
                    <Avatar
                      src={avatarUrl || null}
                      alt={displayName}
                      radius="md"
                      size={32}
                      className="h-8 w-8 rounded-lg shrink-0"
                    >
                      {userInitials}
                    </Avatar>
                    <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {displayName}
                      </span>
                      <span className="truncate text-xs">{displayEmail}</span>
                    </div>
                  </div>
                </Menu.Label>

                <Menu.Divider className="-mx-1 my-1 border-border" />

                <Menu.Item
                  leftSection={<BadgeCheck className="size-4" />}
                  onClick={() => router.push("/profile?tab=profile")}
                  className="rounded-sm px-2 py-1.5 text-sm"
                >
                  Account
                </Menu.Item>
                <Menu.Item
                  leftSection={<Settings2 className="size-4" />}
                  onClick={() => router.push("/profile?tab=settings")}
                  className="rounded-sm px-2 py-1.5 text-sm"
                >
                  Settings
                </Menu.Item>

                <Menu.Divider className="-mx-1 my-1 border-border" />

                <Menu.Item
                  color="red"
                  leftSection={<LogOut className="size-4" />}
                  onClick={() => setIsSignOutOpen(true)}
                  className="rounded-sm px-2 py-1.5 text-sm text-destructive"
                >
                  Sign Out
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Box>
        </Box>
      </Box>

      <UnstyledButton
        unstyled
        type="button"
        data-sidebar="rail"
        aria-label="Toggle Sidebar"
        tabIndex={-1}
        onClick={toggleSidebar}
        title="Toggle Sidebar"
        className="absolute inset-y-0 -right-4 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border sm:flex cursor-w-resize [[data-state=collapsed]_&]:cursor-e-resize"
      />
    </Box>
  );

  return (
    <>
      {isMobile ? (
        <Drawer
          opened={openMobile}
          onClose={() => setOpenMobile(false)}
          position="left"
          size={SIDEBAR_WIDTH_MOBILE}
          padding={0}
          withCloseButton={false}
          title={brandLink}
          classNames={{
            content:
              "!flex !h-full !flex-col bg-sidebar text-sidebar-foreground p-0",
            header: "!h-12 !min-h-12 bg-sidebar !px-3 !py-2",
            title: "w-full",
            body:
              "min-h-0 !flex !flex-1 !flex-col overflow-hidden p-0",
          }}
        >
          {sidebarBody}
        </Drawer>
      ) : (
        <Box
          className="group peer hidden text-sidebar-foreground md:block"
          data-state={state}
          data-collapsible={state === "collapsed" ? "icon" : ""}
          data-variant="sidebar"
          data-side="left"
        >
          <Box className="relative w-[--sidebar-width] bg-transparent transition-[width] duration-200 ease-linear group-data-[collapsible=icon]:w-[--sidebar-width-icon]" />
          <Box
            className={cn(
              "fixed inset-y-0 left-0 z-10 hidden h-svh w-[--sidebar-width] transition-[left,right,width] duration-200 ease-linear md:flex group-data-[collapsible=icon]:w-[--sidebar-width-icon] border-r border-sidebar-border",
              className
            )}
            {...props}
          >
            {sidebarBody}
          </Box>
        </Box>
      )}

      <Modal
        opened={isSignOutOpen}
        onClose={() => setIsSignOutOpen(false)}
        title={
          <Group gap="xs">
            <ThemeIcon size="md" color="red" variant="light" radius="md">
              <LogOut size={16} />
            </ThemeIcon>
            <Text
              fw={700}
              className="font-headline text-base text-slate-900 dark:text-white uppercase tracking-tight"
            >
              Confirm Sign Out
            </Text>
          </Group>
        }
        centered
        radius="lg"
        size="sm"
        overlayProps={{ backgroundOpacity: 0.65, blur: 5 }}
        classNames={{
          content:
            "bg-white/95 dark:bg-[#141a23]/95 backdrop-blur-md border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-slate-100 shadow-xl rounded-xl overflow-hidden",
          header:
            "bg-white/95 dark:bg-[#141a23]/95 border-b border-slate-200/80 dark:border-white/10 p-3",
          body: "!p-3",
          close:
            "text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors",
        }}
      >
        <Stack gap="md" className="pt-1">
          <Text
            size="sm"
            className="text-slate-600 dark:text-slate-300 leading-relaxed"
          >
            Are you sure you want to end your session and sign out of Buildbot
            AI?
          </Text>

          <Group justify="flex-end" gap="xs" pt="xs">
            <Button
              variant="default"
              size="sm"
              radius="md"
              onClick={() => setIsSignOutOpen(false)}
              className="border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              radius="md"
              color="red"
              className="font-bold text-xs uppercase tracking-wider"
              onClick={handleConfirmSignOut}
            >
              Sign Out
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
