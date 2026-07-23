/**
 * Attendance-rate threshold coloring — adapted from ui-rules.md §7's absent-count
 * example (`0` / `<=2` / `>2` → green/gold/red) to a percentage, since a rate is
 * meaningful across events of any size while a fixed absent-count is not.
 */
export function attendanceRateTone(rate: number): 'green' | 'gold' | 'red' {
  if (rate >= 90) return 'green';
  if (rate >= 75) return 'gold';
  return 'red';
}
