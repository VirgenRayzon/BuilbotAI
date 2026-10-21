'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ActionIcon,
  Alert,
  Button,
  Group,
  Modal,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { Camera, CheckCircle2, FlipHorizontal, Keyboard, Scan, Search } from 'lucide-react';
import { useUserProfile } from '@/context/user-profile';
import { useQRScanner } from '@/hooks/use-qr-scanner';
import { parseScannedContent, type DecodedQRResult } from '@/lib/qr-decoder';

export function QRScannerDialog() {
  const router = useRouter();
  const { authUser } = useUserProfile();
  const [opened, setOpened] = useState(false);
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  const [manualInput, setManualInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);

  const handleDetectedResultRef = useRef<(result: DecodedQRResult) => Promise<void>>(async () => {});

  const {
    videoRef,
    canvasRef,
    isScanning,
    cameraError,
    hasMultipleCameras,
    startCamera,
    stopCamera,
    switchCamera,
    resetDetection,
  } = useQRScanner((result) => {
    void handleDetectedResultRef.current(result);
  });

  const handleDetectedResult = async (result: DecodedQRResult) => {
    setResolving(true);
    setErrorMessage(null);
    setStatusMessage('Recognized code! Resolving destination…');

    try {
      if (result.productId) {
        setStatusMessage(`Found product ${result.productId}`);
        setOpened(false);
        router.push(`/admin?tab=stock&product=${result.productId}`);
        return;
      }

      if (result.token) {
        let authHeader = '';
        if (authUser) {
          try {
            const idToken = await authUser.getIdToken();
            authHeader = `Bearer ${idToken}`;
          } catch {
            // Proceed without header if token retrieval fails
          }
        }

        const res = await fetch(`/api/qr/${result.token}`, {
          headers: authHeader ? { Authorization: authHeader } : undefined,
          cache: 'no-store',
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || 'QR code could not be resolved.');
        }

        const data = await res.json();
        if (data.destination) {
          setStatusMessage('Destination resolved!');
          setOpened(false);
          router.push(data.destination);
          return;
        }
      }

      if (result.sku) {
        // If it's a SKU, we can navigate or search in stock tab
        setStatusMessage(`Looking up SKU ${result.sku}…`);
        setOpened(false);
        router.push(`/admin?tab=stock&search=${encodeURIComponent(result.sku)}`);
        return;
      }

      throw new Error('Unrecognized product identifier.');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to resolve scanned code.');
      setStatusMessage(null);
      resetDetection();
    } finally {
      setResolving(false);
    }
  };

  handleDetectedResultRef.current = handleDetectedResult;


  useEffect(() => {
    if (opened && activeTab === 'camera') {
      void startCamera();
    } else {
      stopCamera();
    }
  }, [opened, activeTab, startCamera, stopCamera]);

  const handleManualSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsed = parseScannedContent(manualInput);
    if (!parsed) {
      setErrorMessage('Please enter a valid PRD-000123, SKU, or full BuildbotAI QR URL.');
      return;
    }
    void handleDetectedResult(parsed);
  };

  const handleClose = () => {
    stopCamera();
    setOpened(false);
    setStatusMessage(null);
    setErrorMessage(null);
    setManualInput('');
  };

  return (
    <>
      <Button
        variant="default"
        radius="md"
        size="xs"
        mih={44}
        leftSection={<Scan size={16} />}
        onClick={() => {
          setOpened(true);
          setActiveTab('camera');
        }}
      >
        Scan item
      </Button>

      <Modal
        opened={opened}
        onClose={handleClose}
        title="Scan or Lookup Item"
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
          <SegmentedControl
            value={activeTab}
            onChange={(val) => {
              setActiveTab(val as 'camera' | 'manual');
              setErrorMessage(null);
            }}
            data={[
              {
                value: 'camera',
                label: (
                  <Group gap={6} justify="center">
                    <Camera size={14} />
                    <span>Camera Scan</span>
                  </Group>
                ),
              },
              {
                value: 'manual',
                label: (
                  <Group gap={6} justify="center">
                    <Keyboard size={14} />
                    <span>Manual Lookup</span>
                  </Group>
                ),
              },
            ]}
          />

          {activeTab === 'camera' && (
            <Stack gap="xs">
              <Paper
                withBorder
                radius="md"
                className="relative overflow-hidden bg-black aspect-video flex items-center justify-center border-slate-300 dark:border-white/20"
              >
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Viewfinder Target Overlay */}
                {isScanning && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-cyan-400 rounded-lg relative opacity-85 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                      <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-cyan-300" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-cyan-300" />
                      <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-cyan-300" />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-cyan-300" />
                    </div>
                  </div>
                )}

                {hasMultipleCameras && isScanning && (
                  <ActionIcon
                    variant="filled"
                    color="dark"
                    radius="xl"
                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/80"
                    onClick={switchCamera}
                    title="Switch Camera"
                    size="lg"
                  >
                    <FlipHorizontal size={18} />
                  </ActionIcon>
                )}

                {!isScanning && !cameraError && (
                  <Text size="sm" c="dimmed">
                    Initializing camera…
                  </Text>
                )}
              </Paper>

              <Text size="xs" c="dimmed" ta="center">
                Point camera at a physical product QR code. The item will open automatically.
              </Text>

              {cameraError && (
                <Alert color="red" variant="light" title="Camera Error" radius="md">
                  <Stack gap="xs">
                    <Text size="xs">{cameraError}</Text>
                    <Button
                      size="xs"
                      variant="light"
                      color="red"
                      onClick={() => setActiveTab('manual')}
                      mih={36}
                    >
                      Switch to manual lookup
                    </Button>
                  </Stack>
                </Alert>
              )}
            </Stack>
          )}

          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit}>
              <Stack gap="sm">
                <Text size="xs" c="dimmed">
                  Type or paste a product identifier (e.g. PRD-000123, SKU, or QR link). Handheld USB/Bluetooth barcode scanners are also supported.
                </Text>
                <TextInput
                  placeholder="PRD-000123, SKU-CPU..., or https://.../q/..."
                  value={manualInput}
                  onChange={(e) => setManualInput(e.currentTarget.value)}
                  autoFocus
                  rightSection={
                    <ActionIcon
                      type="submit"
                      color="cyan"
                      variant="subtle"
                      loading={resolving}
                      aria-label="Search item"
                    >
                      <Search size={16} />
                    </ActionIcon>
                  }
                  classNames={{
                    input: 'bg-white dark:bg-[#141a23] border-slate-300 dark:border-white/20 text-slate-900 dark:text-slate-100',
                  }}
                />
                <Button
                  type="submit"
                  variant="filled"
                  color="cyan"
                  loading={resolving}
                  disabled={!manualInput.trim()}
                  mih={44}
                >
                  Lookup item
                </Button>
              </Stack>
            </form>
          )}

          {statusMessage && (
            <Group gap="xs" className="p-2 rounded bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-300 text-xs">
              <CheckCircle2 size={16} />
              <Text size="xs" fw={500}>{statusMessage}</Text>
            </Group>
          )}

          {errorMessage && (
            <Text size="xs" c="red" role="alert">
              {errorMessage}
            </Text>
          )}
        </Stack>
      </Modal>
    </>
  );
}
