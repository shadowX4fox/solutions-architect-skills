// sa-alia · status — where the release stands, read from `lifecycle.js status --json` (sa-skills' lifecycle as code: the
// state derived from git and the documents, never stored). Pure: the JSON in, what the pane shows out.
import type { ReleaseStatus } from '../../types'

type Raw = {
  state?: string; version?: string | null; declared_status?: string | null; released?: string | null
  tag?: { name?: string; local?: boolean; remote?: boolean | null } | null
  changes?: { section?: string; bump?: string; text?: string }[]; recommended?: string | null; unreleased?: string[]
  downstream?: { artifact?: string; file?: string; version?: string | null; stale?: boolean; command?: string }[]; next?: string | null
}

/** The status the pane draws, from the script's JSON; null when it is not a status. */
export function readStatus(json: string, at: number): ReleaseStatus | null {
  let r: Raw
  try { r = JSON.parse(json) as Raw } catch { return null }
  if (!r || typeof r.state !== 'string') return null
  return {
    at,
    state: r.state,
    version: r.version || null,
    declared: r.declared_status || null,
    released: r.released || null,
    tag: r.tag && r.tag.name ? { name: r.tag.name, local: !!r.tag.local, remote: r.tag.remote == null ? null : !!r.tag.remote } : null,
    changes: (r.changes || []).map((c) => ({ section: String(c.section || ''), bump: String(c.bump || 'patch'), text: String(c.text || '') })),
    recommended: r.recommended || null,
    unreleased: (r.unreleased || []).map(String),
    downstream: (r.downstream || []).map((d) => ({ artifact: String(d.artifact || ''), file: String(d.file || ''), version: d.version || null, stale: !!d.stale, command: String(d.command || '') })),
    next: r.next || null,
    error: null,
  }
}

/** A status that could not be read: the pane says why. */
export const failedStatus = (error: string, at: number): ReleaseStatus => ({ at, state: 'unknown', version: null, declared: null, released: null, tag: null,
  changes: [], recommended: null, unreleased: [], downstream: [], next: null, error })

/** The state as the pane names it, and its tone: released green, changed or untagged amber, deprecated red. */
export function stateOf(state: string, es: boolean): { label: string; tone: 'ok' | 'high' | 'critical' | 'info' } {
  const L: Record<string, [string, string, 'ok' | 'high' | 'critical' | 'info']> = {
    released: ['released', 'publicada', 'ok'], changed: ['changed since its release', 'con cambios desde su release', 'high'],
    draft: ['draft — never released', 'borrador — sin release', 'info'], untagged: ['released, tag missing', 'publicada sin tag', 'high'],
    deprecated: ['deprecated', 'obsoleta', 'critical'], unreadable: ['unknown — the release tag could not be read', 'desconocido: no se pudo leer el tag del release', 'high'], 'no-git': ['not under git', 'fuera de git', 'high'], unversioned: ['no version', 'sin versión', 'high'],
  }
  const x = L[state]
  return x ? { label: es ? x[1] : x[0], tone: x[2] } : { label: state, tone: 'info' }
}

/** The stale downstream artifacts, one per command (the analyses share one): what a button refreshes. */
export function refreshes(st: ReleaseStatus): { command: string; artifacts: string[] }[] {
  const by = new Map<string, string[]>()
  for (const d of st.downstream) if (d.stale && d.command) by.set(d.command, [...(by.get(d.command) || []), d.artifact])
  return [...by].map(([command, artifacts]) => ({ command: command.split(/\s+—\s+|, then /)[0] || command, artifacts }))
}

/** The prompt that moves the release, when there is one: release a draft or a changed architecture, tag an untagged one. */
export function releasePrompt(st: ReleaseStatus): string | null {
  return st.state === 'draft' || st.state === 'changed' ? 'release my architecture' : st.state === 'untagged' ? 'recover architecture tag' : null
}
