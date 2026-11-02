// The mods end to end, on each surface: a project in memory stands beneath the plugin (the test answers the engine's
// file, clock, state and process calls), the session starts, and each drawing is mounted through the engine — a tree the
// surface's element table refuses (a prop, a colour, a border it does not know) fails here, not in front of the architect.
import { describe, expect, test } from 'claude-code/testing'
import type { On } from 'claude-code'

import { bar, cut, pad } from './ui'

const NOW = Date.UTC(2026, 9, 1, 18), H = 3600 * 1000
const SURFACES = ['terminal', 'desktop'] as const
const BAND = { hasSurvey: false, isWorking: false, maxRows: 8, bodyColumns: 100, scroll: { offset: 0, bodyRows: 8 }, view: {} }
const PANE = { title: 'sa-alia', isFocused: true, bodyColumns: 80, placement: 'dock' as const, scroll: { offset: 0, bodyRows: 30 }, view: {} }
const LEDGER = { generated_at: '2026-10-01T18:00:00Z', architecture: { language: 'es' },
  systems: [{ slug: 'banca', name: 'Banca', owned: true }, { slug: 'core', name: 'Ledger Core', owned: false }],
  components: [{ level: 'L2', system: 'banca', slug: 'alta', name: 'Servicio de Alta', index: '5.10', type: 'API Service', technology: ['Spring Boot'], internal_name: 'omn-alta', component_version: '2.7.0', file: 'docs/components/s/10-alta.md', related_adrs: ['ADR-120'], description: 'Servicio de Alta — otorga canales.' },
    { level: 'L2', system: 'core', slug: 'core', name: 'Core', index: '1.1', type: 'Database', technology: [] }],
  integrations: [{ id: 'I-05', from: 'Core', to: 'Servicio de Alta', protocol: 'CDC', pattern: 'Evento', retired: false }],
  adrs: [{ id: 'ADR-120', title: 'Alta de replicación', status: 'Proposed', scope: 'Proyecto', file: 'adr/ADR-120.md' }],
  tdrs: [{ id: 'TDR-001', title: 'TDR-001: WSS sin JWE', status: 'Open', driver: 'Architecture', file: 'tdr/TDR-001.md' }] }
const FINDINGS = [{ lens: 'SPOF', date: '2026-09-20', file: 'SPOF-2026-09-20.md', total: 22, severity: { critical: 7, medium: 10 }, residual: {}, errors: 0 },
  { lens: 'STRIDE', date: '2026-09-27', file: 'STRIDE-2026-09-27.md', total: 57, severity: { high: 10 }, residual: {}, errors: 0 }]
const FILES: Record<string, { text: string; mtimeMs: number }> = {
  '/p/ARCHITECTURE.md': { text: '<!-- ARCHITECTURE_VERSION: 7.1.0 -->\n<!-- DOC_LANGUAGE: es -->\n<!-- PROSE_STYLE: v1 -->\n# Mesa', mtimeMs: NOW - 9 * H },
  '/p/docs/05-integration-points.md': { text: '#', mtimeMs: NOW - 1 * H },
  '/p/docs/CHANGELOG.md': { text: '# Changelog\n\n## [Unreleased]\n\n### Added\n- uno\n- dos\n', mtimeMs: NOW - 1 * H },
  '/p/.cache/sa-skills/facts.json': { text: JSON.stringify(LEDGER), mtimeMs: NOW - 1 * H },
  '/p/analysis/SPOF-2026-09-20.md': { text: '#', mtimeMs: NOW - 11 * 24 * H },
  '/p/analysis/STRIDE-2026-09-27.md': { text: '#', mtimeMs: NOW - 4 * 24 * H },
  '/p/compliance-docs/COMPLIANCE_MANIFEST.md': { text: '- Average Score: 6.6/10\n', mtimeMs: NOW - 9 * 24 * H },   // present on purpose: the radar must not show it
  '/p/.cache/sa-skills/judge/old.worksheet.md': { text: '### id-0\n', mtimeMs: NOW - 30 * 24 * H },   // abandoned: not a step
  '/sa/scripts/shared/findings.js': { text: '', mtimeMs: 0 },
  '/p/visualizations/architecture-command-center.html': { text: '<html>', mtimeMs: NOW - 2 * H },   // the video is not made yet
  '/p/.cache/sa-skills/analysis/analysis-chart.svg': { text: '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>', mtimeMs: NOW },
}
const STATUS = { state: 'changed', version: '7.1.0', declared_status: 'Released', released: '2026-10-01', git: true,
  tag: { name: 'architecture-v7.1.0', local: true, remote: false }, recommended: 'minor', unreleased: ['uno', 'dos'],
  changes: [{ section: 'containers', bump: 'minor', text: 'Servicio de Alta added' }, { section: 'text', bump: 'patch', text: 'docs/05 edited' }],
  downstream: [{ artifact: 'Analysis SPOF', file: 'analysis/SPOF-2026-09-20.md', version: '7.0.0', stale: true, command: 'run architecture analysis' },
    { artifact: 'Analysis STRIDE', file: 'analysis/STRIDE-2026-09-27.md', version: '7.0.0', stale: true, command: 'run architecture analysis' },
    { artifact: 'Handoff kit', file: 'handoffs/', version: '7.1.0', stale: false, command: 'generate dev handoff, then commit handoffs/' }],
  next: 'release my architecture — 2 change(s) since v7.1.0, recommended minor' }

