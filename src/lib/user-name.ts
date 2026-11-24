export function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function formatFullName(firstName: string, lastName: string): string {
  return [normalizeName(firstName), normalizeName(lastName)]
    .filter(Boolean)
    .join(' ');
}

export function splitDisplayName(displayName?: string | null): {
  firstName: string;
  lastName: string;
  name: string;
} {
  const normalized = normalizeName(displayName ?? '');
  if (!normalized) {
    return { firstName: '', lastName: '', name: '' };
  }

  const parts = normalized.split(' ');
  const firstName = parts[0] ?? '';
  const lastName = parts.length > 1 ? parts.slice(1).join(' ') : '';

  return {
    firstName,
    lastName,
    name: normalized,
  };
}

