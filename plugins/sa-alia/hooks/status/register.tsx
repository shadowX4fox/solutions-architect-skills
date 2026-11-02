// sa-alia · status — `/alia status` and her hub's first button: where the release stands, read now by sa-skills' own
// lifecycle (`lifecycle.js status --json`, read-only, no model): the state, the tag, the changes since it, the hand-written
// unreleased lines and the downstream artifacts a release left stale. Every button fills the prompt — nothing is sent.
import { atom, read, update } from 'claude-code'
import type { EngineInterface, On } from 'claude-code'

import type { AliaLine, ReleaseStatus } from '../../types'

import { Codec, portrait } from '../alia/codec'
import { saSkillsDir } from '../lifecycle'
import { STATUS_PANE } from '../state'
import { GLYPH, TONE, cut } from '../ui'
import { failedStatus, readStatus, refreshes, releasePrompt, stateOf } from './model'

const aliaAtom = atom({ plugin: 'sa-alia', key: 'alia' } as const, null as AliaLine | null)
const langAtom = atom({ plugin: 'sa-alia', key: 'lang' } as const, 'en' as 'en' | 'es')
const statusAtom = atom({ plugin: 'sa-alia', key: 'releaseStatus' } as const, null as ReleaseStatus | null)

const LIFECYCLE = 'skills/architecture-lifecycle/scripts/lifecycle.js'
const MAX_CHANGES = 8

/** Read the release's state now: the lifecycle's own status, by code. */
async function readNow($: EngineInterface): Promise<ReleaseStatus> {
  const now = await $.clock.now(), root = await $.session.root()
  if (!(await $.fs.exists(`${root}/ARCHITECTURE.md`))) return failedStatus('No architecture here (no ARCHITECTURE.md).', now)
  const sa = await saSkillsDir($)
  if (!sa) return failedStatus('sa-skills not found (SA_SKILLS_DIR, or install the plugin).', now)
  try {
    const r = await $.process.run(['bun', `${sa}/${LIFECYCLE}`, 'status', root, '--json'], { timeoutMs: 60000 })
    return readStatus(r.stdout, now) || failedStatus(cut((r.stderr || r.stdout || `exit ${r.exitCode}`).trim(), 300), now)
  } catch (err) { return failedStatus(String((err as Error).message || err), now) }
}

/** `/alia status` and her hub's button: the state read, the pane opened; the text the command answers. */
export async function openStatus($: EngineInterface): Promise<string> {
  const st = await readNow($)
  await update($, statusAtom, () => st)
  const es = (await read($, langAtom)) === 'es'
  await $.ui.open({ id: STATUS_PANE, title: es ? 'Cómo va el release' : 'Where the release stands' })
  if (st.error) return st.error
  return [st.version ? `v${st.version}` : '', stateOf(st.state, es).label, st.next || ''].filter(Boolean).join(` ${GLYPH.dot} `)
}

