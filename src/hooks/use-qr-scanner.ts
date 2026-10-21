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
  const cameraSessionRef = useRef(0);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

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
    cameraSessionRef.current += 1;
    if (frameRequestRef.current !== null) {
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

  const scanLoopRef = useRef<(session: number) => void>(() => {});

  const scanLoop = useCallback(async (session: number) => {
    if (session !== cameraSessionRef.current || !videoRef.current || !canvasRef.current || detectedRef.current) return;

    try {
      const raw = await decodeFrame(videoRef.current, canvasRef.current);
      if (session !== cameraSessionRef.current) return;
      if (raw && !detectedRef.current) {
        const parsed = parseScannedContent(raw);
        if (parsed) {
          detectedRef.current = true;
          stopCamera();
          onScanRef.current(parsed);
          return;
        }
      }
    } catch {
      // Ignore frame errors and continue next frame
    }

    if (session === cameraSessionRef.current && !detectedRef.current) {
      frameRequestRef.current = requestAnimationFrame(() => {
        scanLoopRef.current(session);
      });
    }
  }, [stopCamera]);

  scanLoopRef.current = scanLoop;


  const startCamera = useCallback(async () => {
    stopCamera();
    const session = cameraSessionRef.current;
    detectedRef.current = false;
    setCameraError(null);

    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setCameraError('Camera access requires HTTPS or localhost. Open the secure site on this device, or use manual lookup.');
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraError('This browser does not provide camera access. Check camera permissions or use manual lookup.');
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
      if (session !== cameraSessionRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        if (session !== cameraSessionRef.current) return;
        setIsScanning(true);
        frameRequestRef.current = requestAnimationFrame(() => {
          void scanLoopRef.current(session);
        });
      } else {
        stopCamera();
      }
    } catch (err) {
      if (session !== cameraSessionRef.current) return;
      stopCamera();
      const error = err as Error;
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera access or use manual lookup.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setCameraError('No camera was found on your device.');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        setCameraError('The camera is in use by another app or could not start. Close other camera apps and try again.');
      } else if (error.name === 'OverconstrainedError') {
        setCameraError('This camera cannot meet the requested video settings. Try another camera or use manual lookup.');
      } else {
        setCameraError('Failed to access camera: ' + (error.message || 'Unknown error'));
      }
      setIsScanning(false);
    }
  }, [facingMode, stopCamera]);

  const switchCamera = useCallback(() => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  }, []);

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
