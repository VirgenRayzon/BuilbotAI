
"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface LoadingContextType {
  isPageLoading: boolean;
  setIsPageLoading: (loading: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType>({
  isPageLoading: false,
  setIsPageLoading: () => {},
});

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isPageLoading, setIsPageLoading] = useState(false);

  const setPageLoading = useCallback((loading: boolean) => {
    setIsPageLoading(loading);
  }, []);

  return (
    <LoadingContext.Provider value={{ isPageLoading, setIsPageLoading: setPageLoading }}>
      {children}
    </LoadingContext.Provider>
  );
}

export const useLoading = () => useContext(LoadingContext);
