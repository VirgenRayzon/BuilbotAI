import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { ComponentData } from "@/lib/types";
import { Cpu, Server, CircuitBoard, MemoryStick, HardDrive, Power, RectangleVertical as CaseIcon, Wind } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface YourBuildProps {
    build: Record<string, ComponentData | null>;
}

const componentIcons: { [key: string]: React.ElementType } = {
    CPU: Cpu,
    GPU: Server,
    Motherboard: CircuitBoard,
    RAM: MemoryStick,
    Storage: HardDrive,
    PSU: Power,
    Case: CaseIcon,
    Cooler: Wind,
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(value);
  };

export function YourBuild({ build }: YourBuildProps) {
    const selectedParts = Object.values(build).filter(c => c !== null).length;
    const totalParts = Object.keys(build).length;

    const totalPrice = Object.values(build).reduce((acc, component) => {
        return acc + (component?.price || 0);
    }, 0);

    // Dummy wattage for now
    const estimatedWattage = "50W"; 

    return (
        <Card className="sticky top-20">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-headline">Your Build</CardTitle>
                <Badge variant="secondary">{selectedParts} / {totalParts} Parts</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
                {Object.entries(build).map(([name, component]) => {
                    const Icon = componentIcons[name];
                    return (
                        <div key={name} className="flex items-center gap-4">
                            <div className="p-2 bg-muted rounded-md">
                                <Icon className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm">{name}</p>
                                <p className="text-xs text-muted-foreground">{component?.model ?? "Not selected"}</p>
                            </div>
                        </div>
                    )
                })}

                <Separator />

                <div className="flex justify-between items-center text-sm">
                    <p className="text-muted-foreground">EST. WATTAGE</p>
                    <p className="font-semibold">{estimatedWattage}</p>
                </div>
                
                <Separator />

                <div className="flex justify-between items-center">
                    <p className="text-muted-foreground">Estimated Total</p>
                    <p className="text-2xl font-bold font-headline">{formatCurrency(totalPrice)}</p>
                </div>

            </CardContent>
            <CardFooter>
                <Button className="w-full" size="lg" disabled={selectedParts === 0}>Checkout Build</Button>
            </CardFooter>
        </Card>
    )
}
