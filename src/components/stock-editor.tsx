/**
 * StockEditor — Inline stock quantity editor.
 * Supports click-to-edit mode for direct number input. Used in admin inventory views.
 */

"use client";

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface StockEditorProps {
  stock: number;
  onStockChange: (newStock: number) => void;
  className?: string;
}

export function StockEditor({ stock, onStockChange, className }: StockEditorProps) {
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
    <div className={cn("flex items-center justify-center", className)}>
      <div
        className="w-8 cursor-pointer rounded-md p-1 text-center font-semibold hover:bg-muted"
        onClick={() => setIsEditing(true)}
        role="button"
        tabIndex={0}
      >
        {stock}
      </div>
    </div>
  );
}