/** The engine beneath the plugin: a project in memory, a clock, the session's state, the prompt box. */
function engine(on: On, opts: { env?: Record<string, string | undefined> } = {}) {
  const state = new Map<string, { value: unknown; version: number }>(); const box = { text: '', drawn: [] as { component: string; props: Record<string, unknown> }[], opened: [] as string[], placed: [] as string[], notified: [] as string[], launched: [] as string[][], ledgerBuilt: 0 }
  const dir = (p: string) => Object.keys(FILES).some((k) => k.startsWith(p + '/'))
  on('session.start', (_$, e) => ({ cwd: e.cwd }))
  on('turn.complete', () => ({ text: '' }) as never)
  const store = new Map<string, unknown>([['trend:/p', { SPOF: [{ date: '2026-08-01', critical: 9, high: 2 }, { date: '2026-09-01', critical: 8, high: 1 }] }]])
  on('store.get', (_$, e) => ({ value: store.get(e.key) }))
  on('store.set', (_$, e) => { store.set(e.key, e.value); return { value: undefined } })
  on('ui.notify', (_$, e) => { box.notified.push(e.text); return { value: { isSent: true, channel: 'terminal' } } as never })
  on('session.root', () => ({ value: '/p' }))
  on('clock.now', () => ({ value: NOW }))
  on('env.get', (_$, e) => ({ value: opts.env ? opts.env[e.name] : e.name === 'SA_SKILLS_DIR' ? '/sa' : undefined }))
  on('fs.exists', (_$, e) => ({ value: !!FILES[e.path] || dir(e.path) }))
  on('fs.read', (_$, e) => { if (/\/assets\/alia\/(face-[a-z-]+\.webp|escudo\.png)$/.test(e.path)) return { value: { base64: 'UklGRg==' } } as never
    const f = FILES[e.path]; if (!f) throw new Error(`ENOENT ${e.path}`); return { value: f.text } })
  on('fs.stat', (_$, e) => { const f = FILES[e.path]; if (!f && !dir(e.path)) throw new Error(`ENOENT ${e.path}`); return { value: { kind: f ? 'file' : 'dir', size: f ? f.text.length : 0, mtimeMs: f ? f.mtimeMs : 0, isLink: false } } })
  on('fs.list', (_$, e) => { if (!dir(e.path)) throw new Error(`ENOENT ${e.path}`); const kids = new Map<string, { name: string; kind: 'file' | 'dir'; size: number; mtimeMs: number; isLink: boolean }>()
    for (const [k, f] of Object.entries(FILES)) { if (!k.startsWith(e.path + '/')) continue; const rest = k.slice(e.path.length + 1); const name = rest.split('/')[0] ?? rest
      kids.set(name, rest.includes('/') ? { name, kind: 'dir', size: 0, mtimeMs: 0, isLink: false } : { name, kind: 'file', size: f.text.length, mtimeMs: f.mtimeMs, isLink: false }) }
    return { value: [...kids.values()] } })
  on('process.run', (_$, e) => {
    const cmd = e.argv[0] ?? ''
    if (['xdg-open', 'open', 'cmd'].includes(cmd)) box.launched.push([...e.argv])
    // arch-facts.js writes the ledger the way the real one does: into the project's cache
    if (/arch-facts\.js$/.test(e.argv[1] || '')) { FILES['/p/.cache/sa-skills/facts.json'] = { text: JSON.stringify(LEDGER), mtimeMs: NOW }; box.ledgerBuilt++ }
    const out = cmd === 'git' || ['xdg-open', 'open', 'cmd'].includes(cmd) ? '' : cmd === 'uname' ? 'Linux\n'
      : /lifecycle\.js$/.test(e.argv[1] || '') ? JSON.stringify(STATUS) : JSON.stringify(FINDINGS)
    return { value: { exitCode: 0, stdout: out, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } } })
  on('command.register', (_$, e) => ({ value: { command: e.name } }))
  on('state.get', (_$, e) => { const s = state.get(`${e.plugin}/${e.key}`); return { value: (s ? { isSet: true, value: s.value, version: s.version } : { isSet: false, version: 0 }) as never } })   // the store is untyped here: one Map for every key
  on('state.set', (_$, e) => { const k = `${e.plugin}/${e.key}`; const version = (state.get(k)?.version ?? 0) + 1; state.set(k, { value: e.value, version }); return { value: { isSet: true, version } } })
  on('prompt.suggest', () => ({ isShown: true }))
  on('prompt.fill', (_$, e) => { box.text = e.text; return { isFilled: true, text: e.text, cursor: e.text.length } })
  on('ui.status', () => ({ value: undefined }))
  on('ui.open', (_$, e) => { box.opened.push(e.id); return { value: { isPlaced: true } } })
  on('ui.place', (_$, e) => { box.placed.push(e.id); return { value: { isPlaced: true, requestId: e.id } } })
  on('ui.render', (_$, e) => { box.drawn.push({ component: e.component, props: e.props as never }); return (e.component === 'AskUserQuestion' || e.component === 'AssistantMessage' ? { type: 'engine', ref: 0 } : { type: 'Text', props: {}, children: [''] }) as never })
  on('classic.UserPromptSubmit', () => ({}) as never)   // the engine's own drawing: nothing
  return box
}

describe('sa-alia helpers', () => {
  test('meters and cuts', () => {
    expect(bar(5, 10, 10)).toEqual({ on: '█████', off: '░░░░░' })
    expect(bar(0.2, 100, 10).on).toBe('█')      // a non-zero value always shows
    expect(bar(0, 10, 4)).toEqual({ on: '', off: '░░░░' })
    expect(cut('abcdefgh', 5)).toBe('abcd…'); expect(pad('ab', 4)).toBe('ab  ')
  })
})

