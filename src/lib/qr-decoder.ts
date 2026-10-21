import jsQR from 'jsqr';

export interface DecodedQRResult {
  raw: string;
  token?: string;
  productId?: string;
  sku?: string;
}

export function parseScannedContent(content: string): DecodedQRResult | null {
  const trimmed = content.trim();
  if (!trimmed) return null;

  // 1. Direct PRD-000123 format
  const prdMatch = trimmed.match(/^PRD-\d{6,}$/i);
  if (prdMatch) {
    return { raw: trimmed, productId: prdMatch[0].toUpperCase() };
  }

  // 2. Direct SKU format
  const skuMatch = trimmed.match(/^SKU-[A-Z]{2,3}[23456789ABCDEFGHJKMNPQRSTVWXYZ]{8}$/i);
  if (skuMatch) {
    return { raw: trimmed, sku: skuMatch[0].toUpperCase() };
  }

  // 3. Raw 32-character hex QR token
  const tokenMatch = trimmed.match(/^[a-f0-9]{32}$/i);
  if (tokenMatch) {
    return { raw: trimmed, token: tokenMatch[0].toLowerCase() };
  }

  // 4. Relative /q/<token> path
  const relativeMatch = trimmed.match(/^(?:\/q\/|q\/)([a-f0-9]{32})$/i);
  if (relativeMatch) {
    return { raw: trimmed, token: relativeMatch[1].toLowerCase() };
  }

  // 5. Full URL containing /q/<token>
  try {
    const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'https://buildbotai.local';
    const url = new URL(trimmed, origin);
    const pathMatch = url.pathname.match(/\/q\/([a-f0-9]{32})$/i);
    if (pathMatch) {
      return { raw: trimmed, token: pathMatch[1].toLowerCase() };
    }
  } catch {
    // Not a valid URL
  }


  return null;
}

export async function decodeFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement
): Promise<string | null> {
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return null;
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) return null;

  // 1. Try native BarcodeDetector API if supported
  if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
    try {
      const Detector = Reflect.get(window, 'BarcodeDetector') as new (options: { formats: string[] }) => {
        detect(source: HTMLVideoElement): Promise<Array<{ rawValue?: string }>>;
      };
      const detector = new Detector({ formats: ['qr_code'] });
      const barcodes = await detector.detect(video);
      if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
        return barcodes[0].rawValue;
      }
    } catch {
      // Fall through to jsQR
    }
  }

  // 2. Fallback to jsQR via canvas
  const scale = Math.min(1, 720 / Math.max(width, height));
  const scanWidth = Math.max(1, Math.round(width * scale));
  const scanHeight = Math.max(1, Math.round(height * scale));
  if (canvas.width !== scanWidth || canvas.height !== scanHeight) {
    canvas.width = scanWidth;
    canvas.height = scanHeight;
  }
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(video, 0, 0, scanWidth, scanHeight);
  const imageData = ctx.getImageData(0, 0, scanWidth, scanHeight);
  const code = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: 'dontInvert',
  });

  return code?.data || null;
}
