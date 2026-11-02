// sa-alia · radar — a lens's findings over time as a sparkline, for the desktop radar: critical in red, high in amber, a dot
// per report (a still picture inside the radar's pane; the `<title>`s are for a screen reader). Fewer than two readings draw nothing (one point is not a trend). Pure: the pane draws it.
import type { TrendPoint } from './model'

export const SPARK_W = 96, SPARK_H = 20
const RED = '#ff5d6c', AMBER = '#f0b429'

export function sparkline(points: TrendPoint[], lang: 'en' | 'es', W = SPARK_W, H = SPARK_H): string | null {
  if (points.length < 2) return null
  const SPARK_W_ = W, SPARK_H_ = H
  const max = Math.max(1, ...points.map((p) => Math.max(p.critical, p.high)))
  const x = (i: number) => 3 + (i * (SPARK_W_ - 6)) / (points.length - 1)
  const y = (v: number) => SPARK_H_ - 3 - (v / max) * (SPARK_H_ - 6)
  const line = (k: 'critical' | 'high', c: string) => `<polyline points="${points.map((p, i) => `${x(i).toFixed(1)},${y(p[k]).toFixed(1)}`).join(' ')}" fill="none" stroke="${c}" stroke-width="${H > 30 ? 2.4 : 1.6}" stroke-linejoin="round"/>`
  const tip = (p: TrendPoint) => (lang === 'es' ? `${p.date} · ${p.critical} críticos · ${p.high} altos` : `${p.date} · ${p.critical} critical · ${p.high} high`)
  const dots = points.map((p, i) => `<g><title>${tip(p)}</title><circle cx="${x(i).toFixed(1)}" cy="${y(p.critical).toFixed(1)}" r="${H > 30 ? 3.2 : 2.2}" fill="${RED}"/><circle cx="${x(i).toFixed(1)}" cy="${y(p.high).toFixed(1)}" r="${H > 30 ? 3.2 : 2.2}" fill="${AMBER}"/></g>`).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SPARK_W_}" height="${SPARK_H_}" viewBox="0 0 ${SPARK_W_} ${SPARK_H_}">${line('high', AMBER)}${line('critical', RED)}${dots}</svg>`
}

/** The change between a lens's last two readings: critical and high, and the arrow a reader takes it in. */
export function change(points: TrendPoint[]): { critical: number; high: number; arrow: '▲' | '▼' | '=' } | null {
  if (points.length < 2) return null
  const a = points[points.length - 2]!, b = points[points.length - 1]!
  const critical = b.critical - a.critical, high = b.high - a.high
  const weight = critical * 2 + high
  return { critical, high, arrow: weight > 0 ? '▲' : weight < 0 ? '▼' : '=' }
}

