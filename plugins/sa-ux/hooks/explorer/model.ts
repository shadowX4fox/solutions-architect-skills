// sa-ux · explorer — the architecture as a browsable list, from the facts ledger (`.cache/sa-skills/facts.json`, written
// by arch-facts.js on every workflow): containers, integrations, ADRs and TDRs, and a card per element. Pure: the pane
// draws what these functions return, and the actions only fill the prompt.
import type { ExplorerFacts, ExplorerScope, ExplorerTab, IntegrationScope } from '../../types'
import type { Io } from '../next-steps/rules'
import { GLYPH, TONE, type Tone } from '../ui'

/** A list row: a glyph in a tone says what kind of thing it is before the words do. */
export type Row = { id: string; title: string; sub: string; glyph: string; tone: Tone; dim?: boolean }
/** A card: a badge (the element's state), its scalar fields, its lists (one item a line), and the actions. */
export type Card = { title: string; badge: { glyph: string; text: string; tone: Tone }; lines: [string, string][]; lists: { label: string; items: { glyph: string; text: string }[] }[]; actions: { label: string; prompt: string }[] }

const SCOPE_GLYPH = { internal: GLYPH.internal, boundary: GLYPH.boundary, external: GLYPH.external } as const
const adrMark = (status: string): { glyph: string; tone: Tone } => (/^Accepted/i.test(status) ? { glyph: GLYPH.accepted, tone: TONE.ok } : /^Proposed/i.test(status) ? { glyph: GLYPH.proposed, tone: TONE.high } : { glyph: GLYPH.superseded, tone: undefined })
const tdrMark = (status: string): { glyph: string; tone: Tone } => (/^(Resolved|Won't Fix)$/.test(status) ? { glyph: GLYPH.debtDone, tone: TONE.ok } : status === 'Open' ? { glyph: GLYPH.debtOpen, tone: TONE.critical } : { glyph: GLYPH.debtOpen, tone: TONE.high })

const t = (lang: 'en' | 'es', en: string, es: string) => (lang === 'es' ? es : en)
const str = (v: unknown) => (v == null ? '' : String(v))

/** The ledger, slimmed to what the pane shows. null when the project has none yet. */
export async function loadFacts(io: Io, root: string): Promise<ExplorerFacts | null> {
  let raw: any
  try { raw = JSON.parse(await io.read(`${root}/.cache/sa-skills/facts.json`)) } catch { return null }
  const arr = (x: unknown): any[] => (Array.isArray(x) ? x : [])
  // scope is the ledger's: a system the architecture owns (`owned: true`) is in scope, every other one is outside
  const systems = new Map(arr(raw.systems).map((s) => [str(s.slug), { name: str(s.name), owned: s.owned === true }]))
  const components = arr(raw.components).filter((c) => c.level === 'L2').map((c) => {
    const sys = systems.get(str(c.system))
    return {
      slug: str(c.slug), name: str(c.name), index: str(c.index), type: str(c.type), technology: arr(c.technology).map(str),
      description: str(c.description), internalName: str(c.internal_name), version: str(c.component_version), file: str(c.file),
      adrs: arr(c.related_adrs).map(str), system: sys ? sys.name : str(c.system), inScope: !!(sys && sys.owned),
    }
  })
  const inside = new Set(components.filter((c) => c.inScope).map((c) => c.name))
  const scopeOf = (from: string, to: string): IntegrationScope => { const n = (inside.has(from) ? 1 : 0) + (inside.has(to) ? 1 : 0); return n === 2 ? 'internal' : n === 1 ? 'boundary' : 'external' }
  return {
    generatedAt: str(raw.generated_at),
    lang: /^es/i.test(str(raw.architecture && raw.architecture.language)) ? 'es' : 'en',
    components,
    integrations: arr(raw.integrations).map((i) => ({ id: str(i.id), from: str(i.from), to: str(i.to), protocol: str(i.protocol), pattern: str(i.pattern), retired: !!i.retired, scope: scopeOf(str(i.from), str(i.to)) })),
    adrs: arr(raw.adrs).map((a) => ({ id: str(a.id), title: str(a.title), status: str(a.status), scope: str(a.scope), file: str(a.file) })),
    tdrs: arr(raw.tdrs).map((d) => ({ id: str(d.id), title: str(d.title).replace(/^TDR-\d+:\s*/, ''), status: str(d.status), driver: str(d.driver), file: str(d.file) })),
  }
}

const num = (s: string) => s.split('.').map((x) => x.padStart(4, '0')).join('.')
/** Whether a container or an integration passes the scope filter; ADRs and TDRs are not filtered. */
export function inFilter(f: ExplorerFacts, tab: ExplorerTab, id: string, scope: ExplorerScope): boolean {
  if (scope === 'all' || (tab !== 'components' && tab !== 'integrations')) return true
  if (tab === 'components') { const c = f.components.find((x) => x.slug === id); return !!c && (scope === 'in') === c.inScope }
  const i = f.integrations.find((x) => x.id === id); return !!i && (scope === 'in') === (i.scope !== 'external')
}
const scopeWord = (L: 'en' | 'es', s: IntegrationScope) => (L === 'es' ? { internal: 'interna', boundary: 'frontera', external: 'externa' } : { internal: 'internal', boundary: 'boundary', external: 'external' })[s]
export function rows(f: ExplorerFacts, tab: ExplorerTab, scope: ExplorerScope = 'all'): Row[] {
  const L = f.lang
  if (tab === 'components') return [...f.components].filter((c) => inFilter(f, tab, c.slug, scope)).sort((a, b) => Number(b.inScope) - Number(a.inScope) || num(a.index).localeCompare(num(b.index)))
    .map((c) => ({ id: c.slug, title: c.name, sub: [c.system, c.type, c.technology.join(', ')].filter(Boolean).join(' · '), glyph: c.inScope ? GLYPH.inScope : GLYPH.outScope, tone: c.inScope ? TONE.ok : undefined, dim: !c.inScope && scope === 'all' }))
  if (tab === 'integrations') return f.integrations.filter((i) => inFilter(f, tab, i.id, scope))
    .map((i) => ({ id: i.id, title: `${i.id}  ${i.from} → ${i.to}`, sub: [scopeWord(L, i.scope), i.protocol, i.pattern].filter(Boolean).join(' · '), glyph: i.retired ? GLYPH.retired : SCOPE_GLYPH[i.scope], tone: i.retired ? undefined : i.scope === 'internal' ? TONE.ok : i.scope === 'boundary' ? TONE.info : undefined, dim: i.retired || (i.scope === 'external' && scope === 'all') }))
  if (tab === 'adrs') return f.adrs.map((a) => ({ id: a.id, title: `${a.id}  ${a.title}`, sub: [a.status.replace(/\s*\(.*$|\s+—.*$/, ''), a.scope].filter(Boolean).join(' · '), ...adrMark(a.status), dim: /^Superseded|^Deprecated/i.test(a.status) }))
  return f.tdrs.map((d) => ({ id: d.id, title: `${d.id}  ${d.title}`, sub: [d.status, d.driver].filter(Boolean).join(' · '), ...tdrMark(d.status), dim: /^(Resolved|Won't Fix)$/.test(d.status) }))
}

export function card(f: ExplorerFacts, tab: ExplorerTab, id: string): Card | null {
  const L = f.lang
  if (tab === 'components') {
    const c = f.components.find((x) => x.slug === id); if (!c) return null
    const live = f.integrations.filter((i) => !i.retired)
    const inbound = live.filter((i) => i.to === c.name).map((i) => ({ glyph: GLYPH.inbound, text: `${i.id}  ${i.from}  ${GLYPH.dot} ${i.protocol}` }))
    const outbound = live.filter((i) => i.from === c.name).map((i) => ({ glyph: GLYPH.outbound, text: `${i.id}  ${i.to}  ${GLYPH.dot} ${i.protocol}` }))
    return { title: c.name,
      badge: c.inScope ? { glyph: GLYPH.inScope, text: t(L, 'in scope', 'en alcance'), tone: TONE.ok } : { glyph: GLYPH.outScope, text: t(L, 'out of scope', 'fuera de alcance'), tone: undefined },
      lines: ([
        [t(L, 'System', 'Sistema'), c.system], [t(L, 'Internal name', 'Nombre interno'), c.internalName], [t(L, 'Type', 'Tipo'), c.type],
        [t(L, 'Technology', 'Tecnología'), c.technology.join(', ')], [t(L, 'Version', 'Versión'), c.version], [t(L, 'Description', 'Descripción'), c.description],
        ['ADR', c.adrs.join(', ')], [t(L, 'File', 'Archivo'), c.file],
      ] as [string, string][]).filter(([, v]) => v),
      lists: [{ label: t(L, 'Inbound', 'Entrantes'), items: inbound }, { label: t(L, 'Outbound', 'Salientes'), items: outbound }].filter((x) => x.items.length),
      actions: [
        { label: t(L, 'Ask about it', 'Preguntar'), prompt: t(L, `explain the component ${c.name}: its responsibility, its integrations and the decisions that govern it`, `explica el componente ${c.name}: su responsabilidad, sus integraciones y las decisiones que lo gobiernan`) },
        { label: t(L, 'Handoff', 'Handoff'), prompt: t(L, `generate the handoff for ${c.name}`, `genera el handoff del ${c.name}`) },
      ] }
  }
  if (tab === 'integrations') {
    const i = f.integrations.find((x) => x.id === id); if (!i) return null
    return { title: `${i.id}  ${i.from} → ${i.to}`,
      badge: i.retired ? { glyph: GLYPH.retired, text: t(L, 'retired', 'retirada'), tone: undefined } : { glyph: SCOPE_GLYPH[i.scope], text: scopeWord(L, i.scope), tone: i.scope === 'internal' ? TONE.ok : i.scope === 'boundary' ? TONE.info : undefined },
      lines: ([[t(L, 'From', 'Desde'), i.from], [t(L, 'To', 'Hacia'), i.to], [t(L, 'Protocol', 'Protocolo'), i.protocol], [t(L, 'Pattern', 'Patrón'), i.pattern]] as [string, string][]).filter(([, v]) => v), lists: [],
      actions: [{ label: t(L, 'Ask about it', 'Preguntar'), prompt: t(L, `explain integration ${i.id}: what it carries, its failure behaviour and the ADRs behind it`, `explica la integración ${i.id}: qué lleva, cómo falla y qué ADR la gobiernan`) }] }
  }
  if (tab === 'adrs') {
    const a = f.adrs.find((x) => x.id === id); if (!a) return null
    const proposed = /^Proposed/i.test(a.status)
    return { title: `${a.id}  ${a.title}`, badge: { ...adrMark(a.status), text: a.status.replace(/\s*\(.*$|\s+—.*$/, '') },
      lines: ([[t(L, 'Status', 'Estado'), a.status], [t(L, 'Scope', 'Alcance'), a.scope], [t(L, 'File', 'Archivo'), a.file]] as [string, string][]).filter(([, v]) => v), lists: [],
      actions: [{ label: t(L, 'Summarize', 'Resumir'), prompt: t(L, `summarize ${a.id}: the decision, why, and what it constrains`, `resume el ${a.id}: la decisión, por qué y qué restringe`) },
        ...(proposed ? [{ label: t(L, 'What is missing to accept it', 'Qué falta para aceptarlo'), prompt: t(L, `review the proposed ${a.id} and tell me what is missing to accept it`, `revisa el ${a.id} propuesto y dime qué falta para aceptarlo`) }] : [])] }
  }
  const d = f.tdrs.find((x) => x.id === id); if (!d) return null
  return { title: `${d.id}  ${d.title}`, badge: { ...tdrMark(d.status), text: d.status },
    lines: ([['Driver', d.driver], [t(L, 'File', 'Archivo'), d.file]] as [string, string][]).filter(([, v]) => v), lists: [],
    actions: [{ label: t(L, 'Summarize', 'Resumir'), prompt: t(L, `summarize ${d.id}: the compromise, its impact and the plan to pay it`, `resume el ${d.id}: el compromiso, su impacto y el plan para pagarlo`) }] }
}
