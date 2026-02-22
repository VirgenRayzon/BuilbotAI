
"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus } from 'lucide-react';

interface StockEditorProps {
  stock: number;
  onStockChange: (newStock: number) => void;
}

export function StockEditor({ stock, onStockChange }: StockEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(stock.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setValue(stock.toString());
    }
  }, [stock, isEditing]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const commitChange = () => {
    const newStock = parseInt(value, 10);
    if (!isNaN(newStock) && newStock !== stock) {
      onStockChange(newStock);
    }
    setIsEditing(false);
  };

  const handleBlur = () => {
    commitChange();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitChange();
    } else if (e.key === 'Escape') {
      setValue(stock.toString());
      setIsEditing(false);
    }
  };

  const handleIncrement = () => {
    onStockChange(stock + 1);
  };

  const handleDecrement = () => {
    onStockChange(Math.max(0, stock - 1));
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="h-8 w-20 text-center"
      />
    );
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <Button variant="outline" size="icon" className="h-6 w-6" onClick={handleDecrement}>
        <Minus className="h-3 w-3" />
      </Button>
      <div
        className="font-semibold text-center w-8 cursor-pointer p-1 rounded-md hover:bg-muted"
        onClick={() => setIsEditing(true)}
        role="button"
        tabIndex={0}
      >
        {stock}
      </div>
      <Button variant="outline" size="icon" className="h-6 w-6" onClick={handleIncrement}>
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
}
