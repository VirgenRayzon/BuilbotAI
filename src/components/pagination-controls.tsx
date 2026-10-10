import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationControlsProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    itemsPerPage?: number;
    onItemsPerPageChange?: (items: number) => void;
    className?: string;
}

export function PaginationControls({
    currentPage,
    totalPages,
    onPageChange,
    className,
}: PaginationControlsProps) {
    return (
        <div className={cn(
            "flex items-center justify-end py-2 transition-colors",
            className
        )}>
            {/* Pagination Controls & Indicator */}
            <div className="flex items-center space-x-3 sm:space-x-5">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono whitespace-nowrap">
                    Page <span className="text-cyan-600 dark:text-cyan-400 font-bold">{currentPage}</span> of {totalPages || 1}
                </span>

                <div className="flex items-center space-x-1 sm:space-x-1.5">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-lg bg-white dark:bg-slate-900/90 border-slate-300 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        onClick={() => onPageChange(1)}
                        disabled={currentPage === 1}
                        aria-label="First page"
                    >
                        <ChevronsLeft className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-lg bg-white dark:bg-slate-900/90 border-slate-300 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        aria-label="Previous page"
                    >
                        <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-lg bg-white dark:bg-slate-900/90 border-slate-300 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages || totalPages === 0}
                        aria-label="Next page"
                    >
                        <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-lg bg-white dark:bg-slate-900/90 border-slate-300 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        onClick={() => onPageChange(totalPages)}
                        disabled={currentPage >= totalPages || totalPages === 0}
                        aria-label="Last page"
                    >
                        <ChevronsRight className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
