import { describe, expect, test } from 'claude-code/testing'

import { failedStatus, readStatus, refreshes, releasePrompt, stateOf } from './model'

// the shape `lifecycle.js status --json` writes (a released architecture whose analyses predate the release)
const RELEASED = JSON.stringify({ state: 'released', version: '1.4.0', declared_status: 'Released', released: '2026-10-30', git: true,
  baseline: { kind: 'tag', ref: 'architecture-v1.4.0' }, tag: { name: 'architecture-v1.4.0', local: true, remote: true, origin: 'x' },
  changes: [], recommended: null, unreleased: [],
  downstream: [{ artifact: 'PO Spec', file: 'PRODUCT_OWNER_SPEC.md', version: '1.1.0', stale: true, command: 'update the PO spec' },
    { artifact: 'Handoff kit', file: 'handoffs/', version: '1.4.0', stale: false, command: 'generate dev handoff, then commit handoffs/ — an index publishes…' },
    { artifact: 'Analysis SPOF', file: 'analysis/SPOF.md', version: '1.3.0', stale: true, command: 'run architecture analysis' },
    { artifact: 'Analysis STRIDE', file: 'analysis/STRIDE.md', version: '1.3.0', stale: true, command: 'run architecture analysis' }],
  next: 'refresh the stale downstream artifacts listed' })

describe('status model', () => {
  test('reads the lifecycle status as the pane draws it', () => {
    const st = readStatus(RELEASED, 5)!
    expect(st).toMatchObject({ at: 5, state: 'released', version: '1.4.0', released: '2026-10-30', error: null })
    expect(st.tag).toEqual({ name: 'architecture-v1.4.0', local: true, remote: true })
    expect(st.downstream.filter((d) => d.stale).length).toBe(3)
    expect(readStatus('not json', 1)).toBeNull()
    expect(readStatus('[{"lens":"SPOF"}]', 1)).toBeNull()
  })

  test('one refresh per command — the analyses share one — and the command without its trailing advice', () => {
    expect(refreshes(readStatus(RELEASED, 0)!)).toEqual([
      { command: 'update the PO spec', artifacts: ['PO Spec'] },
      { command: 'run architecture analysis', artifacts: ['Analysis SPOF', 'Analysis STRIDE'] }])
  })

  test('what moves the release: a release for a draft or a change, the tag for an untagged one, nothing otherwise', () => {
    const at = (state: string) => releasePrompt({ ...failedStatus('', 0), error: null, state })
    expect(at('changed')).toBe('release my architecture')
    expect(at('draft')).toBe('release my architecture')
    expect(at('untagged')).toBe('recover architecture tag')
    expect(at('released')).toBeNull()
    expect(stateOf('changed', true)).toEqual({ label: 'con cambios desde su release', tone: 'high' })
    expect(stateOf('released', false).tone).toBe('ok')
    expect(stateOf('weird', false)).toEqual({ label: 'weird', tone: 'info' })
  })
})
