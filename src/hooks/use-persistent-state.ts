"use client";

import { useState, useEffect } from 'react';

export function usePersistentState<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
    const [state, setState] = useState<T>(defaultValue);

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
