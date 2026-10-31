// sa-alia · Alia's palette and faces — the Alia Guide's colours (brand/alia/design-system), the moods of AliaCodec, and
// the face each mood shows where a surface draws pictures. Pure.

export type Mood = 'calm' | 'pleased' | 'thinking' | 'worried' | 'stern' | 'talk'

/** The Alia Guide's colours. */
export const ALIA = {
  aqua: '#2ee6e6', aquaMark: '#0c9da3', silver: '#c9d1d9', night: '#0d1418', night2: '#15222a', nightLine: '#2b4a55', nightMuted: '#8ea3ad',
  pleased: '#4dffa0', worried: '#ffd23f', stern: '#ff3b4e',
} as const

/** The codec ring of a mood on a picture (AliaCodec): aqua at rest, green, amber or red when she judges. */
export const RING: Record<Mood, string> = {
  calm: ALIA.aqua, talk: ALIA.aqua, thinking: ALIA.aqua, pleased: ALIA.pleased, worried: ALIA.worried, stern: ALIA.stern,
}

/** Her face per mood, under the plugin's `assets/alia/` — the video's set, 192 px. */
export const FACE: Record<Mood, string> = {
  calm: 'face-calm.webp', talk: 'face-talk-open.webp', thinking: 'face-thinking.webp',
  pleased: 'face-pleased.webp', worried: 'face-warn.webp', stern: 'face-stern.webp',
}

/** The size of her face on a surface that draws pictures: one size everywhere (the Alia Guide's 64 px on slides). */
export const FACE_PX = 64

/**
 * The codec as SVG: her face clipped to a disc on `night-2`, the mood's ring around it. A still picture: the desktop app
 * draws it as an image in the transcript, the band and a pane alike (an interactive one draws nothing in a pane).
 */
export function codecSvg(face: string, ring: string): string {
  const S = FACE_PX + 8, c = S / 2, r = FACE_PX / 2
  const img = (b64: string, extra = '') => `<image href="data:image/webp;base64,${b64}" x="4" y="4" width="${FACE_PX}" height="${FACE_PX}" clip-path="url(#d)"${extra}/>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">`
    + `<defs><clipPath id="d"><circle cx="${c}" cy="${c}" r="${r}"/></clipPath></defs>`
    + `<circle cx="${c}" cy="${c}" r="${r}" fill="${ALIA.night2}"/>${img(face)}`
    + `<circle cx="${c}" cy="${c}" r="${r + 2}" fill="none" stroke="${ring}" stroke-width="3"/></svg>`
}

/** Her escudo (the blazon), under `assets/alia/` — the mark of what she offers, never her voice: the face in a ring is. */
export const BLAZON = 'escudo.png'

/** The blazon as SVG, at the codec's size, so a band and a codec line up; no ring — the ring is the codec's. */
export function blazonSvg(png: string): string {
  const S = FACE_PX + 8
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">`
    + `<image href="data:image/png;base64,${png}" x="4" y="4" width="${FACE_PX}" height="${FACE_PX}"/></svg>`
}
