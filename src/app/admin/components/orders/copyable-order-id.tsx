'use client';

import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Tooltip } from '@mantine/core';

interface CopyableOrderIdProps {
  orderId: string;
  displayId?: string;
  className?: string;
}

export function CopyableOrderId({
  orderId,
  displayId = orderId,
  className,
}: CopyableOrderIdProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(orderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <Tooltip
      label={copied ? 'Copied full ID to clipboard!' : `Copy full ID: ${orderId}`}
      withArrow
      position="top"
    >
      <button
        type="button"
        onClick={handleCopy}
        aria-label={`Copy order identifier ${orderId}`}
        className={`inline-flex items-center gap-1 font-mono font-bold text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 hover:underline cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-cyan-500 rounded px-1 -mx-1 transition-colors ${
          className || ''
        }`}
      >
        <span>{displayId}</span>
        {copied ? (
          <Check size={12} className="text-teal-500 shrink-0" />
        ) : (
          <Copy size={11} className="opacity-60 hover:opacity-100 shrink-0" />
        )}
      </button>
    </Tooltip>
  );
}
