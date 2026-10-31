// sa-ux · Alia's voice — what she says above the prompt and in the panes: one line and a mood, composed by code from
// what the mods already read (the radar, the next steps, the architecture's own markers), never by a model. The mood is
// AliaCodec's: stern for what blocks, worried for what drifts, pleased when all is clear, thinking when a step waits.
// Pure: lifecycle.tsx gathers the inputs, this shapes them.
import type { AliaLine, Radar, Step } from '../../types'

type Lang = 'en' | 'es'
const t = (lang: Lang, en: string, es: string) => (lang === 'es' ? es : en)

/** The architecture's own markers: its H1, version and status, as `ARCHITECTURE.md` states them. */
export function archHeader(text: string): { name: string; version: string; status: string } {
  const marker = (k: string) => (text.match(new RegExp(`<!--\\s*${k}:\\s*([^>]+?)\\s*-->`)) || [])[1] || ''
  const name = ((text.match(/^#\s+(.+)$/m) || [])[1] || '').replace(/\s*<!--.*?-->\s*/g, '').trim()
  return { name, version: marker('ARCHITECTURE_VERSION'), status: marker('ARCHITECTURE_STATUS') || 'Draft' }
}

/** Her line for the project as it stands: the heaviest fact first, one sentence, at most ~90 characters. */
export function aliaSays(input: { lang: Lang; arch: { name: string; version: string; status: string } | null; radar: Radar | null; steps: Step[] }): AliaLine | null {
  const { lang, arch, radar, steps } = input
  if (!arch) return null
  const lenses = radar ? radar.lenses : []
  const critical = lenses.reduce((n, l) => n + l.critical, 0), high = lenses.reduce((n, l) => n + l.high, 0)
  // the lens to start from: the most critical findings, then the most high ones
  const heaviest = [...lenses].sort((a, b) => b.critical - a.critical || b.high - a.high)[0]
  const stale = lenses.filter((l) => l.stale).length
  const debt = radar ? (radar.tdrs['Open'] || 0) + (radar.tdrs['Planned'] || 0) + (radar.tdrs['In Progress'] || 0) : 0
  const version = arch.version ? `v${arch.version}` : ''
  const at = (line: string, mood: AliaLine['mood']): AliaLine => ({ mood, line, ...arch })

  if (critical && heaviest) return at(t(lang,
    `${critical} critical finding${critical > 1 ? 's' : ''} stand — ${heaviest.lens} weighs most. I'd start there.`,
    `Hay ${critical} hallazgo${critical > 1 ? 's' : ''} crítico${critical > 1 ? 's' : ''} — ${heaviest.lens} pesa más. Empezaría ahí.`), 'stern')
  if (stale) return at(t(lang,
    `${stale} analys${stale > 1 ? 'es are' : 'is is'} older than the docs — what they say may no longer hold.`,
    `${stale} análisis ${stale > 1 ? 'son' : 'es'} más viejo${stale > 1 ? 's' : ''} que los docs — puede que ya no digan la verdad.`), 'worried')
  if (high && heaviest) return at(t(lang,
    `No critical findings, but ${high} high — ${heaviest.lens} first.`,
    `Ningún crítico, pero ${high} altos — primero ${heaviest.lens}.`), 'worried')
  const first = steps[0]
  if (first) return at(t(lang,
    `${version ? `${version} · ` : ''}next, I'd ${first.title.charAt(0).toLowerCase()}${first.title.slice(1)}.`,
    `${version ? `${version} · ` : ''}lo siguiente: ${first.title.charAt(0).toLowerCase()}${first.title.slice(1)}.`), 'thinking')
  if (debt) return at(t(lang,
    `${version ? `${version} ${arch.status.toLowerCase()} · ` : ''}all clear, with ${debt} debt record${debt > 1 ? 's' : ''} still open.`,
    `${version ? `${version} ${arch.status.toLowerCase()} · ` : ''}todo en orden, con ${debt} deuda${debt > 1 ? 's' : ''} todavía abierta${debt > 1 ? 's' : ''}.`), 'calm')
  return at(t(lang,
    `${version ? `${version} ${arch.status.toLowerCase()} · ` : ''}all clear — the docs and the analyses agree.`,
    `${version ? `${version} ${arch.status.toLowerCase()} · ` : ''}todo en orden — los docs y los análisis coinciden.`), 'pleased')
}

/** Her words for the spinner while a turn runs in an architecture: what an architect does, present continuous. */
export const SPINNER: Record<Lang, readonly string[]> = {
  en: ['Tracing seams', 'Reading the ledger', 'Weighing trade-offs', 'Walking the flows', 'Checking the budgets', 'Consulting the ADRs',
    'Drawing boundaries', 'Mapping containers', 'Following the contracts', 'Sounding the risks', 'Squaring the layers', 'Reading the blueprint'],
  es: ['Trazando costuras', 'Leyendo el ledger', 'Sopesando trade-offs', 'Recorriendo los flujos', 'Revisando presupuestos', 'Consultando los ADR',
    'Trazando fronteras', 'Mapeando contenedores', 'Siguiendo los contratos', 'Sondeando riesgos', 'Cuadrando las capas', 'Leyendo el plano'],
}
/** The past tense that closes a turn (`Traced for 3s`): English only — the engine writes `for` after it. */
export const DONE = ['Traced', 'Weighed', 'Mapped', 'Charted', 'Surveyed', 'Reviewed', 'Squared']

/** A stable pick: the same engine word maps to the same word of hers, so a turn's spinner does not flicker. */
export function pick<T>(list: readonly T[], seed: string): T {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  return list[Math.abs(h) % list.length]!
}
