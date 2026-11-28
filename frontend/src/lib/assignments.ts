import type { Assignment } from "@/types/api";

/** Submissions that have no grade yet (neither draft nor published). Staff view only. */
export const ungradedCount = (a: Assignment) =>
  Math.max(0, (a.stats?.submitted ?? 0) - (a.stats?.graded_draft ?? 0) - (a.stats?.graded_published ?? 0));
