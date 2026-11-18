import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Catalog, Skill } from '../types'
import { expandHome, lineOf, list, matches, parseSkill, promptFor, settingsOf, viewOf } from './catalog'

const PANE = 'flow-map'
const TITLE = 'yatsude'
const DEPTH = 3
const SKIP = new Set(['node_modules', '.git', 'dist', 'build'])
const VIOLET = '#9B6BDF'
const AMBER = '#F2A541'
const TEAL = '#2EC4B6'

/** The mascot, manga style: a masked octopus with a deadpan stare and eight hands. Drawn when the pane has room. */
const OCTOPUS = ['   ▄▀▀▀▀▀▄   ', '  █▓◉▓▓▓◉▓█≈ ', '   ▀▄ ‿ ▄▀   ', '  ╱╱╱│ │╲╲╲  ']
const ART_WIDTH = 13

// Change the tag when Catalog's fields change: it declines what an earlier version stored.
const catalog = atom({ plugin: 'flow-map', key: 'catalog' } as const, { skills: [], scannedAt: 0, errors: [] }, {
  shape: 'catalog-4',
})
/** What the person typed in the units filter. */
const filter = atom({ plugin: 'flow-map', key: 'filter' } as const, '')
/** Units drawn as one line each with their summary, instead of compact chips. */
const isDetailed = atom({ plugin: 'flow-map', key: 'isDetailed' } as const, false)

/** Hovering a unit lights it everywhere it appears: in every flow's chain and in the units list. */
const lit = (name: string) => ({ scope: `unit:${name}`, color: VIOLET, bold: true })

/** Every folder holding a SKILL.md under `dir`, up to DEPTH levels down; links are followed. */
async function scanDir($: EngineInterface, dir: string, depth: number, found: Skill[], errors: string[]) {
  const entries = await $.fs.list(dir).catch(() => undefined)
  if (!entries) {
    if (depth === 0) errors.push(`cannot read ${dir}`)
    return
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.') || SKIP.has(entry.name)) continue
    if (entry.kind !== 'dir' && !entry.isLink) continue
    const path = `${dir}/${entry.name}`
    const file = `${path}/SKILL.md`
    if (await $.fs.exists(file).catch(() => false)) {
      const text = await $.fs.read(file).catch(() => undefined)
      const skill = typeof text === 'string' ? parseSkill(text, entry.name) : undefined
      // A real folder is the user's own skill; a link points into a collection they installed.
      if (skill) found.push(entry.isLink ? skill : { ...skill, isOwn: true })
      else errors.push(`cannot parse ${file}`)
    } else if (depth + 1 < DEPTH) {
      await scanDir($, path, depth + 1, found, errors)
    }
  }
}

/** Reads every source folder into the catalog atom; returns how many skills it found. */
async function scan($: EngineInterface, sources: string[]) {
  const home = await $.env.get('HOME')
  const skills: Skill[] = []
  const errors: string[] = []
  for (const source of sources) await scanDir($, expandHome(source, home), 0, skills, errors)
  const scannedAt = await $.clock.now()
  await update($, catalog, () => ({ skills, scannedAt, errors }) satisfies Catalog)
  return { count: skills.length, errors }
}

/** Puts `text` at the start of the prompt box, keeping what was typed after it. */
async function fill($: EngineInterface, text: string) {
  const draft = (await $.prompt.read().catch(() => ({ text: '' }))).text
  const filled = await $.prompt.fill({ text: text + draft.trimStart(), mode: 'replace' })
  if (!filled.isFilled) $.ui.toast(`Could not fill the prompt: type ${text.trim()}`)
}

const pick = ($: EngineInterface, skill: Pick<Skill, 'name' | 'isSlash'>) => fill($, promptFor(skill))

