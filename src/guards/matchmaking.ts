/* Duelmasters — Sprint 5A delta */
export function disallowStablemates(aStableId: string, dStableId: string): boolean {
  return !!aStableId && !!dStableId && aStableId === dStableId;
}
