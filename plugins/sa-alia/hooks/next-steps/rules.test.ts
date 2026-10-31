import { describe, expect, test } from 'claude-code/testing'

import { fingerprint, nextSteps, type Io } from './rules'

const NOW = Date.UTC(2026, 9, 1, 18, 0)
const H = 3600 * 1000
type F = { text?: string; mtimeMs: number }

/** A project in memory: path → file; a directory is any prefix. */
function project(files: Record<string, F>): Io {
  const at = (p: string) => files[p]
  return {
    exists: async (p) => !!at(p) || Object.keys(files).some((k) => k.startsWith(p + '/')),
    read: async (p) => { const f = at(p); if (!f) throw new Error('ENOENT'); return f.text ?? '' },
    stat: async (p) => { const f = at(p); if (!f) throw new Error('ENOENT'); return { kind: 'file', mtimeMs: f.mtimeMs } },
    list: async (p) => {
      const kids = new Map<string, { name: string; kind: 'file' | 'dir'; mtimeMs: number }>()
      for (const [k, f] of Object.entries(files)) {
        if (!k.startsWith(p + '/')) continue
        const rest = k.slice(p.length + 1); const name = rest.split('/')[0] ?? rest
        kids.set(name, rest.includes('/') ? { name, kind: 'dir', mtimeMs: 0 } : { name, kind: 'file', mtimeMs: f.mtimeMs })
      }
      if (!kids.size) throw new Error('ENOENT')
      return [...kids.values()]
    },
  }
}
const ARCH = (extra = '') => ({ text: `<!-- ARCHITECTURE_VERSION: 7.1.0 -->\n<!-- ARCHITECTURE_STATUS: Released -->\n<!-- DOC_LANGUAGE: es -->\n<!-- PROSE_STYLE: v1 -->${extra}\n\n# Mesa`, mtimeMs: NOW - 10 * H })

