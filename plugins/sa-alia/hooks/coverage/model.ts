// sa-alia · requirements coverage — TRACEABILITY_REPORT.md (sa-analysis' architecture-traceability) read by code: the
// summary, the coverage per phase or increment, the requirements not covered and the partial ones. Pure: the pane draws it,
// and register.tsx says whether it is still current.
import type { Coverage } from '../../types'

const cells = (l: string) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim())
const num = (s: string | undefined) => { const n = parseInt(String(s ?? '').replace(/[^\d-]/g, ''), 10); return Number.isFinite(n) ? n : 0 }
const plain = (s: string) => s.replace(/`/g, '').replace(/\*\*/g, '').trim()

/** The rows of the first table after a heading that matches `head`, until the next heading. */
function tableAfter(lines: string[], head: RegExp): string[][] {
  const at = lines.findIndex((l) => /^#{2,4}\s/.test(l) && head.test(l))
  if (at < 0) return []
  const rows: string[][] = []
  for (let k = at + 1; k < lines.length; k++) {
    const l = lines[k]!
    if (/^#{2,4}\s/.test(l)) break
    if (/^\s*\|/.test(l) && !/^\s*\|[\s|:-]+\|\s*$/.test(l)) rows.push(cells(l))
  }
  return rows.slice(1)   // the header row
}

/** The report as the pane shows it; null when the text is not a traceability report. */
export function parseCoverage(md: string): Omit<Coverage, 'at' | 'stale' | 'file'> | null {
  const text = md.replace(/\r\n/g, '\n'), lines = text.split('\n')
  if (!/<!--\s*SECTION:\s*Summary\s*-->/.test(text) || !/Covered/.test(text)) return null
  const field = (k: string) => ((text.match(new RegExp(`^\\*\\*${k}\\*\\*:\\s*(.+)$`, 'm')) || [])[1] || '').trim() || null
  const summary = tableAfter(lines, /SECTION:\s*Summary/)
  const count = (re: RegExp) => num((summary.find((r) => re.test(r[0] || '')) || [])[1])
  const spec = field('PO Spec')
  return {
    specVersion: spec ? ((spec.match(/\(v?([\d.]+)\)/) || [])[1] || null) : null,
    archVersion: field('Architecture Version'),
    date: field('Date'),
    total: count(/Total/i), covered: count(/✅|^Covered/), partial: count(/⚠️|^Partial/), gaps: count(/❌|Not Covered/), undecided: count(/❔|Undecided/),
    phases: tableAfter(lines, /SECTION:\s*Coverage by (Phase|Increment)/).map((r) => ({ phase: plain(r[0] || ''), total: num(r[1]), covered: num(r[2]), partial: num(r[3]), gaps: num(r[4]) })).filter((p) => p.phase),
    notCovered: tableAfter(lines, /❌\s*Not Covered/).map((r) => ({ uc: plain(r[0] || ''), req: plain(r[1] || '') })).filter((x) => x.req),
    partials: tableAfter(lines, /⚠️\s*Partial/).map((r) => ({ uc: plain(r[0] || ''), req: plain(r[1] || ''), gap: plain(r[3] || '') })).filter((x) => x.req),
  }
}

/** The share covered, rounded down: a partial is not coverage. */
export const coveredPct = (c: { total: number; covered: number }) => (c.total ? Math.floor((c.covered / c.total) * 100) : 0)
