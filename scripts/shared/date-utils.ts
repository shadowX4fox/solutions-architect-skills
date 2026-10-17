#!/usr/bin/env bun

/**
 * Date utility functions shared across skills (ADR catalog diffs,
 * handoff manifests, scripts/today.ts).
 *
 * Kept free of imports so that score-calculator.ts and manifest-generator.ts
 * don't need to depend on generation-helper.ts (which pulls in validators).
 *
 * @module date-utils
 */

/**
 * Get current date as YYYY-MM-DD string in local timezone.
 *
 * Uses local time (mirrors bash `date +%Y-%m-%d`).
 * Avoids the UTC shift from `new Date().toISOString().split('T')[0]`
 * which can return tomorrow's date for UTC- timezones after midnight UTC.
 */
export function getLocalDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Calculate a date 6 months after the given date, preserving YYYY-MM-DD format.
 * If the day doesn't exist in the target month (e.g. Jan 31 + 6m = Jul 31),
 * the date is clamped to the last day of that month.
 *
 * @param generationDate - Date string in YYYY-MM-DD format
 * @returns Date string 6 months later in YYYY-MM-DD format
 */
export function getNextReviewDate(generationDate: string): string {
  // Validate before arithmetic: an unparseable input used to sail through and
  // return the string "NaN-NaN-NaN", which then landed in a contract's
  // Document Control block as a review date.
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(generationDate);
  if (!match) {
    throw new Error(`getNextReviewDate: expected YYYY-MM-DD, got "${generationDate}"`);
  }
  const [year, month, day] = [match[1], match[2], match[3]].map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    throw new Error(`getNextReviewDate: "${generationDate}" is not a valid date`);
  }
  const targetMonth = ((month - 1 + 6) % 12) + 1;
  const targetYear = year + Math.floor((month - 1 + 6) / 12);
  // Clamp day to last valid day of target month
  const lastDay = new Date(targetYear, targetMonth, 0).getDate();
  const clampedDay = Math.min(day, lastDay);
  return `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`;
}
