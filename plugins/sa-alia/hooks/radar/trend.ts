// sa-alia · radar — a lens's findings over time as a sparkline, for the desktop radar: critical in red, high in amber, a dot
// per report (a still picture inside the radar's pane; the `<title>`s are for a screen reader). Fewer than two readings draw nothing (one point is not a trend). Pure: the pane draws it.
import type { TrendPoint } from './model'

export const SPARK_W = 96, SPARK_H = 20
const RED = '#ff5d6c', AMBER = '#f0b429'

export function sparkline(points: TrendPoint[], lang: 'en' | 'es'): string | null {
  if (points.length < 2) return null
  const max = Math.max(1, ...points.map((p) => Math.max(p.critical, p.high)))
  const x = (i: number) => 3 + (i * (SPARK_W - 6)) / (points.length - 1)
  const y = (v: number) => SPARK_H - 3 - (v / max) * (SPARK_H - 6)
  const line = (k: 'critical' | 'high', c: string) => `<polyline points="${points.map((p, i) => `${x(i).toFixed(1)},${y(p[k]).toFixed(1)}`).join(' ')}" fill="none" stroke="${c}" stroke-width="1.6" stroke-linejoin="round"/>`
  const tip = (p: TrendPoint) => (lang === 'es' ? `${p.date} · ${p.critical} críticos · ${p.high} altos` : `${p.date} · ${p.critical} critical · ${p.high} high`)
  const dots = points.map((p, i) => `<g><title>${tip(p)}</title><circle cx="${x(i).toFixed(1)}" cy="${y(p.critical).toFixed(1)}" r="2.2" fill="${RED}"/><circle cx="${x(i).toFixed(1)}" cy="${y(p.high).toFixed(1)}" r="2.2" fill="${AMBER}"/></g>`).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SPARK_W}" height="${SPARK_H}" viewBox="0 0 ${SPARK_W} ${SPARK_H}">${line('high', AMBER)}${line('critical', RED)}${dots}</svg>`
}
