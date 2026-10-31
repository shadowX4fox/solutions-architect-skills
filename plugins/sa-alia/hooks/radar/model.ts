// sa-alia · radar — the architecture's risk at a glance: the findings of the newest report of each analysis lens (counted
// by sa-skills' own parser, `scripts/shared/findings.js`, never re-parsed here) and the TDRs by status from the facts
// ledger. Nothing compliance writes: compliance is isolated, and its health is the command center's (Alia).
// Pure: lifecycle.tsx gathers the inputs, this shapes them.
import type { Radar, RadarLens } from '../../types'

/** One row of `bun scripts/shared/findings.js <analysis-dir> --json`. */
export type FindingsRow = { lens: string; date: string; file: string; total: number; severity: Record<string, number>; residual: Record<string, number>; errors: number }

const DAY = 24 * 3600 * 1000
const day = (ms: number) => new Date(ms).toISOString().slice(0, 10)

export function buildRadar(input: { lang: 'en' | 'es'; findings: FindingsRow[] | null; findingsNote: string | null; tdrs: { status: string }[]; docsNewest: number; now: number }): Radar {
  const es = input.lang === 'es'
  const docsDay = input.docsNewest ? day(input.docsNewest) : ''
  const lenses: RadarLens[] = (input.findings || []).map((r) => {
    const ageDays = Math.max(0, Math.floor((input.now - Date.parse(`${r.date}T00:00:00Z`)) / DAY))
    // stale: older than the newest change to the docs, and at least a week old — a report of yesterday is not stale
    return { lens: r.lens, date: r.date, ageDays, total: r.total, critical: r.severity.critical || 0, high: r.severity.high || 0, stale: !!docsDay && r.date < docsDay && ageDays >= 7 }
  })
  const tdrs: Record<string, number> = {}
  input.tdrs.forEach((d) => { tdrs[d.status] = (tdrs[d.status] || 0) + 1 })
  const critical = lenses.reduce((n, l) => n + l.critical, 0), high = lenses.reduce((n, l) => n + l.high, 0)
  const openDebt = (tdrs['Open'] || 0) + (tdrs['Planned'] || 0) + (tdrs['In Progress'] || 0)
  const stale = lenses.filter((l) => l.stale).length
  const parts = [
    lenses.length ? (es ? `${critical} crít · ${high} altos` : `${critical} critical · ${high} high`) : null,
    `TDR ${openDebt} ${es ? 'abiertos' : 'open'}`,
    stale ? (es ? `${stale} análisis viejos` : `${stale} stale analyses`) : null,
  ].filter(Boolean)
  return { lang: input.lang, lenses, findingsNote: input.findingsNote, tdrs, line: `${es ? 'riesgo' : 'risk'}: ${parts.join(' · ')}` }
}

/** One reading of a lens: the date of its report and its critical and high findings. */
export type TrendPoint = { date: string; critical: number; high: number }

/**
 * A lens's history: what was remembered, plus the readings seen now (the newest report, the archive's newest), one point a
 * date, oldest first, at most `max`. sa-skills keeps one report per lens in `analysis/` and moves the rest to `archive/`,
 * so the history is what this plugin remembers as reports appear — seeded by the archive's newest at first sight.
 */
export function mergeTrend(stored: Record<string, TrendPoint[]> | null | undefined, seen: { lens: string; date: string; critical: number; high: number }[], max = 12): Record<string, TrendPoint[]> {
  const out: Record<string, TrendPoint[]> = {}
  for (const [lens, pts] of Object.entries(stored || {})) if (Array.isArray(pts)) out[lens] = pts.filter((p) => p && typeof p.date === 'string')
  for (const s of seen) {
    const pts = (out[s.lens] ||= [])
    const at = pts.findIndex((p) => p.date === s.date)
    const p = { date: s.date, critical: s.critical, high: s.high }
    if (at >= 0) pts[at] = p; else pts.push(p)
  }
  for (const lens of Object.keys(out)) out[lens] = out[lens]!.sort((a, b) => a.date.localeCompare(b.date)).slice(-max)
  return out
}
