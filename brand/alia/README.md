# Alia — character identity

Alia's character image (beyond the icon), the identity of the command center's navigator and the knowledge base. This folder holds the **final images** only. Their sources (workflows, anchors, drafts) are kept outside this repository.

Generated with ComfyUI on Animagine XL 4.0 opt (CreativeML Open RAIL++-M, commercial use of outputs allowed).

## Folder

| Path | Content |
|---|---|
| `poses/` | The approved poses (1024², uncompressed) |
| `blazon/` | Her escudo: SVG, and the one-colour editions with their PNGs |
| `github/` | The codecs that head a CI comment, and the GitHub App's avatar (`make.js` renders the codecs from sa-alia's faces) |
| `design-system/assets/` | The Alia Guide's cutouts, faces and sparkles |

## Alia — identity v1

Alia is the navigator of the architecture command center: she guides the reader through the model. No animal traits.

| Trait | Value |
|---|---|
| Hair | Short silver bob, one eye covered, aqua gradient at the tips |
| Eyes | Aqua, softly glowing |
| Top | Oversized white ribbed zip sweater, zipped to a high collar, sleeves past the wrists |
| Bottom | Black shorts over black tights, black lace-up platform boots with aqua laces |
| Accents | Aqua geometric hair clip, small earring |
| Prop | Aqua hologram panels or a holographic tablet — the architecture she navigates |
| Style | Chibi, clean lineart, white background |
| Palette | Silver `#C9D1D9`, white `#FFFFFF`, black `#1B1F24`, aqua `#2EE6E6` |

Approved poses:

| Pose | File | Use |
|---|---|---|
| Cover — waving, hand on hip | `poses/cover.png` | Covers |
| Explaining | `poses/explaining.png` | |
| Warning | `poses/warning.png` | |
| Happy | `poses/happy.png` | |
| Thinking | `poses/thinking.png` | |
| Stern — arms crossed, frowning | `poses/stern.png` | The codec's `stern` face |
| Pointing left | `poses/point-left.png` | Tips, bubble to her left |
| Pointing up | `poses/point-up.png` | Tips under a table or chart |
| Perched — sitting on an edge | `poses/perched.png` | Tips on a card's top edge |
| Talking pair — mouth closed / open | `poses/talk-closed.png`, `poses/talk-open.png` | Talking frames |

Blazon (`blazon/escudo.svg`, approved 2026-10-30; one-colour `escudo-mono.svg` and `escudo-mono-reverse.svg` for grayscale print, stamps and fax, with their 512 px PNGs): a heraldic shield — night field, silver bordure with an aqua inner line, her hair clip as an aqua chevron, her sparkle in chief, a hologram grid in base. The Word and PDF exports carry it as `tools/docgen/themes/alia/blazon.png` (512 px, rendered from the SVG): on the cover above the document type, and at 14 px at the start of every page header. Re-render the PNG after any change to the SVG.

Faces (`design-system/assets/faces/face-<pose>.webp`, 192 px): her head cut from each approved pose — the command center's `alia` skin embeds them and shows the one her mood calls for (calm `cover`, `thinking`, pleased `happy`, worried `warning`, `stern`); `face-talk-closed` / `face-talk-open` are her talking frames. Faces are cropped from the cutout so the head fills the frame like the first four.
