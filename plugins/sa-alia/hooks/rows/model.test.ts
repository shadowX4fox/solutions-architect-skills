// sa-alia · readable rows — the suite's scripts recognized by file name in any of the paths a session runs them from, any
// other command left alone, and each script's verdict read from its own output: the summary line, warnings, findings.
import { describe, expect, test } from 'claude-code/testing'

import { label, recognize, summarize } from './model'

const REPO = '/home/u/solutions-architect-skills'
const CACHE = '/home/u/.claude/plugins/cache/shadowx4fox-solution-architect-marketplace/sa-skills/11.1.1'

describe('readable rows · recognize', () => {
  test('a suite script, from the checkout, the cache or a plugin directory variable', () => {
    expect(recognize(`bun ${REPO}/skills/architecture-docs/scripts/flow-check.js /p`)).toMatchObject({ en: 'Flow check', more: 0 })
    expect(recognize(`bun ${CACHE}/skills/architecture-lifecycle/scripts/lifecycle.js check /p --json`)).toMatchObject({ en: 'Release gates' })
    expect(recognize(`bun "[plugin_dir]/scripts/shared/explorer-cli.ts" manifest /p`)).toMatchObject({ en: 'Architecture manifest' })
    expect(recognize(`cd /p && bun ${CACHE}/plugins/sa-delivery/skills/architecture-dev-handoff/scripts/handoff-prepare.js /p`)).toMatchObject({ en: 'Payload: handoff' })
  })
  test('several scripts in one command: the first, and how many more', () => {
    const k = recognize(`bun ${REPO}/skills/architecture-docs/scripts/prose-check.js /p && bun ${REPO}/skills/architecture-docs/scripts/docs-stats.js /p`)!
    expect(label(k, 'es')).toBe('Revisión de prosa +1')
  })
  test('anything else is the engine\'s row', () => {
    expect(recognize('git status')).toBeNull()
    expect(recognize('bun test')).toBeNull()
    expect(recognize('bun /tmp/other/flow-check.js')).toBeNull()   // the file name alone, outside the suite
    expect(recognize(`node ${REPO}/skills/architecture-docs/scripts/flow-check.js`)).toBeNull()
  })
})

describe('readable rows · summarize', () => {
  test('the summary line the script prints, warnings counted', () => {
    const out = { stdout: 'Flow check — docs/04: 3 documented flow(s)\n  F-01 — Consultar (phases 1 → 2): ✓\n  ⚠ [participant-alias]: "X" read as `X`\nPASS\n', stderr: '' }
    expect(summarize(out, false, false)).toEqual({ state: 'warn', line: 'PASS', findings: [], warnings: 1 })
    expect(summarize({ stdout: '  P-BUDGET-01 WARNING PASS ok\n\nLAYER1: PASS — 0 blocking finding(s), 0 warning(s)\n', stderr: '' }, false, false).line).toBe('LAYER1: PASS — 0 blocking finding(s), 0 warning(s)')
    expect(summarize({ stdout: 'clean — 6 component file(s), index in sync\n', stderr: '' }, false, false)).toMatchObject({ state: 'ok', line: 'clean — 6 component file(s), index in sync' })
  })
  test('a failure: the exit status decides, the first findings stay in view', () => {
    const out = { stdout: 'tdr-check: 4 record(s) — 2 blocking, 0 warning(s)\n  ✗ TDR-003: status missing\n  ✗ TDR-004: index out of sync\n', stderr: '' }
    expect(summarize(out, true, false)).toEqual({ state: 'fail', line: 'tdr-check: 4 record(s) — 2 blocking, 0 warning(s)', findings: ['✗ TDR-003: status missing', '✗ TDR-004: index out of sync'], warnings: 0 })
    expect(summarize({ stdout: 'FAIL — 1 sequence missing\n', stderr: '' }, false, false).state).toBe('fail')
  })
  test('running, and JSON output (no line to quote)', () => {
    expect(summarize(undefined, false, true).state).toBe('running')
    expect(summarize({ stdout: '{"ok":true}', stderr: '' }, false, false)).toMatchObject({ state: 'ok', line: '' })
  })
})
