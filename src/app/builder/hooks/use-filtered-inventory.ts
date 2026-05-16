"use client";

import { useState, useMemo } from 'react';
import type { Part } from '@/lib/types';
import { checkCompatibility } from "@/lib/compatibility";

/**
 * Hook to manage sorting, filtering, and pagination for the builder inventory.
 */
export function useFilteredInventory(allParts: Part[], build: any, getCountInBuild: (name: string) => number) {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('Date Added');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12);
    const [categories, setCategories] = useState([
        { name: "Case", selected: true },
        { name: "Motherboard", selected: true },
        { name: "CPU", selected: true },
        { name: "GPU", selected: true },
        { name: "RAM", selected: true },
        { name: "Storage", selected: true },
        { name: "PSU", selected: true },
        { name: "Cooler", selected: true },
        { name: "Monitor", selected: true },
        { name: "Keyboard", selected: true },
        { name: "Mouse", selected: true },
        { name: "Headset", selected: true },
    ]);

    const handleCategoryChange = (categoryName: string, selected?: boolean) => {
        setCurrentPage(1);
        setCategories(prev => {
            if (categoryName === 'All') {
                const anyUnselected = prev.some(cat => !cat.selected);
                return prev.map(cat => ({ ...cat, selected: anyUnselected }));
            }

            // Check if this category is already the ONLY one selected
            const selectedCount = prev.filter(c => c.selected).length;
            const isAlreadyOnlySelected = selectedCount === 1 && prev.find(c => c.name === categoryName)?.selected;

            // If it's already the only one selected, stay on it (remove toggle-off behavior)
            // unless explicitly unselected (e.g., from a checkbox)
            if (isAlreadyOnlySelected && selected !== false) {
                return prev;
            }

            // If explicitly unselecting the only active category, reset to all
            if (isAlreadyOnlySelected && selected === false) {
                return prev.map(cat => ({ ...cat, selected: true }));
            }

            // Otherwise, select ONLY this category
            return prev.map(cat => ({
                ...cat,
                selected: cat.name === categoryName
            }));
        });
    };

    const sortedAndFilteredParts = useMemo(() => {
        const selectedCategories = categories.filter(c => c.selected).map(c => c.name);
        const searchLower = searchQuery.toLowerCase();

        return (allParts?.filter(part => {
            const matchesCategory = selectedCategories.includes(part.category);
            const matchesSearch = part.name.toLowerCase().includes(searchLower) ||
                (part.brand?.toLowerCase() || '').includes(searchLower) ||
                part.category.toLowerCase().includes(searchLower);
            return matchesCategory && matchesSearch;
        }) ?? [])
        .sort((a, b) => {
            let compare = 0;
            const compA = checkCompatibility(a, build).compatible;
            const compB = checkCompatibility(b, build).compatible;
            if (compA !== compB) return compA ? -1 : 1;

            if (sortBy === 'Name') compare = (a.name || '').localeCompare(b.name || '');
            else if (sortBy === 'Price') compare = (a.price || 0) - (b.price || 0);
            else if (sortBy === 'Date Added') {
                const dateA = a.createdAt?.toDate?.() || a.createdAt || 0;
                const dateB = b.createdAt?.toDate?.() || b.createdAt || 0;
                compare = new Date(dateA).getTime() - new Date(dateB).getTime();
            }
            return sortDirection === 'asc' ? compare : -compare;
        })
        .map(part => ({
            ...part,
            effectiveStock: part.stock - getCountInBuild(part.name),
            compatibility: checkCompatibility(part, build)
        }));
    }, [allParts, categories, sortBy, sortDirection, build, searchQuery, getCountInBuild]);

    const totalPages = Math.ceil(sortedAndFilteredParts.length / itemsPerPage);
    const paginatedParts = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedAndFilteredParts.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedAndFilteredParts, currentPage, itemsPerPage]);

    return {
        searchQuery, setSearchQuery,
        sortBy, setSortBy,
        sortDirection, setSortDirection,
        currentPage, setCurrentPage,
        itemsPerPage, setItemsPerPage,
        categories, setCategories,
        handleCategoryChange,
        sortedAndFilteredParts,
        paginatedParts,
        totalPages
    };
}
