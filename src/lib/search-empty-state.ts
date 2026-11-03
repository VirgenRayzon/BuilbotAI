export function shouldShowSearchNoResults(query: string, resultCount: number, loading: boolean): boolean {
  return !loading && query.trim().length > 0 && resultCount === 0;
}
