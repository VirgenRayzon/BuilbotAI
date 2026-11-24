'use client';

import React from 'react';
import { Progress } from '@mantine/core';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPasswordStrength } from '@/lib/auth-validation';

interface PasswordStrengthMeterProps {
  password: string;
  highScoreColor?: 'cyan' | 'orange';
}

export function PasswordStrengthMeter({
  password,
  highScoreColor = 'cyan',
}: PasswordStrengthMeterProps) {
  if (!password) return null;

  const strength = getPasswordStrength(password);
  const rules = [
    { label: '6+ characters', met: password.length >= 6 },
    { label: 'At least 1 number', met: /\d/.test(password) },
    { label: 'Upper & lowercase', met: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { label: 'Special symbol', met: /[^A-Za-z0-9]/.test(password) },
  ];

  return (
    <div className="mt-2 space-y-1.5">
      <Progress
        value={strength}
        size="xs"
        radius="xl"
        color={
          strength <= 25
            ? 'red'
            : strength <= 50
              ? 'yellow'
              : strength <= 75
                ? highScoreColor
                : 'teal'
        }
      />
      <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-500 dark:text-slate-400">
        {rules.map((rule) => (
          <span
            key={rule.label}
            className={cn(
              'flex items-center gap-1',
              rule.met ? 'text-teal-600 dark:text-teal-400 font-medium' : ''
            )}
          >
            {rule.met ? <Check size={12} /> : <X size={12} />} {rule.label}
          </span>
        ))}
      </div>
    </div>
  );
}
