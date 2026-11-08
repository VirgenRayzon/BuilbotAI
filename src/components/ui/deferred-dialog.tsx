'use client';

import { Suspense, useState, type ReactNode } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from './dialog';

export function DeferredDialog({ children, render, label }: {
  children?: ReactNode;
  render: () => ReactNode;
  label: string;
}) {
  const [activated, setActivated] = useState(false);
  if (!activated) {
    return (
      <Dialog onOpenChange={open => { if (open) setActivated(true); }}>
        <DialogTrigger asChild>{children}</DialogTrigger>
      </Dialog>
    );
  }
  return (
    <Suspense fallback={
      <Dialog open onOpenChange={open => { if (!open) setActivated(false); }}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent>
          <DialogTitle>{label}</DialogTitle>
          <DialogDescription>Please wait a moment.</DialogDescription>
        </DialogContent>
      </Dialog>
    }>
      {render()}
    </Suspense>
  );
}