export const register: Register = (on, options) => {
  const settings = settingsOf(options)
  const listed = list(options.sources)
  const sources = listed.length > 0 ? listed : ['~/.claude/skills']

  on('session.start', async ($, e, next) => {
    const result = await next(e)
    await $.command.register({
      name: 'flow-map',
      description: 'Open the yatsude panel: your flows and units; click one to put it in the prompt',
      argumentHint: '[reload]',
    })
    await scan($, sources).catch(() => undefined)
    if (options.openOnStart !== false) void $.ui.open({ id: PANE, title: TITLE }).catch(() => undefined)
    return result
  })

  on('command.run', { command: 'flow-map' }, async ($, e) => {
    const { count, errors } = await scan($, sources)
    const isReload = String(e.args ?? '').trim() === 'reload'
    if (!isReload) await $.ui.open({ id: PANE, title: TITLE, focus: true }).catch(() => undefined)
    const problems = errors.length > 0 ? ` ${errors.length} problem(s): ${errors.slice(0, 3).join('; ')}.` : ''
    return { text: `yatsude: ${count} skills read from ${sources.join(', ')}.${problems}` }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button, Input } = $.ui.resolve(e)
    const { skills, errors } = await read($, catalog)
    const typed = await read($, filter)
    const detailed = await read($, isDetailed)
    const view = viewOf(skills, settings)
    const width = Math.max(12, e.props.bodyColumns)
    const fit = (text: string, room = width) => (text.length > room ? `${text.slice(0, room - 1)}…` : text)
    const byName = new Map(skills.map(one => [one.name, one]))
    const hasArt = width >= ART_WIDTH + 24

    const header = (
      <Box key="header" flexDirection="row" marginBottom={1}>
        {hasArt && (
          <Box key="art" flexDirection="column" marginRight={2}>
            {OCTOPUS.map((line, at) => (
              <Text key={`art:${at}`} color={VIOLET}>
                {line}
              </Text>
            ))}
          </Box>
        )}
        <Box key="brand" flexDirection="column">
          <Text key="name" bold color={VIOLET}>
            yatsude
          </Text>
          <Text key="tag" dimColor>
            {fit('eight hands for your work', width - (hasArt ? ART_WIDTH + 2 : 0))}
          </Text>
          <Box key="actions" flexDirection="row" marginTop={1}>
            <Button key="new-flow" label="+ new flow" onPress={() => fill($, '/new-flow ')} />
            <Text key="actions:sep"> </Text>
            <Button key="reload" label="↻" plain onPress={() => void scan($, sources)} />
          </Box>
        </Box>
      </Box>
    )

    if (view.flows.length === 0 && view.groups.length === 0) {
      return (
        <Box flexDirection="column">
          {header}
          <Text dimColor>{fit('No flows or units found.')}</Text>
          <Text dimColor>{fit(`Reading: ${sources.join(', ')}`)}</Text>
          <Text dimColor>{fit('Change the folders in /config, then /flow-map reload.')}</Text>
          {errors.slice(0, 3).map(line => (
            <Text key={line} color="red">
              {fit(line)}
            </Text>
          ))}
        </Box>
      )
    }

    const link = (name: string, key: string) => {
      const unit = byName.get(name)
      return unit ? (
        <Button key={key} label={name} plain hover={lit(name)} onPress={() => pick($, unit)} />
      ) : (
        <Text key={key} color="red">
          {`${name}?`}
        </Text>
      )
    }
    const units = view.groups
      .map(group => ({ ...group, skills: group.skills.filter(one => matches(one, typed)) }))
      .filter(group => group.skills.length > 0)

    return (
      <Box flexDirection="column">
        {header}
        {view.flows.length > 0 && (
          <Text key="flows-title" bold>
            Flows
          </Text>
        )}
        {view.flows.map(flow => {
          const steps = flow.steps ?? []
          const throughout = flow.throughout ?? []
          return (
            <Box key={`flow:${flow.name}`} flexDirection="column" marginBottom={1}>
              <Box key={`flow:${flow.name}:head`} flexDirection="row" flexWrap="wrap">
                <Button key={`flow:${flow.name}`} label={flow.name} onPress={() => pick($, flow)} />
                {flow.isOwn === true && (
                  <Text key={`flow:${flow.name}:own`} color={TEAL}>
                    {'  yours'}
                  </Text>
                )}
                {(flow.stops ?? 0) > 0 && (
                  <Text key={`flow:${flow.name}:stops`} color={AMBER}>
                    {`  ⏸ ${flow.stops} ${flow.stops === 1 ? 'stop' : 'stops'}`}
                  </Text>
                )}
                <Text key={`flow:${flow.name}:gap`}>{'  '}</Text>
                <Button
                  key={`edit:${flow.name}`}
                  label="edit"
                  plain
                  dimColor
                  onPress={() => fill($, `/new-flow edit ${flow.name} `)}
                />
              </Box>
              {flow.description !== '' && (
                <Text key={`flow:${flow.name}:about`} dimColor>
                  {fit(`  ${lineOf(flow)}`)}
                </Text>
              )}
              {steps.length > 0 && (
                <Box key={`flow:${flow.name}:chain`} flexDirection="row" flexWrap="wrap">
                  <Text key={`flow:${flow.name}:indent`}>{'  '}</Text>
                  {steps.flatMap((name, at) => [
                    ...(at === 0
                      ? []
                      : [
                          <Text key={`${flow.name}>${at}:arrow`} color={VIOLET}>
                            {' → '}
                          </Text>,
                        ]),
                    link(name, `${flow.name}>${at}:${name}`),
                  ])}
                </Box>
              )}
              {throughout.length > 0 && (
                <Box key={`flow:${flow.name}:throughout`} flexDirection="row" flexWrap="wrap">
                  <Text dimColor>{steps.length > 0 ? '  also uses: ' : '  uses: '}</Text>
                  {throughout.flatMap((name, at) => [
                    ...(at === 0 ? [] : [<Text key={`${flow.name}~${at}:sep`} dimColor>{' · '}</Text>]),
                    link(name, `${flow.name}~${at}:${name}`),
                  ])}
                </Box>
              )}
            </Box>
          )
        })}
        {view.groups.length > 0 && (
          <Box key="filter" flexDirection="row" marginBottom={1}>
            <Input
              key="unit-filter"
              placeholder="filter units"
              value={typed}
              submitLabel="filter"
              onInput={value => void update($, filter, () => value)}
              onSubmit={value => void update($, filter, () => value)}
            />
            <Text key="filter:gap">{'  '}</Text>
            <Button
              key="details"
              label={detailed ? '▾ details' : '▸ details'}
              plain
              dimColor
              onPress={() => void update($, isDetailed, now => !now)}
            />
          </Box>
        )}
        {units.map(group => (
          <Box key={`group:${group.title}`} flexDirection="column" marginBottom={1}>
            <Text bold>{group.title}</Text>
            {detailed ? (
              group.skills.map(unit => (
                <Box key={`unit:${unit.name}`} flexDirection="row">
                  <Button key={`unit:${unit.name}`} label={unit.name} plain hover={lit(unit.name)} onPress={() => pick($, unit)} />
                  <Text dimColor>{fit(`  ${lineOf(unit)}`, Math.max(0, width - unit.name.length - 2))}</Text>
                </Box>
              ))
            ) : (
              <Box key={`group:${group.title}:chips`} flexDirection="row" flexWrap="wrap">
                {group.skills.flatMap((unit, at) => [
                  ...(at === 0 ? [] : [<Text key={`chip:${unit.name}:sep`} dimColor>{' · '}</Text>]),
                  <Button key={`unit:${unit.name}`} label={unit.name} plain hover={lit(unit.name)} onPress={() => pick($, unit)} />,
                ])}
              </Box>
            )}
          </Box>
        ))}
        {typed.trim() !== '' && units.length === 0 && (
          <Text key="no-match" dimColor>
            {fit(`No unit matches "${typed.trim()}".`)}
          </Text>
        )}
        {[...view.missing].some(([, isMissing]) => isMissing) && (
          <Text key="missing" dimColor>
            {fit('name? = a unit the flow lists but no folder has')}
          </Text>
        )}
      </Box>
    )
  })
}
