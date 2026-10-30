# Alia — character identity

Alia's character image (beyond the icon), the identity of the command center's navigator and the knowledge base. Generated locally with ComfyUI on this machine and driven from Claude Code through `comfy-mcp`. Set up 2026-10-30.

## Folder

| Path | Content | In git |
|---|---|---|
| `poses/` | The approved images — `anchor-walking`, `anchor-standing`, `explaining`, `warning`, `happy`, `thinking` (1024², uncompressed) | yes |
| `workflows/` | ComfyUI API-format workflows: `alia-v1.json` (anchors, seed 1030101), `alia-pose-<pose>.json`, `alia-pose-warning-v2.json` | yes |
| `drafts/` | Every generated candidate; `kitsune-test/` is the pipeline test, not Alia | no — local |
| `reference/` | Third-party style references (`ref-01`…`ref-03`, one watermarked) — inputs only, never shipped | no — local |

## Alia — identity v1

Alia is the navigator of the architecture command center: she guides the reader through the model. No animal traits.

| Trait | Value | Source |
|---|---|---|
| Hair | Short silver bob, one eye covered, aqua gradient at the tips | References |
| Eyes | Aqua, softly glowing | References |
| Top | Oversized white ribbed zip sweater, zipped to a high collar, sleeves past the wrists | References (closed up) |
| Bottom | Black shorts over black tights, black lace-up platform boots with aqua laces | References (covered) |
| Accents | Aqua geometric hair clip, small earring | Design choice |
| Prop | Aqua hologram panels or a holographic tablet — the architecture she navigates | Design choice |
| Style | Chibi, clean lineart, white background | Design choice (reads at header size) |
| Palette | Silver `#C9D1D9`, white `#FFFFFF`, black `#1B1F24`, aqua `#2EE6E6` | Design choice |

Approved (2026-10-30):

| Pose | File | Draft |
|---|---|---|
| Anchor — walking, panel in hand | `poses/anchor-walking.png` | `alia-v1-seed1030101-b3` |
| Anchor — standing on a holo ring | `poses/anchor-standing.png` | `alia-v1-seed1030101-b4` |
| Cover — waving, hand on hip | `poses/cover.png` | `alia-pose-cover-b4` (replaces the anchor on covers: the anchors predate IP-Adapter and drift from the poses) |
| Explaining | `poses/explaining.png` | `alia-pose-explaining-b1` |
| Warning | `poses/warning.png` | `alia-pose-warning-b1` (v1; v2 drafts kept) |
| Happy | `poses/happy.png` | `alia-pose-happy-b1` |
| Thinking | `poses/thinking.png` | `alia-pose-thinking-b2` |

The two anchors are the IP-Adapter references for every further pose.

Poses: `workflows/alia-pose-<pose>.json` — both anchors through IP-Adapter Plus SDXL (`PLUS` preset, weight 0.7, `average`, end 0.85), the pose in the prompt, 2 images per run (seed 1030200 + index). Anchors are copied to `~/ai/ComfyUI/input/alia/`. Models: `clip_vision/CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors` and `ipadapter/ip-adapter-plus_sdxl_vit-h.safetensors` (h94/IP-Adapter, Apache-2.0); node pack `comfyui_ipadapter_plus` 2.0.0. A new pose is a copy of one file with another pose prompt.

Rule: the references give the style and palette; Alia's design is original and never a copy of the referenced character.

## Environment

| Item | Value |
|---|---|
| GPU | AMD RX 9060 XT 16 GB (gfx1200) |
| ComfyUI | 0.43.0 at `~/ai/ComfyUI` (v0.43.2 available: `comfy update comfy`) |
| Python venv | `~/ai/comfy-venv` — the only one; torch 2.14.1+rocm7.2 |
| Checkpoint | `animagine-xl-4.0-opt.safetensors` (SHA256 `6327eca9…847ac`) |
| Licence | CreativeML Open RAIL++-M — commercial use of outputs allowed |
| Agent bridge | `comfy-mcp` 0.10.0, Claude Code user scope |
| Post-processing | `rembg[cpu]` + Pillow in the venv, `oxipng` 10.2.1 in `~/.local/bin`, `pngquant` via apt |

## Start ComfyUI

ComfyUI does not start at boot.

```bash
PATH=~/ai/comfy-venv/bin:$PATH VIRTUAL_ENV=~/ai/comfy-venv HIP_VISIBLE_DEVICES=0 \
  comfy launch --background
```

- Serves `http://127.0.0.1:8188` only. Never add `--listen`: ComfyUI has no authentication.
- `HIP_VISIBLE_DEVICES=0` hides the Ryzen integrated GPU, which PyTorch lists as device 1.
- Without `VIRTUAL_ENV`, comfy-cli creates `~/ai/ComfyUI/.venv` with a CUDA torch and runs on the CPU.
- `--background` re-runs `comfy` by name, so the venv's `bin` must be on `PATH`.
- Host Ollama shares the VRAM; on an out-of-memory error unload its models first (`ollama stop <model>`).

From Claude Code: `server_info` → `validate_workflow` → `run_workflow(wait=False)` → `job(action="wait")` → `fetch_outputs`.

## Generation settings

| Setting | Value |
|---|---|
| Sampler | Euler a (`euler_ancestral`), scheduler `normal` |
| Steps / CFG | 28 / 5 |
| Size | 1024×1024 (the model's training size; larger degrades) |
| VAE decode | `VAEDecodeTiled` (tile 512, overlap 64) — `VAEDecode` can crash gfx1200 (ROCm/TheRock #1542) |
| Time | 18 s per image, first load included |

Negative prompt (from the model card):

```
lowres, bad anatomy, bad hands, text, error, missing finger, extra digits, fewer digits, cropped, worst quality, low quality, low score, bad score, average score, signature, watermark, username, blurry
```

## First test — result

Prompt: `1girl, chibi, kitsune, solo, white hair, fox ears, nine tails, …`, seed 20261030.

- Kept: line quality, white hair, fox ears, nine tails, clean background.
- Not chibi: adult proportions.
- Not fit for work documents: revealing outfit.

Changes for the next drafts:

- Style: `chibi, super deformed, big head, small body`.
- Rating: add `safe`; add `nsfw, cleavage, bare shoulders, thighs` to the negative prompt.
- Outfit: describe a closed garment in Alia's colours.
- Batches of 4 seeds per prompt; record the chosen seed in the file name.
- No text in the image — the model cannot render it.

## Identity from reference images

1. Put the reference images in `reference/` (front view, colours, outfit, expression).
2. **Now — IP-Adapter**: condition each generation on the references. Needs the `comfyui_ipadapter_plus` node pack and an SDXL IP-Adapter model; `install_node` runs third-party code, so it is confirmed before install.
3. **Once a design is approved — LoRA**: train on 15–30 approved images so every pose (neutral, explaining, warning, happy) stays on-model.

## Delivery pipeline (per pose)

1. Generate in ComfyUI.
2. Remove the background: `rembg i in.png out.png`.
3. Crop and resize to 2–3× display size (600–900 px tall for a header mascot).
4. Compress: `pngquant --quality 70-90` then `oxipng -o 4`, target 50–150 KB.
5. Save as `<pose>.png` in the consuming project's assets folder.
