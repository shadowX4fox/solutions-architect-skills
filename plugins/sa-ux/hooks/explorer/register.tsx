// sa-ux · explorer — `/arch` opens a pane over the facts ledger: containers, integrations, ADRs, TDRs, and a card per
// element whose actions fill the prompt (a draft — nothing is sent on its own).
import { atom, read, update } from 'claude-code'
import type { EngineInterface, On } from 'claude-code'

import type { ExplorerFacts, ExplorerScope, ExplorerTab } from '../../types'
import { ARCH_PANE } from '../state'
import type { Io } from '../next-steps/rules'
import { GLYPH, TONE, cut, pad, rule } from '../ui'
import { Codec, portrait } from '../alia/codec'
import { neighbourhoodSvg } from './diagram'
import { aliaOnExplorer, card, inFilter, loadFacts, rows } from './model'

const factsAtom = atom({ plugin: 'sa-ux', key: 'explorerFacts' } as const, null as ExplorerFacts | null)
const pageAtom = atom({ plugin: 'sa-ux', key: 'explorerPage' } as const, 0)
const selectedAtom = atom({ plugin: 'sa-ux', key: 'explorerSelected' } as const, null as string | null)
const tabAtom = atom({ plugin: 'sa-ux', key: 'explorerTab' } as const, 'components' as ExplorerTab)
const scopeAtom = atom({ plugin: 'sa-ux', key: 'explorerScope' } as const, 'all' as ExplorerScope)

const PANE = ARCH_PANE
const TABS: { tab: ExplorerTab; key: string; en: string; es: string }[] = [
  { tab: 'components', key: 'c', en: 'Containers', es: 'Contenedores' },
  { tab: 'integrations', key: 'i', en: 'Integrations', es: 'Integraciones' },
  { tab: 'adrs', key: 'a', en: 'ADRs', es: 'ADR' },
  { tab: 'tdrs', key: 't', en: 'TDRs', es: 'TDR' },
]

/** Re-read the ledger: on /arch, so the pane shows the project as it stands. */
async function reload($: EngineInterface) {
  const io: Io = { exists: (p) => $.fs.exists(p), read: (p) => $.fs.read(p), list: (p) => $.fs.list(p), stat: (p) => $.fs.stat(p) }
  const facts = await loadFacts(io, await $.session.root())
  await update($, factsAtom, () => facts)
}

