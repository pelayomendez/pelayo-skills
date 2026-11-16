import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Catalog, Skill } from '../types'
import { expandHome, list, parseSkill, promptFor, settingsOf, lineOf, viewOf } from './catalog'

const PANE = 'flow-map'
const TITLE = 'Flow map'
const DEPTH = 3
const SKIP = new Set(['node_modules', '.git', 'dist', 'build'])

// Change the tag when Catalog's fields change: it declines what an earlier version stored.
const catalog = atom({ plugin: 'flow-map', key: 'catalog' } as const, { skills: [], scannedAt: 0, errors: [] }, {
  shape: 'catalog-3',
})

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
      if (skill) found.push(skill)
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

/** Puts the skill's invocation at the start of the prompt box, keeping what was typed after it. */
async function pick($: EngineInterface, skill: Pick<Skill, 'name' | 'isSlash'>) {
  const draft = (await $.prompt.read().catch(() => ({ text: '' }))).text
  const filled = await $.prompt.fill({ text: promptFor(skill) + draft.trimStart(), mode: 'replace' })
  if (!filled.isFilled) $.ui.toast(`Could not fill the prompt: type ${promptFor(skill).trim()}`)
}

export const register: Register = (on, options) => {
  const settings = settingsOf(options)
  const listed = list(options.sources)
  const sources = listed.length > 0 ? listed : ['~/.claude/skills']

  on('session.start', async ($, e, next) => {
    const result = await next(e)
    await $.command.register({
      name: 'flow-map',
      description: 'Open the flow map: your flows and units, click one to put it in the prompt',
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
    return { text: `Flow map: ${count} skills read from ${sources.join(', ')}.${problems}` }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const { skills, errors } = await read($, catalog)
    const view = viewOf(skills, settings)
    const width = Math.max(12, e.props.bodyColumns)
    const fit = (text: string, room = width) => (text.length > room ? `${text.slice(0, room - 1)}…` : text)
    const byName = new Map(skills.map(one => [one.name, one]))

    if (view.flows.length === 0 && view.groups.length === 0) {
      return (
        <Box flexDirection="column">
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

    return (
      <Box flexDirection="column">
        {view.flows.length > 0 && (
          <Text key="flows-title" bold>
            Flows
          </Text>
        )}
        {view.flows.map(flow => {
          const link = (name: string, key: string) => {
            const unit = byName.get(name)
            return unit ? (
              <Button key={key} label={name} plain onPress={() => pick($, unit)} />
            ) : (
              <Text key={key} color="red">
                {`${name}?`}
              </Text>
            )
          }
          const steps = flow.steps ?? []
          const throughout = flow.throughout ?? []
          return (
            <Box key={`flow:${flow.name}`} flexDirection="column" marginBottom={1}>
              <Button key={`flow:${flow.name}`} label={flow.name} onPress={() => pick($, flow)} />
              {flow.description !== '' && (
                <Text key={`flow:${flow.name}:about`} dimColor>
                  {fit(`  ${lineOf(flow)}`)}
                </Text>
              )}
              {steps.map((name, at) => (
                <Box key={`flow:${flow.name}:step:${at}`} flexDirection="row">
                  <Text dimColor>{`  ${at + 1}. `}</Text>
                  {link(name, `${flow.name}>${at}:${name}`)}
                </Box>
              ))}
              {throughout.length > 0 && (
                <Box key={`flow:${flow.name}:throughout`} flexDirection="row" flexWrap="wrap">
                  <Text dimColor>{steps.length > 0 ? '  throughout: ' : '  uses: '}</Text>
                  {throughout.flatMap((name, at) => [
                    ...(at === 0 ? [] : [<Text key={`${flow.name}~${at}:sep`} dimColor>{' · '}</Text>]),
                    link(name, `${flow.name}~${at}:${name}`),
                  ])}
                </Box>
              )}
            </Box>
          )
        })}
        {view.groups.map(group => (
          <Box key={`group:${group.title}`} flexDirection="column" marginBottom={1}>
            <Text bold>{group.title}</Text>
            {group.skills.map(unit => (
              <Box key={`unit:${unit.name}`} flexDirection="row">
                <Button key={`unit:${unit.name}`} label={unit.name} plain onPress={() => pick($, unit)} />
                <Text dimColor>{fit(`  ${lineOf(unit)}`, Math.max(0, width - unit.name.length - 2))}</Text>
              </Box>
            ))}
          </Box>
        ))}
        {[...view.missing].some(([, isMissing]) => isMissing) && (
          <Text key="missing" dimColor>
            {fit('name? = a unit the flow lists but no folder has')}
          </Text>
        )}
      </Box>
    )
  })
}
