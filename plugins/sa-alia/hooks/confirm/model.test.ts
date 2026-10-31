// sa-alia · confirm — which files the confirmation covers, and the preview of a write: the lines it removes and adds, capped
// to the dialog's rows, a new file counted, the question in the document's language.
import { describe, expect, test } from 'claude-code/testing'

import { architecturePath, preview } from './model'

describe('confirm · the architecture\'s files', () => {
  test('ARCHITECTURE.md, docs/, adr/, tdr/ — nothing else, nothing outside the project', () => {
    expect(architecturePath('/p', '/p/ARCHITECTURE.md')).toBe('ARCHITECTURE.md')
    expect(architecturePath('/p/', '/p/docs/05-integration-points.md')).toBe('docs/05-integration-points.md')
    expect(architecturePath('/p', '/p/adr/ADR-120.md')).toBe('adr/ADR-120.md')
    expect(architecturePath('/p', '/p/tdr/TDR-001.md')).toBe('tdr/TDR-001.md')
    expect(architecturePath('/p', '/p/handoffs/x.md')).toBeNull()
    expect(architecturePath('/p', '/p/src/app.ts')).toBeNull()
    expect(architecturePath('/p', '/q/docs/a.md')).toBeNull()
    expect(architecturePath('/p', '/pdocs/a.md')).toBeNull()
  })
})

describe('confirm · the preview', () => {
  test('an Edit: what it removes, then what it adds', () => {
    const p = preview('Edit', { file_path: '/p/docs/05.md', old_string: '| I-07 | Alta | Correo | SMTP |', new_string: '| I-07 | Alta | Correo | HTTPS/REST |' }, 'docs/05.md', null, 'es', 6)!
    expect(p).toEqual({ file: 'docs/05.md', summary: '+1 −1 líneas', question: '¿Aplicar este cambio a docs/05.md?',
      lines: [{ sign: '-', text: '| I-07 | Alta | Correo | SMTP |' }, { sign: '+', text: '| I-07 | Alta | Correo | HTTPS/REST |' }] })
  })
  test('a Write over a file: the lines that differ; a new file: its lines counted', () => {
    const p = preview('Write', { content: 'a\nb\nc2\nd\n' }, 'ARCHITECTURE.md', 'a\nb\nc\nd\n', 'en', 6)!
    expect(p.lines).toEqual([{ sign: '-', text: 'c' }, { sign: '+', text: 'c2' }])
    expect(preview('Write', { content: '# T\n\nx\n' }, 'adr/ADR-130.md', null, 'en', 6)!.summary).toBe('new file · 2 lines')
  })
  test('a large change is capped to the rows, and says how much is not shown', () => {
    const old = Array.from({ length: 10 }, (_, i) => `old ${i}`).join('\n'), neu = Array.from({ length: 10 }, (_, i) => `new ${i}`).join('\n')
    const p = preview('MultiEdit', { edits: [{ old_string: old, new_string: neu }] }, 'docs/04.md', null, 'en', 6)!
    expect(p.lines.length).toBe(6)
    expect(p.lines.filter((l) => l.sign === '-').length).toBe(3)
    expect(p.summary).toBe('+10 −10 lines · 14 more not shown')
  })
  test('a call it cannot read: no preview — the engine\'s dialog stands', () => {
    expect(preview('Edit', { file_path: '/p/docs/a.md' }, 'docs/a.md', null, 'en', 6)).toBeNull()
    expect(preview('Bash', { command: 'ls' }, 'docs/a.md', null, 'en', 6)).toBeNull()
  })
})
