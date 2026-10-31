/** next-steps: one suggestion — the action the band names, the fact behind it, the prompt it fills, and why it was offered. */
export type Step = { id: string; title: string; detail: string; prompt: string; why: string }

/** explorer: the four lists of the pane. */
export type ExplorerTab = 'components' | 'integrations' | 'adrs' | 'tdrs'
/** explorer: the scope filter of the containers and integrations — the systems the architecture owns, or the rest. */
export type ExplorerScope = 'all' | 'in' | 'out'
/** explorer: an integration against the owned systems — both ends inside, one, or neither. */
export type IntegrationScope = 'internal' | 'boundary' | 'external'
/** explorer: the facts ledger, slimmed to what the pane shows. */
export type ExplorerFacts = {
  generatedAt: string
  lang: 'en' | 'es'
  components: { slug: string; name: string; index: string; type: string; technology: string[]; description: string; internalName: string; version: string; file: string; adrs: string[]; system: string; inScope: boolean }[]
  integrations: { id: string; from: string; to: string; protocol: string; pattern: string; retired: boolean; scope: IntegrationScope }[]
  adrs: { id: string; title: string; status: string; scope: string; file: string }[]
  tdrs: { id: string; title: string; status: string; driver: string; file: string }[]
}

/** radar: one analysis lens, from the newest report — counted by sa-skills' findings parser. */
export type RadarLens = { lens: string; date: string; ageDays: number; total: number; critical: number; high: number; stale: boolean }
/** radar: the architecture's risk at a glance. */
export type Radar = {
  lang: 'en' | 'es'
  lenses: RadarLens[]
  /** null when sa-skills' findings parser could not be run (not installed, or older than 8.116.0). */
  findingsNote: string | null
  tdrs: Record<string, number>
  line: string
}

/** alia: what she says for the project as it stands — the mood her face takes and one line, with the architecture's markers. */
export type AliaLine = { mood: 'calm' | 'pleased' | 'thinking' | 'worried' | 'stern' | 'talk'; line: string; name: string; version: string; status: string }

/** milestones: what the skills left on disk, at the end of a turn — compared with the last reading to find what moved. */
export type ProjectSnapshot = {
  version: string
  status: string
  tagged: boolean
  lenses: Record<string, { date: string; critical: number; high: number }>
  kit: { version: string; hashes: Record<string, string>; interfaces: number } | null
}
/** milestones: one card Alia places in the transcript. */
export type Milestone = { id: string; kind: 'release' | 'analysis' | 'kit'; mood: 'calm' | 'pleased' | 'worried' | 'stern'; title: string; lines: string[] }

declare module 'claude-code' {
  interface PluginState {
    'sa-ux': {
      /** next-steps: the steps computed at the end of the last turn, at most three, most urgent first. */
      nextSteps: Step[]
      /** next-steps: the fingerprint of the step set the person hid or took; hidden until the set changes. */
      nextStepsDismissed: string
      /** The architecture's DOC_LANGUAGE, for the mods' own words. */
      lang: 'en' | 'es'
      /** explorer: the ledger as last loaded, null before /arch or without one. */
      explorerFacts: ExplorerFacts | null
      explorerTab: ExplorerTab
      explorerScope: ExplorerScope
      explorerPage: number
      /** explorer: the id of the element whose card is open, null for the list. */
      explorerSelected: string | null
      /** radar: the last reading, null outside an architecture. */
      radar: Radar | null
      /** radar: what the last reading was computed from — re-read only when it changes. */
      radarKey: string
      /** alia: her line for the project, null outside an architecture. */
      alia: AliaLine | null
      /** milestones: the last reading of the project, null before the session's first. */
      snapshot: ProjectSnapshot | null
      /** milestones: the cards placed this session, by id — what each Placed row draws. */
      milestones: Milestone[]
    }
  }
}
