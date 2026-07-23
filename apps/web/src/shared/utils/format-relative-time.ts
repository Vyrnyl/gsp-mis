const UNITS: Array<{ limit: number; divisor: number; unit: Intl.RelativeTimeFormatUnit }> = [
  { limit: 60, divisor: 1, unit: 'second' },
  { limit: 3600, divisor: 60, unit: 'minute' },
  { limit: 86400, divisor: 3600, unit: 'hour' },
  { limit: 604800, divisor: 86400, unit: 'day' },
  { limit: 2629800, divisor: 604800, unit: 'week' },
  { limit: 31557600, divisor: 2629800, unit: 'month' },
];

const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

function capitalize(text: string): string {
  return text.length > 0 ? text[0]!.toUpperCase() + text.slice(1) : text;
}

/**
 * "2 hours ago", "Yesterday" — used wherever the API sends a raw ISO timestamp.
 * Always rendered standalone (under an activity row, never mid-sentence), so the
 * result is capitalized even though `Intl.RelativeTimeFormat` returns lowercase.
 */
export function formatRelativeTime(iso: string): string {
  const seconds = (Date.now() - new Date(iso).getTime()) / 1000;

  if (seconds < 45) return 'Just now';

  for (const { limit, divisor, unit } of UNITS) {
    if (seconds < limit) return capitalize(formatter.format(-Math.round(seconds / divisor), unit));
  }

  return capitalize(formatter.format(-Math.round(seconds / 31557600), 'year'));
}
