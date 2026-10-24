"use client";

import { Paper, Text } from '@mantine/core';
import { ExternalLink, Globe2 } from 'lucide-react';
import type { AdvisorWebResearchInfo } from '@/lib/types';

interface BuildRecommendationNotesProps {
  webResearchInfo?: AdvisorWebResearchInfo | null;
  hasExternalParts: boolean;
}

export function BuildRecommendationNotes({ webResearchInfo, hasExternalParts }: BuildRecommendationNotesProps) {
  if (!webResearchInfo && !hasExternalParts) return null;

  return (
    <Paper
      withBorder
      radius="lg"
      p="sm"
      shadow="xs"
      className="bg-slate-50/85 dark:bg-[#141a23]/90 border-slate-200/80 dark:border-white/10 backdrop-blur-md"
    >
      {webResearchInfo && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <Globe2 className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            <Text size="sm" fw={700}>Checked with Google Search</Text>
          </div>
          <Text size="xs" className="text-slate-600 dark:text-slate-400">
            Checked {new Date(webResearchInfo.searchedAt).toLocaleString()}. Prices are estimates; confirm current prices and availability with the seller.
          </Text>
          <div className="flex flex-wrap gap-2">
            {webResearchInfo.sources.map((source, index) => (
              <a
                key={`${source.url}-${index}`}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-1 rounded-md border border-slate-200 dark:border-white/10 px-3 text-xs text-cyan-700 dark:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-500/10"
              >
                <span className="max-w-44 truncate">{source.title}</span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            ))}
          </div>
          {webResearchInfo.searchSuggestionHtml && (
            <iframe
              title="Google Search suggestions"
              srcDoc={webResearchInfo.searchSuggestionHtml}
              sandbox="allow-popups allow-popups-to-escape-sandbox"
              referrerPolicy="no-referrer"
              className="h-16 w-full border-0"
            />
          )}
        </div>
      )}
      {hasExternalParts && (
        <Text size="xs" className="mt-2 !text-yellow-600 dark:!text-yellow-300">
          Some parts are outside store inventory. Confirm their specifications, compatibility, and availability before buying.
        </Text>
      )}
    </Paper>
  );
}
