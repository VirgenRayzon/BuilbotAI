"use client";

import Image from "next/image";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import {
    Badge,
    Divider,
    SimpleGrid,
    Paper,
    Text,
    ScrollArea,
    Button,
    ActionIcon,
    Group,
} from "@mantine/core";
import { useTheme } from "@/context/theme-provider";
import { formatCurrency, formatToPHP, getOptimizedStorageUrl, cn } from "@/lib/utils";
import type { Part } from "@/lib/types";
import {
    Cpu,
    Server,
    CircuitBoard,
    MemoryStick,
    Database,
    Power,
    RectangleVertical,
    Wind,
    Monitor,
    Keyboard,
    Mouse,
    Headphones,
    Info,
    Plus,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import ReactMarkdown from 'react-markdown';
import React from "react";

interface PartDetailsDialogProps {
    part: Part;
    children: React.ReactNode;
    isAdded?: boolean;
    onToggle?: () => void;
    isDisabled?: boolean;
}

const iconMap: Record<string, any> = {
    CPU: Cpu,
    GPU: Server,
    Motherboard: CircuitBoard,
    RAM: MemoryStick,
    Storage: Database,
    PSU: Power,
    Case: RectangleVertical,
    Cooler: Wind,
    Monitor: Monitor,
    Keyboard: Keyboard,
    Mouse: Mouse,
    Headset: Headphones,
};

export function PartDetailsDialog({ part, children, isAdded, onToggle, isDisabled }: PartDetailsDialogProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const Icon = iconMap[part.category] || Info;

    const allImages = React.useMemo(() => {
        if (part.images && part.images.length > 0) {
            return part.images;
        }
        return part.imageUrl ? [part.imageUrl] : [];
    }, [part.images, part.imageUrl]);

    const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

    React.useEffect(() => {
        setCurrentImageIndex(0);
    }, [part.id]);

    const handlePrev = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
    };

    const handleNext = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
    };

    // Check if TDP/Wattage is already present in specifications to avoid redundant display
    const hasTdpInSpecs = React.useMemo(() => {
        return Object.keys(part.specifications || {}).some(
            (k) => k.toLowerCase().includes("tdp") || k.toLowerCase().includes("wattage")
        );
    }, [part.specifications]);

    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent
                className={cn(
                    "w-[95vw] max-w-[960px] p-0 gap-0 overflow-hidden rounded-2xl border shadow-2xl transition-colors duration-200",
                    isDark
                        ? "bg-[#0c1017] border-white/10 text-slate-100 shadow-black/80"
                        : "bg-white border-slate-200 text-slate-900 shadow-2xl shadow-slate-900/10",
                    "[&>button]:w-9 [&>button]:h-9 [&>button]:flex [&>button]:items-center [&>button]:justify-center [&>button]:rounded-full [&>button]:transition-all [&>button]:opacity-80 [&>button]:hover:opacity-100",
                    isDark
                        ? "[&>button]:bg-white/10 [&>button]:text-slate-200 [&>button]:hover:bg-white/20"
                        : "[&>button]:bg-slate-100 [&>button]:text-slate-700 [&>button]:hover:bg-slate-200"
                )}
            >
                <div className="flex flex-col md:flex-row items-stretch max-h-[85vh]">
                    {/* Left: Product Image & Action Section */}
                    <div
                        className={cn(
                            "w-full md:w-[350px] lg:w-[380px] shrink-0 flex flex-col justify-between border-b md:border-b-0 md:border-r transition-colors",
                            isDark
                                ? "bg-slate-950/40 border-white/10"
                                : "bg-slate-50 border-slate-200/80"
                        )}
                    >
                        <div className="relative flex-1 w-full min-h-[280px] flex items-center justify-center p-6 select-none overflow-hidden">
                            <Image
                                src={getOptimizedStorageUrl(allImages[currentImageIndex] || part.imageUrl) || "/placeholder-part.png"}
                                alt={`${part.name} - Photo ${currentImageIndex + 1}`}
                                fill
                                unoptimized
                                className="object-contain p-6 transition-all duration-300"
                                sizes="(max-width: 768px) 100vw, 380px"
                            />

                            {/* Category Badge */}
                            <div
                                className="z-20"
                                style={{ position: "absolute", top: "16px", left: "16px" }}
                            >
                                <Badge
                                    variant="light"
                                    color="cyan"
                                    size="md"
                                    radius="sm"
                                    fw={800}
                                    tt="uppercase"
                                    className="shadow-sm font-headline tracking-wider text-xs px-2.5 py-1"
                                >
                                    {part.category}
                                </Badge>
                            </div>

                            {/* Carousel Left and Right Navigation Buttons */}
                            {allImages.length > 1 && (
                                <>
                                    <button
                                        type="button"
                                        onClick={handlePrev}
                                        className={cn(
                                            "z-30 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md",
                                            isDark
                                                ? "bg-slate-900/90 hover:bg-slate-800 text-slate-100 border border-white/20 shadow-black/50"
                                                : "bg-white/95 hover:bg-white text-slate-800 border border-slate-300 shadow-md"
                                        )}
                                        style={{
                                            position: "absolute",
                                            top: "50%",
                                            left: "12px",
                                            transform: "translateY(-50%)",
                                        }}
                                        aria-label="Previous photo"
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleNext}
                                        className={cn(
                                            "z-30 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md",
                                            isDark
                                                ? "bg-slate-900/90 hover:bg-slate-800 text-slate-100 border border-white/20 shadow-black/50"
                                                : "bg-white/95 hover:bg-white text-slate-800 border border-slate-300 shadow-md"
                                        )}
                                        style={{
                                            position: "absolute",
                                            top: "50%",
                                            right: "12px",
                                            transform: "translateY(-50%)",
                                        }}
                                        aria-label="Next photo"
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </button>

                                    {/* Photo Counter */}
                                    <div
                                        className="z-20"
                                        style={{
                                            position: "absolute",
                                            bottom: "14px",
                                            left: "50%",
                                            transform: "translateX(-50%)",
                                        }}
                                    >
                                        <Badge
                                            variant="filled"
                                            color="dark"
                                            size="sm"
                                            radius="xl"
                                            className={cn(
                                                "backdrop-blur-md font-mono font-bold tracking-wider px-3 py-1 text-xs",
                                                isDark
                                                    ? "bg-black/75 text-white/95 border border-white/10"
                                                    : "bg-slate-900/85 text-white"
                                            )}
                                        >
                                            {currentImageIndex + 1} / {allImages.length}
                                        </Badge>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Action CTA Button */}
                        {onToggle && (
                            <div
                                className={cn(
                                    "p-4 sm:p-5 border-t shrink-0 transition-colors",
                                    isDark
                                        ? "bg-slate-950/40 border-white/10"
                                        : "bg-slate-100/70 border-slate-200/80"
                                )}
                            >
                                <Button
                                    fullWidth
                                    size="lg"
                                    radius="md"
                                    color={isAdded ? "teal" : "cyan"}
                                    variant="filled"
                                    disabled={isDisabled || (part.stock === 0 && !isAdded)}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onToggle();
                                    }}
                                    leftSection={
                                        isAdded ? (
                                            <CheckCircle2 className="h-5 w-5" />
                                        ) : (
                                            <Plus className="h-5 w-5" />
                                        )
                                    }
                                    className={cn(
                                        "h-12 font-bold uppercase tracking-wider text-sm shadow-md transition-all",
                                        isAdded
                                            ? "shadow-emerald-500/20 hover:bg-emerald-600 text-white"
                                            : isDark
                                                ? "shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:bg-cyan-500 text-white"
                                                : "shadow-cyan-600/20 hover:shadow-cyan-600/30 bg-cyan-600 hover:bg-cyan-700 text-white"
                                    )}
                                >
                                    {isAdded ? "Added to Build" : "Add to Build"}
                                </Button>
                                {part.stock === 0 && !isAdded && (
                                    <Text size="xs" c="red" fw={700} tt="uppercase" ta="center" mt={6} lts="0.05em">
                                        Currently Out of Stock
                                    </Text>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right: Content Section (Header + Scrollable Highlights & Specs) */}
                    <div
                        className={cn(
                            "flex-1 min-w-0 flex flex-col p-6 sm:p-7 md:p-8 pr-14 md:pr-12 transition-colors",
                            isDark ? "bg-[#0c1017]" : "bg-white"
                        )}
                    >
                        {/* Header: Brand, Title, Price */}
                        <div className="space-y-2.5">
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant="subtle"
                                    color="cyan"
                                    size="md"
                                    radius="sm"
                                    leftSection={<Icon className="w-3.5 h-3.5" />}
                                    fw={800}
                                    tt="uppercase"
                                    lts="0.08em"
                                    px={8}
                                    className="text-xs"
                                >
                                    {part.brand}
                                </Badge>
                            </div>

                            <DialogTitle
                                className={cn(
                                    "text-2xl sm:text-3xl font-bold font-headline leading-tight tracking-tight",
                                    isDark ? "text-slate-100" : "text-slate-900"
                                )}
                            >
                                {part.name}
                            </DialogTitle>
                            <DialogDescription className="sr-only">
                                Technical specifications, stock availability, and pricing details for {part.name}
                            </DialogDescription>

                            <Group gap="sm" align="baseline" mt={4}>
                                <Text
                                    className={cn(
                                        "text-3xl sm:text-4xl font-extrabold font-headline tracking-tight",
                                        isDark ? "text-cyan-400" : "text-cyan-600"
                                    )}
                                >
                                    {formatCurrency(part.price)}
                                </Text>
                                {part.usdSrp && (
                                    <Text
                                        size="sm"
                                        fw={600}
                                        className={isDark ? "text-slate-400" : "text-slate-500"}
                                    >
                                        (Est. PHP {formatToPHP(part.usdSrp)})
                                    </Text>
                                )}
                            </Group>
                        </div>

                        {/* Scrollable Body: Auto-fits height up to max-height */}
                        <ScrollArea.Autosize
                            mah="min(56vh, 500px)"
                            offsetScrollbars
                            scrollbarSize={6}
                            type="hover"
                            className="mt-5 pr-2"
                        >
                            <div className="space-y-6 pb-2">
                                {/* Product Highlights */}
                                {part.description && (
                                    <div>
                                        <Divider
                                            my="sm"
                                            label={
                                                <Text
                                                    size="12px"
                                                    fw={800}
                                                    tt="uppercase"
                                                    lts="0.15em"
                                                    className={isDark ? "text-slate-400" : "text-slate-500"}
                                                >
                                                    Product Highlights
                                                </Text>
                                            }
                                            labelPosition="center"
                                            color={isDark ? "dark.4" : "gray.3"}
                                        />
                                        <div className="pt-2">
                                            <ReactMarkdown
                                                components={{
                                                    ul: ({ children }) => (
                                                        <ul className="space-y-2.5 pl-5 list-disc marker:text-cyan-500">
                                                            {children}
                                                        </ul>
                                                    ),
                                                    li: ({ children }) => (
                                                        <li className={cn("text-sm sm:text-[15px] leading-relaxed", isDark ? "text-slate-300" : "text-slate-700")}>
                                                            {children}
                                                        </li>
                                                    ),
                                                    p: ({ children }) => (
                                                        <p className={cn("text-sm sm:text-[15px] leading-relaxed", isDark ? "text-slate-300" : "text-slate-700")}>
                                                            {children}
                                                        </p>
                                                    ),
                                                    strong: ({ children }) => (
                                                        <strong className={cn("font-bold text-sm sm:text-[15px]", isDark ? "text-slate-100" : "text-slate-950")}>
                                                            {children}
                                                        </strong>
                                                    ),
                                                }}
                                            >
                                                {part.description}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                )}

                                {/* Technical Specifications */}
                                <div>
                                    <Divider
                                        my="sm"
                                        label={
                                            <Text
                                                size="12px"
                                                fw={800}
                                                tt="uppercase"
                                                lts="0.15em"
                                                className={isDark ? "text-slate-400" : "text-slate-500"}
                                            >
                                                Technical Specifications
                                            </Text>
                                        }
                                        labelPosition="center"
                                        color={isDark ? "dark.4" : "gray.3"}
                                    />
                                    <div className="pt-2">
                                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                                            {Object.entries(part.specifications || {}).map(([key, value]) => (
                                                <Paper
                                                    key={key}
                                                    p="10px 14px"
                                                    radius="md"
                                                    withBorder
                                                    className={cn(
                                                        "transition-colors",
                                                        isDark
                                                            ? "bg-slate-900/60 border-white/10 hover:border-cyan-500/20"
                                                            : "bg-slate-50 border-slate-200/90 hover:border-cyan-500/40 hover:bg-white"
                                                    )}
                                                >
                                                    <Text
                                                        size="11px"
                                                        fw={700}
                                                        tt="uppercase"
                                                        lts="0.06em"
                                                        className={cn("truncate", isDark ? "text-slate-400" : "text-slate-500")}
                                                    >
                                                        {key}
                                                    </Text>
                                                    <Text
                                                        size="sm"
                                                        fw={700}
                                                        className={cn("mt-1 break-words leading-snug text-sm sm:text-[15px]", isDark ? "text-slate-100" : "text-slate-900")}
                                                    >
                                                        {String(value)}
                                                    </Text>
                                                </Paper>
                                            ))}

                                            {/* TDP / Wattage if not already in specifications */}
                                            {Boolean(part.wattage && part.wattage > 0) && !hasTdpInSpecs && (
                                                <Paper
                                                    p="10px 14px"
                                                    radius="md"
                                                    withBorder
                                                    className={cn(
                                                        "transition-colors",
                                                        isDark
                                                            ? "bg-slate-900/60 border-white/10 hover:border-cyan-500/20"
                                                            : "bg-slate-50 border-slate-200/90 hover:border-cyan-500/40 hover:bg-white"
                                                    )}
                                                >
                                                    <Text
                                                        size="11px"
                                                        fw={700}
                                                        tt="uppercase"
                                                        lts="0.06em"
                                                        className={isDark ? "text-slate-400" : "text-slate-500"}
                                                    >
                                                        TDP / Wattage
                                                    </Text>
                                                    <Text
                                                        size="sm"
                                                        fw={700}
                                                        className={cn("mt-1 text-sm sm:text-[15px]", isDark ? "text-slate-100" : "text-slate-900")}
                                                    >
                                                        {part.wattage}W
                                                    </Text>
                                                </Paper>
                                            )}

                                            {/* Stock Availability */}
                                            <Paper
                                                p="10px 14px"
                                                radius="md"
                                                withBorder
                                                className={cn(
                                                    "transition-colors",
                                                    isDark
                                                        ? "bg-slate-900/60 border-white/10 hover:border-cyan-500/20"
                                                        : "bg-slate-50 border-slate-200/90 hover:border-cyan-500/40 hover:bg-white"
                                                )}
                                            >
                                                <Text
                                                    size="11px"
                                                    fw={700}
                                                    tt="uppercase"
                                                    lts="0.06em"
                                                    className={isDark ? "text-slate-400" : "text-slate-500"}
                                                >
                                                    Status
                                                </Text>
                                                <div className="mt-1.5">
                                                    <Badge
                                                        variant="light"
                                                        color={part.stock > 0 ? "teal" : "red"}
                                                        size="md"
                                                        radius="sm"
                                                        fw={700}
                                                        className="text-xs"
                                                    >
                                                        {part.stock > 0 ? `${part.stock} in stock` : "Out of stock"}
                                                    </Badge>
                                                </div>
                                            </Paper>
                                        </SimpleGrid>
                                    </div>
                                </div>
                            </div>
                        </ScrollArea.Autosize>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