describe('sa-alia, end to end on every surface', () => {
  for (const surface of SURFACES) {
    test(`${surface}: session start → the next-steps band; a click fills the prompt`, async ($, on) => {
      const box = engine(on)
      await $.session.start({ cwd: '/p', surface, isInteractive: true })
      const ui = await $.ui.mount({ plugin: 'sa-alia', surface, component: 'AbovePrompt', props: BAND })
      expect((await ui.find({ key: 'step-release' }))?.text).toContain('Liberar la arquitectura')
      expect(await ui.find({ type: 'Text', text: /2 cambio\(s\) en \[Unreleased\] desde v7\.1\.0/ })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: /^Alia$|✦ Alia/ })).toBeDefined()
      // the band carries her blazon, never her face: the escudo on the desktop, the bare sparkle in the terminal
      if (surface === 'terminal') { expect(await ui.find({ type: 'Text', text: '✦' })).toBeDefined(); expect(await ui.find({ type: 'Svg' })).toBeUndefined() }
      else { const mark = await ui.find({ type: 'Svg' }); expect(mark).toBeDefined(); expect(JSON.stringify(mark)).toContain('image/png'); expect(JSON.stringify(mark)).not.toContain('image/webp') }
      expect(await ui.find({ type: 'Text', text: /Hay 7 hallazgos críticos — SPOF pesa más/ })).toBeDefined()   // stern: SPOF holds 7 critical
      await ui.press({ key: 'step-release' })
      expect(box.text).toBe('release my architecture')
      await ui.unmount()
    })

    test(`${surface}: /alia arch → the list with its scope filter, then a card with its badge and lists`, async ($, on) => {
      const box = engine(on)
      await $.session.start({ cwd: '/p', surface, isInteractive: true })
      await $.command.run({ command: 'alia', args: 'arch', origin: { kind: 'composer' }, presentation: { isFullscreen: true, columns: 160 } })
      const arch = { plugin: 'sa-alia', surface, component: 'Pane', requestId: 'sa-alia-arch', props: PANE } as const
      const list = await $.ui.mount(arch)
      expect(await list.find({ key: 'scope' })).toBeDefined()
      expect(await list.find({ type: 'Text', text: /2 contenedores — 1 fuera de la arquitectura/ })).toBeDefined()   // her line heads the pane
      expect(await list.find({ type: 'Text', text: /en alcance 1/ })).toBeDefined()
      await list.press({ key: 'pick-alta' })
      await list.unmount()
      // the state beneath this test notifies no one: the pane is drawn again, as a state write makes the engine do
      const card = await $.ui.mount(arch)
      expect(await card.find({ type: 'Text', text: /● en alcance/ })).toBeDefined()
      expect(await card.find({ type: 'Text', text: /I-05/ })).toBeDefined()
      expect(await card.find({ type: 'Text', text: /1 entrante, 0 salientes — gobernado por ADR-120/ })).toBeDefined()
      if (surface === 'desktop') expect(await card.find({ type: 'Svg' })).toBeDefined()   // her map of its neighbourhood
      await card.press({ key: 'act-1' })
      expect(box.text).toBe('genera el handoff del Servicio de Alta')
      await card.unmount()
    })

    test(`${surface}: everything of hers is under /alia — radar and arch answer as her subcommands, an unknown one names them`, async ($, on) => {
      engine(on)
      await $.session.start({ cwd: '/p', surface, isInteractive: true })
      const run = (args: string) => $.command.run({ command: 'alia', args, origin: { kind: 'composer' }, presentation: { isFullscreen: true, columns: 160 } }) as Promise<{ text?: string }>
      expect((await run('radar')).text).not.toMatch(/Alia:/)
      expect((await run('arch')).text).toMatch(/Panel de arquitectura abierto/)
      expect((await run('explorar')).text).toMatch(/Panel de arquitectura abierto/)
      expect((await run('nada')).text).toMatch(/\/alia status · radar · trend · coverage · arch · center · video/)
    })

    test(`${surface}: findings the radar could not read show as unknown, never zero`, async ($, on) => {
      engine(on, { env: {} })   // no SA_SKILLS_DIR, no home: sa-skills is not found
      await $.session.start({ cwd: '/p', surface, isInteractive: true })
      const ui = await $.ui.mount({ plugin: 'sa-alia', surface, component: 'Pane', requestId: 'sa-alia-radar', props: PANE })
      expect(await ui.find({ type: 'Text', text: /sa-skills not found/ })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: '—' })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: /todo en orden/ })).toBeUndefined()
      await ui.unmount()
    })

    test(`${surface}: /radar → tiles, a meter per lens, the stale lens offered for a rerun`, async ($, on) => {
      const box = engine(on)
      await $.session.start({ cwd: '/p', surface, isInteractive: true })
      const ui = await $.ui.mount({ plugin: 'sa-alia', surface, component: 'Pane', requestId: 'sa-alia-radar', props: PANE })
      expect(await ui.find({ type: 'Text', text: /críticos/ })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: /6\.6\/10/ })).toBeUndefined()   // compliance is isolated: the manifest is on disk and never read (0.4.0)
      expect(await ui.find({ type: 'Text', text: /radar de riesgo/ })).toBeDefined()   // her codec heads the pane
      expect(await ui.find({ type: surface === 'terminal' ? 'Text' : 'Svg', ...(surface === 'terminal' ? { text: '✦' } : {}) })).toBeDefined()
      await ui.press({ key: 'rerun-SPOF' })
      expect(box.text).toBe('run spof analysis')
      expect(await ui.find({ key: 'rerun-STRIDE' })).toBeUndefined()   // four days old: not stale
      // the trend is its own pane (1.5.0): here no chart, one line of arrows that opens it
      expect(await ui.find({ type: 'Text', text: /spof ▼/ })).toBeDefined()   // 9 → 8 → today's 7 critical
      await ui.press({ key: 'open-trend' })
      expect(box.opened).toContain('sa-alia-trend')
      await ui.unmount()
    })

    test(`${surface}: /alia cobertura → the report read now: its share, its gaps, out of date when the documents moved after it`, async ($, on) => {
      const report = '# Coverage\n\n**PO Spec**: PRODUCT_OWNER_SPEC.md (v1.4)\n**Architecture Version**: 7.0.0\n**Date**: 2026-10-30\n\n## Summary <!-- SECTION: Summary -->\n\n| Metric | Count | % |\n|---|---|---|\n| Total Requirements | 10 | — |\n| ✅ Covered | 7 | 70% |\n| ⚠️ Partial | 2 | 20% |\n| ❌ Not Covered | 1 | 10% |\n\n## Gap Report <!-- SECTION: Gap Report -->\n\n### ❌ Not Covered\n\n| UC | Requirement | Source | Suggested Section |\n|---|---|---|---|\n| 3 | El cajero imprime el comprobante. | Primary Flow | docs/04 |\n'
      FILES['/p/PRODUCT_OWNER_SPEC.md'] = { text: '# Spec', mtimeMs: NOW - 20 * H }
      FILES['/p/TRACEABILITY_REPORT.md'] = { text: report, mtimeMs: NOW - 10 * H }   // older than docs/05 and of 7.0.0 against today's 7.1.0
      try {
        const box = engine(on)
        await $.session.start({ cwd: '/p', surface, isInteractive: true })
        const r = await $.command.run({ command: 'alia', args: 'cobertura', origin: { kind: 'composer' }, presentation: { isFullscreen: true, columns: 160 } }) as { text?: string }
        expect(r.text).toBe('70% cubierto · 2 parciales · 1 sin cubrir — desactualizado')
        expect(box.opened).toContain('sa-alia-coverage')
        const ui = await $.ui.mount({ plugin: 'sa-alia', surface, component: 'Pane', requestId: 'sa-alia-coverage', props: PANE })
        expect(await ui.find({ type: 'Text', text: /Desactualizado: es de la arquitectura v7\.0\.0, hoy v7\.1\.0 · los docs cambiaron después/ })).toBeDefined()
        expect(await ui.find({ type: 'Text', text: '70%' })).toBeDefined()
        expect(await ui.find({ type: 'Text', text: /✗ UC 3 · El cajero imprime el comprobante\./ })).toBeDefined()
        await ui.press({ key: 'cov-recheck' })
        expect(box.text).toBe('check requirements coverage')
        await ui.unmount()
      } finally { delete FILES['/p/PRODUCT_OWNER_SPEC.md']; delete FILES['/p/TRACEABILITY_REPORT.md'] }
    })

    test(`${surface}: /alia cobertura without a PO Spec explains; without a report offers to make it`, async ($, on) => {
      const box = engine(on)
      await $.session.start({ cwd: '/p', surface, isInteractive: true })
      const run = () => $.command.run({ command: 'alia', args: 'coverage', origin: { kind: 'composer' }, presentation: { isFullscreen: true, columns: 160 } }) as Promise<{ text?: string }>
      expect((await run()).text).toMatch(/Sin PRODUCT_OWNER_SPEC\.md/)
      FILES['/p/PRODUCT_OWNER_SPEC.md'] = { text: '# Spec', mtimeMs: NOW - 20 * H }
      try {
        expect((await run()).text).toMatch(/Aún no hay TRACEABILITY_REPORT\.md/)
        const ui = await $.ui.mount({ plugin: 'sa-alia', surface, component: 'Pane', requestId: 'sa-alia-coverage', props: PANE })
        await ui.press({ key: 'cov-recheck' })
        expect(box.text).toBe('check requirements coverage')
        await ui.unmount()
      } finally { delete FILES['/p/PRODUCT_OWNER_SPEC.md'] }
    })

    test(`${surface}: /alia trend → each lens over its readings, the change since the last; a chart where the surface draws pictures`, async ($, on) => {
      const box = engine(on)
      await $.session.start({ cwd: '/p', surface, isInteractive: true })
      const r = await $.command.run({ command: 'alia', args: 'tendencia', origin: { kind: 'composer' }, presentation: { isFullscreen: true, columns: 160 } }) as { text?: string }
      expect(r.text).toMatch(/Tendencia de riesgo: 1 lente con más de una lectura/)
      expect(box.opened).toContain('sa-alia-trend')
      const ui = await $.ui.mount({ plugin: 'sa-alia', surface, component: 'Pane', requestId: 'sa-alia-trend', props: PANE })
      expect(await ui.find({ type: 'Text', text: /tendencia de riesgo/ })).toBeDefined()   // her codec heads it
      expect(await ui.find({ type: 'Text', text: /▼ -1 críticos/ })).toBeDefined()
      const chart = await ui.find({ type: 'Svg', props: { alt: 'tendencia de SPOF' } } as never)
      if (surface === 'terminal') { expect(chart).toBeUndefined(); expect(await ui.find({ type: 'Text', text: /08-01 9\/2/ })).toBeDefined() }
      else expect(chart).toBeDefined()
      await ui.unmount()
    })

    test(`${surface}: /alia → her codec over the architecture, every view a draft or a pane`, async ($, on) => {
      const box = engine(on)
      await $.session.start({ cwd: '/p', surface, isInteractive: true })
      const r = await $.command.run({ command: 'alia', args: '', origin: { kind: 'composer' }, presentation: { isFullscreen: true, columns: 160 } })
      expect(JSON.stringify(r)).toContain('Alia: Hay 7 hallazgos')
      const ui = await $.ui.mount({ plugin: 'sa-alia', surface, component: 'Pane', requestId: 'sa-alia-alia', props: PANE })
      expect(await ui.find({ type: 'Text', text: /^Mesa$|Mesa/ })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: /v7\.1\.0/ })).toBeDefined()
      if (surface === 'desktop') expect(await ui.find({ type: 'Svg' })).toBeDefined()   // her face, talking, on the desktop
      else { expect(await ui.find({ type: 'Svg' })).toBeUndefined(); expect(await ui.find({ type: 'Text', text: '✦' })).toBeDefined() }   // the terminal: her ringed sparkle, no picture
      await ui.press({ key: 'v-video' })
      expect(box.text).toBe('architecture video')   // not made yet: the prompt that makes it
      await ui.press({ key: 'v-radar' })
      expect(box.opened).toContain('sa-alia-radar')
      await ui.press({ key: 'v-arch' })
      expect(box.opened).toContain('sa-alia-arch')
      await ui.press({ key: 'v-status' })
      expect(box.opened).toContain('sa-alia-status')
      await ui.press({ key: 'v-center' })
      expect(box.launched.at(-1)).toEqual(['xdg-open', '/p/visualizations/architecture-command-center.html'])   // made: opened as it is
      await ui.unmount()
    })

    test(`${surface}: /alia status → the state, the tag, the changes, the stale artifacts; each button a draft`, async ($, on) => {
      const box = engine(on)
      await $.session.start({ cwd: '/p', surface, isInteractive: true })
      const r = await $.command.run({ command: 'alia', args: 'status', origin: { kind: 'composer' }, presentation: { isFullscreen: true, columns: 160 } }) as { text?: string }
      expect(r.text).toMatch(/v7\.1\.0 · con cambios desde su release/)
      expect(box.opened).toContain('sa-alia-status')
      const ui = await $.ui.mount({ plugin: 'sa-alia', surface, component: 'Pane', requestId: 'sa-alia-status', props: PANE })
      expect(await ui.find({ type: 'Text', text: /cómo va el release/ })).toBeDefined()   // her codec heads the pane
      expect(await ui.find({ type: 'Text', text: /2 cambios desde el tag · recomendado minor/ })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: /architecture-v7\.1\.0 ✓ local ✕ remoto/ })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: /Servicio de Alta added/ })).toBeDefined()
      await ui.press({ key: 'st-release' })
      expect(box.text).toBe('release my architecture')
      await ui.press({ key: 'st-fix-0' })   // the two stale analyses share one command: one button
      expect(box.text).toBe('run architecture analysis')
      expect(await ui.find({ key: 'st-fix-1' })).toBeUndefined()
      await ui.unmount()
    })

    test(`${surface}: /alia center opens what exists, /alia video fills what is still to make; nothing is sent`, async ($, on) => {
      const box = engine(on)
      await $.session.start({ cwd: '/p', surface, isInteractive: true })
      const run = (args: string) => $.command.run({ command: 'alia', args, origin: { kind: 'composer' }, presentation: { isFullscreen: true, columns: 160 } }) as Promise<{ text?: string }>
      expect((await run('center')).text).toMatch(/Abierto: visualizations\/architecture-command-center\.html/)
      expect(box.launched).toEqual([['xdg-open', '/p/visualizations/architecture-command-center.html']])
      expect((await run('video')).text).toMatch(/Aún no existe visualizations\/architecture-video\.mp4/)
      expect(box.text).toBe('architecture video')
      expect(box.launched.length).toBe(1)
    })

    test(`${surface}: the analyses' chart becomes a card in the transcript — the app's own drawing on the desktop, the file named in the terminal`, async ($, on) => {
      const box = engine(on)
      // the engine's Bash beneath the plugin: the script printed where its picture is
      on('tool.call', { tool: 'Bash' }, () => ({ result: { stdout: '/p/.cache/sa-skills/analysis/analysis-chart.png\n', stderr: '', interrupted: false } }) as never)
      await $.session.start({ cwd: '/p', surface, isInteractive: true })
      await $.tool.call({ tool: 'Bash', command: 'bun /x/solutions-architect-skills/plugins/sa-analysis/skills/architecture-analysis/scripts/analysis-chart.js /p --lens spof' } as never)
      const id = box.placed.find((x) => x.startsWith('chart-'))
      expect(id).toBeDefined()
      const ui = await $.ui.mount({ plugin: 'sa-alia', surface, component: 'Placed', props: { plugin: 'sa-alia', id: id! } } as never)
      expect(await ui.find({ type: 'Text', text: 'Gráfica del análisis' })).toBeDefined()
      const pic = await ui.find({ type: 'Svg', props: { alt: 'Gráfica de los análisis de la arquitectura' } } as never)
      if (surface === 'terminal') { expect(pic).toBeUndefined(); expect(await ui.find({ type: 'Text', text: /analysis-chart\.png$/ })).toBeDefined() }
      else expect(pic).toBeDefined()
      await ui.unmount()
    })

    test(`${surface}: any other command places no chart`, async ($, on) => {
      const box = engine(on)
      on('tool.call', { tool: 'Bash' }, () => ({ result: { stdout: 'done\n', stderr: '', interrupted: false } }) as never)
      await $.session.start({ cwd: '/p', surface, isInteractive: true })
      await $.tool.call({ tool: 'Bash', command: 'ls -la' } as never)
      expect(box.placed.some((x) => x.startsWith('chart-'))).toBe(false)
    })

    test(`${surface}: a suite script's row reads as what it said; its raw result folds; any other command is the engine's`, async ($, on) => {
      const box = engine(on)
      await $.session.start({ cwd: '/p', surface, isInteractive: true })
      const row = { tool_use_id: 't1', tool: 'Bash', input: { command: 'bun /x/solutions-architect-skills/skills/architecture-docs/scripts/flow-check.js /p' },
        isRunning: false, isErrored: false, isInterrupted: false, output: { stdout: 'F-01 ✓\n  ⚠ alias\nPASS\n', stderr: '' } }
      const ui = await $.ui.mount({ plugin: 'sa-alia', surface, component: 'ToolUse', props: row })
      expect(await ui.find({ type: 'Text', text: 'Revisión de flujos' })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: 'PASS' })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: /1 aviso/ })).toBeDefined()
      await ui.unmount()
      const result = await $.ui.mount({ plugin: 'sa-alia', surface, component: 'ToolResult', props: { tool_use_id: 't1', tool: 'Bash', output: row.output, isErrored: false } })
      expect(await result.find({ type: 'Text' })).toBeUndefined()   // folded under the readable row
      await result.unmount()
      const before = box.drawn.length
      const other = await $.ui.mount({ plugin: 'sa-alia', surface, component: 'ToolUse', props: { ...row, tool_use_id: 't2', input: { command: 'git status' } } })
      expect(box.drawn.slice(before).some((d) => d.component === 'ToolUse')).toBe(true)   // passed to the engine
      await other.unmount()
    })

    test(`${surface}: /alia's line in the transcript is her codec`, async ($, on) => {
      engine(on)
      await $.session.start({ cwd: '/p', surface, isInteractive: true })
      const ui = await $.ui.mount({ plugin: 'sa-alia', surface, component: 'CommandOutput', props: { command: 'alia', args: '', text: '✦ Alia: …', isErrored: false } })
      expect(await ui.find({ type: 'Text', text: 'Alia' })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: /Hay 7 hallazgos críticos/ })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: /Mesa · v7\.1\.0 · Draft/ })).toBeDefined()
      await ui.unmount()
    })

    test(`${surface}: a long turn that moved the project notifies what it moved; a short one never`, async ($, on) => {
      const box = engine(on)
      await $.session.start({ cwd: '/p', surface, isInteractive: true })
      await $.turn.complete({ answer: '', durationMs: 10 * 60000, isAborted: false, turnId: 't0', reason: 'answer' } as never)
      expect(box.notified).toEqual(['Hay 7 hallazgos críticos — SPOF pesa más. Empezaría ahí.'])   // nothing moved: her line
      const was = { ...FILES['/p/ARCHITECTURE.md']! }
      FILES['/p/ARCHITECTURE.md'] = { ...was, text: was.text.replace('7.1.0', '7.2.0').replace('-->', '-->\n<!-- ARCHITECTURE_STATUS: Released -->') }
      try {
        await $.turn.complete({ answer: '', durationMs: 30000, isAborted: false, turnId: 't1', reason: 'answer' } as never)
        expect(box.notified.length).toBe(1)   // half a minute: no notification, the card alone
        FILES['/p/ARCHITECTURE.md'] = { ...was, text: was.text.replace('7.1.0', '7.3.0').replace('-->', '-->\n<!-- ARCHITECTURE_STATUS: Released -->') }
        await $.turn.complete({ answer: '', durationMs: 4 * 60000, isAborted: false, turnId: 't2', reason: 'answer' } as never)
        expect(box.notified[1]).toBe('Liberada v7.3.0 · el tag llega tras el merge')
      } finally { FILES['/p/ARCHITECTURE.md'] = was }
    })

    test(`${surface}: a fresh clone has no ledger — she builds it at session start, and the explorer is full from the first look`, async ($, on) => {
      const kept = FILES['/p/.cache/sa-skills/facts.json']
      delete FILES['/p/.cache/sa-skills/facts.json']
      try {
        const box = engine(on)
        await $.session.start({ cwd: '/p', surface, isInteractive: true })
        expect(box.ledgerBuilt).toBe(1)
        const r = await $.command.run({ command: 'alia', args: 'arch', origin: { kind: 'composer' }, presentation: { isFullscreen: true, columns: 160 } }) as { text?: string }
        expect(r.text).toMatch(/Panel de arquitectura abierto/)
        expect(box.ledgerBuilt).toBe(1)   // fresh now: not rebuilt
      } finally { FILES['/p/.cache/sa-skills/facts.json'] = kept! }
    })

    test(`${surface}: a ledger older than the documents is rebuilt; one as new is left alone`, async ($, on) => {
      const kept = FILES['/p/.cache/sa-skills/facts.json']!
      FILES['/p/.cache/sa-skills/facts.json'] = { ...kept, mtimeMs: NOW - 5 * H }   // the docs moved after it
      try {
        const box = engine(on)
        await $.session.start({ cwd: '/p', surface, isInteractive: true })
        expect(box.ledgerBuilt).toBe(1)
      } finally { FILES['/p/.cache/sa-skills/facts.json'] = kept }
    })

    test(`${surface}: inside an architecture her hub opens on its own at session start, docked beside the chat`, async ($, on) => {
      const box = engine(on)
      await $.session.start({ cwd: '/p', surface, isInteractive: true })
      expect(box.opened).toContain('sa-alia-alia')
    })

    test(`${surface}: openHub off leaves the hub closed`, { options: { openHub: false } }, async ($, on) => {
      const box = engine(on)
      await $.session.start({ cwd: '/p', surface, isInteractive: true })
      expect(box.opened).not.toContain('sa-alia-alia')
    })

    test(`${surface}: notifyAfterMinutes 0 never notifies`, { options: { notifyAfterMinutes: 0 } }, async ($, on) => {
      const box = engine(on)
      await $.session.start({ cwd: '/p', surface, isInteractive: true })
      await $.turn.complete({ answer: '', durationMs: 60 * 60000, isAborted: false, turnId: 't0', reason: 'answer' } as never)
      expect(box.notified).toEqual([])
    })

    test(`${surface}: a write to the architecture that would ask the person asks in Alia's dialog; the answer is the verdict`, async ($, on) => {
      const box = engine(on)
      let verdict: 'ask' | 'allow' = 'ask', answer = 'Aplicar', asked: unknown[] = []
      on('tool.check', (_$, e) => ({ decision: e.tool === 'AskUserQuestion' ? 'allow' : verdict }))   // the engine's own verdict for the mode and rules; her question itself is allowed, as in a session
      const drawn: unknown[] = []
      on('tool.call', { tool: 'AskUserQuestion' }, async (_$, e) => {
        asked.push(e)
        const qs = (e as unknown as { questions: { question: string }[] }).questions
        // her dialog, drawn while the question is open: it must fit the surface's rows, or the engine drops it
        const ui = await $.ui.mount({ plugin: 'sa-alia', surface, component: 'AskUserQuestion', props: { tool: 'AskUserQuestion', questions: qs } as never })
        drawn.push(await ui.find({ type: 'Text', text: /docs\/05-integration-points\.md/ })); await ui.unmount()
        return { result: { questions: [], answers: { [qs[0]!.question]: answer } } } as never
      })
      await $.session.start({ cwd: '/p', surface, isInteractive: true })
      await $.classic.UserPromptSubmit({ prompt: 'x', permission_mode: 'default' } as never)
      const edit = { tool: 'Edit', tool_use_id: 'u1', approver: 'person', input: { file_path: '/p/docs/05-integration-points.md',
        old_string: '| I-07 | Servicio de Alta | Servicio de Correo | SMTP | Asíncrono |\n| I-08 | Servicio de Alta | Auditoría | Kafka | Evento |',
        new_string: '| I-07 | Servicio de Alta | Servicio de Correo | HTTPS/REST | Petición-respuesta |\n| I-08 | Servicio de Alta | Auditoría | Kafka | Evento |\n| I-09 | Servicio de Alta | Notificaciones | HTTPS/REST | Petición-respuesta |\n| I-10 | A | B | C | D |\n| I-11 | A | B | C | D |' } } as const
      expect((await $.tool.check(edit as never)).decision).toBe('allow')
      expect(JSON.stringify(asked[0])).toContain('¿Aplicar este cambio a docs/05-integration-points.md?')
      expect(drawn[0]).toBeDefined()   // her codec drew around the dialog, within the rows
      answer = 'No aplicar'
      const no = await $.tool.check({ ...edit, tool_use_id: 'u2' } as never)
      expect(no.decision).toBe('deny')
      expect(no.reason).toContain('eligió no aplicar este cambio a docs/05-integration-points.md')
      // where the engine would not ask the person, she never asks
      const n = asked.length
      verdict = 'allow'; expect((await $.tool.check({ ...edit, tool_use_id: 'u3' } as never)).decision).toBe('allow')
      verdict = 'ask'
      expect((await $.tool.check({ ...edit, tool_use_id: 'u4', input: { ...edit.input, file_path: '/p/src/app.ts' } } as never)).decision).toBe('ask')   // not the architecture
      expect((await $.tool.check({ ...edit, tool_use_id: 'u5', agentId: 'a1' } as never)).decision).toBe('ask')   // a subagent's loop
      expect((await $.tool.check({ ...edit, tool_use_id: 'u6', approver: 'host' } as never)).decision).toBe('ask')   // a host answers
      await $.classic.UserPromptSubmit({ prompt: 'x', permission_mode: 'auto' } as never)
      expect((await $.tool.check({ ...edit, tool_use_id: 'u7' } as never)).decision).toBe('ask')   // auto mode: the classifier's
      expect(asked.length).toBe(n)
      void box
    })

    test(`${surface}: a large write still fits her dialog in the surface's rows`, async ($, on) => {
      engine(on)
      let fits: unknown
      on('tool.check', (_$, e) => ({ decision: e.tool === 'AskUserQuestion' ? 'allow' : 'ask' }))
      on('tool.call', { tool: 'AskUserQuestion' }, async (_$, e) => {
        const qs = (e as unknown as { questions: { question: string }[] }).questions
        const ui = await $.ui.mount({ plugin: 'sa-alia', surface, component: 'AskUserQuestion', props: { tool: 'AskUserQuestion', questions: qs } as never })
        fits = await ui.find({ type: 'Text', text: /ARCHITECTURE\.md/ }); await ui.unmount()
        return { result: { questions: [], answers: { [qs[0]!.question]: 'Aplicar' } } } as never
      })
      await $.session.start({ cwd: '/p', surface, isInteractive: true })
      await $.classic.UserPromptSubmit({ prompt: 'x', permission_mode: 'default' } as never)
      const content = Array.from({ length: 40 }, (_, i) => `| una fila nueva bastante larga de la tabla número ${i} con más texto | x |`).join('\n')
      expect((await $.tool.check({ tool: 'Write', tool_use_id: 'w1', approver: 'person', input: { file_path: '/p/ARCHITECTURE.md', content } } as never)).decision).toBe('allow')
      expect(fits).toBeDefined()   // drawn: within the 12 rows on the terminal, the 48 elsewhere
    })

    test(`${surface}: before the mode is known she never asks`, async ($, on) => {
      engine(on)
      let asked = 0
      on('tool.check', (_$, e) => ({ decision: e.tool === 'AskUserQuestion' ? 'allow' : 'ask' }))
      on('tool.call', { tool: 'AskUserQuestion' }, () => { asked++; return { result: { questions: [], answers: {} } } as never })
      await $.session.start({ cwd: '/p', surface, isInteractive: true })
      expect((await $.tool.check({ tool: 'Write', input: { file_path: '/p/ARCHITECTURE.md', content: '#' }, tool_use_id: 'u1', approver: 'person' } as never)).decision).toBe('ask')
      expect(asked).toBe(0)
    })

    test(`${surface}: the skills' questions get her codec on top of the engine's dialog`, async ($, on) => {
      engine(on)
      await $.session.start({ cwd: '/p', surface, isInteractive: true })
      const ui = await $.ui.mount({ plugin: 'sa-alia', surface, component: 'AskUserQuestion', props: { tool: 'AskUserQuestion', questions: [{ question: '¿Aplico los 3 cambios?', header: 'Cambios', options: [], multiSelect: false }] } })
      expect(await ui.find({ type: 'Text', text: /Nada cambia sin tu sí/ })).toBeDefined()
      await ui.unmount()
    })

    test(`${surface}: every reply in her codec — the mark and name on its first block, the rest and summaries plain`, async ($, on) => {
      const box = engine(on)
      await $.session.start({ cwd: '/p', surface, isInteractive: true })
      const first = await $.ui.mount({ plugin: 'sa-alia', surface, component: 'AssistantMessage', props: { text: 'Ya revisé las ramas.', isFirstOfReply: true } })
      expect(await first.find({ type: 'Text', text: 'Alia' })).toBeDefined()
      expect(await first.find({ type: surface === 'terminal' ? 'Text' : 'Svg', ...(surface === 'terminal' ? { text: '✦' } : {}) })).toBeDefined()
      expect(JSON.stringify(await first.drawn())).toMatch(/^\{"type":"Box","props":\{"flexDirection":"row","gap":1,"alignItems":"flex-start","alignSelf":"flex-start"/)   // her face at the reply's start, never centred; the row held to the start
      await first.unmount()
      const n0 = box.drawn.filter((d) => d.component === 'AssistantMessage').length
      const later = await $.ui.mount({ plugin: 'sa-alia', surface, component: 'AssistantMessage', props: { text: 'Y algo más.', isFirstOfReply: false } })
      expect(await later.find({ type: 'Text', text: 'Alia' })).toBeUndefined()
      expect(box.drawn.filter((d) => d.component === 'AssistantMessage').length).toBe(n0 + 1)   // a later block is the engine's own (1.0.3)
      await later.unmount()
      const n = box.drawn.filter((d) => d.component === 'AssistantMessage').length
      const summary = await $.ui.mount({ plugin: 'sa-alia', surface, component: 'AssistantMessage', props: { text: 'resumen', isFirstOfReply: true, isSummary: true } })
      expect(await summary.find({ type: 'Text', text: 'Alia' })).toBeUndefined()
      await summary.unmount()
      expect(box.drawn.filter((d) => d.component === 'AssistantMessage').length).toBe(n + 1)   // passed to the engine
    })

    test(`${surface}: a sub-agent's message under a helper of hers — the role's face and label, the engine's row beneath; the person's prompt untouched`, async ($, on) => {
      const box = engine(on)
      await $.session.start({ cwd: '/p', surface, isInteractive: true })
      const judge = await $.ui.mount({ plugin: 'sa-alia', surface, component: 'UserMessage', props: { text: 'La hoja resolve-name está respondida.', origin: { kind: 'unclassified' }, isExpanded: false, from: { name: 'sa-skills:reviewers:worksheet-judge' } } })
      expect(await judge.find({ type: 'Text', text: 'Alia' })).toBeDefined()
      expect(JSON.stringify(await judge.drawn())).toMatch(/worksheet-judge/)
      expect(JSON.stringify(await judge.drawn())).toMatch(surface === 'terminal' ? /✦/ : /Alia, (judge|juez)/)   // her small face, or the sparkle in the terminal
      await judge.unmount()
      const writer = await $.ui.mount({ plugin: 'sa-alia', surface, component: 'UserMessage', props: { text: 'Segmento escrito.', origin: { kind: 'unclassified' }, isExpanded: true, from: { name: 'segment-runner' } } })
      expect(JSON.stringify(await writer.drawn())).toMatch(/writer|redactora/)
      await writer.unmount()
      const n = box.drawn.filter((d) => d.component === 'UserMessage').length
      const prompt = await $.ui.mount({ plugin: 'sa-alia', surface, component: 'UserMessage', props: { text: 'hola', origin: { kind: 'composer' }, isExpanded: false } })
      expect(await prompt.find({ type: 'Text', text: 'Alia' })).toBeUndefined()
      expect(box.drawn.filter((d) => d.component === 'UserMessage').length).toBe(n + 1)   // passed to the engine
      await prompt.unmount()
    })

    test(`${surface}: replyCodec off leaves replies as they are`, { options: { replyCodec: false } }, async ($, on) => {
      engine(on)
      await $.session.start({ cwd: '/p', surface, isInteractive: true })
      const ui = await $.ui.mount({ plugin: 'sa-alia', surface, component: 'AssistantMessage', props: { text: 'hola', isFirstOfReply: true } })
      expect(await ui.find({ type: 'Text', text: 'Alia' })).toBeUndefined()
      await ui.unmount()
    })

    test(`${surface}: the footer carries the architecture's version and status`, async ($, on) => {
      const box = engine(on)
      await $.session.start({ cwd: '/p', surface, isInteractive: true })
      const ui = await $.ui.mount({ plugin: 'sa-alia', surface, component: 'SessionMode', props: { modes: ['focus'] } })
      expect(box.drawn.filter((d) => d.component === 'SessionMode').pop()?.props.modes).toEqual(['focus', '✦ v7.1.0 Draft'])
      await ui.unmount()
    })

    test(`${surface}: a turn that releases the architecture places her card in the transcript`, async ($, on) => {
      const box = engine(on)
      await $.session.start({ cwd: '/p', surface, isInteractive: true })
      expect(box.placed).toEqual([])   // the session's first reading is the baseline
      const was = { ...FILES['/p/ARCHITECTURE.md']! }, log = { ...FILES['/p/docs/CHANGELOG.md']! }
      FILES['/p/ARCHITECTURE.md'] = { ...was, text: was.text.replace('7.1.0', '7.2.0').replace('-->', '-->\n<!-- ARCHITECTURE_STATUS: Released -->') }
      FILES['/p/docs/CHANGELOG.md'] = { ...log, text: log.text + '\n## [7.2.0] - 2026-10-01\n\n### Added\n- tres\n' }
      try {
        await $.turn.complete({ answer: '', durationMs: 1, isAborted: false, turnId: 't1', reason: 'answer' } as never)
        expect(box.placed).toEqual(['release-7_2_0-doc'])
        const card = await $.ui.mount({ plugin: 'sa-alia', surface, component: 'Placed', props: { id: 'release-7_2_0-doc', plugin: 'sa-alia' } })
        expect(await card.find({ type: 'Text', text: 'Liberada v7.2.0 · el tag llega tras el merge' })).toBeDefined()
        expect(await card.find({ type: 'Text', text: /tres/ })).toBeDefined()
        await card.unmount()
      } finally { FILES['/p/ARCHITECTURE.md'] = was; FILES['/p/docs/CHANGELOG.md'] = log }
    })

    test(`${surface}: inside an architecture the spinner speaks hers`, async ($, on) => {
      const box = engine(on)
      await $.session.start({ cwd: '/p', surface, isInteractive: true })
      const ui = await $.ui.mount({ plugin: 'sa-alia', surface, component: 'Spinner', props: { word: 'Sauteing', message: null, suffix: '…', mode: 'thinking' } })
      const drawn = box.drawn.filter((d) => d.component === 'Spinner').pop()
      expect(drawn?.props.word).not.toBe('Sauteing')
      expect(String(drawn?.props.word)).toMatch(/^[A-Z][a-zé]+ /)
      await ui.unmount()
    })
  }
})
