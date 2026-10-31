// sa-alia · confirm — what Alia shows when a write to the architecture waits for the person's yes: which file, what the write
// does to it (the lines it removes and adds, a preview capped to the dialog's rows), and the question. Pure: register.tsx
// asks, and only where Claude Code would ask today.
import type { ChangePreview } from '../../types'

type Lang = 'en' | 'es'
const t = (lang: Lang, en: string, es: string) => (lang === 'es' ? es : en)

/** The architecture's own files: what the confirm-first rule governs — ARCHITECTURE.md, docs/, adr/, tdr/. */
export function architecturePath(root: string, file: string): string | null {
  const r = root.replace(/\/+$/, '') + '/'
  if (!file.startsWith(r)) return null
  const rel = file.slice(r.length)
  return rel === 'ARCHITECTURE.md' || /^(docs|adr|tdr)\//.test(rel) ? rel : null
}

const lines = (s: string) => s.replace(/\r\n/g, '\n').split('\n')

/** The lines one text removes and the other adds, in order — a preview of the change, not a minimal diff. */
function delta(before: string, after: string): { removed: string[]; added: string[] } {
  const count = (xs: string[]) => { const m = new Map<string, number>(); xs.forEach((x) => m.set(x, (m.get(x) || 0) + 1)); return m }
  const b = lines(before), a = lines(after), inA = count(a), inB = count(b)
  const removed = b.filter((x) => { const n = inA.get(x) || 0; if (n) { inA.set(x, n - 1); return false } return true })
  const added = a.filter((x) => { const n = inB.get(x) || 0; if (n) { inB.set(x, n - 1); return false } return true })
  return { removed: removed.filter((x) => x.trim()), added: added.filter((x) => x.trim()) }
}

/** The preview of a Write, Edit or MultiEdit on an architecture file; `before` is the file as it stands (a Write's base). */
export function preview(tool: string, input: unknown, rel: string, before: string | null, lang: Lang, rows: number): ChangePreview | null {
  const i = (input || {}) as { content?: unknown; old_string?: unknown; new_string?: unknown; edits?: { old_string?: unknown; new_string?: unknown }[] }
  let removed: string[] = [], added: string[] = [], created = false
  if (tool === 'Write') {
    if (typeof i.content !== 'string') return null
    if (before === null) { created = true; added = lines(i.content).filter((x) => x.trim()) } else ({ removed, added } = delta(before, i.content))
  } else if (tool === 'Edit') {
    if (typeof i.old_string !== 'string' || typeof i.new_string !== 'string') return null
    ;({ removed, added } = delta(i.old_string, i.new_string))
  } else if (tool === 'MultiEdit') {
    if (!Array.isArray(i.edits)) return null
    for (const e of i.edits) { const d = delta(String(e.old_string ?? ''), String(e.new_string ?? '')); removed.push(...d.removed); added.push(...d.added) }
  } else return null

  // the rows the dialog leaves: removed first, then added, half each when both overflow
  const half = Math.max(1, Math.floor(rows / 2))
  const r = removed.length + added.length <= rows ? removed : removed.slice(0, Math.max(half, rows - Math.min(added.length, half)))
  const a = added.slice(0, rows - r.length)
  const cut = (s: string) => (s.length > 110 ? `${s.slice(0, 109)}…` : s)
  const hidden = removed.length + added.length - r.length - a.length
  return {
    file: rel,
    summary: created
      ? t(lang, `new file · ${added.length} line${added.length === 1 ? '' : 's'}`, `archivo nuevo · ${added.length} línea${added.length === 1 ? '' : 's'}`)
      : t(lang, `+${added.length} −${removed.length} lines`, `+${added.length} −${removed.length} líneas`) + (hidden > 0 ? t(lang, ` · ${hidden} more not shown`, ` · ${hidden} más sin mostrar`) : ''),
    lines: [...r.map((x) => ({ sign: '-' as const, text: cut(x) })), ...a.map((x) => ({ sign: '+' as const, text: cut(x) }))],
    question: t(lang, `Apply this change to ${rel}?`, `¿Aplicar este cambio a ${rel}?`),
  }
}

export const APPLY = { en: ['Apply', "Don't apply"], es: ['Aplicar', 'No aplicar'] } as const
