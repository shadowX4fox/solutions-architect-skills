// sa-alia · readable rows — a transcript row of a sa-skills script (`Bash(bun …/flow-check.js /p)`) redrawn as what it is
// and what it said: `✦ Flow check · ✓ PASS — 3 flows`. The script is recognized by its file name, the verdict is the exit
// status, and the words are the script's own summary line, picked by code — never rewritten. Pure: register.tsx draws it.

type Lang = 'en' | 'es'
export type Kind = { script: string; en: string; es: string }
export type Summary = { state: 'running' | 'ok' | 'warn' | 'fail'; line: string; findings: string[]; warnings: number }

// script file → its name in the row; a lifecycle subcommand names its own step
const NAMES: Record<string, [string, string]> = {
  'prose-check.js': ['Prose check', 'Revisión de prosa'], 'flow-check.js': ['Flow check', 'Revisión de flujos'],
  'principle-check.js': ['Principle gate', 'Gate de principios'], 'principle-gate-prepare.js': ['Principle review payload', 'Payload de revisión de principios'],
  'component-cli.ts': ['Component index', 'Índice de componentes'], 'component-facts.ts': ['Component facts', 'Hechos de componentes'],
  'explorer-cli.ts': ['Explorer', 'Explorador'], 'integration-check.js': ['Integration check', 'Revisión de integraciones'],
  'tdr-check.js': ['TDR check', 'Revisión de TDR'], 'kit-check.js': ['Handoff kit check', 'Revisión del kit de handoff'],
  'kit-drift.js': ['Handoff kit drift', 'Deriva del kit de handoff'], 'kit-coherence.js': ['Handoff kit coherence', 'Coherencia del kit de handoff'],
  'contract-check.js': ['Contract check', 'Revisión de contratos'], 'mermaid-check.js': ['Diagram check', 'Revisión de diagramas'],
  'label-check.js': ['Connection label check', 'Revisión de etiquetas'], 'judge.js': ['Judge', 'Juez'],
  'arch-facts.js': ['Facts ledger', 'Ledger de hechos'], 'docs-stats.js': ['Size budgets', 'Presupuestos de tamaño'],
  'render-analysis.js': ['Analysis report', 'Reporte de análisis'], 'check-report.js': ['Report check', 'Revisión de reporte'],
  'security-posture.js': ['Security posture', 'Postura de seguridad'], 'findings.js': ['Findings', 'Hallazgos'],
  'export-index.js': ['Index bundle', 'Bundle del índice'], 'publish-index.js': ['Index publish', 'Publicación del índice'],
  'review-check.js': ['Architecture review', 'Revisión de arquitectura'], 'adr-index.js': ['ADR index', 'Índice de ADR'],
  'adr-link.js': ['ADR links', 'Enlaces de ADR'], 'gates-check.js': ['Creation gates', 'Gates de creación'],
  'create-progress.js': ['Creation progress', 'Progreso de creación'], 'resume-prepare.js': ['Resume receipt', 'Recibo para continuar'],
  'collect-save.js': ['Collection saved', 'Colección guardada'], 'flow-compose.js': ['Wire sequences', 'Secuencias de extremo a extremo'],
  'scene-from-docs.js': ['Command center scene', 'Escena del centro de mando'], 'render.js': ['Command center', 'Centro de mando'],
  'dossier.js': ['Alia dossier', 'Dossier de Alia'], 'snapshot.js': ['Command center snapshot', 'Foto del centro de mando'],
  'video-prepare.js': ['Video storyboard', 'Guion del video'], 'video-build.js': ['Video build', 'Armado del video'],
  'sa-export-assemble.js': ['Word export', 'Exportación a Word'], 'generate-doc.js': ['Document render', 'Render del documento'],
  'escalate.js': ['Escalation', 'Escalamiento'], 'tier0.js': ['Tier 0', 'Tier 0'], 'ci-setup.js': ['CI setup', 'Configuración de CI'],
  'po-spec-checkability.js': ['PO Spec checkability', 'Verificabilidad del PO Spec'], 'po-spec-coherence.js': ['PO Spec coherence', 'Coherencia del PO Spec'],
  'po-spec-delta.js': ['PO Spec delta', 'Delta del PO Spec'], 'qualifier-check.js': ['Qualifier check', 'Revisión de calificadores'],
  'superseded-claims.js': ['Superseded claims', 'Afirmaciones superadas'], 'identifier-check.js': ['Identifier check', 'Revisión de identificadores'],
  'catalog-check.js': ['ADR catalog check', 'Revisión del catálogo de ADR'], 'packs.js': ['Institution packs', 'Packs institucionales'],
  'increments.js': ['Delivery increments', 'Incrementos de entrega'], 'traceability-prepare.js': ['Traceability payload', 'Payload de trazabilidad'],
}
const LIFECYCLE: Record<string, [string, string]> = {
  status: ['Release status', 'Estado del release'], check: ['Release gates', 'Gates del release'], plan: ['Release plan', 'Plan del release'],
  apply: ['Release', 'Release'], tag: ['Release tag', 'Tag del release'], recover: ['Tag recovery', 'Recuperación del tag'], deprecate: ['Deprecation', 'Deprecación'],
}
// a payload cutter: `<thing>-prepare.js` reads as «payload: <thing>»
const PREPARE = /^([\w-]+)-prepare\.js$/

