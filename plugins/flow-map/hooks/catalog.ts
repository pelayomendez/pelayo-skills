import type { Skill } from '../types'

/** What the pane draws: flows with their chains, then units in groups. */
export type View = {
  flows: Skill[]
  groups: { title: string; skills: Skill[] }[]
  missing: Map<string, boolean>
}

export type Settings = {
  units: 'in-flows' | 'all' | 'none'
  show: string[]
  hide: string[]
  order: string[]
  groups: { title: string; names: string[] }[]
}

export const list = (text: unknown): string[] =>
  String(text ?? '')
    .split(',')
    .map(one => one.trim())
    .filter(Boolean)

/** `Backlog: a, b; Workers: c` → [{ title: 'Backlog', names: [a, b] }, …]. */
export const parseGroups = (text: unknown): Settings['groups'] =>
  String(text ?? '')
    .split(';')
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => {
      const at = part.indexOf(':')
      return at < 0
        ? { title: part, names: [] }
        : { title: part.slice(0, at).trim(), names: list(part.slice(at + 1)) }
    })
    .filter(group => group.title !== '')

export const settingsOf = (options: Readonly<Record<string, unknown>>): Settings => {
  const units = options.units
  return {
    units: units === 'all' || units === 'none' ? units : 'in-flows',
    show: list(options.show),
    hide: list(options.hide),
    order: list(options.order),
    groups: parseGroups(options.groups),
  }
}

const unquote = (value: string) => {
  const text = value.trim()
  if (text.length >= 2 && (text[0] === '"' || text[0] === "'") && text.at(-1) === text[0]) {
    return text.slice(1, -1).replace(/\\"/g, '"')
  }
  return text
}

/** Reads a SKILL.md: its frontmatter and, for a flow, its `## Units` list. */
export const parseSkill = (text: string, folderName: string): Skill | undefined => {
  const lines = text.split(/\r?\n/)
  const fields: Record<string, string> = {}
  let body = 0
  if (lines[0]?.trim() === '---') {
    const end = lines.findIndex((line, at) => at > 0 && line.trim() === '---')
    if (end < 0) return undefined
    const head = lines.slice(1, end)
    for (let at = 0; at < head.length; at++) {
      const match = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(head[at] ?? '')
      if (match?.[1] === undefined) continue
      const value = (match[2] ?? '').trim()
      if (/^[|>][-+]?$/.test(value)) {
        // A YAML block value: the indented lines that follow, folded into one.
        const parts: string[] = []
        while (at + 1 < head.length && /^\s+\S/.test(head[at + 1] ?? '')) parts.push((head[++at] ?? '').trim())
        fields[match[1]] = parts.join(' ')
      } else {
        fields[match[1]] = unquote(value)
      }
    }
    body = end + 1
  }
  const name = fields.name || folderName
  if (!name) return undefined
  const skill: Skill = {
    name,
    description: fields.description ?? '',
    ...(fields.summary ? { summary: fields.summary } : {}),
    isSlash: fields['user-invocable'] !== 'false',
  }
  let isFenced = false
  const heading = lines.findIndex((line, at) => {
    if (at < body) return false
    if (/^\s*(```|~~~)/.test(line)) isFenced = !isFenced
    return !isFenced && /^##\s+Units\s*$/.test(line)
  })
  if (heading >= 0) {
    const steps: string[] = []
    const throughout: string[] = []
    let into = steps
    for (const line of lines.slice(heading + 1)) {
      if (/^#{1,2}\s/.test(line)) break
      if (/^\s*(throughout|always|global)\b[^`]*:\s*$/i.test(line)) into = throughout
      else if (/^\s*steps\b[^`]*:\s*$/i.test(line)) into = steps
      const match = /^\s*[-*]\s+`([^`]+)`/.exec(line)
      if (match?.[1] !== undefined) into.push(match[1].trim())
    }
    if (steps.length + throughout.length > 0) {
      skill.units = [...steps, ...throughout]
      skill.steps = steps
      skill.throughout = throughout
    }
  }
  return skill
}

/** The skill's `summary:` line, or else the first sentence of its description. */
export const lineOf = (skill: { summary?: string; description: string }) =>
  skill.summary || summaryOf(skill.description)

/** The first sentence of a description, for a one-line summary. */
export const summaryOf = (description: string) => {
  const match = /^(.+?[.!?])(\s|$)/.exec(description.trim())
  return (match?.[1] ?? description).trim()
}

const rank = (order: string[]) => (a: Skill, b: Skill) => {
  const ia = order.indexOf(a.name)
  const ib = order.indexOf(b.name)
  if (ia >= 0 || ib >= 0) return (ia < 0 ? Infinity : ia) - (ib < 0 ? Infinity : ib)
  return a.name.localeCompare(b.name)
}

/** Applies show, hide, order and groups to the scanned skills. */
export const viewOf = (skills: Skill[], settings: Settings): View => {
  const byName = new Map<string, Skill>()
  for (const one of skills) if (!byName.has(one.name)) byName.set(one.name, one)
  const isShown = (name: string) =>
    !settings.hide.includes(name) && (settings.show.length === 0 || settings.show.includes(name))
  const all = [...byName.values()].sort(rank(settings.order))
  const flows = all.filter(one => one.units && isShown(one.name))
  const chained = new Set(flows.flatMap(one => one.units ?? []))
  const missing = new Map<string, boolean>()
  for (const name of chained) missing.set(name, !byName.has(name))
  const units =
    settings.units === 'none'
      ? []
      : all.filter(
          one =>
            !one.units &&
            isShown(one.name) &&
            (settings.units === 'all' || chained.has(one.name)),
        )
  const placed = new Set<string>()
  const groups: View['groups'] = []
  for (const group of settings.groups) {
    const members = group.names
      .map(name => units.find(one => one.name === name))
      .filter((one): one is Skill => one !== undefined && !placed.has(one.name))
    for (const one of members) placed.add(one.name)
    if (members.length > 0) groups.push({ title: group.title, skills: members })
  }
  const rest = units.filter(one => !placed.has(one.name))
  if (rest.length > 0) groups.push({ title: settings.groups.length > 0 ? 'Other units' : 'Units', skills: rest })
  return { flows, groups, missing }
}

/** What a click puts in the prompt. */
export const promptFor = (skill: Pick<Skill, 'name' | 'isSlash'>) =>
  skill.isSlash ? `/${skill.name} ` : `Use the ${skill.name} skill: `

export const expandHome = (path: string, home: string | undefined) =>
  home && (path === '~' || path.startsWith('~/')) ? `${home}${path.slice(1)}` : path
