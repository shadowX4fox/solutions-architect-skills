// sa-alia · requirements coverage — `/alia cobertura` (`coverage`, `trazabilidad`) and her hub's button: the PO Spec's
// requirements against the architecture, from TRACEABILITY_REPORT.md read by code — the share covered, partial, not
// covered and undecided, each phase or increment, the gaps. It never shows an old figure as current: a report of another
// architecture version, or older than the PO Spec or the documents, says so. Re-checking is the model's work: its button
// fills the prompt, nothing is sent.
import { atom, read, update } from 'claude-code'
import type { EngineInterface, On } from 'claude-code'

import type { AliaLine, Coverage } from '../../types'

import { Codec, portrait } from '../alia/codec'
import { opener } from '../alia/open'
import { newestMd, type Io } from '../next-steps/rules'
import { COVERAGE_PANE } from '../state'
import { GLYPH, TONE, bar, cut } from '../ui'
import { coveredPct, parseCoverage } from './model'

const aliaAtom = atom({ plugin: 'sa-alia', key: 'alia' } as const, null as AliaLine | null)
const langAtom = atom({ plugin: 'sa-alia', key: 'lang' } as const, 'en' as 'en' | 'es')
const coverageAtom = atom({ plugin: 'sa-alia', key: 'coverage' } as const, null as Coverage | 'none' | 'no-spec' | null)

const REPORT = 'TRACEABILITY_REPORT.md'
const RECHECK = 'check requirements coverage'

/** Read the report now, and why it may no longer hold. */
async function readNow($: EngineInterface): Promise<Coverage | 'none' | 'no-spec'> {
  const root = String(await $.session.root()).replace(/\\/g, '/')
  if (!(await $.fs.exists(`${root}/PRODUCT_OWNER_SPEC.md`))) return 'no-spec'
  let md = ''
  try { md = String(await $.fs.read(`${root}/${REPORT}`)) } catch { return 'none' }
  const c = parseCoverage(md)
  if (!c) return 'none'
  const mt = async (p: string) => { try { return (await $.fs.stat(p)).mtimeMs } catch { return 0 } }
  const io: Io = { exists: (p) => $.fs.exists(p), read: (p) => $.fs.read(p), list: (p) => $.fs.list(p), stat: (p) => $.fs.stat(p) }
  const report = await mt(`${root}/${REPORT}`), stale: string[] = []
  let arch = ''
  try { arch = String(await $.fs.read(`${root}/ARCHITECTURE.md`)) } catch { arch = '' }
  const version = (arch.match(/ARCHITECTURE_VERSION:\s*([\d.]+)/) || [])[1]
  if (version && c.archVersion && c.archVersion !== version) stale.push(`arch:${c.archVersion}→${version}`)
  if ((await mt(`${root}/PRODUCT_OWNER_SPEC.md`)) > report) stale.push('spec')
  if (Math.max(await mt(`${root}/ARCHITECTURE.md`), await newestMd(io, `${root}/docs`)) > report) stale.push('docs')
  return { ...c, at: await $.clock.now(), file: `${root}/${REPORT}`, stale }
}

/** `/alia cobertura` and her hub's button: the report read, the pane opened; the text the command answers. */
export async function openCoverage($: EngineInterface): Promise<string> {
  const c = await readNow($)
  await update($, coverageAtom, () => c)
  const es = (await read($, langAtom)) === 'es'
  await $.ui.open({ id: COVERAGE_PANE, title: es ? 'Cobertura de requisitos' : 'Requirements coverage' })
  if (c === 'no-spec') return es ? 'Sin PRODUCT_OWNER_SPEC.md: la cobertura compara los requisitos del PO Spec con la arquitectura.' : 'No PRODUCT_OWNER_SPEC.md: coverage compares the PO Spec\'s requirements with the architecture.'
  if (c === 'none') return es ? `Aún no hay ${REPORT}: «${RECHECK}» lo genera.` : `No ${REPORT} yet: "${RECHECK}" makes it.`
  const s = es ? `${coveredPct(c)}% cubierto · ${c.partial} parciales · ${c.gaps} sin cubrir${c.undecided ? ` · ${c.undecided} sin decidir` : ''}` : `${coveredPct(c)}% covered · ${c.partial} partial · ${c.gaps} not covered${c.undecided ? ` · ${c.undecided} undecided` : ''}`
  return c.stale.length ? `${s} — ${es ? 'desactualizado' : 'out of date'}` : s
}

