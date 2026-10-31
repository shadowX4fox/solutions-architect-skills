// sa-ux · next steps — the band above the prompt box, under Alia's blazon (her escudo where pictures draw, the bare
// sparkle in the terminal — never her face, which is her voice in a codec), her line,
// then up to three prompts lifecycle.tsx computed from the project's state. A click fills the prompt with the step as a draft (nothing is sent); "hide" hides the set until it changes.
// No hotkeys: a band Button's digit also answers from an empty composer, so a digit typed to answer the model's own
// numbered options would take a step instead.
import { atom, read, update } from 'claude-code'
import type { On } from 'claude-code'

import type { AliaLine, Step } from '../../types'

import { Codec, blazon } from '../alia/codec'
import { GLYPH, TONE, cut, pad } from '../ui'
import { fingerprint } from './rules'

const aliaAtom = atom({ plugin: 'sa-ux', key: 'alia' } as const, null as AliaLine | null)
const dismissedAtom = atom({ plugin: 'sa-ux', key: 'nextStepsDismissed' } as const, '')
const langAtom = atom({ plugin: 'sa-ux', key: 'lang' } as const, 'en' as 'en' | 'es')
const stepsAtom = atom({ plugin: 'sa-ux', key: 'nextSteps' } as const, [] as Step[])

/** Next steps: the band above the prompt box. */
export function registerNextSteps(on: On) {
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const steps = await read($, stepsAtom)
    if (e.props.hasSurvey || !steps.length || (await read($, dismissedAtom)) === fingerprint(steps)) return next(e)

    const es = (await read($, langAtom)) === 'es'
    const say = await read($, aliaAtom)
    const els = $.ui.resolve(e)
    const { Box, Button, Text } = els
    const hide = () => update($, dismissedAtom, () => fingerprint(steps))
    const take = (s: Step) => async () => {
      await $.prompt.fill({ text: s.prompt })
      await hide()
    }

    // the band carries her blazon, not her face: a face in a ring is her talking (the codec); the steps are what she
    // offers. In the terminal the bare sparkle (the codec's is ringed). Left out where the band is narrow.
    const showMark = e.props.bodyColumns >= 60
    const svg = showMark ? await blazon($, e.surface) : null
    const room = Math.max(20, e.props.bodyColumns - 2 - (showMark ? 2 : 0))
    const titleWidth = Math.max(...steps.map((s) => s.title.length))
    return (
      <Codec els={els} say={say} svg={svg} showMark={showMark} blazon
        kicker={es ? `siguientes pasos ${GLYPH.dot} clic para llenar el prompt, no lo envía` : `next steps ${GLYPH.dot} click to fill the prompt, never sends it`}>
        {steps.map((s) => (
          <Box key={`row-${s.id}`} flexDirection="row" gap={1}>
            <Text color={TONE.info}>{GLYPH.step}</Text>
            <Button key={`step-${s.id}`} plain label={pad(s.title, titleWidth)} onPress={take(s)} />
            <Text dimColor>{cut(s.detail, Math.max(10, room - titleWidth - 7))}</Text>
          </Box>
        ))}
        <Button key="hide" plain dimColor label={es ? 'ocultar hasta que cambien' : 'hide until they change'} onPress={hide} />
      </Codec>
    )
  })
}
