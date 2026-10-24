'use client';

import { lazy, Suspense, useState } from 'react';
import { ActionIcon } from '@mantine/core';
import { AnimatedMessageIcon } from './ui/animated-icons';
import type { BuilderFloatingChatProps } from './chat/types';

const Chat = lazy(() => import('./builder-floating-chat').then(module => ({ default: module.BuilderFloatingChat })));

export function DeferredBuilderChat(props: BuilderFloatingChatProps) {
  const [activated, setActivated] = useState(false);
  const trigger = (
    <div className="fixed right-4 sm:right-6 bottom-20 sm:bottom-24 lg:bottom-6 z-50">
      <ActionIcon
        onClick={() => setActivated(true)}
        aria-label="Open Buildbot chat"
        aria-busy={activated}
        color="cyan" radius="xl" size={52} className="shadow-lg"
      >
        <AnimatedMessageIcon size={22} />
      </ActionIcon>
    </div>
  );
  return activated ? <Suspense fallback={trigger}><Chat {...props} initiallyOpen /></Suspense> : trigger;
}
