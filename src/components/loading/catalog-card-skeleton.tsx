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
        <div className={catalogCardLayout.title}>
          <Skeleton className="inline-flex">
            <Text size="sm" fw={600} lineClamp={2}>
              Component name
            </Text>
          </Skeleton>
        </div>
      </Stack>
      <Box className={catalogCardLayout.image}>
        <Skeleton className="absolute inset-0 rounded-none" />
      </Box>
      <Stack gap="xs" className={catalogCardLayout.footer}>
        <Group justify="space-between" align="flex-end" wrap="nowrap">
          <Stack gap={2}>
            <Skeleton className="inline-flex w-fit">
              <Text size="xs" tt="uppercase" fw={600} className="tracking-wider text-[10px]">
                Price
              </Text>
            </Skeleton>
            <Skeleton className="inline-flex w-fit">
              <Text size="lg" fw={700} className="font-mono leading-none">
                ₱00,000.00
              </Text>
            </Skeleton>
          </Stack>
          <Skeleton className="h-7 w-7 shrink-0 rounded-md" />
        </Group>
        <Skeleton className="flex">
          <Button fullWidth radius="md" size="sm" disabled tabIndex={-1}>
            Add to Build
          </Button>
        </Skeleton>
      </Stack>
    </Card>
  );
}
