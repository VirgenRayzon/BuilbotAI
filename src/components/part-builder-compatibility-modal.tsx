'use client';

import {
  Badge,
  Button,
  Group,
  Modal,
  Paper,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';
import { AlertTriangle, ArrowRight, CheckCircle2, Cpu, Wrench } from 'lucide-react';
import type { PublicProduct } from '@/lib/public-product-types';
import { usePartBuilderCompatibility } from '@/hooks/use-part-builder-compatibility';

interface PartBuilderCompatibilityModalProps {
  product: PublicProduct;
  opened: boolean;
  onClose: () => void;
}

export function PartBuilderCompatibilityModal({
  product,
  opened,
  onClose,
}: PartBuilderCompatibilityModalProps) {
  const {
    isLoaded,
    hasActiveBuild,
    activeBuildCount,
    compatibility,
    addToBuildAndOpen,
  } = usePartBuilderCompatibility(product);

  const isCompatible = compatibility.compatible;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Build Compatibility Check"
      centered
      radius="lg"
      size="md"
      overlayProps={{ backgroundOpacity: 0.65, blur: 5 }}
      classNames={{
        content: 'bg-white/95 dark:bg-[#141a23]/95 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100',
        header: 'bg-white/95 dark:bg-[#141a23]/95 border-b border-slate-200 dark:border-white/10 p-3',
        body: '!p-3',
      }}
    >
      <Stack gap="md">
        <div>
          <Text size="xs" c="dimmed">Selected Scanned Component</Text>
          <Text size="sm" fw={700} className="line-clamp-1">{product.name}</Text>
          <Group gap="xs" mt={4}>
            <Badge size="xs" color="cyan" variant="filled">{product.category}</Badge>
            <Badge size="xs" variant="outline">{product.brand}</Badge>
          </Group>
        </div>

        {hasActiveBuild ? (
          <Paper withBorder radius="md" p="sm" className="!p-3 bg-slate-50 dark:bg-[#111722] border-slate-200 dark:border-white/10">
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="xs" c="dimmed">Your Active PC Build</Text>
                <Badge size="xs" variant="dot" color="teal">
                  {activeBuildCount} component{activeBuildCount !== 1 ? 's' : ''} in builder
                </Badge>
              </Group>

              <Group gap="sm" align="flex-start" wrap="nowrap" mt={4}>
                <ThemeIcon
                  size="md"
                  radius="md"
                  color={isCompatible ? 'teal' : 'amber'}
                  variant="light"
                  className="shrink-0"
                >
                  {isCompatible ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                </ThemeIcon>
                <Stack gap={2}>
                  <Text size="sm" fw={600} c={isCompatible ? 'teal' : 'amber'}>
                    {isCompatible ? 'Hardware Compatible' : 'Compatibility Conflict Detected'}
                  </Text>
                  <Text size="xs" c={isCompatible ? 'dimmed' : 'red'}>
                    {isCompatible
                      ? `This ${product.category} matches your selected motherboard socket, DDR generation, and power constraints.`
                      : compatibility.message}
                  </Text>
                </Stack>
              </Group>
            </Stack>
          </Paper>
        ) : (
          <Paper withBorder radius="md" p="sm" className="!p-3 bg-slate-50 dark:bg-[#111722] border-slate-200 dark:border-white/10">
            <Group gap="sm" wrap="nowrap">
              <ThemeIcon size="md" radius="md" color="cyan" variant="light" className="shrink-0">
                <Wrench size={18} />
              </ThemeIcon>
              <div>
                <Text size="sm" fw={600}>No active build in progress</Text>
                <Text size="xs" c="dimmed">
                  Starting a new build with this {product.category} as your baseline.
                </Text>
              </div>
            </Group>
          </Paper>
        )}

        <Stack gap="xs" mt="xs">
          <Button
            color="cyan"
            fullWidth
            mih={44}
            rightSection={<ArrowRight size={16} />}
            onClick={() => {
              addToBuildAndOpen();
              onClose();
            }}
            disabled={!isLoaded}
          >
            {hasActiveBuild ? 'Add to build & open PC Builder' : 'Start build with this part'}
          </Button>
          <Button variant="default" fullWidth mih={44} onClick={onClose}>
            Keep browsing part
          </Button>
        </Stack>
      </Stack>
    </Modal>
  );
}
