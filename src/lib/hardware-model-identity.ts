const VECTOR_RESULT_NAME = /^\[Hardware Spec: [^\]]+\]\s+(.+)$/im;
const LEADING_BRAND = /^(?:amd|intel|nvidia)\s+/;
const GENERIC_SUFFIX = /\s+(?:desktop\s+)?(?:processor|cpu|graphics card)$/;

function normalizeHardwareName(value: string): string {
  return value
    .replace(/[™®©]/g, '')
    .normalize('NFKD')
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(GENERIC_SUFFIX, '')
    .trim();
}

function comparableHardwareNames(value: string): Set<string> {
  const normalized = normalizeHardwareName(value);
  return new Set([normalized, normalized.replace(LEADING_BRAND, '')]);
}

export function hasExactHardwareModelMatch(
  requestedName: string,
  vectorResults: readonly string[]
): boolean {
  const requestedNames = comparableHardwareNames(requestedName);

  return vectorResults.some((result) => {
    const resultName = result.match(VECTOR_RESULT_NAME)?.[1];
    if (!resultName) return false;

    const resultNames = comparableHardwareNames(resultName);
    return [...requestedNames].some((name) => name.length > 0 && resultNames.has(name));
  });
}
