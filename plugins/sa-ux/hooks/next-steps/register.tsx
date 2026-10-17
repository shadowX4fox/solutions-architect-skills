// sa-ux · next steps — the band above the prompt box: up to three prompts lifecycle.tsx computed from the project's
// state. A click fills the prompt with the step as a draft (nothing is sent); "hide" hides the set until it changes.
// No hotkeys: a band Button's digit also answers from an empty composer, so a digit typed to answer the model's own
// numbered options would take a step instead.
import { atom, read, update } from 'claude-code'
import type { On } from 'claude-code'

import type { Step } from '../../types'
import { GLYPH, TONE, cut, pad } from '../ui'
import { fingerprint } from './rules'

const dismissedAtom = atom({ plugin: 'sa-ux', key: 'nextStepsDismissed' } as const, '')
const langAtom = atom({ plugin: 'sa-ux', key: 'lang' } as const, 'en' as 'en' | 'es')
const stepsAtom = atom({ plugin: 'sa-ux', key: 'nextSteps' } as const, [] as Step[])

/** Next steps: the band above the prompt box. */
export function registerNextSteps(on: On) {
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const steps = await read($, stepsAtom)
    if (e.props.hasSurvey || !steps.length || (await read($, dismissedAtom)) === fingerprint(steps)) return next(e)

    const es = (await read($, langAtom)) === 'es'
    const { Box, Button, Text } = $.ui.resolve(e)
    const hide = () => update($, dismissedAtom, () => fingerprint(steps))
    const take = (s: Step) => async () => {
      await $.prompt.fill({ text: s.prompt })
      await hide()
    }

    // one row per step: the action (a click fills the prompt), then the fact behind it, dimmed and cut to the band
    const room = Math.max(20, e.props.bodyColumns - 2)
    const titleWidth = Math.max(...steps.map((s) => s.title.length))
    return (
      <Box flexDirection="column">
        <Box flexDirection="row" gap={1}>
          <Text color={TONE.info} bold>{`${GLYPH.brand} ${es ? 'Siguientes pasos' : 'Next steps'}`}</Text>
          <Text dimColor>{es ? `${steps.length} · clic para llenar el prompt, no lo envía` : `${steps.length} · click to fill the prompt, never sends it`}</Text>
        </Box>
        {steps.map((s) => (
          <Box key={`row-${s.id}`} flexDirection="row" gap={1}>
            <Button key={`step-${s.id}`} plain label={pad(s.title, titleWidth)} onPress={take(s)} />
            <Text dimColor>{cut(s.detail, Math.max(10, room - titleWidth - 5))}</Text>
          </Box>
        ))}
        <Button key="hide" plain dimColor label={es ? 'ocultar hasta que cambien' : 'hide until they change'} onPress={hide} />
      </Box>
    )
  })
}
