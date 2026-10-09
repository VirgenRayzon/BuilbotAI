/** Parses common PHP budget inputs such as "₱50,000" and "75k PHP". */
export function parsePesoBudget(value: string): number | null {
  const normalized = value.toLowerCase().replace(/,/g, '');
  const match = normalized.match(/(\d+(?:\.\d+)?)\s*([km])?/);
  if (!match) return null;
  const multiplier = match[2] === 'm' ? 1_000_000 : match[2] === 'k' ? 1_000 : 1;
  const amount = Number(match[1]) * multiplier;
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}
