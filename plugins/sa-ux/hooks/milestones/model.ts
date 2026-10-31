// sa-ux · milestones — what moved in the project during a turn, as cards Alia places in the transcript: a release (the
// version, its status, its tag, the changelog entry), an analysis run (each lens re-run, its critical and high findings
// against the last report), a handoff kit (its version, the components whose specification changed). Found by comparing
// two snapshots of what the skills leave on disk — never by reading the conversation. Pure: lifecycle.tsx takes them.
import type { Milestone, ProjectSnapshot } from '../../types'

type Lang = 'en' | 'es'
const t = (lang: Lang, en: string, es: string) => (lang === 'es' ? es : en)
/** A placed row's id: 1 to 64 of letters, digits, `_` and `-` (the host's rule) — a version's dots become `_`. */
const rowId = (s: string) => s.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 64)

/** The changelog entry of a version: its bullets, at most `max`, plain text. */
export function changelogEntry(text: string, version: string, max = 4): string[] {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const at = lines.findIndex((l) => new RegExp(`^##\\s*\\[${version.replace(/\./g, '\\.')}\\]`).test(l))
  if (at < 0) return []
  const out: string[] = []
  for (let i = at + 1; i < lines.length && !/^##\s/.test(lines[i]!); i++) {
    const m = lines[i]!.match(/^\s*[-*]\s+(.*)$/)
    if (m) out.push(m[1]!.replace(/\*\*|`/g, '').trim())
  }
  return out.slice(0, max)
}

/** The handoff kit's manifest, slimmed: the version it was cut at and each component's payload hash. */
export function kitOf(manifest: unknown): ProjectSnapshot['kit'] {
  const m = manifest as { run?: { architecture_version?: unknown }; cut_sheets?: Record<string, { payload_hash?: unknown }>; seams?: Record<string, unknown> } | null
  if (!m || !m.cut_sheets) return null
  const hashes: Record<string, string> = {}
  for (const [slug, c] of Object.entries(m.cut_sheets)) hashes[slug] = String(c?.payload_hash ?? '')
  return { version: String(m.run?.architecture_version ?? ''), hashes, interfaces: Object.keys(m.seams || {}).length }
}

/** The cards between two snapshots, in the order they happened: release, analyses, kit. */
export function milestones(prev: ProjectSnapshot | null, next: ProjectSnapshot, lang: Lang, changelog = ''): Milestone[] {
  if (!prev) return []   // the session's first reading is the baseline, not news
  const out: Milestone[] = []
  const v = next.version

  // a release: the document reached Released at a new version, or its tag appeared
  const released = next.status === 'Released' && (prev.version !== v || prev.status !== 'Released')
  if (released || (next.tagged && !prev.tagged && prev.version === v)) {
    const lines = changelogEntry(changelog, v)
    out.push({ id: rowId(`release-${v}-${next.tagged ? 'tag' : 'doc'}`), kind: 'release', mood: 'pleased',
      title: next.tagged ? t(lang, `Released v${v} · tagged architecture-v${v}`, `Liberada v${v} · tag architecture-v${v}`)
        : t(lang, `Released v${v} · the tag comes after the merge`, `Liberada v${v} · el tag llega tras el merge`),
      lines: lines.length ? lines : [t(lang, 'No changelog entry for this version.', 'Esta versión no tiene entrada en el changelog.')] })
  }

  // analyses: a lens whose newest report changed
  const reran = Object.entries(next.lenses).filter(([lens, l]) => !prev.lenses[lens] || prev.lenses[lens]!.date !== l.date)
  if (reran.length) {
    const delta = (a: number, b: number | undefined) => (b === undefined || a === b ? String(a) : `${b} → ${a}`)
    const worse = reran.some(([lens, l]) => l.critical > (prev.lenses[lens]?.critical ?? 0))
    const better = reran.every(([lens, l]) => prev.lenses[lens] && l.critical + l.high < prev.lenses[lens]!.critical + prev.lenses[lens]!.high)
    out.push({ id: rowId(`analysis-${reran.map(([lens, l]) => `${lens}-${l.date}`).join('-')}`), kind: 'analysis',
      mood: worse ? 'stern' : better ? 'pleased' : 'calm',
      title: t(lang, `${reran.length} analys${reran.length === 1 ? 'is' : 'es'} run`, `${reran.length} análisis corrido${reran.length === 1 ? '' : 's'}`),
      lines: reran.map(([lens, l]) => {
        const p = prev.lenses[lens]
        return t(lang, `${lens}: critical ${delta(l.critical, p?.critical)} · high ${delta(l.high, p?.high)}${p ? '' : ' · first report'}`,
          `${lens}: críticos ${delta(l.critical, p?.critical)} · altos ${delta(l.high, p?.high)}${p ? '' : ' · primer reporte'}`)
      }) })
  }

  // the handoff kit: regenerated — a new version, or components whose payload moved
  if (next.kit && (!prev.kit || JSON.stringify(prev.kit) !== JSON.stringify(next.kit))) {
    const k = next.kit, before = prev.kit
    const changed = Object.keys(k.hashes).filter((s) => !before || before.hashes[s] !== k.hashes[s])
    const stale = k.version && v && k.version !== v
    const n = Object.keys(k.hashes).length
    out.push({ id: rowId(`kit-${k.version}-${changed.join('-')}`), kind: 'kit', mood: stale ? 'worried' : 'pleased',
      title: t(lang, `Handoff kit v${k.version} · ${n} component${n === 1 ? '' : 's'}, ${k.interfaces} interface contract${k.interfaces === 1 ? '' : 's'}`,
        `Kit de handoff v${k.version} · ${n} componente${n === 1 ? '' : 's'}, ${k.interfaces} contrato${k.interfaces === 1 ? '' : 's'} de interfaz`),
      lines: [
        changed.length ? t(lang, `Changed: ${changed.join(', ')}`, `Cambiaron: ${changed.join(', ')}`) : t(lang, 'No specification changed.', 'Ninguna especificación cambió.'),
        ...(stale ? [t(lang, `Cut at v${k.version} — the architecture is at v${v}.`, `Cortado en v${k.version} — la arquitectura está en v${v}.`)] : []),
      ] })
  }
  return out
}
