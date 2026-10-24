'use client';

import { lazy } from 'react';
import { DeferredDialog } from './ui/deferred-dialog';
import type { AddPartEditorProps } from './add-part-editor';

const AddPartEditor = lazy(() => import('./add-part-editor').then(module => ({ default: module.AddPartEditor })));

export function AddPartDialog(props: Omit<AddPartEditorProps, 'initiallyOpen'>) {
  return (
    <DeferredDialog label="Loading component editor" render={() => <AddPartEditor {...props} initiallyOpen />}>
      {props.children}
    </DeferredDialog>
  );
}
