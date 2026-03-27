#!/usr/bin/env bun

/**
 * Date utility functions for compliance contract generation.
 *
 * Isolated here so that score-calculator.ts and manifest-generator.ts
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
  const [year, month, day] = generationDate.split('-').map(Number);
  const targetMonth = ((month - 1 + 6) % 12) + 1;
  const targetYear = year + Math.floor((month - 1 + 6) / 12);
  // Clamp day to last valid day of target month
  const lastDay = new Date(targetYear, targetMonth, 0).getDate();
  const clampedDay = Math.min(day, lastDay);
  return `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`;
}
