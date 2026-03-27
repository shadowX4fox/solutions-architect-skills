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
