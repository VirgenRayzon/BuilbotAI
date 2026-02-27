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

/**
 * BuildbotAI Currency Utility
 * Converts USD SRP to PHP with a safety buffer of 1:60
 */
export const USD_TO_PHP_RATE = 60;

export const formatToPHP = (usdAmount: number): string => {
  // 1. Convert to PHP using the safety rate
  const phpAmount = usdAmount * USD_TO_PHP_RATE;

  // 2. Format as Philippine Peso currency
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(phpAmount);
};
