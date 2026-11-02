// sa-alia · her hub's views that open what already exists: the command center's HTML and the explainer video, in the
// system's own viewer (xdg-open, open, start). What does not exist yet is the skill's to make: the prompt is filled with
// the words that route to it — nothing is sent on its own.
import type { EngineInterface } from 'claude-code'

export const ARTIFACTS = {
  center: { file: 'visualizations/architecture-command-center.html', prompt: 'command center' },
  video: { file: 'visualizations/architecture-video.mp4', prompt: 'architecture video' },
} as const

/** The command that opens a file with the system's viewer: macOS `open`, Windows `start`, otherwise `xdg-open`. */
export async function opener($: EngineInterface): Promise<(file: string) => string[]> {
  // Windows: OS=Windows_NT, or its command interpreter named (a mod's environment may hold only part of the process's)
  if (/windows/i.test((await $.env.get('OS')) || '') || /cmd\.exe$/i.test((await $.env.get('ComSpec')) || '')) return (f) => ['cmd', '/c', 'start', '', f]
  try { if ((await $.process.run(['uname'], { timeoutMs: 3000 })).stdout.trim() === 'Darwin') return (f) => ['open', f] } catch { /* no uname */ }
  return (f) => ['xdg-open', f]
}

/** Open the artifact when it exists, else fill the prompt that makes it; the text the command answers. */
export async function openArtifact($: EngineInterface, which: keyof typeof ARTIFACTS, es: boolean): Promise<string> {
  const a = ARTIFACTS[which], root = await $.session.root(), file = `${root}/${a.file}`
  if (await $.fs.exists(file)) {
    try {
      const r = await $.process.run((await opener($))(file), { timeoutMs: 15000 })
      if (r.exitCode === 0) return es ? `Abierto: ${a.file}` : `Opened: ${a.file}`
      return es ? `No pude abrir ${a.file} (salida ${r.exitCode}).` : `Could not open ${a.file} (exit ${r.exitCode}).`
    } catch (err) { return es ? `No pude abrir ${a.file}: ${(err as Error).message}` : `Could not open ${a.file}: ${(err as Error).message}` }
  }
  await $.prompt.fill({ text: a.prompt })
  return es ? `Aún no existe ${a.file}: dejé «${a.prompt}» en el prompt para generarlo.` : `${a.file} does not exist yet: "${a.prompt}" is in the prompt to make it.`
}
