/**
 * Keeps AI-generated product highlights readable in plain text and Markdown
 * editors by placing every labelled bullet on its own line.
 */
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
