// sa-ux · AliaCodec — her mark beside her name and her line, the way the Alia Guide's codec frames her. Where the surface
// draws pictures (`Svg`: the desktop app, the editor, mobile) the mark is her face at full resolution in the mood's ring;
// in the terminal a face at cell resolution is a blur, so its equivalent is the codec's own sign — her sparkle inside
// a ring that takes the mood's colour. Her name is `aqua-mark`, the aqua that reads on light and dark grounds; the
// line's tone is the mood's theme key, so every theme paints it its own way.
import type { EngineInterface } from 'claude-code'

import type { AliaLine } from '../../types'

import { GLYPH, TONE } from '../ui'
import { ALIA, BLAZON, FACE, FACE_PX, RING, blazonSvg, codecSvg, type Mood } from './palette'

export const MOOD_TONE: Record<Mood, string | undefined> = {
  calm: undefined, talk: undefined, thinking: TONE.info, pleased: TONE.ok, worried: TONE.high, stern: TONE.critical,
}
/** The terminal ring: aqua at rest, the theme's own green, amber or red when she judges. */
const RING_TONE: Record<Mood, string> = {
  calm: ALIA.aquaMark, talk: ALIA.aquaMark, thinking: ALIA.aquaMark, pleased: TONE.ok, worried: TONE.high, stern: TONE.critical,
}

const faces = new Map<string, string>()   // file → base64, read once per load
async function face($: EngineInterface, file: string): Promise<string | null> {
  if (faces.has(file)) return faces.get(file)!
  try { const { base64 } = await $.fs.read(`${$.plugin.root}/assets/alia/${file}`, { as: 'bytes' }); faces.set(file, base64); return base64 } catch { return null }
}

/**
 * Her codec picture for a surface that draws `Svg`, null in the terminal (whose element table still answers `Svg`, with an
 * empty box) or where the face cannot be read.
 */
export async function portrait($: EngineInterface, surface: string, mood: Mood): Promise<string | null> {
  if (surface === 'terminal') return null
  const f = await face($, FACE[mood])
  if (!f) return null
  return codecSvg(f, RING[mood])
}

/** Her blazon for a surface that draws `Svg`, null in the terminal or where the file cannot be read. */
export async function blazon($: EngineInterface, surface: string): Promise<string | null> {
  if (surface === 'terminal') return null
  const f = await face($, BLAZON)
  return f ? blazonSvg(f) : null
}

type Els = { Box: any; Text: any; Svg?: any }

/**
 * The mark: her face where a picture can be drawn, else the sparkle in the mood's ring — her voice. With `blazon`, her
 * escudo instead, and in the terminal the bare sparkle: what she offers, so it is never read as her talking.
 */
export function Mark(props: { els: Els; mood: Mood; svg: string | null; show?: boolean; blazon?: boolean }) {
  const { Box, Svg, Text } = props.els
  if (props.show === false) return null
  if (props.svg && Svg) return <Svg source={props.svg} alt={props.blazon ? 'Alia' : `Alia, ${props.mood}`} width={FACE_PX + 8} height={FACE_PX + 8} />
  if (props.blazon) return <Text color={ALIA.aquaMark} bold>{GLYPH.brand}</Text>
  return (
    <Box borderStyle="round" borderColor={RING_TONE[props.mood]} paddingX={1}>
      <Text color={ALIA.aquaMark} bold>{GLYPH.brand}</Text>
    </Box>
  )
}

/** The codec: her mark, then «Alia · <kicker>» and her line, then whatever the caller puts beneath. */
export function Codec(props: { els: Els; say: Pick<AliaLine, 'mood' | 'line'> | null; kicker: string; svg: string | null; showMark?: boolean; blazon?: boolean; children?: unknown }) {
  const { Box, Text } = props.els
  const mood: Mood = props.say ? props.say.mood : 'calm'
  return (
    <Box flexDirection="row" gap={1}>
      <Mark els={props.els} mood={mood} svg={props.svg} show={props.showMark} blazon={props.blazon} />
      <Box flexDirection="column" flexGrow={1}>
        <Box flexDirection="row" gap={1}>
          <Text color={ALIA.aquaMark} bold>{props.showMark === false ? `${GLYPH.brand} Alia` : 'Alia'}</Text>
          <Text dimColor>{`${GLYPH.dot} ${props.kicker}`}</Text>
        </Box>
        {props.say ? <Text color={MOOD_TONE[mood]} wrap="wrap">{props.say.line}</Text> : null}
        {props.children as never}
      </Box>
    </Box>
  )
}
