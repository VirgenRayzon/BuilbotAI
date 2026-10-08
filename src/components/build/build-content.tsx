"use client";

import { useState, useEffect, useRef, useId } from "react";
import { Cpu, Server, CircuitBoard, MemoryStick, Database, Power, RectangleVertical as CaseIcon, Wind, Monitor, Keyboard, Mouse, Headphones, ChevronDown, HardDrive } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn, formatCurrency } from "@/lib/utils";
import { ComponentData } from "@/lib/types";
import { BuildItem } from "./build-item";
import { PowerMeter } from "../ui/power-meter";
import { motion, AnimatePresence } from "framer-motion";

interface BuildContentProps {
  build: Record<string, ComponentData | ComponentData[] | null>;
  onRemovePart: (category: string, index?: number) => void;
  onCategorySelect?: (category: string) => void;
  categories?: any[];
  showSystemBalance?: boolean;
  totalWattage: number;
  psuWattage: number;
  totalPrice: number;
  activeFilter?: string | null;
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

const mainCategories = ['Motherboard', 'CPU', 'GPU', 'RAM', 'Storage', 'PSU', 'Cooler', 'Case'];
const accessoryCategories = ['Monitor', 'Keyboard', 'Mouse', 'Headset'];

export function BuildContent({
  build,
  onRemovePart,
  onCategorySelect,
  activeFilter,
  categories,
  showSystemBalance,
  totalWattage,
  psuWattage,
  totalPrice,
}: BuildContentProps) {
  const [showAccessories, setShowAccessories] = useState(false);
  const accessoriesId = useId();
  const previousAccessories = useRef("");
  const accessorySignature = accessoryCategories.map((category) => {
    const value = build[category];
    return Array.isArray(value)
      ? value.map((part) => `${category}:${part.id}`).join("|")
      : value ? `${category}:${value.id}` : "";
  }).filter(Boolean).join("|");

  useEffect(() => {
    if (accessorySignature !== previousAccessories.current) {
      setShowAccessories(Boolean(accessorySignature));
      previousAccessories.current = accessorySignature;
    }
  }, [accessorySignature]);

  useEffect(() => {
    const handleLoadedBuild = (event: Event) => {
      const favorite = (event as CustomEvent<{ parts?: { category: string }[] }>).detail;
      setShowAccessories(Boolean(favorite?.parts?.some((part) => accessoryCategories.includes(part.category))));
    };
    window.addEventListener("load-favorite-build", handleLoadedBuild);
    return () => window.removeEventListener("load-favorite-build", handleLoadedBuild);
  }, []);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    RAM: false,
    Storage: false,
  });

  // Auto-expand if filter is active
  useEffect(() => {
    if (activeFilter === 'RAM') {
      setExpandedSections({ RAM: true, Storage: false });
    } else if (activeFilter === 'Storage') {
      setExpandedSections({ RAM: false, Storage: true });
    } else {
      setExpandedSections({ RAM: false, Storage: false });
    }
  }, [activeFilter]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const isCurrentlyOpen = prev[section];
      // Close others when opening one (exclusive focus)
      if (!isCurrentlyOpen) {
        return { RAM: false, Storage: false, [section]: true };
      }
      return { ...prev, [section]: false };
    });
  };

  return (
    <div className="px-5 py-4 flex flex-col h-full overflow-y-auto no-scrollbar">
      <div className="space-y-3 py-1 flex-1">
        {mainCategories.map((name) => {
          const mobo = build['Motherboard'] as ComponentData | null;
          
          if (name === 'RAM') {
            const ramData = build['RAM'];
            const rams = Array.isArray(ramData) ? ramData : (ramData ? [ramData] : []);
            
            const flattenedRams: { data: ComponentData | null; originalIndex: number }[] = [];
            rams.forEach((r, idx) => {
              const sticks = parseInt(r.specifications?.['Stick Count']?.toString() || "1");
              for (let s = 0; s < sticks; s++) {
                flattenedRams.push({ data: r, originalIndex: idx });
              }
            });

            const totalSlots = mobo ? parseInt(mobo.specifications?.['Memory Slots']?.toString() || "4") : Math.max(flattenedRams.length, 1);
            while (flattenedRams.length < totalSlots) {
              flattenedRams.push({ data: null, originalIndex: -1 });
            }

            const usedCount = flattenedRams.filter(r => r.data).length;
            const isExpanded = expandedSections['RAM'];

            return (
              <div key={name} className="space-y-2">
                <button 
                  onClick={() => toggleSection('RAM')}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <MemoryStick className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">Memory</p>
                      <p className="text-xs font-bold text-primary">{usedCount}/{totalSlots} Slots Used</p>
                    </div>
                  </div>
                  <ChevronDown className={cn("w-4 h-4 text-primary/50 transition-transform duration-300", !isExpanded && "-rotate-90")} />
                </button>
                
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden space-y-2 pl-2 border-l border-primary/10 ml-5"
                    >
                      {flattenedRams.slice(0, totalSlots).map((slot, i) => (
                        <BuildItem
                          key={`${name}-${i}`}
                          name={name}
                          label={`Slot ${i + 1}`}
                          component={slot.data}
                          icon={MemoryStick}
                          onRemove={(cat, _) => onRemovePart(cat, slot.originalIndex)}
                          onSelect={onCategorySelect}
                          isActiveFilter={activeFilter === name}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }

          if (name === 'Storage') {
            const storageData = build['Storage'];
            const storages = Array.isArray(storageData) ? storageData : (storageData ? [storageData] : []);
            
            const nvmeSlots = mobo ? parseInt(mobo.specifications?.['NVMe Slots']?.toString() || "1") : 1;
            const sataSlots = mobo ? parseInt(mobo.specifications?.['SATA Slots']?.toString() || "2") : 1;

            const nvmeDrives = storages.filter(s => s.specifications?.['Type']?.toString().toLowerCase().includes('nvme') || s.model.toLowerCase().includes('nvme'));
            const sataDrives = storages.filter(s => !nvmeDrives.includes(s));

            const findOriginalIndex = (drive: ComponentData) => storages.indexOf(drive);
            const isExpanded = expandedSections['Storage'];

            return (
              <div key={name} className="space-y-2">
                <button 
                  onClick={() => toggleSection('Storage')}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Database className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">Storage</p>
                      <p className="text-xs font-bold text-primary">{storages.length}/{nvmeSlots + sataSlots} Drives</p>
                    </div>
                  </div>
                  <ChevronDown className={cn("w-4 h-4 text-primary/50 transition-transform duration-300", !isExpanded && "-rotate-90")} />
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden space-y-2 pl-2 border-l border-primary/10 ml-5"
                    >
                      <div className="space-y-1 mt-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1 ml-2">NVMe M.2 Slots</p>
                        {Array.from({ length: nvmeSlots }).map((_, i) => (
                          <BuildItem
                            key={`NVME-${i}`}
                            name={name}
                            label={`NVME ${i + 1}`}
                            component={nvmeDrives[i] || null}
                            icon={Database}
                            onRemove={(cat, _) => onRemovePart(cat, findOriginalIndex(nvmeDrives[i]))}
                            onSelect={onCategorySelect}
                            isActiveFilter={activeFilter === name}
                          />
                        ))}
                      </div>

                      <div className="space-y-1 mt-4">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1 ml-2">SATA Slots</p>
                        {Array.from({ length: sataSlots }).map((_, i) => (
                          <BuildItem
                            key={`SATA-${i}`}
                            name={name}
                            label={`SATA ${i + 1}`}
                            component={sataDrives[i] || null}
                            icon={HardDrive}
                            onRemove={(cat, _) => onRemovePart(cat, findOriginalIndex(sataDrives[i]))}
                            onSelect={onCategorySelect}
                            isActiveFilter={activeFilter === name}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }

          return (
            <BuildItem
              key={name}
              name={name}
              component={build[name]}
              icon={componentIcons[name.toLowerCase()] || Cpu}
              onRemove={onRemovePart}
              onSelect={onCategorySelect}
              isActiveFilter={activeFilter === name}
            />
          );
        })}

        <button 
          type="button"
          aria-expanded={showAccessories}
          aria-controls={accessoriesId}
          className="w-full pt-6 pb-3 cursor-pointer group/acc border-none bg-transparent outline-none"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowAccessories(!showAccessories);
          }}
        >
          <div className="flex items-center gap-3 w-full">
            <span className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 group-hover/acc:text-primary transition-colors">
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

        <div id={accessoriesId} className={cn("space-y-2", !showAccessories && "hidden")}>
          {showAccessories && accessoryCategories.map((name) => (
            <BuildItem
              key={name}
              name={name}
              component={build[name]}
              icon={componentIcons[name.toLowerCase()] || Monitor}
              onRemove={onRemovePart}
              onSelect={onCategorySelect}
              isAccessory={true}
              isActiveFilter={activeFilter === name}
            />
          ))}
        </div>
      </div>

      <div className="pt-4 flex-none space-y-4">
        <Separator className="opacity-50" />
        
        {totalWattage > 0 && (
          <PowerMeter value={totalWattage} max={psuWattage} className="mt-2" />
        )}

        <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-white/10">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Total value</span>
          <span className="text-2xl font-bold font-headline text-slate-950 dark:text-slate-100 tracking-tight">{formatCurrency(totalPrice)}</span>
        </div>
      </div>
    </div>
  );
}
