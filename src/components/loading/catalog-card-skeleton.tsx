'use client';

import { Badge, Box, Button, Card, Group, Stack, Text } from '@mantine/core';
import { Skeleton } from '@/components/ui/skeleton';

export const catalogCardLayout = {
  header: 'px-3 pt-3 pb-2',
  image: 'aspect-[4/3] relative w-full overflow-hidden bg-pure-white border-y border-slate-200/70 dark:border-white/10',
  footer: 'px-3 pt-3 pb-3',
  title: 'min-h-[2.5rem] leading-snug',
};

export function CatalogCardSkeleton() {
  return (
    <Card
      withBorder
      radius="lg"
      padding={0}
      aria-hidden="true"
      className="flex h-full w-full min-w-0 flex-col justify-between overflow-hidden border-slate-200/80 bg-white/85 shadow-lg dark:border-white/10 dark:bg-[#111722]"
    >
      <Stack gap={6} className={catalogCardLayout.header}>
        <Group justify="space-between" align="center" wrap="nowrap">
          <Skeleton className="flex">
            <Badge size="xs" variant="light" color="gray" radius="sm" className="uppercase tracking-wide">
              Component
            </Badge>
          </Skeleton>
          <Skeleton className="flex">
            <Badge size="xs" variant="light" color="teal" radius="sm">
              Available
            </Badge>
          </Skeleton>
        </Group>
        <Text size="sm" fw={600} lineClamp={2} className={catalogCardLayout.title}>
          <span className="rounded bg-slate-200 text-transparent dark:bg-white/10">Component name</span>
        </Text>
      </Stack>
      <Box className={catalogCardLayout.image}>
        <Skeleton className="absolute inset-0 rounded-none" />
      </Box>
      <Stack gap="xs" className={catalogCardLayout.footer}>
        <Stack gap={0}>
          <Text size="xs" tt="uppercase" fw={600} className="tracking-wider text-[10px]">
            <span className="rounded bg-slate-200 text-transparent dark:bg-white/10">Price</span>
          </Text>
          <Text size="lg" fw={700} className="font-mono leading-none">
            <span className="rounded bg-slate-200 text-transparent dark:bg-white/10">₱00,000.00</span>
          </Text>
        </Stack>
        <Skeleton className="flex">
          <Button fullWidth radius="md" size="sm" disabled tabIndex={-1}>
            View product
          </Button>
        </Skeleton>
      </Stack>
    </Card>
  );
}
