/**
 * Tests for compliance date helpers.
 *
 * `getNextReviewDate` carries documented month-clamping logic and had no tests.
 * It also accepted anything: `getNextReviewDate('')` returned the string
 * "NaN-NaN-NaN", which would be written into a contract's Document Control
 * block as a review date. It now validates its input.
 *
 * @module date-utils.test
 */
import { describe, expect, test } from 'bun:test';
import { getLocalDateString, getNextReviewDate } from './date-utils';

describe('getNextReviewDate — six months forward', () => {
  test('mid-month date in the same year', () => {
    expect(getNextReviewDate('2026-01-15')).toBe('2026-07-15');
  });

  test('rolls into the next year', () => {
    expect(getNextReviewDate('2026-08-23')).toBe('2027-02-23');
  });

  test('December rolls to June of the next year', () => {
    expect(getNextReviewDate('2026-12-01')).toBe('2027-06-01');
  });

  test('July stays in the same year', () => {
    expect(getNextReviewDate('2026-07-31')).toBe('2027-01-31');
  });
});

describe('getNextReviewDate — day clamping', () => {
  test('Aug 31 + 6m clamps to Feb 28 in a common year', () => {
    expect(getNextReviewDate('2026-08-31')).toBe('2027-02-28');
  });

  test('Aug 31 + 6m clamps to Feb 29 in a leap year', () => {
    // 2028 is a leap year.
    expect(getNextReviewDate('2027-08-31')).toBe('2028-02-29');
  });

  test('Mar 31 + 6m clamps to Sep 30', () => {
    expect(getNextReviewDate('2026-03-31')).toBe('2026-09-30');
  });

  test('a day that exists in the target month is not clamped', () => {
    expect(getNextReviewDate('2026-03-30')).toBe('2026-09-30');
  });

  test('Feb 29 of a leap year + 6m is Aug 29', () => {
    expect(getNextReviewDate('2028-02-29')).toBe('2028-08-29');
  });
});

describe('getNextReviewDate — input validation', () => {
  for (const bad of ['', 'not-a-date', '2026-1-5', '20260105', '2026/01/05', '2026-01']) {
    test(`rejects ${JSON.stringify(bad)}`, () => {
      expect(() => getNextReviewDate(bad)).toThrow(/expected YYYY-MM-DD/);
    });
  }

  test('rejects an out-of-range month', () => {
    expect(() => getNextReviewDate('2026-13-01')).toThrow(/not a valid date/);
  });

  test('rejects an out-of-range day', () => {
    expect(() => getNextReviewDate('2026-01-32')).toThrow(/not a valid date/);
  });

  test('never returns a NaN-bearing string', () => {
    // The old failure mode, pinned: a bad input must not produce "NaN-NaN-NaN".
    for (const bad of ['', 'x', '2026-01']) {
      let out: string | null = null;
      try { out = getNextReviewDate(bad); } catch { /* expected */ }
      expect(out).toBeNull();
    }
  });
});

describe('getLocalDateString', () => {
  test('returns a YYYY-MM-DD string', () => {
    expect(getLocalDateString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('agrees with local time, not UTC', () => {
    // The UTC shift this helper exists to avoid would show up as a different
    // day-of-month for UTC- timezones shortly after midnight UTC.
    const d = new Date();
    const expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    expect(getLocalDateString()).toBe(expected);
  });

  test('round-trips through getNextReviewDate', () => {
    expect(() => getNextReviewDate(getLocalDateString())).not.toThrow();
  });
});
