"use client";

import type { Build } from "@/lib/types";
import { ComponentCard } from "./component-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Bot, Info } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Skeleton } from "./ui/skeleton";

interface BuildSummaryProps {
  build: Build | null;
  isPending: boolean;
}

export function BuildSummary({ build, isPending }: BuildSummaryProps) {
  if (isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full rounded-lg" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-72 w-full rounded-lg" />
          <Skeleton className="h-72 w-full rounded-lg" />
          <Skeleton className="h-72 w-full rounded-lg" />
          <Skeleton className="h-72 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!build) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-xl h-96">
        <Bot className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold font-headline text-muted-foreground">
          Your build awaits
        </h3>
        <p className="text-muted-foreground mt-2 max-w-sm">
          Use the AI Build Advisor to generate your personalized PC component
          list.
        </p>
      </div>
    );
  }

  const components = [
    { name: "CPU", data: build.cpu },
    { name: "Graphics Card", data: build.gpu },
    { name: "Motherboard", data: build.motherboard },
    { name: "RAM", data: build.ram },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle className="font-headline">AI Build Summary</AlertTitle>
          <AlertDescription>{build.summary}</AlertDescription>
        </Alert>

        <div className="grid md:grid-cols-2 gap-6">
          {components.map((component, index) => (
            <motion.div
              key={component.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <ComponentCard name={component.name} component={component.data} />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
