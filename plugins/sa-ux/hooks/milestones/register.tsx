// sa-ux · milestones — the cards lifecycle.tsx places in the transcript when a turn moved the project: a release, an
// analysis run, a handoff kit. Each is Alia's codec — her mark in the card's mood, the title as her line, the facts beneath.
import { atom, read } from 'claude-code'
import type { On } from 'claude-code'

import type { Milestone } from '../../types'

import { Codec, portrait } from '../alia/codec'
import { GLYPH } from '../ui'

const milestonesAtom = atom({ plugin: 'sa-ux', key: 'milestones' } as const, [] as Milestone[])
const langAtom = atom({ plugin: 'sa-ux', key: 'lang' } as const, 'en' as 'en' | 'es')

const KICKER = { release: ['release', 'release'], analysis: ['analysis', 'análisis'], kit: ['handoff kit', 'kit de handoff'] } as const

export function registerMilestones(on: On) {
  on('ui.render', { component: 'Placed' }, async ($, e, next) => {
    if (e.props.plugin !== 'sa-ux') return next(e)
    const m = (await read($, milestonesAtom)).find((x) => x.id === e.props.id)
    if (!m) return next(e)
    const es = (await read($, langAtom)) === 'es'
    const els = $.ui.resolve(e)
    const { Box, Text } = els
    return (
      <Box flexDirection="column" borderStyle="round" borderDimColor paddingX={1}>
        <Codec els={els} say={{ mood: m.mood, line: m.title }} svg={await portrait($, e.surface, m.mood)} kicker={KICKER[m.kind][es ? 1 : 0]}>
          {m.lines.map((l, i) => <Text key={`l-${i}`} dimColor wrap="wrap">{`${GLYPH.step} ${l}`}</Text>)}
        </Codec>
      </Box>
    )
  })
}
