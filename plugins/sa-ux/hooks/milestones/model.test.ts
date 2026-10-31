// sa-ux · milestones — the cards between two readings of the project: none at the session's first reading, a release, the
// lenses re-run with their deltas, the handoff kit regenerated with the components whose payload moved.
import { describe, expect, test } from 'claude-code/testing'

import type { ProjectSnapshot } from '../../types'
import { changelogEntry, kitOf, milestones } from './model'

const BASE: ProjectSnapshot = { version: '1.4.0', status: 'Draft', tagged: false, lenses: { SPOF: { date: '2026-10-01', critical: 3, high: 2 } }, kit: null }
const CHANGELOG = '# Changelog\n\n## [Unreleased]\n\n## [1.5.0] - 2026-10-31\n\n### Added\n- Hub API: a **retry** budget.\n- `Order Desk`: cancel.\n\n## [1.4.0]\n- old\n'

describe('milestones', () => {
  test('the changelog entry of a version, plain', () => {
    expect(changelogEntry(CHANGELOG, '1.5.0')).toEqual(['Hub API: a retry budget.', 'Order Desk: cancel.'])
    expect(changelogEntry(CHANGELOG, '9.9.9')).toEqual([])
  })
  test('the first reading is the baseline: no card', () => {
    expect(milestones(null, BASE, 'en')).toEqual([])
    expect(milestones(BASE, BASE, 'en')).toEqual([])
  })
  test('a release: a card with the version, the tag when it is there, and the changelog entry', () => {
    const [c] = milestones(BASE, { ...BASE, version: '1.5.0', status: 'Released' }, 'en', CHANGELOG)
    expect(c!.id).toMatch(/^[A-Za-z0-9_-]{1,64}$/)   // a placed row's id, the host's rule
    expect(c).toMatchObject({ kind: 'release', mood: 'pleased', title: 'Released v1.5.0 · the tag comes after the merge', lines: ['Hub API: a retry budget.', 'Order Desk: cancel.'] })
    const tagged = milestones({ ...BASE, version: '1.5.0', status: 'Released' }, { ...BASE, version: '1.5.0', status: 'Released', tagged: true }, 'es', CHANGELOG)
    expect(tagged[0]!.title).toBe('Liberada v1.5.0 · tag architecture-v1.5.0')
  })
  test('analyses: each lens re-run with its deltas; more critical findings make her stern', () => {
    const [c] = milestones(BASE, { ...BASE, lenses: { SPOF: { date: '2026-10-31', critical: 5, high: 2 }, STRIDE: { date: '2026-10-31', critical: 0, high: 4 } } }, 'en')
    expect(c).toMatchObject({ kind: 'analysis', mood: 'stern', title: '2 analyses run', lines: ['SPOF: critical 3 → 5 · high 2', 'STRIDE: critical 0 · high 4 · first report'] })
    const [d] = milestones(BASE, { ...BASE, lenses: { SPOF: { date: '2026-10-31', critical: 1, high: 1 } } }, 'en')
    expect(d!.mood).toBe('pleased')
  })
  test('the handoff kit: the components whose payload moved, and a kit cut at another version', () => {
    const kit = kitOf({ run: { architecture_version: '1.4.0' }, cut_sheets: { 'hub-api': { payload_hash: 'a' }, 'order-desk': { payload_hash: 'b' } }, seams: { x: {} } })
    expect(kit).toEqual({ version: '1.4.0', hashes: { 'hub-api': 'a', 'order-desk': 'b' }, interfaces: 1 })
    const prev = { ...BASE, kit }
    const [c] = milestones(prev, { ...BASE, version: '1.5.0', kit: { ...kit!, version: '1.5.0', hashes: { 'hub-api': 'a', 'order-desk': 'c' } } }, 'en')
    expect(c).toMatchObject({ kind: 'kit', mood: 'pleased', lines: ['Changed: order-desk'] })
    const [s] = milestones(BASE, { ...BASE, version: '1.5.0', kit }, 'en')
    expect(s).toMatchObject({ mood: 'worried', lines: ['Changed: hub-api, order-desk', 'Cut at v1.4.0 — the architecture is at v1.5.0.'] })
  })
})
