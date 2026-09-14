// Only entities already attributed to this inventory may contribute to a stack.
// A missing amount is not evidence for a stack of one.
export function ownedStackCount(entities, amounts) {
  const unique = [...new Set(entities)];
  if (!unique.length) return null;
  const values = unique.map(id => amounts.get(id));
  if (values.some(n => !Number.isInteger(n) || n < 0)) return null;
  return values.reduce((sum, n) => sum + n, 0);
}
