// sa-ux · Alia — her picture and her voice, pure: the codec SVG with the mood's ring,
// and her line chosen by the heaviest fact (critical, then stale, then high, then the next step, then all clear).
import { describe, expect, test } from 'claude-code/testing'

import type { Radar } from '../../types'
import { FACE, RING, codecSvg, type Mood } from './palette'
import { DONE, SPINNER, aliaSays, archHeader, pick } from './voice'

const MOODS: Mood[] = ['calm', 'pleased', 'thinking', 'worried', 'stern', 'talk']
const ARCH = { name: 'Order Desk', version: '1.4.0', status: 'Released' }
const radar = (lenses: { lens: string; critical: number; high: number; stale?: boolean }[], tdrs: Record<string, number> = {}): Radar => ({
  lang: 'en', findingsNote: null, tdrs, line: '',
  lenses: lenses.map((l) => ({ date: '2026-10-01', ageDays: 1, total: 10, stale: false, ...l })),
})

describe('Alia codec picture', () => {
  test('her face in a disc, the mood ring around it; talking adds the open mouth for a moment, then her mood holds', () => {
    const svg = codecSvg('QUJD', RING.stern)
    expect(svg).toContain('href="data:image/webp;base64,QUJD"')
    expect(svg).toContain(`stroke="${RING.stern}"`)
    expect(svg).not.toContain('<animate')
    const talk = codecSvg('QUJD', RING.calm, 'WFla')
    expect(talk).toContain('base64,WFla')
    expect(talk).toMatch(/repeatCount="5" fill="freeze"/)
    expect(talk.length).toBeLessThan(131072)
  })
  test('every mood has a face and a ring', () => {
    for (const m of MOODS) { expect(FACE[m]).toMatch(/^face-.+\.webp$/); expect(RING[m]).toMatch(/^#[0-9a-f]{6}$/) }
  })
})

describe('Alia voice', () => {
  test('the markers of ARCHITECTURE.md', () => {
    expect(archHeader('<!-- ARCHITECTURE_VERSION: 2.0.1 -->\n<!-- ARCHITECTURE_STATUS: Released -->\n# Order Desk <!-- x -->\n'))
      .toEqual({ name: 'Order Desk', version: '2.0.1', status: 'Released' })
    expect(archHeader('# Hub').status).toBe('Draft')
  })
  test('outside an architecture she says nothing', () => {
    expect(aliaSays({ lang: 'en', arch: null, radar: null, steps: [] })).toBeNull()
  })
  test('critical findings make her stern and name the heaviest lens', () => {
    const say = aliaSays({ lang: 'en', arch: ARCH, radar: radar([{ lens: 'STRIDE', critical: 1, high: 9 }, { lens: 'SPOF', critical: 3, high: 0 }]), steps: [] })
    expect(say?.mood).toBe('stern')
    expect(say?.line).toBe('4 critical findings stand — SPOF weighs most. I\'d start there.')
  })
  test('stale analyses worry her before high findings; the next step makes her think; all clear pleases her', () => {
    expect(aliaSays({ lang: 'es', arch: ARCH, radar: radar([{ lens: 'SPOF', critical: 0, high: 2, stale: true }]), steps: [] })?.mood).toBe('worried')
    expect(aliaSays({ lang: 'en', arch: ARCH, radar: radar([{ lens: 'SPOF', critical: 0, high: 2 }]), steps: [] })?.line).toContain('2 high — SPOF first')
    const step = { id: 'release', title: 'Release the architecture', detail: '', prompt: 'release my architecture', why: '' }
    expect(aliaSays({ lang: 'en', arch: ARCH, radar: radar([]), steps: [step] })).toMatchObject({ mood: 'thinking', line: 'v1.4.0 · next, I\'d release the architecture.' })
    expect(aliaSays({ lang: 'en', arch: ARCH, radar: radar([], { Open: 2 }), steps: [] })?.mood).toBe('calm')
    expect(aliaSays({ lang: 'en', arch: ARCH, radar: null, steps: [] })).toMatchObject({ mood: 'pleased', line: 'v1.4.0 released · all clear — the docs and the analyses agree.' })
  })
  test('a stable pick: the same engine word, the same word of hers', () => {
    expect(pick(SPINNER.en, 'Sauteing')).toBe(pick(SPINNER.en, 'Sauteing'))
    expect(SPINNER.en.length).toBe(SPINNER.es.length)
    expect(DONE).toContain(pick(DONE, 'Baked'))
  })
})