// a script of the suite: its file under a sa-* plugin, the repository checkout or the marketplace's cache
const SUITE = /(solutions-architect-skills|shadowx4fox-solution-architect|\/sa-(?:skills|records|requirements|analysis|delivery|visualization|ux)\b|\[plugin_dir\]|\[sa_skills_dir\]|\$\{?(?:PLUGIN_DIR|SA_SKILLS_DIR|SA)\}?)/
const SCRIPT = /(?:^|[\s/'"])([\w.-]+\.(?:js|ts))['"]?(?=$|\s)((?:\s+[^\s|&;>]+)*)/g

/** The suite's script a Bash command runs, null for any other command. Several in one command: the first, and how many. */
export function recognize(command: string): (Kind & { more: number }) | null {
  if (!/\bbun\b/.test(command) || !SUITE.test(command)) return null
  const found: Kind[] = []
  for (const m of command.matchAll(SCRIPT)) {
    const file = m[1]!, args = (m[2] || '').trim().split(/\s+/)
    if (file === 'lifecycle.js') { const sub = args.find((a) => LIFECYCLE[a]); const n = LIFECYCLE[sub || 'status']!; found.push({ script: `lifecycle.js ${sub || ''}`.trim(), en: n[0], es: n[1] }); continue }
    if (file === 'explorer-cli.ts' && args[0] === 'manifest') { found.push({ script: file, en: 'Architecture manifest', es: 'Manifiesto de la arquitectura' }); continue }
    if (file === 'explorer-cli.ts' && args[0] === 'check') { found.push({ script: file, en: 'Explorer headers', es: 'Encabezados del explorador' }); continue }
    const name = NAMES[file]
    if (name) { found.push({ script: file, en: name[0], es: name[1] }); continue }
    const p = file.match(PREPARE)
    if (p && SUITE.test(command)) found.push({ script: file, en: `Payload: ${p[1]!.replace(/-/g, ' ')}`, es: `Payload: ${p[1]!.replace(/-/g, ' ')}` })
  }
  return found.length ? { ...found[0]!, more: found.length - 1 } : null
}

export const label = (k: Kind & { more: number }, lang: Lang) => `${lang === 'es' ? k.es : k.en}${k.more ? ` +${k.more}` : ''}`

// the line a script means as its verdict: its own summary, in the order the suite's scripts print them
const VERDICT = [
  /^(?:LAYER\d|RESULT|VERDICT)\s*:/i,
  /^(?:PASS|FAIL|BLOCKED|OK|clean)\b/i,
  /—\s*\d+\s+(?:blocking|error|errors)\b/i,
  /^[\w-]+(?: check)?\s*(?::|—)\s*\d+\s+\w+/i,
  /^next:/i,
]
const FINDING = /^\s*(?:✗|✘|⛔|FAIL\b|BLOCKING\b|error\b|\[blocking\])/i
const WARNING = /^\s*(?:⚠|!\s|WARN(?:ING)?\b|\[warning\])/i
const clean = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, '').replace(/\s+/g, ' ').trim()

/** What the script said, from its output: the verdict line, how many warnings, and the first findings when it failed. */
export function summarize(output: unknown, isErrored: boolean, isRunning: boolean): Summary {
  if (isRunning) return { state: 'running', line: '', findings: [], warnings: 0 }
  const o = (output && typeof output === 'object' ? output : {}) as { stdout?: unknown; stderr?: unknown }
  const text = typeof output === 'string' ? output : `${String(o.stdout ?? '')}\n${String(o.stderr ?? '')}`
  const lines = text.split(/\r?\n/).map((l) => l.replace(/\x1b\[[0-9;]*m/g, '')).filter((l) => l.trim())
  const json = lines.length && /^[[{]/.test(lines[0]!.trim())
  const verdict = json ? '' : (VERDICT.map((re) => lines.find((l) => re.test(l.trim()))).find(Boolean) || lines[lines.length - 1] || '')
  const findings = lines.filter((l) => FINDING.test(l) && !/\bPASS\b/.test(l)).slice(0, 3).map(clean)
  const warnings = lines.filter((l) => WARNING.test(l)).length
  const failed = isErrored || /^(?:FAIL|BLOCKED)\b/i.test(verdict.trim()) || /:\s*FAIL\b/.test(verdict)
  return { state: failed ? 'fail' : warnings ? 'warn' : 'ok', line: clean(verdict).slice(0, 160), findings: failed ? findings : [], warnings }
}