export function registerCoverage(on: On) {
  on('ui.render', { component: 'Pane', requestId: COVERAGE_PANE }, async ($, e) => {
    const els = $.ui.resolve(e)
    const { Box, Button, Text } = els
    const c = await read($, coverageAtom), say = await read($, aliaAtom), es = (await read($, langAtom)) === 'es'
    const head = <Codec els={els} say={say} svg={await portrait($, e.surface, say ? say.mood : 'calm')} kicker={es ? 'cobertura de requisitos' : 'requirements coverage'} />
    const recheck = (label: string) => (
      <Box flexDirection="row" gap={1}>
        <Text color={TONE.info}>{GLYPH.step}</Text>
        <Button key="cov-recheck" plain label={label} onPress={async () => { await $.prompt.fill({ text: RECHECK }) }} />
      </Box>
    )
    if (c === null || c === 'no-spec') return (
      <Box flexDirection="column" gap={1}>
        {head}
        <Text dimColor>{es ? 'La cobertura compara los requisitos del PO Spec (PRODUCT_OWNER_SPEC.md) con la arquitectura, y este proyecto no tiene uno.' : 'Coverage compares the PO Spec\'s requirements (PRODUCT_OWNER_SPEC.md) with the architecture, and this project has none.'}</Text>
      </Box>
    )
    if (c === 'none') return (
      <Box flexDirection="column" gap={1}>
        {head}
        <Text dimColor>{es ? `Aún no hay ${REPORT}.` : `No ${REPORT} yet.`}</Text>
        {recheck(es ? 'Revisar la cobertura (llena el prompt)' : 'Check the coverage (fills the prompt)')}
      </Box>
    )
    const width = Math.max(30, e.props.bodyColumns - 2), meter = width < 70 ? 8 : 14
    const tile = (key: string, value: string, label: string, tone: string | undefined) => (
      <Box key={key} flexDirection="column" borderStyle="round" borderDimColor paddingX={1}>
        <Text color={tone} bold>{value}</Text>
        <Text dimColor>{label}</Text>
      </Box>
    )
    const why = c.stale.map((s) => s.startsWith('arch:') ? (es ? `es de la arquitectura v${s.slice(5).replace('→', ', hoy v')}` : `it is of architecture v${s.slice(5).replace('→', ', now v')}`)
      : s === 'spec' ? (es ? 'el PO Spec cambió después' : 'the PO Spec changed after it') : (es ? 'los docs cambiaron después' : 'the documents changed after it'))
    const pct = coveredPct(c)
    return (
      <Box flexDirection="column" gap={1}>
        {head}
        {c.stale.length ? <Text color={TONE.high}>{`${GLYPH.stale} ${es ? 'Desactualizado' : 'Out of date'}: ${why.join(' · ')}. ${es ? 'Las cifras son las del reporte, no las de hoy.' : 'The figures are the report\'s, not today\'s.'}`}</Text> : null}
        <Box flexDirection="row" gap={1} flexWrap="wrap">
          {tile('c-pct', `${pct}%`, es ? 'cubierto' : 'covered', c.stale.length ? undefined : pct >= 90 ? TONE.ok : pct >= 70 ? TONE.high : TONE.critical)}
          {tile('c-part', String(c.partial), es ? 'parciales' : 'partial', c.partial ? TONE.high : TONE.ok)}
          {tile('c-gap', String(c.gaps), es ? 'sin cubrir' : 'not covered', c.gaps ? TONE.critical : TONE.ok)}
          {c.undecided ? tile('c-und', String(c.undecided), es ? 'sin decidir' : 'undecided', TONE.high) : null}
        </Box>
        {c.phases.length > 1 || (c.phases.length === 1 && c.phases[0]!.phase) ? (
          <Box flexDirection="column">
            {c.phases.map((p) => { const m = bar(p.covered, p.total, meter); const v = p.total ? Math.floor((p.covered / p.total) * 100) : 0; return (
              <Box key={`ph-${p.phase}`} flexDirection="row" gap={1}>
                <Text>{cut(p.phase, 18)}</Text>
                <Text color={TONE.ok}>{m.on}</Text><Text dimColor>{m.off}</Text>
                <Text dimColor>{`${v}% · ${p.covered}/${p.total}`}</Text>
              </Box>) })}
          </Box>
        ) : null}
        {c.notCovered.length ? (
          <Box flexDirection="column">
            <Text bold>{es ? 'Sin cubrir' : 'Not covered'}</Text>
            {c.notCovered.slice(0, 6).map((x, i) => <Text key={`nc-${i}`} color={TONE.critical} wrap="truncate-end">{`✗ UC ${x.uc} · ${cut(x.req, 100)}`}</Text>)}
            {c.notCovered.length > 6 ? <Text dimColor>{es ? `+${c.notCovered.length - 6} más en el reporte` : `+${c.notCovered.length - 6} more in the report`}</Text> : null}
          </Box>
        ) : null}
        {c.partials.length ? (
          <Box flexDirection="column">
            <Text bold>{es ? 'Parciales' : 'Partial'}</Text>
            {c.partials.slice(0, 4).map((x, i) => <Text key={`pa-${i}`} color={TONE.high} wrap="truncate-end">{`${GLYPH.stale} UC ${x.uc} · ${cut(x.req, 70)}${x.gap ? ` — ${cut(x.gap, 50)}` : ''}`}</Text>)}
            {c.partials.length > 4 ? <Text dimColor>{es ? `+${c.partials.length - 4} más en el reporte` : `+${c.partials.length - 4} more in the report`}</Text> : null}
          </Box>
        ) : null}
        <Box flexDirection="column">
          {recheck(es ? 'Volver a revisar la cobertura (llena el prompt)' : 'Check the coverage again (fills the prompt)')}
          <Box flexDirection="row" gap={1}>
            <Text color={TONE.info}>{GLYPH.step}</Text>
            <Button key="cov-open" plain label={es ? 'Abrir el reporte' : 'Open the report'} onPress={async () => { try { await $.process.run((await opener($))(c.file), { timeoutMs: 15000 }) } catch { /* no viewer */ } }} />
          </Box>
          <Text dimColor>{[c.date && (es ? `reporte del ${c.date}` : `report of ${c.date}`), c.archVersion && (es ? `arquitectura v${c.archVersion}` : `architecture v${c.archVersion}`), c.specVersion && `PO Spec v${c.specVersion}`].filter(Boolean).join(' · ')}</Text>
        </Box>
      </Box>
    )
  })
}
