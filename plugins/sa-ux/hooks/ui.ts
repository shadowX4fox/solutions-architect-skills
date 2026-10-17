// sa-ux — the mods' shared visual language: glyphs, tones and small text helpers. Pure (no `$`): each render hook draws
// with these so the band, the explorer and the radar read as one product. Tones are theme keys, never raw colours, so
// every theme and surface paints them its own way.
export const TONE = { critical: 'error', high: 'warning', ok: 'success', info: 'suggestion' } as const
export type Tone = (typeof TONE)[keyof typeof TONE] | undefined

export const GLYPH = {
  brand: '◆', step: '▸', inScope: '●', outScope: '○', internal: '⇄', boundary: '⇥', external: '⋯', retired: '✕',
  accepted: '✓', proposed: '◌', superseded: '✕', debtOpen: '▲', debtDone: '✓', inbound: '←', outbound: '→', stale: '⚠', dot: '·',
} as const

export const cut = (s: string, n: number) => (s.length > n ? `${s.slice(0, Math.max(1, n - 1))}…` : s)
export const pad = (s: string, n: number) => (s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length))
export const padLeft = (s: string, n: number) => (s.length >= n ? s : ' '.repeat(n - s.length) + s)
export const rule = (n: number) => '─'.repeat(Math.max(0, n))
/** A meter: `filled` of `width` cells; a non-zero value always shows at least one. */
export function bar(value: number, max: number, width: number): { on: string; off: string } {
  const n = max > 0 && value > 0 ? Math.max(1, Math.min(width, Math.round((value / max) * width))) : 0
  return { on: '█'.repeat(n), off: '░'.repeat(width - n) }
}
