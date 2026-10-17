import { describe, expect, test } from 'claude-code/testing'

import type { ExplorerFacts } from '../../types'
import { card, inFilter, loadFacts, rows } from './model'

const LEDGER = {
  generated_at: '2026-10-01T18:00:00Z', architecture: { language: 'es' },
  systems: [{ slug: 'banca', name: 'Banca', owned: true }, { slug: 'ext', name: 'Externo', owned: false }],
  components: [
    { level: 'L1', slug: 'apim', name: 'APIM' },
    { level: 'L2', system: 'banca', slug: 'alta', name: 'Servicio de Alta', index: '5.10', type: 'Service', technology: ['Java 21'], internal_name: 'omn-alta', component_version: '2.7.0', file: 'docs/components/s/10-alta.md', related_adrs: ['ADR-120'], description: 'Servicio de Alta — da de alta.' },
    { level: 'L2', system: 'banca', slug: 'gw', name: 'Gateway de Control', index: '5.2', type: 'Gateway', technology: [] },
    { level: 'L2', system: 'ext', slug: 'core', name: 'Core', index: '1.1', type: 'Database', technology: [] },
  ],
  integrations: [
    { id: 'I-27', from: 'Gateway de Control', to: 'Servicio de Alta', protocol: 'REST/HTTPS', pattern: 'Petición-respuesta', retired: false },
    { id: 'I-11', from: 'Servicio de Alta', to: 'Viejo', protocol: '—', retired: true },
    { id: 'I-05', from: 'Core', to: 'Servicio de Alta', protocol: 'CDC', retired: false },
    { id: 'I-03', from: 'Core', to: 'Afuera', protocol: 'JDBC', retired: false },
  ],
  adrs: [{ id: 'ADR-120', title: 'Alta de replicación', status: 'Proposed', scope: 'Proyecto', file: 'adr/ADR-120.md' }, { id: 'ADR-099', title: 'Viejo', status: 'Superseded by [ADR-120]', scope: 'Proyecto' }],
  tdrs: [{ id: 'TDR-001', title: 'TDR-001: WSS sin JWE', status: 'Open', driver: 'Architecture', file: 'tdr/TDR-001.md' }],
}
const io = (text: string | null) => ({ exists: async () => true, read: async () => { if (text === null) throw new Error('ENOENT'); return text }, list: async () => [], stat: async () => ({ kind: 'file' as const, mtimeMs: 0 }) })

describe('sa-ux explorer model', () => {
  test('the ledger, slimmed: L2 containers only, the TDR title without its id', async () => {
    const f = (await loadFacts(io(JSON.stringify(LEDGER)), '/p')) as ExplorerFacts
    expect(f.lang).toBe('es')
    expect(f.components.map((c) => c.slug)).toEqual(['alta', 'gw', 'core'])
    expect(f.tdrs[0]?.title).toBe('WSS sin JWE')
    expect(await loadFacts(io(null), '/p')).toBeNull()
  })

  test('rows: containers by index (5.2 before 5.10), retired and superseded dimmed', async () => {
    const f = (await loadFacts(io(JSON.stringify(LEDGER)), '/p')) as ExplorerFacts
    expect(rows(f, 'components').map((r) => r.id)).toEqual(['gw', 'alta', 'core'])   // in scope first, each by index
    expect(rows(f, 'integrations').find((r) => r.id === 'I-11')?.dim).toBe(true)
    expect(rows(f, 'adrs').find((r) => r.id === 'ADR-099')?.dim).toBe(true)
  })

  test("a container's card: its live integrations both ways, its ADRs, prompts in the doc's language", async () => {
    const f = (await loadFacts(io(JSON.stringify(LEDGER)), '/p')) as ExplorerFacts
    const c = card(f, 'components', 'alta')
    expect(c?.lists).toEqual([{ label: 'Entrantes', items: [{ glyph: '←', text: 'I-27  Gateway de Control  · REST/HTTPS' }, { glyph: '←', text: 'I-05  Core  · CDC' }] }])   // no Salientes: I-11 is retired
    expect(c?.badge).toEqual({ glyph: '●', text: 'en alcance', tone: 'success' })
    expect(c?.actions[1]?.prompt).toBe('genera el handoff del Servicio de Alta')
    expect(card(f, 'adrs', 'ADR-120')?.actions.map((a) => a.label)).toEqual(['Resumir', 'Qué falta para aceptarlo'])   // proposed
    expect(card(f, 'components', 'nope')).toBeNull()
  })

  test('scope: a container by its system\'s ownership; an integration internal, boundary or external', async () => {
    const f = (await loadFacts(io(JSON.stringify(LEDGER)), '/p')) as ExplorerFacts
    expect(rows(f, 'components', 'in').map((r) => r.id)).toEqual(['gw', 'alta'])
    expect(rows(f, 'components', 'out').map((r) => r.id)).toEqual(['core'])
    expect(f.integrations.map((i) => [i.id, i.scope])).toEqual([['I-27', 'internal'], ['I-11', 'boundary'], ['I-05', 'boundary'], ['I-03', 'external']])
    expect(rows(f, 'integrations', 'in').map((r) => r.id)).toEqual(['I-27', 'I-11', 'I-05'])   // touches the system
    expect(rows(f, 'integrations', 'out').map((r) => r.id)).toEqual(['I-03'])
    expect(rows(f, 'integrations', 'all').find((r) => r.id === 'I-05')?.sub).toBe('frontera · CDC')
    expect(inFilter(f, 'adrs', 'ADR-120', 'out')).toBe(true)   // ADRs and TDRs are not filtered
    expect(card(f, 'components', 'core')).toMatchObject({ badge: { glyph: '○', text: 'fuera de alcance' }, lines: [['Sistema', 'Externo'], ['Tipo', 'Database']] })
    expect(rows(f, 'integrations').map((r) => r.glyph)).toEqual(['⇄', '✕', '⇥', '⋯'])   // internal, retired, boundary, external
    expect(rows(f, 'adrs').map((r) => [r.glyph, r.tone])).toEqual([['◌', 'warning'], ['✕', undefined]])   // proposed, superseded
  })
})