export function registerStatus(on: On) {
  on('ui.render', { component: 'Pane', requestId: STATUS_PANE }, async ($, e) => {
    const els = $.ui.resolve(e)
    const { Box, Button, Text } = els
    const st = await read($, statusAtom), say = await read($, aliaAtom), es = (await read($, langAtom)) === 'es'
    const head = <Codec els={els} say={say} svg={await portrait($, e.surface, say ? say.mood : 'calm')} kicker={es ? 'cómo va el release' : 'where the release stands'} />
    if (!st || st.error) return (
      <Box flexDirection="column" gap={1}>
        {head}
        <Text dimColor>{st ? st.error : es ? 'Aún no se ha leído el estado: /alia status.' : 'Not read yet: /alia status.'}</Text>
      </Box>
    )
    const s = stateOf(st.state, es), tone = TONE[s.tone], move = releasePrompt(st), fixes = refreshes(st)
    const tagLine = st.tag ? `${st.tag.name} ${st.tag.local ? GLYPH.accepted : GLYPH.retired} ${es ? 'local' : 'local'}${st.tag.remote == null ? '' : ` ${st.tag.remote ? GLYPH.accepted : GLYPH.retired} ${es ? 'remoto' : 'remote'}`}` : null
    const fill = (text: string) => async () => { await $.prompt.fill({ text }) }
    return (
      <Box flexDirection="column" gap={1}>
        {head}
        <Box flexDirection="column">
          <Box flexDirection="row" gap={1} flexWrap="wrap">
            {st.version ? <Text bold>{`v${st.version}`}</Text> : null}
            <Text color={tone} bold>{s.label}</Text>
            {st.released ? <Text dimColor>{`${GLYPH.dot} ${st.released}`}</Text> : null}
          </Box>
          {tagLine ? <Text dimColor>{tagLine}</Text> : null}
        </Box>

        {st.changes.length ? (
          <Box flexDirection="column">
            <Text bold>{es ? `${st.changes.length} cambio${st.changes.length === 1 ? '' : 's'} desde el tag · recomendado ${st.recommended || 'patch'}` : `${st.changes.length} change${st.changes.length === 1 ? '' : 's'} since the tag · recommended ${st.recommended || 'patch'}`}</Text>
            {st.changes.slice(0, MAX_CHANGES).map((c, i) => (
              <Box key={`chg-${i}`} flexDirection="row" gap={1}>
                <Text color={c.bump === 'major' ? TONE.critical : c.bump === 'minor' ? TONE.high : TONE.info}>{c.bump.toUpperCase()}</Text>
                <Text>{cut(`${c.section ? c.section + ': ' : ''}${c.text}`, 110)}</Text>
              </Box>
            ))}
            {st.changes.length > MAX_CHANGES ? <Text dimColor>{es ? `+${st.changes.length - MAX_CHANGES} más` : `+${st.changes.length - MAX_CHANGES} more`}</Text> : null}
          </Box>
        ) : null}

        {st.unreleased.length ? (
          <Box flexDirection="column">
            <Text bold>{es ? 'Notas sin publicar' : 'Unreleased notes'}</Text>
            {st.unreleased.slice(0, 5).map((l, i) => <Text key={`unr-${i}`}>{`${GLYPH.step} ${cut(l, 110)}`}</Text>)}
          </Box>
        ) : null}

        {st.downstream.length ? (
          <Box flexDirection="column">
            <Text bold>{es ? 'Artefactos derivados' : 'Downstream artifacts'}</Text>
            {st.downstream.map((d, i) => (
              <Box key={`ds-${i}`} flexDirection="row" gap={1}>
                <Text color={d.stale ? TONE.high : TONE.ok}>{d.stale ? GLYPH.stale : GLYPH.accepted}</Text>
                <Text>{d.artifact}</Text>
                <Text dimColor>{d.version ? `v${d.version}` : es ? 'sin versión' : 'no version'}</Text>
              </Box>
            ))}
          </Box>
        ) : null}

        <Box flexDirection="column">
          {move ? (
            <Box flexDirection="row" gap={1}>
              <Text color={TONE.info}>{GLYPH.step}</Text>
              <Button key="st-release" plain label={move === 'release my architecture' ? (es ? 'Publicar la arquitectura' : 'Release the architecture') : (es ? 'Recuperar el tag' : 'Recover the tag')} onPress={fill(move)} />
            </Box>
          ) : null}
          {fixes.map((f, i) => (
            <Box key={`fx-row-${i}`} flexDirection="row" gap={1}>
              <Text color={TONE.info}>{GLYPH.step}</Text>
              <Button key={`st-fix-${i}`} plain label={`${es ? 'Actualizar' : 'Refresh'}: ${f.artifacts.length > 1 ? `${f.artifacts.length} ${es ? 'artefactos' : 'artifacts'}` : f.artifacts[0]} (${f.command})`} onPress={fill(f.command)} />
            </Box>
          ))}
          {st.next && !move && !fixes.length ? <Text dimColor>{st.next}</Text> : null}
          <Text dimColor>{es ? 'Cada opción llena el prompt; nada se envía solo.' : 'Each fills the prompt; nothing is sent on its own.'}</Text>
        </Box>
      </Box>
    )
  })
}
