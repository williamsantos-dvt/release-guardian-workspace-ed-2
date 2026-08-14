// General purpose helpers accumulated over time.

/**
 * Formats a percentage for display.
 * NOTE: currently unused — kept for the reporting feature planned next quarter.
 */
export function formatPercentage(value: number): string {
  return value.toFixed(2) + '%';
}

/**
 * Deep-merges two objects.
 * NOTE: currently unused — kept from the previous configuration system.
 */
export function deepMerge(a: any, b: any): any {
  const out: any = { ...a };
  for (const key of Object.keys(b)) {
    if (typeof b[key] === 'object' && b[key] !== null && typeof a[key] === 'object') {
      out[key] = deepMerge(a[key], b[key]);
    } else {
      out[key] = b[key];
    }
  }
  return out;
}