/** Explorer: `/arch`, a pane over the architecture's containers, integrations, ADRs and TDRs. */
export function registerExplorer(on: On) {
  on('command.run', { command: 'arch' }, async $ => {
    await reload($)
    const f = await read($, factsAtom)
    await $.ui.open({ id: PANE, title: f && f.lang === 'es' ? 'Arquitectura' : 'Architecture' })
    return { text: f ? (f.lang === 'es' ? 'Panel de arquitectura abierto.' : 'Architecture pane opened.') : 'No facts ledger yet (.cache/sa-skills/facts.json) — run any sa-skills workflow on this architecture first.' }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const els = $.ui.resolve(e)
    const { Box, Button, Text } = els
    const f = await read($, factsAtom)
    const mono = e.surface === 'terminal'   // fields line up by padding in a monospaced cell grid; elsewhere, by columns
    if (!f) return (
      <Box flexDirection="column">
        <Text color={TONE.info} bold>{`${GLYPH.brand} Architecture`}</Text>
        <Text dimColor>No facts ledger yet (.cache/sa-skills/facts.json). Run any sa-skills workflow on this architecture, then /arch again.</Text>
      </Box>
    )
    const es = f.lang === 'es'
    const tab = await read($, tabAtom), page = await read($, pageAtom), selected = await read($, selectedAtom), scope = await read($, scopeAtom)
    const width = Math.max(30, e.props.bodyColumns - 2)
    const total: Record<ExplorerTab, number> = { components: f.components.length, integrations: f.integrations.length, adrs: f.adrs.length, tdrs: f.tdrs.length }
    const go = (x: ExplorerTab) => async () => { await update($, tabAtom, () => x); await update($, pageAtom, () => 0); await update($, selectedAtom, () => null) }
    // her codec heads the pane: what the open tab or card comes to
    const say = aliaOnExplorer(f, tab, selected)
    const header = <Codec els={els} say={say} svg={await portrait($, e.surface, say.mood)} kicker={es ? 'explorador' : 'explorer'} />
    // the tab bar: the open tab is a solid chip, the others are keys
    const tabs = (
      <Box flexDirection="column">
        {header}
        <Box flexDirection="row" gap={2}>
          {TABS.map((x) => (x.tab === tab
            ? <Text key={`on-${x.tab}`} inverse bold>{` ${es ? x.es : x.en} ${total[x.tab]} `}</Text>
            : <Button key={`tab-${x.tab}`} hotkey={x.key} plain dimColor label={`${es ? x.es : x.en} ${total[x.tab]}`} onPress={go(x.tab)} />))}
        </Box>
        <Text dimColor>{rule(width)}</Text>
      </Box>
    )

    if (selected) {
      const c = card(f, tab, selected)
      if (c) {
        const labelWidth = Math.max(...c.lines.map(([k]) => k.length), 0)
        // on a surface that draws pictures, a container's card shows its neighbourhood; the terminal keeps the lists
        const map = !mono && tab === 'components' ? neighbourhoodSvg(f, selected) : null
        const Svg = (els as { Svg?: any }).Svg
        return (
          <Box flexDirection="column">
            {tabs}
            <Box flexDirection="column" borderStyle="round" borderDimColor paddingX={1}>
              <Text bold wrap="truncate-end">{c.title}</Text>
              <Text color={c.badge.tone} dimColor={!c.badge.tone}>{`${c.badge.glyph} ${c.badge.text}`}</Text>
              {mono ? c.lines.map(([k, v]) => (
                <Box key={`l-${k}`} flexDirection="row" gap={1}>
                  <Text dimColor>{pad(k, labelWidth)}</Text>
                  <Box flexShrink={1}><Text wrap="wrap">{v}</Text></Box>
                </Box>
              )) : (
                <Box flexDirection="row" gap={2}>
                  <Box flexDirection="column">{c.lines.map(([k]) => <Text key={`k-${k}`} dimColor>{k}</Text>)}</Box>
                  <Box flexDirection="column" flexShrink={1}>{c.lines.map(([k, v]) => <Text key={`v-${k}`} wrap="truncate-end">{v}</Text>)}</Box>
                </Box>
              )}
              {map && Svg ? <Box marginTop={1}><Svg source={map} alt={es ? `Vecindario de ${c.title}` : `${c.title}'s neighbourhood`} /></Box> : null}
              {c.lists.map((l) => (
                <Box key={`list-${l.label}`} flexDirection="column" marginTop={1}>
                  <Text dimColor>{`${l.label} ${GLYPH.dot} ${l.items.length}`}</Text>
                  {l.items.map((it, k) => (
                    <Box key={`it-${l.label}-${k}`} flexDirection="row" gap={1}>
                      <Text color={TONE.info}>{it.glyph}</Text>
                      <Text wrap="truncate-end">{it.text}</Text>
                    </Box>
                  ))}
                </Box>
              ))}
            </Box>
            <Box flexDirection="row" gap={2}>
              {c.actions.map((a, i) => (
                <Button key={`act-${i}`} hotkey={String(i + 1)} plain label={a.label} onPress={async () => { await $.prompt.fill({ text: a.prompt }) }} />
              ))}
              <Button key="back" hotkey="b" plain dimColor label={es ? 'volver' : 'back'} onPress={() => update($, selectedAtom, () => null)} />
            </Box>
            <Text dimColor>{es ? 'las acciones llenan el prompt, no lo envían' : 'actions fill the prompt, never send it'}</Text>
          </Box>
        )
      }
    }

    // scope: containers and integrations only — `s` cycles all → in scope → out of scope; each state carries its count
    const scoped = tab === 'components' || tab === 'integrations'
    const ids = tab === 'components' ? f.components.map((c) => c.slug) : f.integrations.map((i) => i.id)
    const count = (sc: ExplorerScope) => ids.filter((id) => inFilter(f, tab, id, sc)).length
    const NEXT: Record<ExplorerScope, ExplorerScope> = { all: 'in', in: 'out', out: 'all' }
    const word: Record<ExplorerScope, string> = es ? { all: 'todos', in: 'en alcance', out: 'fuera de alcance' } : { all: 'all', in: 'in scope', out: 'out of scope' }
    const filter = scoped ? (
      <Box flexDirection="row" gap={1}>
        <Button key="scope" hotkey="s" plain dimColor label={es ? 'alcance' : 'scope'} onPress={async () => { await update($, scopeAtom, () => NEXT[scope]); await update($, pageAtom, () => 0) }} />
        {(['all', 'in', 'out'] as ExplorerScope[]).map((sc) => (sc === scope
          ? <Text key={`sc-${sc}`} color={TONE.info} bold>{`${word[sc]} ${count(sc)}`}</Text>
          : <Text key={`sc-${sc}`} dimColor>{`${word[sc]} ${count(sc)}`}</Text>))}
      </Box>
    ) : null
    const list = rows(f, tab, scoped ? scope : 'all')
    const size = Math.max(3, Math.min(9, Math.floor(((e.viewport?.rows ?? 24) - 9) / 2)))
    const pages = Math.max(1, Math.ceil(list.length / size)), p = Math.min(page, pages - 1)
    const shown = list.slice(p * size, p * size + size)
    return (
      <Box flexDirection="column">
        {tabs}
        {filter}
        {shown.length === 0 ? <Text dimColor>{es ? 'nada en este filtro' : 'nothing under this filter'}</Text> : null}
        {shown.map((r, i) => (
          <Box key={`row-${r.id}`} flexDirection="row" gap={1}>
            <Text color={r.tone} dimColor={!r.tone}>{r.glyph}</Text>
            <Box flexDirection="column" flexShrink={1}>
              <Button key={`pick-${r.id}`} hotkey={String(i + 1)} plain dimColor={r.dim} label={cut(r.title, width - 6)} onPress={() => update($, selectedAtom, () => r.id)} />
              {r.sub ? <Text dimColor>{`   ${cut(r.sub, width - 5)}`}</Text> : null}
            </Box>
          </Box>
        ))}
        <Text dimColor>{rule(width)}</Text>
        <Box flexDirection="row" gap={2}>
          <Text dimColor>{es ? `página ${p + 1} de ${pages} ${GLYPH.dot} ${list.length}` : `page ${p + 1} of ${pages} ${GLYPH.dot} ${list.length}`}</Text>
          {p > 0 ? <Button key="prev" hotkey="p" plain dimColor label={es ? 'anterior' : 'previous'} onPress={() => update($, pageAtom, () => p - 1)} /> : null}
          {p < pages - 1 ? <Button key="next" hotkey="n" plain dimColor label={es ? 'siguiente' : 'next'} onPress={() => update($, pageAtom, () => p + 1)} /> : null}
          <Text dimColor>{`ledger ${f.generatedAt.slice(0, 10)}`}</Text>
        </Box>
      </Box>
    )
  })
}
