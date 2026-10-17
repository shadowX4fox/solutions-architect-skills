// sa-ux · radar — the status line carries the summary (lifecycle.tsx writes it); `/radar` opens the detail: each lens's
// newest report with its critical and high findings and age, the TDRs by status, and a button
// per stale lens that fills the prompt to rerun it (a draft — nothing is sent).
import { atom, read } from 'claude-code'
import type { On } from 'claude-code'

import type { Radar } from '../../types'

import { RADAR_PANE } from '../state'
import { GLYPH, TONE, bar, pad, padLeft, rule, type Tone } from '../ui'

const radarAtom = atom({ plugin: 'sa-ux', key: 'radar' } as const, null as Radar | null)

/** Radar: `/radar`, the risk detail behind the status line. */
export function registerRadar(on: On) {
  on('command.run', { command: 'radar' }, async $ => {
    const r = await read($, radarAtom)
    await $.ui.open({ id: RADAR_PANE, title: r && r.lang === 'es' ? 'Radar de riesgo' : 'Risk radar' })
    return { text: r ? r.line : 'No architecture here (no ARCHITECTURE.md), or the radar has not been read yet.' }
  })

  on('ui.render', { component: 'Pane', requestId: RADAR_PANE }, async ($, e) => {
    const { Box, Button, Text } = $.ui.resolve(e)
    const r = await read($, radarAtom)
    if (!r) return (
      <Box flexDirection="column">
        <Text color={TONE.info} bold>{`${GLYPH.brand} Risk radar`}</Text>
        <Text dimColor>No architecture here (no ARCHITECTURE.md).</Text>
      </Box>
    )
    const es = r.lang === 'es'
    const width = Math.max(30, e.props.bodyColumns - 2)
    const critical = r.lenses.reduce((n, l) => n + l.critical, 0), high = r.lenses.reduce((n, l) => n + l.high, 0)
    const debt = (r.tdrs['Open'] || 0) + (r.tdrs['Planned'] || 0) + (r.tdrs['In Progress'] || 0)
    const stale = r.lenses.filter((l) => l.stale)
    // the meter of a lens: critical counts double, scaled to the heaviest lens
    const weight = (l: { critical: number; high: number }) => l.critical * 2 + l.high
    const heaviest = Math.max(1, ...r.lenses.map(weight))
    const METER = 10
    const lenses = [...r.lenses].sort((a, b) => weight(b) - weight(a))
    const tile = (key: string, value: string, label: string, tone: Tone) => (
      <Box key={key} flexDirection="column" borderStyle="round" borderDimColor paddingX={1}>
        <Text color={tone} bold>{value}</Text>
        <Text dimColor>{label}</Text>
      </Box>
    )
    return (
      <Box flexDirection="column">
        <Box flexDirection="row" gap={1} flexWrap="wrap">
          {tile('t-crit', String(critical), es ? 'críticos' : 'critical', critical ? TONE.critical : TONE.ok)}
          {tile('t-high', String(high), es ? 'altos' : 'high', high ? TONE.high : TONE.ok)}
          {tile('t-debt', String(debt), es ? 'TDR abiertos' : 'open TDRs', debt ? TONE.high : TONE.ok)}
        </Box>
        {r.findingsNote ? <Text color={TONE.high}>{`${GLYPH.stale} ${r.findingsNote}`}</Text> : null}

        {lenses.length ? <Text dimColor>{`${pad(es ? 'lente' : 'lens', 17)}${pad('', METER + 1)}${padLeft(es ? 'crít' : 'crit', 5)}${padLeft(es ? 'altos' : 'high', 6)}${padLeft('total', 6)}  ${es ? 'reporte' : 'report'}`}</Text> : null}
        {lenses.map((l) => { const m = bar(weight(l), heaviest, METER); return (
          <Box key={`lens-${l.lens}`} flexDirection="row">
            <Text dimColor={!weight(l)}>{pad(l.lens.toLowerCase(), 17)}</Text>
            <Text color={l.critical ? TONE.critical : TONE.high}>{m.on}</Text>
            <Text dimColor>{`${m.off} `}</Text>
            <Text color={l.critical ? TONE.critical : undefined} dimColor={!l.critical}>{padLeft(String(l.critical), 5)}</Text>
            <Text color={l.high ? TONE.high : undefined} dimColor={!l.high}>{padLeft(String(l.high), 6)}</Text>
            <Text dimColor>{`${padLeft(String(l.total), 6)}  ${l.date}`}</Text>
            {l.stale ? <Text color={TONE.high}>{` ${GLYPH.stale} ${l.ageDays} d`}</Text> : <Text dimColor>{` ${l.ageDays} d`}</Text>}
          </Box>
        ) })}
        <Text dimColor>{rule(width)}</Text>

        <Box flexDirection="row" gap={1}>
          <Text dimColor>{pad(es ? 'deuda' : 'debt', 13)}</Text>
          {Object.keys(r.tdrs).length ? Object.entries(r.tdrs).map(([st, n]) => (
            <Text key={`tdr-${st}`} color={st === 'Open' ? TONE.critical : /^(Resolved|Won't Fix)$/.test(st) ? TONE.ok : TONE.high}>{`${/^(Resolved|Won't Fix)$/.test(st) ? GLYPH.debtDone : GLYPH.debtOpen} ${st} ${n}`}</Text>
          )) : <Text dimColor>—</Text>}
        </Box>

        {stale.length ? <Text dimColor>{rule(width)}</Text> : null}
        {stale.length ? <Text color={TONE.high}>{es ? `${GLYPH.stale} ${stale.length} análisis más viejos que los docs — volver a correr (llena el prompt):` : `${GLYPH.stale} ${stale.length} analyses older than the docs — rerun (fills the prompt):`}</Text> : null}
        <Box flexDirection="row" gap={2} flexWrap="wrap">
          {stale.slice(0, 9).map((l, i) => (
            <Button key={`rerun-${l.lens}`} hotkey={String(i + 1)} plain label={l.lens.toLowerCase()}
              onPress={async () => { await $.prompt.fill({ text: `run ${l.lens.toLowerCase().replace(/-/g, ' ')} analysis` }) }} />
          ))}
        </Box>
      </Box>
    )
  })
}
