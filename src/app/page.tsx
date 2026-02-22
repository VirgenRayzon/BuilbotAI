"use client";
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { YourBuild } from "@/components/your-build";
import { Cpu, Server, CircuitBoard, MemoryStick, HardDrive, Power, RectangleVertical as CaseIcon, Wind, Search } from "lucide-react";
import type { ComponentData } from "@/lib/types";
import { InventoryToolbar } from "@/components/inventory-toolbar";

const componentCategories = [
  { name: "CPU", icon: Cpu, selected: true },
  { name: "GPU", icon: Server, selected: false },
  { name: "Motherboard", icon: CircuitBoard, selected: false },
  { name: "RAM", icon: MemoryStick, selected: false },
  { name: "Storage", icon: HardDrive, selected: false },
  { name: "PSU", icon: Power, selected: false },
  { name: "Case", icon: CaseIcon, selected: false },
  { name: "Cooler", icon: Wind, selected: false },
];

export default function BuilderPage() {
    const [build, setBuild] = useState<Record<string, ComponentData | null>>({
        CPU: null,
        GPU: null,
        Motherboard: null,
        RAM: null,
        Storage: null,
        PSU: null,
        Case: null,
        Cooler: null,
    });
    
    const [categories, setCategories] = useState(
      componentCategories.map(c => ({ name: c.name, selected: true }))
    );

    const handleCategoryChange = (categoryName: string, selected: boolean) => {
        setCategories(prev =>
            prev.map(cat => (cat.name === categoryName ? { ...cat, selected } : cat))
        );
    };

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="text-left mb-8">
        <h1 className="text-4xl font-headline font-bold">Build Your Masterpiece</h1>
        <p className="text-muted-foreground mt-2">
          Select high-performance components and let our AI ensure everything fits
          perfectly together.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <div className="space-y-4">
            <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder={`Search components...`} className="pl-10" />
            </div>
            <InventoryToolbar
              categories={categories}
              onCategoryChange={handleCategoryChange}
              itemCount={0}
            />
          </div>

          <Card className="mt-6 min-h-[400px] flex items-center justify-center">
            <CardContent className="text-center text-muted-foreground p-6">
              <p>No components found.</p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4">
            <YourBuild build={build} />
        </div>
      </div>
    </main>
  );
}
