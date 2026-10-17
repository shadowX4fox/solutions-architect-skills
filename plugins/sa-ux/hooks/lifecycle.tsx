// sa-ux — the session's lifecycle, once for every mod: a plugin hooks session.start and turn.complete once, so this file
// registers the commands and refreshes what each mod draws. The logic is the mods' own (pure modules); what needs `$`
// lives here, at the top of the file, where the engine follows it.
import { atom, read, update } from 'claude-code'
import type { EngineInterface, On } from 'claude-code'

import type { Radar, Step } from '../types'

import { fingerprint, newestMd, nextSteps, type Io } from './next-steps/rules'
import { buildRadar, type FindingsRow } from './radar/model'

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
  if (key === (await read($, radarKeyAtom)) && (await read($, radarAtom))) { const r = await read($, radarAtom); if (r) $.ui.status(r.line); return }

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
  $.ui.status(radar.line)
}

/** The lifecycle hooks of every mod: commands at session start, refreshes at session start and after each turn. */
export function registerLifecycle(on: On) {
  on('session.start', async ($, e, next) => {
    const r = await next(e)
    await $.command.register({ name: 'arch', description: 'Browse the architecture: containers, integrations, ADRs and TDRs (sa-ux)' })
    await $.command.register({ name: 'radar', description: "The architecture's risk: findings by lens and open debt (sa-ux)" })
    await refreshNextSteps($)
    await refreshRadar($)
    return r
  })

  on('turn.complete', async ($, e, next) => {
    const r = await next(e)
    await refreshNextSteps($)
    await refreshRadar($)
    return r
  })
}
