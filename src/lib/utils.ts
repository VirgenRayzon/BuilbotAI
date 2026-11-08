import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number) {
  if (isNaN(value) || value === undefined || value === null) {
    return "₱0.00";
  }
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value);
}

export const USD_TO_PHP_RATE = 60;

export const formatToPHP = (usdAmount: number): string => {
  const phpAmount = usdAmount * USD_TO_PHP_RATE;

  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(phpAmount);
};

export function getOptimizedStorageUrl(url: string | undefined, corrupt: boolean = false): string {
  if (!url) return "";
  
  if (corrupt) {
    return url.replace("alt=media", "alt=broken_by_admin").replace(".webp", "_corrupted.jpg");
  }

  if (!url.includes("firebasestorage.googleapis.com")) return url;
  
  if (url.includes("_600x600") || url.startsWith("data:")) return url;

  try {
    const baseUrl = url.split("?")[0];
    
    const lastDotIndex = baseUrl.lastIndexOf(".");
    if (lastDotIndex === -1) return url;

    const prefix = baseUrl.substring(0, lastDotIndex);
    
    const optimizedUrl = `${prefix}_600x600.webp`;
    
    return `${optimizedUrl}?alt=media`;
  } catch (error) {
    console.warn("[Utils] Failed to optimize storage URL:", error);
    return url;
  }
}
