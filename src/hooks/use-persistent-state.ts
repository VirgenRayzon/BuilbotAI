"use client";

import { useState, useEffect } from 'react';

/**
 * usePersistentState — A hook that syncs state with LocalStorage.
 * Useful for UI preferences that should survive a refresh.
 */
export function usePersistentState<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
    // Initialize state with default value
    const [state, setState] = useState<T>(defaultValue);

    // Load from LocalStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(key);
            if (saved !== null) {
                setState(JSON.parse(saved));
            }
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
        }
    }, [key]);

    // Update LocalStorage whenever state changes
    const setPersistentState = (value: T | ((prev: T) => T)) => {
        try {
            const nextValue = value instanceof Function ? value(state) : value;
            setState(nextValue);
            localStorage.setItem(key, JSON.stringify(nextValue));
        } catch (error) {
            console.warn(`Error writing localStorage key "${key}":`, error);
        }
    };

    return [state, setPersistentState];
}
