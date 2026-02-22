"use client";
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { YourBuild } from "@/components/your-build";
import { Cpu, Server, CircuitBoard, MemoryStick, HardDrive, Power, RectangleVertical as CaseIcon, Wind } from "lucide-react";
import type { ComponentData, Part } from "@/lib/types";
import { InventoryToolbar } from "@/components/inventory-toolbar";
import { parts as allParts } from "@/lib/database";
import { PartCard } from "@/components/part-card";

const componentCategories = [
  { name: "CPU", icon: Cpu, selected: true },
  { name: "GPU", icon: Server, selected: true },
  { name: "Motherboard", icon: CircuitBoard, selected: true },
  { name: "RAM", icon: MemoryStick, selected: true },
  { name: "Storage", icon: HardDrive, selected: true },
  { name: "PSU", icon: Power, selected: true },
  { name: "Case", icon: CaseIcon, selected: true },
  { name: "Cooler", icon: Wind, selected: true },
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
      componentCategories.map(c => ({ name: c.name, selected: true, icon: c.icon }))
    );

    const handleCategoryChange = (categoryName: string, selected: boolean) => {
        setCategories(prev =>
            prev.map(cat => (cat.name === categoryName ? { ...cat, selected } : cat))
        );
    };

    const handleAddToBuild = (part: Part) => {
      const category = part.category;
      const componentData: ComponentData = {
        model: part.name,
        price: part.price,
        description: part.specifications.slice(0, 2).map(s => `${s.key}: ${s.value}`).join(' | '),
        image: part.imageUrl,
        imageHint: part.name.toLowerCase().split(' ').slice(0, 2).join(' '),
        icon: componentCategories.find(c => c.name === category)!.icon,
      };

      setBuild(prevBuild => ({
        ...prevBuild,
        [category]: componentData,
      }));
    };

    const selectedCategories = categories.filter(c => c.selected).map(c => c.name);
    const filteredParts = allParts.filter(part => selectedCategories.includes(part.category));

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
            <InventoryToolbar
              categories={categories}
              onCategoryChange={handleCategoryChange}
              itemCount={filteredParts.length}
            />
          </div>

          {filteredParts.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {filteredParts.map(part => (
                    <PartCard key={part.id} part={part} onAddToBuild={handleAddToBuild} />
                ))}
            </div>
          ) : (
             <Card className="mt-6 min-h-[400px] flex items-center justify-center">
                <CardContent className="text-center text-muted-foreground p-6">
                  <p>No components found for the selected categories.</p>
                </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-4">
            <YourBuild build={build} />
        </div>
      </div>
    </main>
  );
}