describe('sa-next-steps rules', () => {
  test('a release is due from the last lifecycle status: changes since the tag, or a missing tag; a status of another version is ignored', async () => {
    const changed = await nextSteps(project({ '/p/ARCHITECTURE.md': ARCH(), '/p/.cache/sa-skills/lifecycle/status.json': { text: JSON.stringify({ state: 'changed', version: '7.1.0', changes: 3, recommended: 'minor' }), mtimeMs: NOW } }), '/p', NOW)
    expect(changed.steps.find((s) => s.id === 'release')).toMatchObject({ title: 'Liberar la arquitectura', detail: '3 cambio(s) desde v7.1.0 · minor', prompt: 'release my architecture' })
    const untagged = await nextSteps(project({ '/p/ARCHITECTURE.md': ARCH(), '/p/.cache/sa-skills/lifecycle/status.json': { text: JSON.stringify({ state: 'untagged', version: '7.1.0' }), mtimeMs: NOW } }), '/p', NOW)
    expect(untagged.steps.find((s) => s.id === 'release')).toMatchObject({ title: 'Recuperar la etiqueta de la arquitectura', prompt: 'recover architecture tag' })
    const old = await nextSteps(project({ '/p/ARCHITECTURE.md': ARCH(), '/p/.cache/sa-skills/lifecycle/status.json': { text: JSON.stringify({ state: 'changed', version: '7.0.0', changes: 3 }), mtimeMs: NOW } }), '/p', NOW)
    expect(old.steps.find((s) => s.id === 'release')).toBeUndefined()
  })

  test('no ARCHITECTURE.md: no steps — the mod stays out of other projects', async () => {
    expect((await nextSteps(project({ '/p/README.md': { text: '# x', mtimeMs: NOW } }), '/p', NOW)).steps).toEqual([])
  })

  test('a quiet project: nothing to suggest', async () => {
    const r = await nextSteps(project({ '/p/ARCHITECTURE.md': ARCH(), '/p/docs/01-system-overview.md': { text: '#', mtimeMs: NOW - 9 * H } }), '/p', NOW)
    expect(r).toEqual({ lang: 'es', steps: [] })
  })

  test('the reference project on 2026-10-01: worksheets, a release, a stale export — at most three, most urgent first', async () => {
    const r = await nextSteps(project({
      '/p/ARCHITECTURE.md': ARCH(),
      '/p/docs/05-integration-points.md': { text: '#', mtimeMs: NOW - 1 * H },
      '/p/docs/CHANGELOG.md': { text: '# Changelog\n\n## [Unreleased]\n\n### Added\n- one\n- two\n\n## [7.1.0] - 2026-09-30\n- old\n', mtimeMs: NOW - 1 * H },
      '/p/.cache/sa-skills/judge/identifier-language.worksheet.md': { text: '### id-0\n### id-1\n', mtimeMs: NOW - 2 * H },
      '/p/.cache/sa-skills/judge/identifier-language.answers.json': { text: '{}', mtimeMs: NOW - 1 * H },   // answered after: not pending
      '/p/.cache/sa-skills/judge/resolve-name.worksheet.md': { text: '### id-0\n### id-1\n### id-2\n', mtimeMs: NOW - 5 * H },
      '/p/.cache/sa-skills/judge/registro-lector-unico.worksheet.md': { text: '### id-0\n', mtimeMs: NOW - 10 * 24 * H },   // abandoned
      '/p/exports/SA-mesa.docx': { mtimeMs: NOW - 15 * 24 * H },
    }), '/p', NOW)
    expect(r.steps.map((s) => s.id)).toEqual(['judge', 'release', 'export'])
    expect(r.steps[0]).toMatchObject({ title: 'Responder las hojas del juez', detail: '1 pendiente(s) · 3 ítems · resolve-name' })
    expect(r.steps[1]).toMatchObject({ title: 'Liberar la arquitectura', detail: '2 cambio(s) en [Unreleased] desde v7.1.0' })   // the released section is not counted
    expect(r.steps[1]?.prompt).toBe('release my architecture')
  })

  test('a Component Specification older than its descriptor is a regeneration; a fresh one is not', async () => {
    const files: Record<string, F> = {
      '/p/ARCHITECTURE.md': ARCH(),
      '/p/handoffs/.manifest.json': { text: JSON.stringify({ cut_sheets: { 'alta': { cut_sheet_file: 'components/10-alta.md' }, 'postura': { cut_sheet_file: 'components/11-postura.md' } } }), mtimeMs: NOW },
      '/p/.cache/sa-skills/facts.json': { text: JSON.stringify({ components: [{ slug: 'alta', name: 'Servicio de Alta', file: 'docs/components/s/10-alta.md' }, { slug: 'postura', name: 'Servicio de Postura', file: 'docs/components/s/11-postura.md' }] }), mtimeMs: NOW },
      '/p/handoffs/components/10-alta.md': { mtimeMs: NOW - 5 * H },
      '/p/docs/components/s/10-alta.md': { text: '#', mtimeMs: NOW - 1 * H },
      '/p/handoffs/components/11-postura.md': { mtimeMs: NOW - 1 * H },
      '/p/docs/components/s/11-postura.md': { text: '#', mtimeMs: NOW - 5 * H },
    }
    const r = await nextSteps(project(files), '/p', NOW)
    expect(r.steps[0]).toMatchObject({ id: 'handoff', prompt: 'regenera el handoff de Servicio de Alta' })
  })

  test('English project, stale blast radius, stale scene, unstamped prose; the fingerprint changes with the set', async () => {
    const r = await nextSteps(project({
      '/p/ARCHITECTURE.md': { text: '<!-- DOC_LANGUAGE: en -->\n# Desk', mtimeMs: NOW - 2 * H },
      '/p/.cache/sa-skills/handoff-payloads/context-result.json': { text: JSON.stringify({ edge_cross_check_warnings: ['⚠ blast-radius stale: a but analysis/BLAST-RADIUS-2026-09-20.md fan-out', '⚠ blast-radius stale: b but analysis/BLAST-RADIUS-2026-09-20.md fan-out', '⚠ boundary mismatch: c'] }), mtimeMs: NOW },
      '/p/analysis/BLAST-RADIUS-2026-09-20.md': { text: '#', mtimeMs: NOW - 9 * 24 * H },
      '/p/visualizations/architecture-command-center-2026-09-24.scene.json': { mtimeMs: NOW - 7 * 24 * H },
      '/p/docs/04-data-flow-patterns.md': { text: '#', mtimeMs: NOW - 1 * H },
    }), '/p', NOW)
    expect(r.lang).toBe('en')
    expect(r.steps.map((s) => s.id)).toEqual(['blast-radius', 'command-center', 'restyle'])
    expect(r.steps[0]?.detail).toBe('2 docs/05 edge(s) missing from the report')
    expect(fingerprint(r.steps)).not.toBe(fingerprint(r.steps.slice(0, 2)))
  })

  test('a stale blast-radius warning is answered by a newer report — whatever the last handoff left behind', async () => {
    const files: Record<string, F> = {
      '/p/ARCHITECTURE.md': ARCH(),
      '/p/.cache/sa-skills/handoff-payloads/context-result.json': { text: JSON.stringify({ edge_cross_check_warnings: ['⚠ blast-radius stale: docs/05 has edge x but analysis/BLAST-RADIUS-2026-09-20.md fan-out for y'] }), mtimeMs: NOW - 5 * H },
      '/p/analysis/BLAST-RADIUS-2026-10-01.md': { text: '#', mtimeMs: NOW - 1 * H },
      '/p/analysis/archive/BLAST-RADIUS-2026-09-20.md': { text: '#', mtimeMs: NOW - 9 * 24 * H },
    }
    expect((await nextSteps(project(files), '/p', NOW)).steps.map((s) => s.id)).not.toContain('blast-radius')
  })
})
