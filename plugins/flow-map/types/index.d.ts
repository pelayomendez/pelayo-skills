export type Skill = {
  name: string
  description: string
  /** The `summary:` line, when the skill has one: what the pane shows. */
  summary?: string
  /** Typed as /name: false only when the skill sets `user-invocable: false`. */
  isSlash: boolean
  /** Every unit the flow's `## Units` lists; present only on a flow. */
  units?: string[]
  /** The units that run as steps, in order (the list before any `Throughout:` line). */
  steps?: string[]
  /** The units used at any step, listed after a `Throughout:` line. */
  throughout?: string[]
  /** How many places the flow stops for you (`**Stop and ask**`, `**3. Stop:`). */
  stops?: number
  /** Where the stops fall: indexes into `steps` a stop comes after (-1: before the first step). */
  stopsAfter?: number[]
  /** The flow's `## Slots`: each slot and the unit that fills it by default, if the flow names one. */
  slots?: { name: string; fallback?: string }[]
  /** True when the skill's folder is the user's own, not a link to a collection. */
  isOwn?: boolean
}

/** `plugged`: the user's slots file, slot name → the skill they plugged in. */
export type Catalog = { skills: Skill[]; plugged: Record<string, string>; scannedAt: number; errors: string[] }

declare module 'claude-code' {
  interface PluginState {
    'flow-map': { catalog: Shaped<Catalog>; filter: string; isCompact: boolean }
  }
}
