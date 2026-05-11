"use client";

import { useState } from "react";
import { Cpu, Server, CircuitBoard, MemoryStick, Database, Power, RectangleVertical as CaseIcon, Wind, Monitor, Keyboard, Mouse, Headphones, ChevronDown } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn, formatCurrency } from "@/lib/utils";
import { ComponentData, Resolution } from "@/lib/types";
import { BuildItem } from "./build-item";
import { BottleneckMeter } from "./bottleneck-meter";
import { PowerMeter } from "../ui/power-meter";
import { calculateSynergyScore } from "@/lib/bottleneck";
import { motion } from "framer-motion";

interface BuildContentProps {
  build: Record<string, ComponentData | ComponentData[] | null>;
  onRemovePart: (category: string, index?: number) => void;
  onCategorySelect?: (category: string) => void;
  showSystemBalance?: boolean;
  resolution: Resolution;
  totalWattage: number;
  psuWattage: number;
  totalPrice: number;
}

const componentIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  cpu: Cpu,
  gpu: Server,
  motherboard: CircuitBoard,
  ram: MemoryStick,
  storage: Database,
  psu: Power,
  case: CaseIcon,
  cooler: Wind,
  monitor: Monitor,
  keyboard: Keyboard,
  mouse: Mouse,
  headset: Headphones,
};

const mainCategories = ['Case', 'Motherboard', 'CPU', 'GPU', 'RAM', 'Storage', 'PSU', 'Cooler'];
const accessoryCategories = ['Monitor', 'Keyboard', 'Mouse', 'Headset'];

export function BuildContent({
  build,
  onRemovePart,
  onCategorySelect,
  showSystemBalance,
  resolution,
  totalWattage,
  psuWattage,
  totalPrice,
}: BuildContentProps) {
  const [showAccessories, setShowAccessories] = useState(false);

  return (
    <div className="px-5 py-4 flex flex-col h-full">
      <div className="space-y-3 py-1 flex-1">
        {mainCategories.map((name) => (
          <BuildItem
            key={name}
            name={name}
            component={build[name]}
            icon={componentIcons[name.toLowerCase()] || Cpu}
            onRemove={onRemovePart}
            onSelect={onCategorySelect}
          />
        ))}

        <button 
          type="button"
          className="w-full pt-6 pb-3 cursor-pointer group/acc border-none bg-transparent outline-none"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowAccessories(!showAccessories);
          }}
        >
          <div className="flex items-center gap-3 w-full">
            <span className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] group-hover/acc:text-primary transition-colors">
                Accessories
              </span>
              <ChevronDown className={cn(
                "w-4 h-4 text-muted-foreground transition-transform duration-300 group-hover/acc:text-primary",
                showAccessories && "rotate-180"
              )} />
            </span>
            <div className="h-px flex-1 bg-border/30 group-hover/acc:bg-primary/40 transition-colors" />
          </div>
        </button>

        {showAccessories && accessoryCategories.map((name) => (
          <BuildItem
            key={name}
            name={name}
            component={build[name]}
            icon={componentIcons[name.toLowerCase()] || Monitor}
            onRemove={onRemovePart}
            onSelect={onCategorySelect}
            isAccessory={true}
          />
        ))}
      </div>

      <div className="pt-4 flex-none space-y-4">
        <Separator className="opacity-50" />
        {showSystemBalance !== false && <BottleneckMeter build={build} resolution={resolution} />}
        
        {totalWattage > 0 && (
          <PowerMeter value={totalWattage} max={psuWattage} className="mt-2" />
        )}

        <div className="pt-2">
            <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Synergy Rating</span>
                <span className={cn("text-[10px] font-black tracking-widest", calculateSynergyScore(build, resolution).score >= 80 ? "text-primary" : "text-amber-500")}>
                    {calculateSynergyScore(build, resolution).score}/100
                </span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${calculateSynergyScore(build, resolution).score}%` }}
                    className="h-full bg-primary"
                    style={{ backgroundColor: calculateSynergyScore(build, resolution).color }}
                />
            </div>
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-dashed border-border/40">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Total Value</span>
          <span className="text-2xl font-bold font-headline text-primary tracking-tighter">{formatCurrency(totalPrice)}</span>
        </div>
      </div>
    </div>
  );
}
