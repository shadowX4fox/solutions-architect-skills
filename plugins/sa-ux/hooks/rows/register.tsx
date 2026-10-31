// sa-ux · readable rows — a Bash row that runs one of the suite's scripts is drawn as `✦ <what it is> · <verdict>` with the
// script's own summary line, its raw output folded away (ctrl+o, or `--verbose`, shows the engine's row and result, untouched).
// A failure keeps its first findings in view. Any other command is the engine's.
import { atom, read } from 'claude-code'
import type { On } from 'claude-code'

import { ALIA } from '../alia/palette'
import { GLYPH, TONE } from '../ui'
import { label, recognize, summarize } from './model'

const langAtom = atom({ plugin: 'sa-ux', key: 'lang' } as const, 'en' as 'en' | 'es')

// the calls whose row this mod drew, so their result block folds with them (a reload forgets: the engine draws them again)
const mine = new Set<string>()

const MARK = { running: '…', ok: GLYPH.accepted, warn: GLYPH.stale, fail: '✗' } as const
const TONE_OF = { running: undefined, ok: TONE.ok, warn: TONE.high, fail: TONE.critical } as const

export function registerRows(on: On) {
  on('ui.render', { component: 'ToolUse' }, async ($, e, next) => {
    if (e.props.tool !== 'Bash' || e.props.isExpanded || e.props.isInterrupted) return next(e)
    const command = String((e.props.input as { command?: unknown } | null)?.command ?? '')
    const kind = recognize(command)
    if (!kind) return next(e)
    mine.add(e.props.tool_use_id)
    const lang = await read($, langAtom)
    const s = summarize(e.props.output, e.props.isErrored, e.props.isRunning)
    const { Box, Text } = $.ui.resolve(e)
    const warn = s.warnings ? (lang === 'es' ? `${s.warnings} aviso${s.warnings === 1 ? '' : 's'}` : `${s.warnings} warning${s.warnings === 1 ? '' : 's'}`) : ''
    return (
      <Box flexDirection="column">
        <Box flexDirection="row" gap={1}>
          <Text color={ALIA.aquaMark} bold>{GLYPH.brand}</Text>
          <Text bold>{label(kind, lang)}</Text>
          <Text color={TONE_OF[s.state]} dimColor={s.state === 'running'}>{MARK[s.state]}</Text>
          {s.line ? <Text dimColor wrap="truncate-end">{s.line}</Text> : null}
          {warn && s.state !== 'fail' ? <Text color={TONE.high}>{`${GLYPH.dot} ${warn}`}</Text> : null}
        </Box>
        {s.findings.map((f, i) => <Text key={`f-${i}`} color={TONE.critical} wrap="truncate-end">{`  ${f}`}</Text>)}
      </Box>
    )
  })

  // the raw result folds under the readable row; expanded, it is the engine's again
  on('ui.render', { component: 'ToolResult' }, async ($, e, next) => {
    if (e.props.isExpanded || !mine.has(e.props.tool_use_id)) return next(e)
    const { Box } = $.ui.resolve(e)
    return <Box />
  })
}
