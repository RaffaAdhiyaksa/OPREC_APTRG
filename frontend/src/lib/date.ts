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

/** Splits an ISO instant into WIB `yyyy-MM-dd` and `HH:mm` values for native date/time inputs. */
export function toWibInputs(value: string | Date): { date: string; time: string } {
  const wib = toWibWallClock(value);
  return { date: format(wib, "yyyy-MM-dd"), time: format(wib, "HH:mm") };
}

/** Joins WIB date/time input values back into an ISO 8601 UTC string. */
export function fromWibInputs(date: string, time: string): string {
  return new Date(`${date}T${time}:00+07:00`).toISOString();
}

/** True when the instant is in the future but less than 24 hours away. */
export function isDueSoon(value: string, now = Date.now()) {
  const left = new Date(value).getTime() - now;
  return left > 0 && left < 24 * 60 * 60 * 1000;
}
