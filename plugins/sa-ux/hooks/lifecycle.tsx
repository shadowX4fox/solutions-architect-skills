// sa-ux — the session's lifecycle, once for every mod: a plugin hooks session.start and turn.complete once, so this file
// registers the commands and refreshes what each mod draws. The logic is the mods' own (pure modules); what needs `$`
// lives here, at the top of the file, where the engine follows it.
import { atom, read, update } from 'claude-code'
import type { EngineInterface, On } from 'claude-code'

import type { AliaLine, Milestone, ProjectSnapshot, Radar, Step } from '../types'

import { kitOf, milestones } from './milestones/model'

import { aliaSays, archHeader } from './alia/voice'
import { GLYPH } from './ui'

import { fingerprint, newestMd, nextSteps, type Io } from './next-steps/rules'
import { buildRadar, type FindingsRow } from './radar/model'

const aliaAtom = atom({ plugin: 'sa-ux', key: 'alia' } as const, null as AliaLine | null)
const snapshotAtom = atom({ plugin: 'sa-ux', key: 'snapshot' } as const, null as ProjectSnapshot | null)
const milestonesAtom = atom({ plugin: 'sa-ux', key: 'milestones' } as const, [] as Milestone[])
const dismissedAtom = atom({ plugin: 'sa-ux', key: 'nextStepsDismissed' } as const, '')
const langAtom = atom({ plugin: 'sa-ux', key: 'lang' } as const, 'en' as 'en' | 'es')
const radarAtom = atom({ plugin: 'sa-ux', key: 'radar' } as const, null as Radar | null)
const radarKeyAtom = atom({ plugin: 'sa-ux', key: 'radarKey' } as const, '')
const stepsAtom = atom({ plugin: 'sa-ux', key: 'nextSteps' } as const, [] as Step[])

const MARKETPLACE_ROOT_SCRIPT = '.claude/plugins/marketplaces/shadowx4fox-solution-architect-marketplace/scripts/plugin-root.ts'

/** next-steps: recompute the steps from the project's state; the first is the prompt box's dim suggestion. */
async function refreshNextSteps($: EngineInterface) {
  const io: Io = { exists: (p) => $.fs.exists(p), read: (p) => $.fs.read(p), list: (p) => $.fs.list(p), stat: (p) => $.fs.stat(p) }
  const root = await $.session.root()
  const { lang, steps } = await nextSteps(io, root, await $.clock.now())
  await update($, stepsAtom, () => steps)
  await update($, langAtom, () => lang)
  const first = steps[0]
  if (first && (await read($, dismissedAtom)) !== fingerprint(steps)) void $.prompt.suggest({ text: first.prompt })
}

/** Where sa-skills is: SA_SKILLS_DIR, the checkout this plugin was loaded from, else the marketplace's own resolver. */
async function saSkillsDir($: EngineInterface): Promise<string | null> {
  const has = async (d: string) => $.fs.exists(`${d}/scripts/shared/findings.js`)
  const env = await $.env.get('SA_SKILLS_DIR')
  if (env && (await has(env))) return env
  try {
    const real = (await $.fs.stat($.plugin.root, { resolve: true })).realPath
    const repo = real ? real.replace(/\/plugins\/sa-ux\/?$/, '') : ''
    if (repo && repo !== real && (await has(repo))) return repo
  } catch { /* not a checkout */ }
  const home = await $.env.get('HOME')
  if (!home) return null
  try {
    const r = await $.process.run(['bun', `${home}/${MARKETPLACE_ROOT_SCRIPT}`])
    const dir = r.exitCode === 0 ? r.stdout.trim().split('\n').pop() || '' : ''
    return dir && (await has(dir)) ? dir : null
  } catch { return null }
}

