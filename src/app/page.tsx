"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { YourBuild } from "@/components/your-build";
import { Cpu, Server, CircuitBoard, MemoryStick, HardDrive, Power, Rectangle as CaseIcon, Wind, Search, Filter } from "lucide-react";
import type { ComponentData } from "@/lib/types";

const componentCategories = [
  { name: "CPU", icon: Cpu },
  { name: "GPU", icon: Server },
  { name: "Motherboard", icon: CircuitBoard },
  { name: "RAM", icon: MemoryStick },
  { name: "Storage", icon: HardDrive },
  { name: "PSU", icon: Power },
  { name: "Case", icon: CaseIcon },
  { name: "Cooler", icon: Wind },
];

export default function BuilderPage() {
    const [selectedCategory, setSelectedCategory] = useState("CPU");
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
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {componentCategories.map((cat) => (
              <Button
                key={cat.name}
                variant={selectedCategory === cat.name ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat.name)}
                className="flex-shrink-0"
              >
                <cat.icon className="mr-2 h-4 w-4" />
                {cat.name}
              </Button>
            ))}
          </div>

          <div className="flex gap-4 mb-4">
            <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder={`Search ${selectedCategory}s...`} className="pl-10" />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>

          <Card className="min-h-[400px] flex items-center justify-center">
            <CardContent className="text-center text-muted-foreground p-6">
              <p>No components found matching your search.</p>
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
