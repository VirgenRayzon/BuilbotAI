export function findDuplicateCatalogName(
  candidate: string,
  existingNames: readonly string[],
  ignoredName?: string
): string | null {
  const normalizedCandidate = candidate.trim().toLocaleLowerCase();
  if (!normalizedCandidate) return null;

  const normalizedIgnoredName = ignoredName?.trim().toLocaleLowerCase();
  const match = existingNames.find((name) => {
    const normalizedName = name.trim().toLocaleLowerCase();
    return normalizedName === normalizedCandidate && normalizedName !== normalizedIgnoredName;
  });

  return match ?? null;
}