/** radar: re-read the risk when its inputs changed — analysis reports and the ledger. */
async function refreshRadar($: EngineInterface) {
  const root = await $.session.root()
  let arch = ''
  try { arch = await $.fs.read(`${root}/ARCHITECTURE.md`) } catch { arch = '' }
  if (!arch) { await update($, radarAtom, () => null); $.ui.status(undefined); return }
  const mtime = async (p: string) => { try { return (await $.fs.stat(p)).mtimeMs } catch { return 0 } }
  const analysis = `${root}/analysis`, facts = `${root}/.cache/sa-skills/facts.json`
  let reports: { name: string; mtimeMs: number }[] = []
  try { reports = (await $.fs.list(analysis)).filter((x) => x.kind === 'file') } catch { reports = [] }
  const io: Io = { exists: (p) => $.fs.exists(p), read: (p) => $.fs.read(p), list: (p) => $.fs.list(p), stat: (p) => $.fs.stat(p) }
  const docs = await newestMd(io, `${root}/docs`)
  const key = [reports.length, Math.max(0, ...reports.map((x) => x.mtimeMs)), await mtime(facts), docs].join(':')
  if (key === (await read($, radarKeyAtom)) && (await read($, radarAtom))) { const r = await read($, radarAtom); if (r) $.ui.status(`${GLYPH.brand} ${r.line}`); return }

  const lang: 'en' | 'es' = /<!--\s*(?:DOC_)?LANGUAGE:\s*es\b/i.test(arch) ? 'es' : 'en'
  let findings: FindingsRow[] | null = null, findingsNote: string | null = null
  if (reports.length) {
    const sa = await saSkillsDir($)
    if (!sa) findingsNote = 'sa-skills not found (set SA_SKILLS_DIR) — findings not counted'
    else {
      try {
        const r = await $.process.run(['bun', `${sa}/scripts/shared/findings.js`, analysis, '--json'], { timeoutMs: 20000 })
        if (r.exitCode === 0) findings = JSON.parse(r.stdout) as FindingsRow[]
        else findingsNote = 'sa-skills older than 8.116.0 (no findings CLI) — findings not counted'
      } catch { findingsNote = 'findings parser failed — findings not counted' }
    }
  }
  let tdrs: { status: string }[] = []
  try { const f = JSON.parse(await $.fs.read(facts)); tdrs = Array.isArray(f.tdrs) ? f.tdrs.map((d: { status?: unknown }) => ({ status: String(d.status || '') })) : [] } catch { tdrs = [] }
  const radar = buildRadar({ lang, findings, findingsNote, tdrs, docsNewest: docs, now: await $.clock.now() })
  await update($, radarAtom, () => radar)
  await update($, radarKeyAtom, () => key)
  $.ui.status(`${GLYPH.brand} ${radar.line}`)
}

/** alia: her line from what the other mods just read — after them, so it speaks of the same state. */
async function refreshAlia($: EngineInterface) {
  const root = await $.session.root()
  let text = ''
  try { text = await $.fs.read(`${root}/ARCHITECTURE.md`) } catch { text = '' }
  const say = aliaSays({ lang: await read($, langAtom), arch: text ? archHeader(text) : null, radar: await read($, radarAtom), steps: await read($, stepsAtom) })
  const was = await read($, aliaAtom)
  if (JSON.stringify(was) !== JSON.stringify(say)) await update($, aliaAtom, () => say)
}

/** milestones: read the project as the skills left it, compare with the last reading, place a card for each move. */
async function refreshMilestones($: EngineInterface) {
  const root = await $.session.root()
  let text = ''
  try { text = await $.fs.read(`${root}/ARCHITECTURE.md`) } catch { text = '' }
  if (!text) return
  const { version, status } = archHeader(text)
  let tagged = false
  if (version) try {
    const r = await $.process.run(['git', '-C', root, 'tag', '-l', `architecture-v${version}`], { timeoutMs: 5000 })
    tagged = r.exitCode === 0 && r.stdout.trim() !== ''
  } catch { tagged = false }
  const radar = await read($, radarAtom)
  const lenses: ProjectSnapshot['lenses'] = {}
  for (const l of radar ? radar.lenses : []) lenses[l.lens] = { date: l.date, critical: l.critical, high: l.high }
  let kit: ProjectSnapshot['kit'] = null
  try { kit = kitOf(JSON.parse(await $.fs.read(`${root}/handoffs/.manifest.json`))) } catch { kit = null }
  const next: ProjectSnapshot = { version, status, tagged, lenses, kit }
  const prev = await read($, snapshotAtom)
  if (JSON.stringify(prev) === JSON.stringify(next)) return
  let changelog = ''
  try { changelog = await $.fs.read(`${root}/docs/CHANGELOG.md`) } catch { changelog = '' }
  const cards = milestones(prev, next, await read($, langAtom), changelog)
  await update($, snapshotAtom, () => next)
  if (!cards.length) return
  const placed = await read($, milestonesAtom)
  const fresh = cards.filter((c) => !placed.some((p) => p.id === c.id))
  if (!fresh.length) return
  await update($, milestonesAtom, (xs) => [...xs, ...fresh].slice(-40))
  for (const c of fresh) try { await $.ui.place({ id: c.id }) } catch { /* a build without placed rows: the cards stay unshown */ }
}

/** The lifecycle hooks of every mod: commands at session start, refreshes at session start and after each turn. */
export function registerLifecycle(on: On) {
  on('session.start', async ($, e, next) => {
    const r = await next(e)
    await $.command.register({ name: 'arch', description: 'Browse the architecture: containers, integrations, ADRs and TDRs (sa-ux)' })
    await $.command.register({ name: 'radar', description: "The architecture's risk: findings by lens and open debt (sa-ux)" })
    await $.command.register({ name: 'alia', description: 'Alia: where the architecture stands, in one line, and the way to every view (sa-ux)' })
    await refreshNextSteps($)
    await refreshRadar($)
    await refreshAlia($)
    await refreshMilestones($)
    return r
  })

  on('turn.complete', async ($, e, next) => {
    const r = await next(e)
    await refreshNextSteps($)
    await refreshRadar($)
    await refreshAlia($)
    await refreshMilestones($)
    return r
  })
}
