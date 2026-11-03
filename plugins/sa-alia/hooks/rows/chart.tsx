// sa-alia · the analyses' pictures, natively — when a session runs sa-analysis' `analysis-chart.js`, the SVG it writes
// beside its PNG becomes a card she places in the transcript: the same picture Alia's pull request comment opens on, drawn
// by the app. A card, not the script's row: the desktop app folds command rows into "Ran a command", and a picture there
// stays unseen (1.5.0). The terminal draws no pictures: its card names the file.
import { atom, read, update } from 'claude-code'
import type { On } from 'claude-code'

import { ALIA } from '../alia/palette'
import { GLYPH } from '../ui'
import { chartOf, recognize } from './model'

type Chart = { id: string; file: string; svg: string }
const chartsAtom = atom({ plugin: 'sa-alia', key: 'charts' } as const, [] as Chart[])
const langAtom = atom({ plugin: 'sa-alia', key: 'lang' } as const, 'en' as 'en' | 'es')

const SVG_MAX = 131072   // the Svg element's limit

export function registerCharts(on: On) {
  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const r = await next(e)
    const k = recognize(String(e.command ?? ''))
    if (!k || k.script !== 'analysis-chart.js') return r
    // every step that leaves no card says why, as a dim line (never sent to the model): a card that silently never appeared
    // could not be told apart from a surface that does not draw placed rows (1.6.1)
    const why = (reason: string) => { try { $.ui.log(`sa-alia · ${reason}`) } catch { /* a build without log lines */ } }
    try {
      const out = (r as { result?: unknown; isError?: boolean })
      if (out.isError || !out.result) return r
      if (String(e.command).includes('--json')) return r   // the figure's data, for a chat's native visual: no picture to place
      const file = chartOf(out.result)
      if (!file) { why('chart card: the script printed no picture path'); return r }
      let svg = ''
      try { svg = String(await $.fs.read(file)) } catch (err) { why(`chart card: cannot read ${file} (${(err as Error)?.message ?? err})`); return r }
      if (!svg.startsWith('<svg')) { why(`chart card: ${file} is not an SVG`); return r }
      if (svg.length > SVG_MAX) { why(`chart card: ${file} is over ${SVG_MAX} characters`); return r }
      const id = `chart-${(await $.clock.now()).toString(36)}`   // place ids: 1–64 of [A-Za-z0-9_-]
      await update($, chartsAtom, (xs) => [...xs, { id, file, svg }].slice(-6))
      const placed = await $.ui.place({ id })
      if (!placed.isPlaced) why(`chart card not drawn: ${placed.reason}`)
    } catch (err) { why(`chart card failed: ${(err as Error)?.message ?? err}`) }
    return r
  })

  on('ui.render', { component: 'Placed' }, async ($, e, next) => {
    if (e.props.plugin !== 'sa-alia') return next(e)
    const c = (await read($, chartsAtom)).find((x) => x.id === e.props.id)
    if (!c) return next(e)
    const es = (await read($, langAtom)) === 'es'
    const { Box, Text, Svg } = $.ui.resolve(e) as { Box: any; Text: any; Svg?: any }
    const pictures = e.surface !== 'terminal' && Svg
    return (
      <Box flexDirection="column">
        <Box flexDirection="row" gap={1}>
          <Text color={ALIA.aquaMark} bold>{GLYPH.brand}</Text>
          <Text bold>{es ? 'Gráfica del análisis' : 'Analysis chart'}</Text>
          {pictures ? null : <Text dimColor wrap="truncate-end">{c.file.replace(/\.svg$/i, '.png')}</Text>}
        </Box>
        {pictures ? <Svg source={c.svg} alt={es ? 'Gráfica de los análisis de la arquitectura' : 'Chart of the architecture analyses'} width={720} /> : null}
      </Box>
    )
  })
}
