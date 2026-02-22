
'use client';

import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import type { Part } from '@/lib/types';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { StockEditor } from './stock-editor';

interface AdminPartCardProps {
  part: Part;
  onDelete: (partId: string, category: Part['category']) => void;
  onUpdateStock: (partId: string, category: Part['category'], newStock: number) => void;
}

export function AdminPartCard({ part, onDelete, onUpdateStock }: AdminPartCardProps) {
  return (
    <Card className={cn(
      "flex flex-col h-full overflow-hidden",
      part.stock === 0 && "grayscale"
    )}>
      <CardHeader className="p-4 pb-2 relative">
        <div className="absolute top-2 right-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete {part.name}.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                    onClick={() => onDelete(part.id, part.category)}
                    className="bg-destructive hover:bg-destructive/90"
                >
                    Delete
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <div className="aspect-video relative w-full overflow-hidden rounded-md mb-2">
          <Image
            src={part.imageUrl}
            alt={part.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
            className="object-cover"
          />
        </div>
        <CardTitle className="text-base font-headline leading-tight h-10 line-clamp-2 pr-8">{part.name}</CardTitle>
        <CardDescription className="text-xs pt-1">{part.brand}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-4 pt-0">
        <StockEditor
          stock={part.stock}
          onStockChange={(newStock) => onUpdateStock(part.id, part.category, newStock)}
        />
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <p className="text-lg font-bold font-headline">{formatCurrency(part.price)}</p>
      </CardFooter>
    </Card>
  );
}
