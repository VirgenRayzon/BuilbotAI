import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ComponentData } from "@/lib/types";
import Image from "next/image";

interface ComponentCardProps {
  name: string;
  component: ComponentData;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(value);
  };

export function ComponentCard({ name, component }: ComponentCardProps) {
  const Icon = component.icon;

  return (
    <Card className="flex flex-col h-full overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 ease-in-out">
      <CardHeader className="flex-row items-center gap-3">
        <Icon className="w-8 h-8 text-primary" />
        <div>
          <CardTitle className="font-headline">{name}</CardTitle>
          <CardDescription>{component.model}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div className="aspect-square relative w-full overflow-hidden rounded-md">
            <Image
                src={component.image}
                alt={component.description}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
                data-ai-hint={component.imageHint}
            />
        </div>
        <p className="text-sm text-muted-foreground">{component.description}</p>
      </CardContent>
      <CardFooter>
        <div className="text-lg font-semibold text-foreground">
          {formatCurrency(component.price)}
        </div>
      </CardFooter>
    </Card>
  );
}
