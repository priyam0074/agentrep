/**
 * Demo calendars for all four provider catalogues.
 *
 * Saturdays from 12 Sep 2026 through 6 Mar 2027 (~six months). A few
 * Saturdays are left out on purpose so check_availability can fail.
 * LATER omits 2026-09-12 — extra-notice items (same rule as before).
 * 2026-09-19 is on both lists so the recorded demo date still books.
 */

export const DATES: string[] = [
  "2026-09-12",
  "2026-09-19",
  "2026-09-26",
  "2026-10-10",
  "2026-10-17",
  "2026-10-24",
  "2026-10-31",
  "2026-11-14",
  "2026-11-21",
  "2026-12-05",
  "2026-12-12",
  "2026-12-19",
  "2027-01-09",
  "2027-01-16",
  "2027-01-30",
  "2027-02-13",
  "2027-02-20",
  "2027-02-27",
  "2027-03-06",
];

/** Extra-notice items: same Saturdays as DATES except the first (12 Sep). */
export const LATER: string[] = DATES.filter((d) => d !== "2026-09-12");
