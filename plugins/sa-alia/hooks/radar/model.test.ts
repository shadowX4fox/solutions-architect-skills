import { describe, expect, test } from 'claude-code/testing'

import { buildRadar, mergeTrend, type FindingsRow } from './model'
import { sparkline } from './trend'

const NOW = Date.UTC(2026, 9, 1, 18)
const row = (lens: string, date: string, sev: Record<string, number>): FindingsRow => ({ lens, date, file: `${lens}-${date}.md`, total: Object.values(sev).reduce((a, b) => a + b, 0), severity: sev, residual: {}, errors: 0 })

describe('sa-alia radar model', () => {
  test('the line: critical and high across lenses, open debt, stale analyses — in the doc language; nothing of compliance', () => {
    const r = buildRadar({ lang: 'es', now: NOW, docsNewest: Date.UTC(2026, 9, 1, 15), findingsNote: null,
      findings: [row('STRIDE', '2026-09-27', { high: 10, medium: 20 }), row('SPOF', '2026-09-20', { critical: 7, medium: 10 })],
      tdrs: [{ status: 'Open' }, { status: 'Open' }, { status: 'Planned' }, { status: 'Resolved' }] })
    expect(r.line).toBe('riesgo: 7 crít · 10 altos · TDR 3 abiertos · 1 análisis viejos')
    expect(r.lenses.find((l) => l.lens === 'SPOF')).toMatchObject({ stale: true, ageDays: 11 })
    expect(r.lenses.find((l) => l.lens === 'STRIDE')?.stale).toBe(false)   // 4 days old: not stale yet
    expect(r.tdrs).toEqual({ Open: 2, Planned: 1, Resolved: 1 })
  })

  test('without the findings parser the line still carries the debt', () => {
    const r = buildRadar({ lang: 'en', now: NOW, docsNewest: 0, findings: null, findingsNote: 'sa-skills not found', tdrs: [] })
    expect(r.line).toBe('risk: TDR 0 open')
  })

  test('the trend: remembered points plus today\'s, one a date, oldest first, capped', () => {
    const t = mergeTrend({ SPOF: [{ date: '2026-09-01', critical: 8, high: 1 }] }, [{ lens: 'SPOF', date: '2026-10-01', critical: 3, high: 2 }, { lens: 'SPOF', date: '2026-09-01', critical: 7, high: 1 }, { lens: 'STRIDE', date: '2026-10-01', critical: 0, high: 4 }], 2)
    expect(t).toEqual({ SPOF: [{ date: '2026-09-01', critical: 7, high: 1 }, { date: '2026-10-01', critical: 3, high: 2 }], STRIDE: [{ date: '2026-10-01', critical: 0, high: 4 }] })
    expect(mergeTrend(null, [])).toEqual({})
  })
  test('a sparkline needs two readings; each carries its tooltip', () => {
    expect(sparkline([{ date: '2026-10-01', critical: 1, high: 1 }], 'en')).toBeNull()
    const svg = sparkline([{ date: '2026-09-01', critical: 8, high: 1 }, { date: '2026-10-01', critical: 3, high: 2 }], 'es')!
    expect(svg).toContain('<title>2026-10-01 · 3 críticos · 2 altos</title>')
    expect(svg.match(/<polyline/g)!.length).toBe(2)
  })
})
