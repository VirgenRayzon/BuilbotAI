export function normalizeProductDescription(description?: string | null): string {
  if (!description) return "";

  return description
    .replace(/\r\n?/g, "\n")
    .trim()
    .replace(/\s+(?=(?:\*|-|•)\s+\*\*[^*\n]+\*\*\s*:)/g, "\n")
    .split("\n")
    .map((line) => line.trim().replace(/^(?:\*|•)\s+/, "- "))
    .filter(Boolean)
    .join("\n");
}
