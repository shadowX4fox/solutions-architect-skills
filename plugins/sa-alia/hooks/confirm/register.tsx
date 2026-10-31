// sa-alia · confirm — the confirmations of today, in Alia's look, deciding exactly what they decide today:
//  · the questions the skills already ask (the change set before → after, approved before any write) get her codec on top
//    of the engine's own dialog — the options and the answer are the engine's, untouched;
//  · a write to the architecture (ARCHITECTURE.md, docs/, adr/, tdr/) that Claude Code would put to the person is put to
//    them in her dialog instead — the file, a preview of the lines it removes and adds, Apply / Don't apply — and the
//    answer is the verdict: Apply runs it, Don't apply (or Esc) refuses it, as the engine's dialog would.
// She asks only where the engine would ask the person: the verdict `ask`, a person to answer, the session in default mode
// (in auto mode an ask is the classifier's), the main loop. Anywhere else — or when the mode is unknown — the engine's own
// dialog stands. A hook that fails is skipped, and the engine's dialog stands then too.
import { atom, read, update } from 'claude-code'
import type { On } from 'claude-code'

import type { AliaLine, ChangePreview } from '../../types'

import { Codec, portrait } from '../alia/codec'
import { ALIA } from '../alia/palette'
import { GLYPH, TONE } from '../ui'
import { APPLY, architecturePath, preview } from './model'

const aliaAtom = atom({ plugin: 'sa-alia', key: 'alia' } as const, null as AliaLine | null)
const langAtom = atom({ plugin: 'sa-alia', key: 'lang' } as const, 'en' as 'en' | 'es')
const modeAtom = atom({ plugin: 'sa-alia', key: 'permissionMode' } as const, null as string | null)
const pendingAtom = atom({ plugin: 'sa-alia', key: 'pendingChange' } as const, null as ChangePreview | null)

const WRITES = new Set(['Write', 'Edit', 'MultiEdit'])
// the rows around a question's dialog: at most 12 on the terminal, 48 elsewhere, counted at 40 columns — so on the terminal
// one header row (no ringed mark), the summary and six lines cut to that width (seven measured the most that fits, one
// kept as margin; a test holds the worst case); elsewhere her codec and twelve lines
const PREVIEW_ROWS = 12, TERMINAL_ROWS = 6, TERMINAL_COLS = 32

export function registerConfirm(on: On) {
  // the session's permission mode, as its own hook events report it — the one way a mod learns who answers an ask
  on('classic.SessionStart', async ($, e, next) => {
    const mode = (e as { permission_mode?: string }).permission_mode
    if (mode) await update($, modeAtom, () => mode)
    return next(e)
  })
  on('classic.UserPromptSubmit', async ($, e, next) => {
    const mode = (e as { permission_mode?: string }).permission_mode
    if (mode) await update($, modeAtom, () => mode)
    return next(e)
  })

  on('tool.check', async ($, e, next) => {
    const verdict = await next(e)
    if (verdict.decision !== 'ask' || verdict.plugin || e.approver !== 'person' || e.agentId || !e.tool_use_id || !WRITES.has(e.tool)) return verdict
    if ((await read($, modeAtom)) !== 'default' || !(await read($, aliaAtom))) return verdict
    const file = String((e.input as { file_path?: unknown } | null)?.file_path ?? '')
    const rel = architecturePath(await $.session.root(), file)
    if (!rel) return verdict
    let before: string | null = null
    if (e.tool === 'Write') try { before = await $.fs.read(file) } catch { before = null }
    const lang = await read($, langAtom)
    const p = preview(e.tool, e.input, rel, before, lang, PREVIEW_ROWS)
    if (!p) return verdict
    await update($, pendingAtom, () => p)
    let apply = false
    try { apply = (await $.ui.ask(p.question, { options: APPLY[lang], header: 'Alia' })) === APPLY[lang][0] }
    catch { apply = false }   // dismissed: as Esc on the engine's dialog, the write does not run
    finally { await update($, pendingAtom, () => null) }
    return apply
      ? { decision: 'allow', reason: `approved in Alia's confirmation (${rel})`, plugin: 'sa-alia' }
      : { decision: 'deny', reason: lang === 'es'
          ? `La persona eligió no aplicar este cambio a ${rel} (confirmación de Alia). Pregunta qué cambiar antes de intentarlo de nuevo.`
          : `The person chose not to apply this change to ${rel} (Alia's confirmation). Ask what to change before trying again.`, plugin: 'sa-alia' }
  })

  // her codec on top of the engine's question dialog, inside an architecture; the engine's node last, untouched
  on('ui.render', { component: 'AskUserQuestion' }, async ($, e, next) => {
    if (!(await read($, aliaAtom))) return next(e)
    const engine = await next(e)
    const es = (await read($, langAtom)) === 'es'
    const els = $.ui.resolve(e)
    const { Box, Text } = els
    const pending = await read($, pendingAtom)
    const first = (Array.isArray(e.props.questions) ? e.props.questions[0] : null) as { question?: unknown } | null
    const mine = !!pending && first?.question === pending.question
    const svg = await portrait($, e.surface, 'thinking')
    const term = e.surface === 'terminal'
    const fit = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s)
    const shown = pending ? (term ? pending.lines.slice(0, TERMINAL_ROWS) : pending.lines) : []
    const more = pending ? pending.lines.length - shown.length : 0
    return (
      <Box flexDirection="column">
        {mine && pending && term ? (
          // the terminal: one header row instead of the ringed codec, so the change itself gets the rows
          <Box flexDirection="column">
            <Text wrap="truncate-end"><Text color={ALIA.aquaMark} bold>{`${GLYPH.brand} Alia`}</Text><Text dimColor>{` ${GLYPH.dot} ${es ? 'confirmar' : 'confirm'} ${GLYPH.dot} `}</Text><Text>{fit(pending.file, TERMINAL_COLS)}</Text></Text>
            <Text dimColor wrap="truncate-end">{fit(pending.summary + (more > 0 ? ` +${more}` : ''), 40)}</Text>
            {shown.map((l, i) => <Text key={`d-${i}`} color={l.sign === '-' ? TONE.critical : TONE.ok} wrap="truncate-end">{`${l.sign} ${fit(l.text, 38)}`}</Text>)}
          </Box>
        ) : mine && pending ? (
          <Codec els={els} say={{ mood: 'thinking', line: term ? fit(pending.file, TERMINAL_COLS + 2) : pending.file }} svg={svg} kicker={es ? 'confirmar' : 'confirm'}>
            <Text dimColor>{term ? fit(pending.summary + (more > 0 ? ` +${more}` : ''), TERMINAL_COLS + 2) : pending.summary}</Text>
            {shown.map((l, i) => <Text key={`d-${i}`} color={l.sign === '-' ? TONE.critical : TONE.ok} wrap="truncate-end">{`${l.sign} ${term ? fit(l.text, TERMINAL_COLS) : l.text}`}</Text>)}
          </Codec>
        ) : (
          <Codec els={els} svg={svg} kicker={es ? 'antes de responder' : 'before you answer'}
            say={{ mood: 'thinking', line: es ? 'Nada cambia sin tu sí.' : 'Nothing changes without your yes.' }} />
        )}
        {engine}
      </Box>
    )
  })
}
