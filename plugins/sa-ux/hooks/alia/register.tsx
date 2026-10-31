// sa-ux · Alia — the suite's navigator, present in Claude Code: `/alia` opens her codec over the architecture (where it
// stands, her line, the way to every view, each a draft in the prompt) — on the desktop her face speaks for a moment
// when it opens —, and while
// a turn runs in an architecture the spinner says what an architect does. Her line is composed by code (voice.ts); she
// never sends a prompt and never edits a document.
import { atom, read } from 'claude-code'
import type { On, PluginOptions } from 'claude-code'

import type { AliaLine } from '../../types'

import { ALIA_PANE, RADAR_PANE } from '../state'
import { GLYPH, TONE } from '../ui'
import { Codec, portrait } from './codec'
import { DONE, SPINNER, pick } from './voice'

const aliaAtom = atom({ plugin: 'sa-ux', key: 'alia' } as const, null as AliaLine | null)
const langAtom = atom({ plugin: 'sa-ux', key: 'lang' } as const, 'en' as 'en' | 'es')

/** What the hub offers: each fills the prompt with the words that route to the skill, or opens a pane of this plugin. */
const VIEWS: { key: string; en: string; es: string; prompt?: string; pane?: string }[] = [
  { key: 'v-status', en: 'Where the release stands', es: 'Cómo va el release', prompt: 'architecture status' },
  { key: 'v-radar', en: 'Risk radar', es: 'Radar de riesgo', pane: RADAR_PANE },
  { key: 'v-arch', en: 'Browse the architecture', es: 'Explorar la arquitectura', prompt: '/arch' },
  { key: 'v-center', en: 'Open the command center', es: 'Abrir el centro de mando', prompt: 'command center' },
  { key: 'v-video', en: 'Make the explainer video', es: 'Hacer el video explicativo', prompt: 'architecture video' },
]

export function registerAlia(on: On, options: PluginOptions) {
  const voice = options.voice !== false

  on('command.run', { command: 'alia' }, async $ => {
    const say = await read($, aliaAtom)
    const es = (await read($, langAtom)) === 'es'
    await $.ui.open({ id: ALIA_PANE, title: 'Alia' })
    return { text: say ? `${GLYPH.brand} Alia: ${say.line}` : es ? 'Aquí no hay arquitectura (sin ARCHITECTURE.md).' : 'No architecture here (no ARCHITECTURE.md).' }
  })

  on('ui.render', { component: 'Pane', requestId: ALIA_PANE }, async ($, e) => {
    const els = $.ui.resolve(e)
    const { Box, Button, Text } = els
    const say = await read($, aliaAtom)
    const es = (await read($, langAtom)) === 'es'
    if (!say) return (
      <Codec els={els} say={null} svg={await portrait($, e.surface, 'calm')} kicker="sa-skills">
        <Text dimColor>{es ? 'Aquí no hay arquitectura (sin ARCHITECTURE.md). Pídeme «crea la arquitectura» para empezar.' : 'No architecture here (no ARCHITECTURE.md). Ask to "create the architecture" to begin.'}</Text>
      </Codec>
    )
    const status = say.status === 'Released' ? TONE.ok : say.status === 'Deprecated' ? TONE.critical : TONE.high
    return (
      <Box flexDirection="column" gap={1}>
        <Codec els={els} say={say} svg={await portrait($, e.surface, say.mood, true)} interactive
          kicker={say.name || (es ? 'arquitectura' : 'architecture')}>
          <Box flexDirection="row" gap={1}>
            {say.version ? <Text bold>{`v${say.version}`}</Text> : null}
            <Text color={status}>{say.status}</Text>
          </Box>
        </Codec>
        <Box flexDirection="column">
          {VIEWS.map((v) => (
            <Box key={`row-${v.key}`} flexDirection="row" gap={1}>
              <Text color={TONE.info}>{GLYPH.step}</Text>
              <Button key={v.key} plain label={es ? v.es : v.en} onPress={async () => {
                if (v.pane) await $.ui.open({ id: v.pane, title: es ? v.es : v.en })
                else if (v.prompt) await $.prompt.fill({ text: v.prompt })
              }} />
            </Box>
          ))}
        </Box>
        <Text dimColor>{es ? 'Cada opción llena el prompt; nada se envía solo.' : 'Each fills the prompt; nothing is sent on its own.'}</Text>
      </Box>
    )
  })

  // `/alia`'s line in the transcript, as her codec; the model reads the text the command answered, unchanged
  on('ui.render', { component: 'CommandOutput' }, async ($, e, next) => {
    if (e.props.command !== 'alia' || e.props.isErrored) return next(e)
    const say = await read($, aliaAtom)
    if (!say) return next(e)
    const es = (await read($, langAtom)) === 'es'
    const els = $.ui.resolve(e)
    return <Codec els={els} say={say} svg={await portrait($, e.surface, say.mood)} kicker={[say.name, say.version ? `v${say.version}` : '', say.status].filter(Boolean).join(` ${GLYPH.dot} `) || (es ? 'arquitectura' : 'architecture')} />
  })

  // the architecture in the prompt footer, beside the engine's modes: `✦ v1.10.2 Released` — what every turn works on
  on('ui.render', { component: 'SessionMode' }, async ($, e, next) => {
    const say = await read($, aliaAtom)
    if (!say || !say.version) return next(e)
    return next({ ...e, props: { ...e.props, modes: [...e.props.modes, `${GLYPH.brand} v${say.version} ${say.status}`] } })
  })

  // her words on the spinner and the turn's closing line — only inside an architecture, and only with `voice` on
  on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
    if (!voice || !(await read($, aliaAtom))) return next(e)
    const lang = await read($, langAtom)
    return next({ ...e, props: { ...e.props, word: pick(SPINNER[lang], e.props.word) } })
  })
  on('ui.render', { component: 'TurnDuration' }, async ($, e, next) => {
    if (!voice || (await read($, langAtom)) !== 'en' || !(await read($, aliaAtom))) return next(e)
    return next({ ...e, props: { ...e.props, word: pick(DONE, e.props.word) } })
  })
}
