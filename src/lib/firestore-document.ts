/**
 * Removes values that Firestore cannot serialize while preserving SDK value
 * objects such as Timestamp and FieldValue instances.
 */
export function toFirestoreDocument<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((entry) => toFirestoreDocument(entry)) as T;
  }

  if (
    value === null ||
    typeof value !== "object" ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .map(([key, entry]) => [key, toFirestoreDocument(entry)])
  ) as T;
}
