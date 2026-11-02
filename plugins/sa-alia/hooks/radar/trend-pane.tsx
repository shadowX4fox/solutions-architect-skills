// sa-alia · risk trend — `/alia trend` (`tendencia`) and her hub's button: each lens's critical and high findings over the
// readings the radar remembered, a larger chart on a surface that draws pictures and a line of numbers in the terminal, and
// the change since the previous reading. Split from the radar (1.5.0) so neither is too wide for a laptop's pane.
import { atom, read } from 'claude-code'
import type { EngineInterface, On } from 'claude-code'

import type { AliaLine, Radar } from '../../types'

import { Codec, portrait } from '../alia/codec'
import { TREND_PANE } from '../state'
import { TONE } from '../ui'
import { change, sparkline } from './trend'

const aliaAtom = atom({ plugin: 'sa-alia', key: 'alia' } as const, null as AliaLine | null)
const radarAtom = atom({ plugin: 'sa-alia', key: 'radar' } as const, null as Radar | null)

const CHART_W = 300, CHART_H = 48

/** `/alia trend` and her hub's button: the pane opened; the text the command answers. */
export async function openTrend($: EngineInterface): Promise<string> {
  const r = await read($, radarAtom)
  await $.ui.open({ id: TREND_PANE, title: r && r.lang === 'es' ? 'Tendencia de riesgo' : 'Risk trend' })
  const n = r && r.trend ? Object.values(r.trend).filter((p) => p.length > 1).length : 0
  return r && r.lang === 'es' ? `Tendencia de riesgo: ${n} lente${n === 1 ? '' : 's'} con más de una lectura.` : `Risk trend: ${n} lens${n === 1 ? '' : 'es'} with more than one reading.`
}

export function registerTrend(on: On) {
  on('ui.render', { component: 'Pane', requestId: TREND_PANE }, async ($, e) => {
    const els = $.ui.resolve(e) as { Box: any; Text: any; Svg?: any }
    const { Box, Text, Svg } = els
    const r = await read($, radarAtom), say = await read($, aliaAtom)
    const es = !r || r.lang === 'es'
    const head = <Codec els={els as never} say={say} svg={await portrait($, e.surface, say ? say.mood : 'calm')} kicker={es ? 'tendencia de riesgo' : 'risk trend'} />
    const lenses = r ? [...r.lenses].sort((a, b) => b.critical * 2 + b.high - (a.critical * 2 + a.high)).filter((l) => (r.trend?.[l.lens] || []).length > 1) : []
    if (!r || !lenses.length) return (
      <Box flexDirection="column" gap={1}>
        {head}
        <Text dimColor>{es ? 'Aún no hay tendencia: hace falta más de una lectura de un análisis (cada corrida del radar la guarda).' : 'No trend yet: a lens needs more than one reading (each radar reading is kept).'}</Text>
      </Box>
    )
    const pictures = e.surface !== 'terminal' && Svg
    const tone = (d: number) => (d > 0 ? TONE.critical : d < 0 ? TONE.ok : undefined)
    return (
      <Box flexDirection="column" gap={1}>
        {head}
        {lenses.map((l) => {
          const pts = r.trend![l.lens]!, last = pts[pts.length - 1]!, c = change(pts)!
          const svg = pictures ? sparkline(pts, r.lang, CHART_W, CHART_H) : null
          const said = es ? `${c.arrow} ${c.critical >= 0 ? '+' : ''}${c.critical} críticos · ${c.high >= 0 ? '+' : ''}${c.high} altos desde ${pts[pts.length - 2]!.date}`
            : `${c.arrow} ${c.critical >= 0 ? '+' : ''}${c.critical} critical · ${c.high >= 0 ? '+' : ''}${c.high} high since ${pts[pts.length - 2]!.date}`
          return (
            <Box key={`t-${l.lens}`} flexDirection="column">
              <Box flexDirection="row" gap={1}>
                <Text bold>{l.lens.toLowerCase()}</Text>
                <Text color={last.critical ? TONE.critical : undefined} dimColor={!last.critical}>{es ? `${last.critical} crít` : `${last.critical} crit`}</Text>
                <Text color={last.high ? TONE.high : undefined} dimColor={!last.high}>{es ? `${last.high} altos` : `${last.high} high`}</Text>
                <Text color={tone(c.critical * 2 + c.high)}>{said}</Text>
              </Box>
              {svg ? <Svg source={svg} alt={es ? `tendencia de ${l.lens}` : `${l.lens} trend`} width={CHART_W} height={CHART_H} />
                : <Text dimColor wrap="truncate-end">{pts.map((p) => `${p.date.slice(5)} ${p.critical}/${p.high}`).join('  →  ')}</Text>}
            </Box>
          )
        })}
        <Text dimColor>{es ? 'Rojo: críticos · ámbar: altos. Una lectura por corrida del radar.' : 'Red: critical · amber: high. One reading per radar run.'}</Text>
      </Box>
    )
  })
}
