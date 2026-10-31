// The next steps of an sa-skills architecture, computed by code from what the plugin's scripts leave on disk — never
// proposed by a model. Each rule reads one state and offers one prompt; the first three that hold are shown, most
// urgent first. A rule whose file is absent or unreadable holds nothing: the project simply has not reached that state.
import type { Step } from '../../types'

/** The part of `$.fs` the rules read, so a test can hand them a fake project. */
export type Io = {
  exists: (path: string) => Promise<boolean>
  read: (path: string) => Promise<string>
  list: (path: string) => Promise<{ name: string; kind: 'file' | 'dir' | 'other'; mtimeMs: number }[]>
  stat: (path: string) => Promise<{ kind: 'file' | 'dir' | 'other'; mtimeMs: number }>
}
type Lang = 'en' | 'es'

const WEEK = 7 * 24 * 3600 * 1000
const MAX = 3
const day = (ms: number) => new Date(ms).toISOString().slice(0, 10)
const safe = async <T>(f: () => Promise<T>, d: T): Promise<T> => { try { return await f() } catch { return d } }
const json = async (io: Io, p: string): Promise<any> => safe(async () => JSON.parse(await io.read(p)), null)
const t = (lang: Lang, en: string, es: string) => (lang === 'es' ? es : en)

/** The newest modification under a directory (Markdown only), a few levels down. */
export async function newestMd(io: Io, dir: string, depth = 4): Promise<number> {
  if (depth < 0) return 0
  const entries = await safe(() => io.list(dir), [])
  let max = 0
  for (const e of entries) {
    if (e.kind === 'dir') max = Math.max(max, await newestMd(io, `${dir}/${e.name}`, depth - 1))
    else if (e.kind === 'file' && e.name.endsWith('.md') && !/^CHANGELOG/.test(e.name)) max = Math.max(max, e.mtimeMs)
  }
  return max
}

