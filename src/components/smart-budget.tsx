import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Cpu, Loader2, Save, X, Lightbulb } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getAiSmartBudget } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";

interface SmartBudgetProps {
    inventory: any[];
    onApplyBuild: (build: Record<string, any>) => void;
    onClose: () => void;
}

export function SmartBudget({ inventory, onApplyBuild, onClose }: SmartBudgetProps) {
    const [budget, setBudget] = useState("");
    const [preferences, setPreferences] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const { toast } = useToast();

    const handleGenerate = async () => {
        const budgetNum = parseInt(budget, 10);
        if (isNaN(budgetNum) || budgetNum <= 0) {
            toast({ variant: "destructive", title: "Invalid Budget", description: "Please enter a valid budget amount." });
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const response = await getAiSmartBudget({
                budget: budgetNum,
                inventory: inventory,
                preferences: preferences,
            });

            if ('error' in response) {
                toast({ variant: "destructive", title: "Error", description: response.error as string });
            } else {
                setResult(response);
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "An unexpected error occurred." });
        } finally {
            setLoading(false);
        }
    };

    const handleApply = () => {
        if (!result || !result.build) return;

        // Convert the returned part IDs back into actual part objects
        const newBuildData: Record<string, any> = {
            CPU: null, GPU: null, Motherboard: null, RAM: null, Storage: [], PSU: null, Case: null, Cooler: null,
        };

        let appliedCount = 0;

        Object.entries(result.build).forEach(([category, partId]) => {
            if (!partId) return;
            const fullPart = inventory.find(p => p.id === partId);
            if (!fullPart) return;

            const componentData = {
                model: fullPart.name,
                price: fullPart.price,
                description: Object.entries(fullPart.specifications || {}).slice(0, 2).map(([key, value]) => `${key}: ${value}`).join(' | '),
                image: fullPart.imageUrl,
                imageHint: fullPart.name.toLowerCase().split(' ').slice(0, 2).join(' '),
                icon: null, // Will be filled by the parent
                wattage: fullPart.wattage,
                socket: fullPart.specifications?.['Socket']?.toString() || fullPart.specifications?.['socket']?.toString(),
                ramType: fullPart.specifications?.['Memory Type']?.toString() || fullPart.specifications?.['RAM Type']?.toString() || fullPart.specifications?.['Memory']?.toString(),
            };

            if (category === 'Storage') {
                newBuildData.Storage.push(componentData);
            } else {
                newBuildData[category] = componentData;
            }
            appliedCount++;
        });

        onApplyBuild(newBuildData);
        toast({ title: "Build Applied", description: `Successfully applied ${appliedCount} recommended parts to your build.` });
        onClose();
    };

    return (
        <Card className="w-full bg-gradient-to-br from-card to-primary/5 border-primary/20 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
                <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
            </div>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                    <Lightbulb className="h-6 w-6 text-yellow-500" />
                    AI Smart Budget
                </CardTitle>
                <CardDescription>
                    Tell us your budget, and our AI will pick the perfect parts from our inventory.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="budget">Target Budget (PHP ₱)</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-semibold">₱</span>
                        <Input
                            id="budget"
                            type="number"
                            placeholder="e.g. 90000"
                            className="pl-9"
                            value={budget}
                            onChange={(e) => setBudget(e.target.value)}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="preferences">Preferences (Optional)</Label>
                    <Textarea
                        id="preferences"
                        placeholder="e.g. Needs WiFi, prefer RGB lighting, main game is Cyberpunk 2077..."
                        value={preferences}
                        onChange={(e) => setPreferences(e.target.value)}
                        className="resize-none"
                        rows={3}
                    />
                </div>

                {loading && (
                    <div className="flex flex-col items-center justify-center p-6 space-y-4 bg-secondary/20 rounded-lg">
                        <Cpu className="h-8 w-8 animate-spin text-primary" />
                        <div className="text-center space-y-1">
                            <p className="text-sm font-semibold text-primary animate-pulse">Buildbot is Calculating Your Optimal Build…</p>
                            <p className="text-xs text-muted-foreground">Scanning inventory for the best price-to-performance combinations.</p>
                        </div>
                    </div>
                )}

                {result && !loading && (
                    <div className="mt-4 p-4 border rounded-lg bg-card animate-in fade-in slide-in-from-bottom-2">
                        <h4 className="font-semibold text-lg mb-2 flex justify-between">
                            Recommended Build
                            <span className="text-primary font-headline">{formatCurrency(result.totalCost)}</span>
                        </h4>
                        <p className="text-sm text-muted-foreground mb-4 italic">"{result.reasoning}"</p>

                        <div className="space-y-2 mb-4">
                            {Object.entries(result.build).map(([cat, id]) => {
                                if (!id) return null;
                                const part = inventory.find((p: any) => p.id === id);
                                if (!part) return null;
                                return (
                                    <div key={cat} className="flex justify-between items-center text-sm border-b border-border/50 pb-2 last:border-0">
                                        <span className="text-muted-foreground w-24 flex-shrink-0">{cat}</span>
                                        <span className="font-medium text-right truncate pl-4">{part.name}</span>
                                    </div>
                                )
                            })}
                        </div>

                        <Button className="w-full" onClick={handleApply}>
                            <Save className="h-4 w-4 mr-2" /> Apply to My Build
                        </Button>
                    </div>
                )}
            </CardContent>
            {!result && !loading && (
                <CardFooter>
                    <Button onClick={handleGenerate} className="w-full font-headline tracking-wide">
                        Generate Build
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}
