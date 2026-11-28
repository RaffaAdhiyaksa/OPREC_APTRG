import { differenceInMilliseconds, format, formatDistanceStrict } from "date-fns";
import { id } from "date-fns/locale";

// The API sends ISO 8601 UTC. The UI always shows WIB (UTC+7, no daylight saving),
// regardless of the browser's time zone.
const WIB_OFFSET_MINUTES = 7 * 60;

/** Returns a Date whose local fields equal the WIB wall-clock time, for date-fns formatting. */
function toWibWallClock(value: string | Date): Date {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Date(date.getTime() + (WIB_OFFSET_MINUTES + date.getTimezoneOffset()) * 60_000);
}

/** "Jum, 5 Des 2026 23.59 WIB" */
export function formatDateTime(value: string | Date): string {
  return `${format(toWibWallClock(value), "EEE, d MMM yyyy HH.mm", { locale: id })} WIB`;
}

/** "5 Des 2026" */
export function formatDate(value: string | Date): string {
  return format(toWibWallClock(value), "d MMM yyyy", { locale: id });
}

/** "2 hari lagi" / "3 jam lalu". Pair with formatDateTime in a tooltip. */
export function formatRelative(value: string | Date, now: Date = new Date()): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const distance = formatDistanceStrict(date, now, { locale: id });
  return differenceInMilliseconds(date, now) >= 0 ? `${distance} lagi` : `${distance} lalu`;
}
