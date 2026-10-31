// The mods end to end, on each surface: a project in memory stands beneath the plugin (the test answers the engine's
// file, clock, state and process calls), the session starts, and each drawing is mounted through the engine — a tree the
// surface's element table refuses (a prop, a colour, a border it does not know) fails here, not in front of the architect.
import { describe, expect, test } from 'claude-code/testing'
import type { On } from 'claude-code'

import { bar, cut, pad } from './ui'

const NOW = Date.UTC(2026, 9, 1, 18), H = 3600 * 1000
const SURFACES = ['terminal', 'desktop'] as const
const BAND = { hasSurvey: false, isWorking: false, maxRows: 8, bodyColumns: 100, scroll: { offset: 0, bodyRows: 8 }, view: {} }
const PANE = { title: 'sa-ux', isFocused: true, bodyColumns: 80, placement: 'dock' as const, scroll: { offset: 0, bodyRows: 30 }, view: {} }
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
}

/** The engine beneath the plugin: a project in memory, a clock, the session's state, the prompt box. */
function engine(on: On) {
  const state = new Map<string, { value: unknown; version: number }>(); const box = { text: '', drawn: [] as { component: string; props: Record<string, unknown> }[], opened: [] as string[], placed: [] as string[] }
  const dir = (p: string) => Object.keys(FILES).some((k) => k.startsWith(p + '/'))
  on('session.start', (_$, e) => ({ cwd: e.cwd }))
  on('turn.complete', () => ({ text: '' }) as never)
  on('session.root', () => ({ value: '/p' }))
  on('clock.now', () => ({ value: NOW }))
  on('env.get', (_$, e) => ({ value: e.name === 'SA_SKILLS_DIR' ? '/sa' : undefined }))
  on('fs.exists', (_$, e) => ({ value: !!FILES[e.path] || dir(e.path) }))
  on('fs.read', (_$, e) => { if (/\/assets\/alia\/face-[a-z-]+\.webp$/.test(e.path)) return { value: { base64: 'UklGRg==' } } as never
    const f = FILES[e.path]; if (!f) throw new Error(`ENOENT ${e.path}`); return { value: f.text } })
  on('fs.stat', (_$, e) => { const f = FILES[e.path]; if (!f && !dir(e.path)) throw new Error(`ENOENT ${e.path}`); return { value: { kind: f ? 'file' : 'dir', size: f ? f.text.length : 0, mtimeMs: f ? f.mtimeMs : 0, isLink: false } } })
  on('fs.list', (_$, e) => { if (!dir(e.path)) throw new Error(`ENOENT ${e.path}`); const kids = new Map<string, { name: string; kind: 'file' | 'dir'; size: number; mtimeMs: number; isLink: boolean }>()
    for (const [k, f] of Object.entries(FILES)) { if (!k.startsWith(e.path + '/')) continue; const rest = k.slice(e.path.length + 1); const name = rest.split('/')[0] ?? rest
      kids.set(name, rest.includes('/') ? { name, kind: 'dir', size: 0, mtimeMs: 0, isLink: false } : { name, kind: 'file', size: f.text.length, mtimeMs: f.mtimeMs, isLink: false }) }
    return { value: [...kids.values()] } })
  on('process.run', (_$, e) => ({ value: { exitCode: 0, stdout: e.argv[0] === 'git' ? '' : JSON.stringify(FINDINGS), stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }))
  on('command.register', (_$, e) => ({ value: { command: e.name } }))
  on('state.get', (_$, e) => { const s = state.get(`${e.plugin}/${e.key}`); return { value: (s ? { isSet: true, value: s.value, version: s.version } : { isSet: false, version: 0 }) as never } })   // the store is untyped here: one Map for every key
  on('state.set', (_$, e) => { const k = `${e.plugin}/${e.key}`; const version = (state.get(k)?.version ?? 0) + 1; state.set(k, { value: e.value, version }); return { value: { isSet: true, version } } })
  on('prompt.suggest', () => ({ isShown: true }))
  on('prompt.fill', (_$, e) => { box.text = e.text; return { isFilled: true, text: e.text, cursor: e.text.length } })
  on('ui.status', () => ({ value: undefined }))
  on('ui.open', (_$, e) => { box.opened.push(e.id); return { value: { isPlaced: true } } })
  on('ui.place', (_$, e) => { box.placed.push(e.id); return { value: { isPlaced: true, requestId: e.id } } })
  on('ui.render', (_$, e) => { box.drawn.push({ component: e.component, props: e.props as never }); return { type: 'Text', props: {}, children: [''] } as never })   // the engine's own drawing: nothing
  return box
}

describe('sa-ux helpers', () => {
  test('meters and cuts', () => {
    expect(bar(5, 10, 10)).toEqual({ on: '█████', off: '░░░░░' })
    expect(bar(0.2, 100, 10).on).toBe('█')      // a non-zero value always shows
    expect(bar(0, 10, 4)).toEqual({ on: '', off: '░░░░' })
    expect(cut('abcdefgh', 5)).toBe('abcd…'); expect(pad('ab', 4)).toBe('ab  ')
  })
})

describe('sa-ux, end to end on every surface', () => {
  for (const surface of SURFACES) {
    test(`${surface}: session start → the next-steps band; a click fills the prompt`, async ($, on) => {
      const box = engine(on)
      await $.session.start({ cwd: '/p', surface, isInteractive: true })
      const ui = await $.ui.mount({ plugin: 'sa-ux', surface, component: 'AbovePrompt', props: BAND })
      expect((await ui.find({ key: 'step-release' }))?.text).toContain('Liberar la arquitectura')
      expect(await ui.find({ type: 'Text', text: /2 cambio\(s\) en \[Unreleased\] desde v7\.1\.0/ })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: /^Alia$|✦ Alia/ })).toBeDefined()
      if (surface === 'terminal') { expect(await ui.find({ type: 'Text', text: '✦' })).toBeDefined(); expect(await ui.find({ type: 'Svg' })).toBeUndefined() }
      else expect(await ui.find({ type: 'Svg' })).toBeDefined()   // her face on the desktop; her ringed sparkle in the terminal
      expect(await ui.find({ type: 'Text', text: /Hay 7 hallazgos críticos — SPOF pesa más/ })).toBeDefined()   // stern: SPOF holds 7 critical
      await ui.press({ key: 'step-release' })
      expect(box.text).toBe('release my architecture')
      await ui.unmount()
    })

    test(`${surface}: /arch → the list with its scope filter, then a card with its badge and lists`, async ($, on) => {
      const box = engine(on)
      await $.session.start({ cwd: '/p', surface, isInteractive: true })
      await $.command.run({ command: 'arch', args: '', origin: { kind: 'composer' }, presentation: { isFullscreen: true, columns: 160 } })
      const arch = { plugin: 'sa-ux', surface, component: 'Pane', requestId: 'sa-ux-arch', props: PANE } as const
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
      if (surface === 'desktop') expect(await card.find({ type: 'Svg', props: { isInteractive: true } } as never)).toBeDefined()   // her map of its neighbourhood
      await card.press({ key: 'act-1' })
      expect(box.text).toBe('genera el handoff del Servicio de Alta')
      await card.unmount()
    })

    test(`${surface}: /radar → tiles, a meter per lens, the stale lens offered for a rerun`, async ($, on) => {
      const box = engine(on)
      await $.session.start({ cwd: '/p', surface, isInteractive: true })
      const ui = await $.ui.mount({ plugin: 'sa-ux', surface, component: 'Pane', requestId: 'sa-ux-radar', props: PANE })
      expect(await ui.find({ type: 'Text', text: /críticos/ })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: /6\.6\/10/ })).toBeUndefined()   // compliance is isolated: the manifest is on disk and never read (0.4.0)
      expect(await ui.find({ type: 'Text', text: /radar de riesgo/ })).toBeDefined()   // her codec heads the pane
      expect(await ui.find({ type: surface === 'terminal' ? 'Text' : 'Svg', ...(surface === 'terminal' ? { text: '✦' } : {}) })).toBeDefined()
      await ui.press({ key: 'rerun-SPOF' })
      expect(box.text).toBe('run spof analysis')
      expect(await ui.find({ key: 'rerun-STRIDE' })).toBeUndefined()   // four days old: not stale
      await ui.unmount()
    })

    test(`${surface}: /alia → her codec over the architecture, every view a draft or a pane`, async ($, on) => {
      const box = engine(on)
      await $.session.start({ cwd: '/p', surface, isInteractive: true })
      const r = await $.command.run({ command: 'alia', args: '', origin: { kind: 'composer' }, presentation: { isFullscreen: true, columns: 160 } })
      expect(JSON.stringify(r)).toContain('Alia: Hay 7 hallazgos')
      const ui = await $.ui.mount({ plugin: 'sa-ux', surface, component: 'Pane', requestId: 'sa-ux-alia', props: PANE })
      expect(await ui.find({ type: 'Text', text: /^Mesa$|Mesa/ })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: /v7\.1\.0/ })).toBeDefined()
      if (surface === 'desktop') expect(await ui.find({ type: 'Svg' })).toBeDefined()   // her face, talking, on the desktop
      else { expect(await ui.find({ type: 'Svg' })).toBeUndefined(); expect(await ui.find({ type: 'Text', text: '✦' })).toBeDefined() }   // the terminal: her ringed sparkle, no picture
      await ui.press({ key: 'v-video' })
      expect(box.text).toBe('architecture video')
      await ui.press({ key: 'v-radar' })
      expect(box.opened).toContain('sa-ux-radar')
      await ui.unmount()
    })

    test(`${surface}: a suite script's row reads as what it said; its raw result folds; any other command is the engine's`, async ($, on) => {
      const box = engine(on)
      await $.session.start({ cwd: '/p', surface, isInteractive: true })
      const row = { tool_use_id: 't1', tool: 'Bash', input: { command: 'bun /x/solutions-architect-skills/skills/architecture-docs/scripts/flow-check.js /p' },
        isRunning: false, isErrored: false, isInterrupted: false, output: { stdout: 'F-01 ✓\n  ⚠ alias\nPASS\n', stderr: '' } }
      const ui = await $.ui.mount({ plugin: 'sa-ux', surface, component: 'ToolUse', props: row })
      expect(await ui.find({ type: 'Text', text: 'Revisión de flujos' })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: 'PASS' })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: /1 aviso/ })).toBeDefined()
      await ui.unmount()
      const result = await $.ui.mount({ plugin: 'sa-ux', surface, component: 'ToolResult', props: { tool_use_id: 't1', tool: 'Bash', output: row.output, isErrored: false } })
      expect(await result.find({ type: 'Text' })).toBeUndefined()   // folded under the readable row
      await result.unmount()
      const before = box.drawn.length
      const other = await $.ui.mount({ plugin: 'sa-ux', surface, component: 'ToolUse', props: { ...row, tool_use_id: 't2', input: { command: 'git status' } } })
      expect(box.drawn.slice(before).some((d) => d.component === 'ToolUse')).toBe(true)   // passed to the engine
      await other.unmount()
    })

    test(`${surface}: the footer carries the architecture's version and status`, async ($, on) => {
      const box = engine(on)
      await $.session.start({ cwd: '/p', surface, isInteractive: true })
      const ui = await $.ui.mount({ plugin: 'sa-ux', surface, component: 'SessionMode', props: { modes: ['focus'] } })
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
        const card = await $.ui.mount({ plugin: 'sa-ux', surface, component: 'Placed', props: { id: 'release-7_2_0-doc', plugin: 'sa-ux' } })
        expect(await card.find({ type: 'Text', text: 'Liberada v7.2.0 · el tag llega tras el merge' })).toBeDefined()
        expect(await card.find({ type: 'Text', text: /tres/ })).toBeDefined()
        await card.unmount()
      } finally { FILES['/p/ARCHITECTURE.md'] = was; FILES['/p/docs/CHANGELOG.md'] = log }
    })

    test(`${surface}: inside an architecture the spinner speaks hers`, async ($, on) => {
      const box = engine(on)
      await $.session.start({ cwd: '/p', surface, isInteractive: true })
      const ui = await $.ui.mount({ plugin: 'sa-ux', surface, component: 'Spinner', props: { word: 'Sauteing', message: null, suffix: '…', mode: 'thinking' } })
      const drawn = box.drawn.filter((d) => d.component === 'Spinner').pop()
      expect(drawn?.props.word).not.toBe('Sauteing')
      expect(String(drawn?.props.word)).toMatch(/^[A-Z][a-zé]+ /)
      await ui.unmount()
    })
  }
})
