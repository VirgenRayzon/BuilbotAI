
"use client";

import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import type { Part } from '@/lib/types';
import { Plus } from 'lucide-react';
import { Badge } from './ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface PartCardProps {
  part: Part;
  onAddToBuild: (part: Part) => void;
}

export function PartCard({ part, onAddToBuild }: PartCardProps) {
  const { toast } = useToast();

  const handleAdd = () => {
    onAddToBuild(part);
    toast({
      title: 'Part Added',
      description: `${part.name} has been added to your build.`,
    });
  }

  return (
    <Card className={cn(
      "flex flex-col h-full overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 ease-in-out",
      part.stock === 0 && "grayscale opacity-60"
    )}>
      <CardHeader className="p-4 pb-2">
        <div className="aspect-video relative w-full overflow-hidden rounded-md mb-2">
          <Image
            src={part.imageUrl}
            alt={part.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />
        </div>
        <CardTitle className="text-base font-headline leading-tight h-10 line-clamp-2">{part.name}</CardTitle>
        <CardDescription className="text-xs pt-1">{part.brand}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-4 pt-0">
        {part.stock > 0 ? (
          <Badge variant={part.stock > 5 ? 'secondary' : 'destructive'} className="text-xs">
            {part.stock} in stock
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs">Out of stock</Badge>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <p className="text-lg font-bold font-headline">{formatCurrency(part.price)}</p>
        <Button size="icon" onClick={handleAdd} disabled={part.stock === 0}>
          <Plus className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
