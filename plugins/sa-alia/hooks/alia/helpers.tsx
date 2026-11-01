// sa-alia · Alia's helpers (1.1.0) — a sub-agent's message row in the transcript ("Message from subagent") drawn under a
// smaller face of hers, one per role: the judge thinking on silver, a reviewer stern on amber, a writer talking on deep
// teal, any other a calm helper. The label names the role and the agent; the engine's own row (compact or expanded) is
// kept beneath it, untouched. Her replies keep the larger codec, so the main voice stays hers. The terminal draws the
// role's sparkle in its ring colour instead of a face.
import type { EngineInterface } from 'claude-code'

import { GLYPH } from '../ui'
import { ALIA, HELPER, HELPER_PX, codecSvg, helperRole } from './palette'

const faces = new Map<string, string>()
async function face($: EngineInterface, file: string): Promise<string | null> {
  if (faces.has(file)) return faces.get(file)!
  try { const { base64 } = await $.fs.read(`${$.plugin.root}/assets/alia/${file}`, { as: 'bytes' }); faces.set(file, base64); return base64 } catch { return null }
}

/** Who sent the row: the sender's name, or — on a sub-agent's completion notice — its type from the session's agents. */
export async function helperOf($: EngineInterface, props: { from?: { name: string }; task?: { id?: string; type?: string } }): Promise<string | null> {
  if (props.from && props.from.name) return props.from.name
  if (!props.task || !props.task.id || props.task.type) return null   // a typed task is a shell, a workflow, a remote agent
  try {
    const agent = (await $.agent.list()).find((a) => a.id === props.task!.id)
    return agent ? agent.type : null
  } catch { return null }
}

/** The helper's codec around the engine's row: her small face in the role's ring, «Alia · <role> · <agent>», the row. */
export async function Helper($: EngineInterface, els: { Box: any; Text: any; Svg?: any }, surface: string, who: string, lang: 'en' | 'es', row: unknown) {
  const { Box, Text, Svg } = els
  const role = HELPER[helperRole(who)]
  const name = who.split(':').pop() || who
  const f = surface === 'terminal' ? null : await face($, role.face)
  const mark = f && Svg
    ? <Svg source={codecSvg(f, role.ring, HELPER_PX)} alt={`Alia, ${role[lang]}`} width={HELPER_PX + 8} height={HELPER_PX + 8} />
    : <Text color={role.ring} bold>{GLYPH.brand}</Text>
  return (
    <Box flexDirection="row" gap={1} alignItems="flex-start">
      {mark}
      <Box flexDirection="column" flexGrow={1} flexShrink={1}>
        <Box flexDirection="row" gap={1}>
          <Text color={ALIA.aquaMark} bold>Alia</Text>
          <Text color={role.ring}>{`${GLYPH.dot} ${role[lang]}`}</Text>
          <Text dimColor>{`${GLYPH.dot} ${name}`}</Text>
        </Box>
        {row as never}
      </Box>
    </Box>
  )
}
