// sa-ux · explorer — a container's neighbourhood as SVG, for the card on surfaces that draw pictures: the container in the
// middle, what calls it on the left, what it calls on the right, each link its `I-nn` and protocol drawn on it (a still
// picture: the desktop draws an interactive one as nothing inside a pane, so the `<title>`s are for a screen reader). Drawn on Alia's night ground (her palette), so it reads the same on a light or a dark app. Live integrations
// only; a node outside the architecture is silver, inside it aqua. Pure: the card draws what this returns.
import type { ExplorerFacts } from '../../types'
import { ALIA } from '../alia/palette'

// three columns of nodes with room between them for a link's label: the label sits in that gap, never under a node
const W = 640, NODE_W = 150, NODE_H = 34, ROW = 46, PAD = 16, LABEL = 12
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const cut = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s)

/** The SVG of one container's live integrations, null when the container is unknown or has none. */
export function neighbourhoodSvg(f: ExplorerFacts, slug: string): string | null {
  const c = f.components.find((x) => x.slug === slug)
  if (!c) return null
  const live = f.integrations.filter((i) => !i.retired)
  const ins = live.filter((i) => i.to === c.name), outs = live.filter((i) => i.from === c.name)
  if (!ins.length && !outs.length) return null
  const byName = new Map(f.components.map((x) => [x.name, x]))
  const rows = Math.max(ins.length, outs.length, 1)
  const H = PAD * 2 + rows * ROW - (ROW - NODE_H)
  const midY = H / 2
  const colY = (n: number, i: number) => midY - ((n - 1) * ROW) / 2 + i * ROW

  const node = (x: number, y: number, name: string, centre = false) => {
    const k = byName.get(name), inside = centre || !!(k && k.inScope)
    const tip = k ? `${k.name} — ${[k.type, k.technology.join(', '), k.system].filter(Boolean).join(' · ')}` : name
    return `<g><title>${esc(tip)}</title><rect x="${x}" y="${y - NODE_H / 2}" width="${NODE_W}" height="${NODE_H}" rx="8" fill="${centre ? ALIA.night : ALIA.night2}" stroke="${inside ? ALIA.aqua : ALIA.nightMuted}" stroke-width="${centre ? 2.5 : 1.2}"/>`
      + `<text x="${x + NODE_W / 2}" y="${y + 4.5}" text-anchor="middle" font-family="Nunito, system-ui, sans-serif" font-size="12.5" font-weight="${centre ? 800 : 600}" fill="${centre ? '#ffffff' : ALIA.silver}">${esc(cut(name, 21))}</text></g>`
  }
  // a link's label sits above it beside the outer node, where the curve runs level: links that fan out never share a spot
  const edge = (x1: number, y1: number, x2: number, y2: number, i: ExplorerFacts['integrations'][number], side: 'in' | 'out') => {
    const dash = i.scope === 'external' ? ' stroke-dasharray="5 4"' : ''
    const mx = (x1 + x2) / 2
    const lx = side === 'in' ? x1 + 5 : x2 - 8, ly = (side === 'in' ? y1 : y2) - 5, anchor = side === 'in' ? 'start' : 'end'
    return `<g><title>${esc(`${i.id} · ${i.from} → ${i.to} · ${[i.protocol, i.pattern].filter(Boolean).join(' · ')}`)}</title>`
      + `<path d="M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}" fill="none" stroke="${ALIA.aquaMark}" stroke-width="1.6" marker-end="url(#arrow)"${dash}/>`
      + `<text x="${lx}" y="${ly}" text-anchor="${anchor}" font-family="IBM Plex Mono, ui-monospace, monospace" font-size="10.5" fill="${ALIA.nightMuted}">${esc(cut(`${i.id} ${i.protocol}`.trim(), LABEL))}</text></g>`
  }

  const leftX = PAD, centreX = (W - NODE_W) / 2, rightX = W - PAD - NODE_W
  const parts: string[] = []
  ins.forEach((i, k) => { const y = colY(ins.length, k); parts.push(edge(leftX + NODE_W, y, centreX - 3, midY, i, 'in'), node(leftX, y, i.from)) })
  outs.forEach((i, k) => { const y = colY(outs.length, k); parts.push(edge(centreX + NODE_W, midY, rightX - 3, y, i, 'out'), node(rightX, y, i.to)) })
  parts.push(node(centreX, midY, c.name, true))
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`
    + `<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${ALIA.aquaMark}"/></marker></defs>`
    + `<rect width="${W}" height="${H}" rx="12" fill="${ALIA.night}"/>${parts.join('')}</svg>`
}
