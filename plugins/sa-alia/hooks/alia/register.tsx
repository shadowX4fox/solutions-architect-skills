// sa-alia · Alia — the suite's navigator, present in Claude Code: `/alia` opens her codec over the architecture (where it
// stands, her line, the way to every view), and everything of hers is under it, each view a subcommand that does what its
// button in her hub does — `/alia status` the release, `/alia radar` the risk, `/alia arch` the explorer, `/alia center` and
// `/alia video` the command center and the video when they exist (else the prompt that makes them); while a turn runs in an
// architecture the spinner says what an architect does. Her line is composed by code (voice.ts); she
// never sends a prompt and never edits a document.
import { atom, read } from 'claude-code'
import type { On, PluginOptions } from 'claude-code'

import type { AliaLine } from '../../types'

import { ALIA_PANE } from '../state'
import { GLYPH, TONE } from '../ui'
import { Codec, Mark, portrait } from './codec'
import { openArch } from '../explorer/register'
import { openRadar } from '../radar/register'
import { openStatus } from '../status/register'
import { openArtifact } from './open'
import { Helper, helperOf } from './helpers'
import { ALIA } from './palette'
import { DONE, SPINNER, pick } from './voice'

const aliaAtom = atom({ plugin: 'sa-alia', key: 'alia' } as const, null as AliaLine | null)
const langAtom = atom({ plugin: 'sa-alia', key: 'lang' } as const, 'en' as 'en' | 'es')

type View = 'status' | 'radar' | 'arch' | 'center' | 'video'

/** What the hub offers, in order: one button per view, and the same view as `/alia <view>`. */
const VIEWS: { key: View; en: string; es: string }[] = [
  { key: 'status', en: 'Where the release stands', es: 'Cómo va el release' },
  { key: 'radar', en: 'Risk radar', es: 'Radar de riesgo' },
  { key: 'arch', en: 'Browse the architecture', es: 'Explorar la arquitectura' },
  { key: 'center', en: 'Open the command center', es: 'Abrir el centro de mando' },
  { key: 'video', en: 'Watch the explainer video', es: 'Ver el video explicativo' },
]

/** Her subcommands, in either language: the view each is. */
const SUB: Record<string, View> = {
  status: 'status', release: 'status', estado: 'status',
  radar: 'radar', riesgo: 'radar', risk: 'radar',
  arch: 'arch', arquitectura: 'arch', architecture: 'arch', explorer: 'arch', explorar: 'arch',
  center: 'center', centro: 'center', mando: 'center', '3d': 'center',
  video: 'video', vídeo: 'video',
}
const SUBS = '/alia status · radar · arch · center · video'

/** One view, opened: a pane read now, or an artifact that exists (else its prompt filled). The command's text. */
async function openView($: Parameters<typeof openStatus>[0], v: View, es: boolean): Promise<string> {
  if (v === 'status') return openStatus($)
  if (v === 'radar') return openRadar($)
  if (v === 'arch') return openArch($)
  return openArtifact($, v, es)
}

export function registerAlia(on: On, options: PluginOptions) {
  const voice = options.voice !== false
  const replyCodec = options.replyCodec !== false

  on('command.run', { command: 'alia' }, async ($, e) => {
    const word = e.args.trim().toLowerCase(), sub = SUB[word]
    const es = (await read($, langAtom)) === 'es'
    if (sub) return { text: await openView($, sub, es) }
    const say = await read($, aliaAtom)
    await $.ui.open({ id: ALIA_PANE, title: 'Alia' })
    const unknown = word ? (es ? ` (no conozco «${e.args.trim()}»: ${SUBS})` : ` (unknown "${e.args.trim()}": ${SUBS})`) : ''
    return { text: (say ? `${GLYPH.brand} Alia: ${say.line}` : es ? 'Aquí no hay arquitectura (sin ARCHITECTURE.md).' : 'No architecture here (no ARCHITECTURE.md).') + unknown }
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
        <Codec els={els} say={say} svg={await portrait($, e.surface, say.mood)}
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
              <Button key={`v-${v.key}`} plain label={es ? v.es : v.en} onPress={async () => { await openView($, v.key, es) }} />
            </Box>
          ))}
        </Box>
        <Text dimColor>{es ? `Cada vista abre directo; lo que hay que generar llena el prompt, nada se envía solo. También: ${SUBS}` : `Each view opens directly; what must be made fills the prompt, nothing is sent on its own. Also: ${SUBS}`}</Text>
      </Box>
    )
  })

  // `/alia`'s line in the transcript, as her codec; the model reads the text the command answered, unchanged
  on('ui.render', { component: 'CommandOutput' }, async ($, e, next) => {
    if (e.props.command !== 'alia' || e.props.isErrored || e.props.args.trim()) return next(e)
    const say = await read($, aliaAtom)
    if (!say) return next(e)
    const es = (await read($, langAtom)) === 'es'
    const els = $.ui.resolve(e)
    return <Codec els={els} say={say} svg={await portrait($, e.surface, say.mood)} kicker={[say.name, say.version ? `v${say.version}` : '', say.status].filter(Boolean).join(` ${GLYPH.dot} `) || (es ? 'arquitectura' : 'architecture')} />
  })

  // every reply in her codec, inside an architecture: her mark and name beside the reply's first block; the text is the engine's own drawing, untouched, and the stored message too (ctrl+o shows it).
  // Her calm face: a reply is her voice, not a judgement — the mood ring stays for those. Summaries pass as they are.
  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    // only the reply's first block carries her codec; a later block is the engine's own drawing, untouched — wrapped to line up
    // under her name, the desktop app (2.1.316) shrank it to its narrowest content at the right edge, one word a line (1.0.3)
    if (!replyCodec || e.props.isSummary || !e.props.isFirstOfReply || !(await read($, aliaAtom))) return next(e)
    const engine = await next(e)
    const els = $.ui.resolve(e)
    const { Box, Text } = els
    const svg = await portrait($, e.surface, 'calm')
    // her face at the start of the reply, beside her name — never centred on a long reply
    return (
      <Box flexDirection="row" gap={1} alignItems="flex-start" alignSelf="flex-start">
        <Mark els={els} mood="calm" svg={svg} />
        <Box flexDirection="column" flexGrow={1} flexShrink={1}>
          <Text color={ALIA.aquaMark} bold>Alia</Text>
          {engine}
        </Box>
      </Box>
    )
  })

  // her helpers: a sub-agent's message row under a smaller face of hers, one per role (1.1.0) — inside an architecture,
  // with the reply codec on; every other user-role row (the person's prompt, a shell's notice) passes as it is
  on('ui.render', { component: 'UserMessage' }, async ($, e, next) => {
    if (!replyCodec || !(e.props.from || e.props.task) || !(await read($, aliaAtom))) return next(e)
    const who = await helperOf($, e.props)
    if (!who) return next(e)
    const row = await next(e)
    return await Helper($, $.ui.resolve(e), e.surface, who, await read($, langAtom), row)
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