export async function nextSteps(io: Io, root: string, now: number): Promise<{ lang: Lang; steps: Step[] }> {
  const arch = await safe(() => io.read(`${root}/ARCHITECTURE.md`), '')
  if (!arch) return { lang: 'en', steps: [] }
  const lang: Lang = /<!--\s*(?:DOC_)?LANGUAGE:\s*es\b/i.test(arch) ? 'es' : 'en'
  const docsNewest = Math.max(await newestMd(io, `${root}/docs`), await safe(async () => (await io.stat(`${root}/ARCHITECTURE.md`)).mtimeMs, 0))
  const steps: Step[] = []

  // 1 — judge worksheets waiting for answers (written in the last week; an older one was abandoned)
  const judgeDir = `${root}/.cache/sa-skills/judge`
  const judge = await safe(() => io.list(judgeDir), [])
  const pending = judge.filter((w) => w.name.endsWith('.worksheet.md') && now - w.mtimeMs < WEEK).filter((w) => {
    const a = judge.find((x) => x.name === w.name.replace(/\.worksheet\.md$/, '.answers.json'))
    return !a || a.mtimeMs < w.mtimeMs
  })
  if (pending.length) {
    const ids = pending.map((w) => w.name.replace(/\.worksheet\.md$/, ''))
    let items = 0
    for (const w of pending) items += ((await safe(() => io.read(`${judgeDir}/${w.name}`), '')).match(/^### /gm) || []).length
    steps.push({ id: 'judge', why: `${ids.length} worksheet(s) without answers newer than themselves`,
      title: t(lang, 'Answer the judge worksheets', 'Responder las hojas del juez'),
      detail: t(lang, `${ids.length} pending · ${items} items · ${ids.join(', ')}`, `${ids.length} pendiente(s) · ${items} ítems · ${ids.join(', ')}`),
      prompt: t(lang, `answer the pending judge worksheets in .cache/sa-skills/judge/ (${ids.join(', ')}) and re-run the checks that wrote them`, `responde las hojas del juez pendientes en .cache/sa-skills/judge/ (${ids.join(', ')}) y vuelve a correr los checks que las escribieron`) })
  }

  // 2 — a Component Specification older than its component descriptor
  const manifest = await json(io, `${root}/handoffs/.manifest.json`)
  const facts = await json(io, `${root}/.cache/sa-skills/facts.json`)
  if (manifest && manifest.cut_sheets && facts && Array.isArray(facts.components)) {
    const outdated: string[] = []
    for (const [slug, e] of Object.entries<any>(manifest.cut_sheets)) {
      const c = facts.components.find((x: any) => x.slug === slug); if (!c || !c.file || !e.cut_sheet_file) continue
      const spec = await safe(async () => (await io.stat(`${root}/handoffs/${e.cut_sheet_file}`)).mtimeMs, 0)
      const desc = await safe(async () => (await io.stat(`${root}/${c.file}`)).mtimeMs, 0)
      if (spec && desc > spec) outdated.push(c.name)
    }
    if (outdated.length) steps.push({ id: 'handoff', why: 'a descriptor changed after its Component Specification',
      title: t(lang, 'Regenerate the handoff', 'Regenerar el handoff'),
      detail: t(lang, `${outdated.join(', ')} — descriptor newer than its specification`, `${outdated.join(', ')} — descriptor más nuevo que su especificación`),
      prompt: t(lang, `regenerate the handoff of ${outdated.join(' and ')}`, `regenera el handoff de ${outdated.join(' y ')}`) })
  }

  // 3 — the blast-radius analysis no longer matches docs/05. handoff-prepare.js wrote the warning against the report it
  // read, and names it; the warning holds only while that report is still the newest Blast Radius in analysis/ — a newer
  // run (the older one archived) answers it, whatever the last handoff left in context-result.json.
  const ctx = await json(io, `${root}/.cache/sa-skills/handoff-payloads/context-result.json`)
  const blast = (await safe(() => io.list(`${root}/analysis`), [])).map((e) => e.name).filter((n) => /^BLAST-RADIUS-\d{4}-\d{2}-\d{2}\.(md|html)$/.test(n)).sort().pop()
  const stale = blast && ctx && Array.isArray(ctx.edge_cross_check_warnings) ? ctx.edge_cross_check_warnings.filter((w: string) => /blast-radius stale/.test(w) && w.includes(`analysis/${blast}`)).length : 0
  if (stale) steps.push({ id: 'blast-radius', why: `${stale} edge(s) of docs/05 missing from the blast-radius report`,
    title: t(lang, 'Rerun the blast-radius analysis', 'Volver a correr blast-radius'),
    detail: t(lang, `${stale} docs/05 edge(s) missing from the report`, `al reporte le faltan ${stale} arista(s) de docs/05`),
    prompt: t(lang, 'run blast radius analysis', 'corre el análisis blast radius') })

  // 4 — a release is due: the last `lifecycle.js status` (changes since the tag, or a missing tag), else lines in [Unreleased]
  const changelog = await safe(() => io.read(`${root}/docs/CHANGELOG.md`), '')
  const unreleased = (changelog.split(/^## \[Unreleased\]\s*$/m)[1] ?? '').split(/^## \[/m)[0] ?? ''
  const entries = (unreleased.match(/^- /gm) || []).length
  const version = (arch.match(/<!--\s*ARCHITECTURE_VERSION:\s*([\d.]+)\s*-->/) || [])[1]
  const life = await json(io, `${root}/.cache/sa-skills/lifecycle/status.json`)
  if (life && life.version === version && life.state === 'untagged') steps.push({ id: 'release', why: 'Released in the document, tag missing',
    title: t(lang, 'Recover the architecture tag', 'Recuperar la etiqueta de la arquitectura'),
    detail: `architecture-v${version}`,
    prompt: t(lang, 'recover architecture tag', 'recover architecture tag') })
  else if (life && life.version === version && life.state === 'changed' && life.changes) steps.push({ id: 'release', why: `${life.changes} change(s) since the tag`,
    title: t(lang, 'Release the architecture', 'Liberar la arquitectura'),
    detail: t(lang, `${life.changes} change(s) since v${version} · ${life.recommended}`, `${life.changes} cambio(s) desde v${version} · ${life.recommended}`),
    prompt: t(lang, 'release my architecture', 'release my architecture') })
  else if (entries) steps.push({ id: 'release', why: `${entries} entr(ies) under [Unreleased]`,
    title: t(lang, 'Release the architecture', 'Liberar la arquitectura'),
    detail: t(lang, `${entries} change(s) in [Unreleased] since v${version || '?'}`, `${entries} cambio(s) en [Unreleased] desde v${version || '?'}`),
    prompt: t(lang, 'release my architecture', 'release my architecture') })

  // 5 — the command center's newest scene is older than the docs
  const scenes = (await safe(() => io.list(`${root}/visualizations`), [])).filter((e) => e.name.endsWith('.scene.json'))
  const scene = Math.max(0, ...scenes.map((e) => e.mtimeMs))
  if (scene && docsNewest > scene) steps.push({ id: 'command-center', why: 'docs newer than the newest scene',
    title: t(lang, 'Refresh the command center', 'Actualizar el centro de mando'),
    detail: t(lang, `scene of ${day(scene)}, docs changed since`, `escena del ${day(scene)}, los docs cambiaron después`),
    prompt: t(lang, 'command center', 'centro de mando') })

  // 6 — the newest Word export is older than the docs
  const exportsDir = (await safe(() => io.list(`${root}/exports`), [])).filter((e) => /^SA-.*\.docx$/.test(e.name))
  const exported = Math.max(0, ...exportsDir.map((e) => e.mtimeMs))
  if (exported && docsNewest > exported) steps.push({ id: 'export', why: 'docs newer than the newest SA-*.docx',
    title: t(lang, 'Export to Word again', 'Volver a exportar a Word'),
    detail: t(lang, `last export ${day(exported)}, docs changed since`, `última exportación del ${day(exported)}, los docs cambiaron después`),
    prompt: t(lang, 'export architecture to Word', 'export architecture to Word') })

  // 7 — not yet under the prose contract
  if (!/<!--\s*PROSE_STYLE:\s*v1\s*-->/.test(arch)) steps.push({ id: 'restyle', why: 'no PROSE_STYLE: v1 stamp',
    title: t(lang, 'Apply the prose contract', 'Aplicar el contrato de prosa'),
    detail: '/restyle-architecture',
    prompt: '/restyle-architecture' })

  return { lang, steps: steps.slice(0, MAX) }
}

/** The fingerprint of a step set: the band, once hidden, comes back only when the set changes. */
export const fingerprint = (steps: Step[]) => steps.map((s) => `${s.id}:${s.detail}`).join('|')
