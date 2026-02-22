
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { ComponentData } from "@/lib/types";
import { Cpu, Server, CircuitBoard, MemoryStick, HardDrive, Power, RectangleVertical as CaseIcon, Wind, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";

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

export function YourBuild({ build }: YourBuildProps) {
    const selectedParts = Object.values(build).filter(c => c !== null).length;
    const totalParts = Object.keys(build).length;

    const totalWattage = Object.entries(build).reduce((acc, [name, component]) => {
        if (name === 'PSU' || !component?.wattage) {
            return acc;
        }
        return acc + component.wattage;
    }, 0);

    const psu = build['PSU'];
    const psuWattage = psu?.wattage || 0;
    const showPsuWarning = psuWattage > 0 && psuWattage < totalWattage;

    const totalPrice = Object.values(build).reduce((acc, component) => {
        return acc + (component?.price || 0);
    }, 0);

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
                            <div className="flex-1">
                                <p className="font-semibold text-sm">{name}</p>
                                <p className="text-xs text-muted-foreground">{component?.model ?? "Not selected"}</p>
                            </div>
                            {component?.wattage && name !== 'PSU' && (
                                <p className="text-xs font-semibold text-muted-foreground">
                                    {`~${component.wattage}W`}
                                </p>
                            )}
                        </div>
                    )
                })}

                <Separator />

                <div className="flex justify-between items-center text-sm">
                    <p className="text-muted-foreground">EST. WATTAGE</p>
                    <p className="font-semibold">{totalWattage}W</p>
                </div>
                
                <Separator />

                <div className="flex justify-between items-center">
                    <p className="text-muted-foreground">Estimated Total</p>
                    <p className="text-2xl font-bold font-headline">{formatCurrency(totalPrice)}</p>
                </div>

            </CardContent>
            <CardFooter className="flex-col items-stretch gap-4">
                {showPsuWarning && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Power Supply Warning</AlertTitle>
                        <AlertDescription>
                            Your PSU ({psuWattage}W) may be insufficient for the estimated {totalWattage}W load.
                        </AlertDescription>
                    </Alert>
                )}
                <Button className="w-full" size="lg" disabled={selectedParts === 0}>Checkout Build</Button>
            </CardFooter>
        </Card>
    )
}
