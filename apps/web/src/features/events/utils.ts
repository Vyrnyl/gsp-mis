export function formatEventDate(iso: string, style: 'short' | 'long' = 'short'): string {
  return new Date(iso).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: style,
    day: 'numeric',
  });
}

function formatTime(time: string): string {
  const [hourStr, minute] = time.split(':');
  const hour = Number(hourStr);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute} ${period}`;
}

export function formatEventTimeRange(startTime: string | null, endTime: string | null): string | null {
  if (!startTime) return null;
  return endTime ? `${formatTime(startTime)} – ${formatTime(endTime)}` : formatTime(startTime);
}
