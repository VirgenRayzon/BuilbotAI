'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { decodeFrame, parseScannedContent, type DecodedQRResult } from '@/lib/qr-decoder';

export function useQRScanner(onScan: (result: DecodedQRResult) => void) {
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRequestRef = useRef<number | null>(null);
  const detectedRef = useRef(false);

  // Check available camera devices
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setHasMultipleCameras(videoInputs.length > 1);
      }).catch(() => {
        setHasMultipleCameras(false);
      });
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (frameRequestRef.current) {
      cancelAnimationFrame(frameRequestRef.current);
      frameRequestRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  }, []);

  const scanLoopRef = useRef<() => void>(() => {});

  const scanLoop = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || detectedRef.current) return;

    try {
      const raw = await decodeFrame(videoRef.current, canvasRef.current);
      if (raw && !detectedRef.current) {
        const parsed = parseScannedContent(raw);
        if (parsed) {
          detectedRef.current = true;
          stopCamera();
          onScan(parsed);
          return;
        }
      }
    } catch {
      // Ignore frame errors and continue next frame
    }

    if (!detectedRef.current) {
      frameRequestRef.current = requestAnimationFrame(() => {
        scanLoopRef.current();
      });
    }
  }, [onScan, stopCamera]);

  scanLoopRef.current = scanLoop;


  const startCamera = useCallback(async () => {
    stopCamera();
    detectedRef.current = false;
    setCameraError(null);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is not supported by your browser.');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS Safari
        await videoRef.current.play();
        setIsScanning(true);
        frameRequestRef.current = requestAnimationFrame(() => {
          void scanLoop();
        });
      }
    } catch (err) {
      const error = err as Error;
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera access or use manual lookup.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setCameraError('No camera was found on your device.');
      } else {
        setCameraError('Failed to access camera: ' + (error.message || 'Unknown error'));
      }
      setIsScanning(false);
    }
  }, [facingMode, scanLoop, stopCamera]);

  const switchCamera = useCallback(() => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  }, []);

  // Restart camera when facingMode changes
  useEffect(() => {
    if (isScanning) {
      void startCamera();
    }
  }, [facingMode]);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    canvasRef,
    isScanning,
    cameraError,
    facingMode,
    hasMultipleCameras,
    startCamera,
    stopCamera,
    switchCamera,
    resetDetection: () => {
      detectedRef.current = false;
    },
  };
}
