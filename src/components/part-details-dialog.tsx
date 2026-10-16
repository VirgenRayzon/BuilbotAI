'use client';

import { lazy } from 'react';
import { DeferredDialog } from './ui/deferred-dialog';
import type { PartDetailsContentProps } from './part-details-content';

const PartDetailsContent = lazy(() => import('./part-details-content').then(module => ({ default: module.PartDetailsContent })));

export function PartDetailsDialog(props: Omit<PartDetailsContentProps, 'initiallyOpen'>) {
  return (
    <DeferredDialog label="Loading product details" render={() => <PartDetailsContent {...props} initiallyOpen />}>
      {props.children}
    </DeferredDialog>
  );
}
