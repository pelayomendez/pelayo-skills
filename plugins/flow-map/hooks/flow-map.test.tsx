import { expect, test } from 'claude-code/testing'

import { lineOf, parseGroups, parseSkill, promptFor, settingsOf, summaryOf, viewOf } from './catalog'

const FLOW = `---
name: backlog
description: "Tidy and order a backlog."
disable-model-invocation: true
---

# Backlog

## Units

- \`snapshot-backlog\`
- \`prune-backlog\`
- \`missing-unit\`

Throughout:

- \`charter\`

## Steps
- \`not-a-unit\`
`

const UNIT = (name: string, extra = '') => `---
name: ${name}
description: The ${name} unit.
${extra}---
# ${name}
`

const FILES: Record<string, string> = {
  '/home/me/.claude/skills/backlog/SKILL.md': FLOW,
  '/home/me/.claude/skills/snapshot-backlog/SKILL.md': UNIT('snapshot-backlog'),
  '/home/me/.claude/skills/prune-backlog/SKILL.md': UNIT('prune-backlog', 'user-invocable: false\n'),
  '/home/me/.claude/skills/loose/SKILL.md': UNIT('loose'),
}

const DIRS: Record<string, string[]> = {
  '/home/me/.claude/skills': ['backlog', 'snapshot-backlog', 'prune-backlog', 'loose', '.git'],
}

const PANE = {
  plugin: 'flow-map',
  component: 'Pane',
  requestId: 'flow-map',
  props: {
    title: 'Flow map',
    isFocused: false,
    bodyColumns: 60,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 40 },
    view: {},
  },
} as const

test('a flow keeps its units in order and stops at the next heading', () => {
  const skill = parseSkill(FLOW, 'backlog')
  expect(skill?.name).toBe('backlog')
  expect(skill?.description).toBe('Tidy and order a backlog.')
  expect(skill?.steps).toEqual(['snapshot-backlog', 'prune-backlog', 'missing-unit'])
  expect(skill?.throughout).toEqual(['charter'])
  expect(skill?.units).toEqual(['snapshot-backlog', 'prune-backlog', 'missing-unit', 'charter'])
})

test('show, hide, order and groups shape the view', () => {
  const skills = [FLOW, UNIT('snapshot-backlog'), UNIT('prune-backlog'), UNIT('loose')].map(
    (text, at) => parseSkill(text, `s${at}`)!,
  )
  const inFlows = viewOf(skills, settingsOf({}))
  expect(inFlows.flows.map(one => one.name)).toEqual(['backlog'])
  expect(inFlows.groups.map(group => group.skills.map(one => one.name))).toEqual([['prune-backlog', 'snapshot-backlog']])
  expect(inFlows.missing.get('missing-unit')).toBe(true)

  const all = viewOf(skills, settingsOf({ units: 'all', hide: 'snapshot-backlog', order: 'prune-backlog,loose', groups: 'Odd: loose' }))
  expect(all.groups.map(group => [group.title, group.skills.map(one => one.name)])).toEqual([
    ['Odd', ['loose']],
    ['Other units', ['prune-backlog']],
  ])

  expect(viewOf(skills, settingsOf({ show: 'loose', units: 'all' })).flows).toEqual([])
  expect(viewOf(skills, settingsOf({ units: 'none' })).groups).toEqual([])
  expect(parseGroups(' A: x, y ;; B:z ')).toEqual([
    { title: 'A', names: ['x', 'y'] },
    { title: 'B', names: ['z'] },
  ])
})

test('the pane line is the summary, else the first sentence', () => {
  expect(lineOf(parseSkill('---\nname: a\ndescription: "Long text. More."\nsummary: "Short"\n---\n', 'a')!)).toBe('Short')
  expect(lineOf({ description: 'Long text. More.' })).toBe('Long text.')
  expect(summaryOf('Order the tickets. Proposes only. Use when…')).toBe('Order the tickets.')
  expect(summaryOf('No full stop here')).toBe('No full stop here')
})

test('a click puts a slash command, or a plain request when the skill has none', () => {
  expect(promptFor({ name: 'backlog', isSlash: true })).toBe('/backlog ')
  expect(promptFor({ name: 'prune-backlog', isSlash: false })).toBe('Use the prune-backlog skill: ')
})

test('the pane lists the flow and its chain, and a click fills the prompt', async ($, on) => {
  const filled: string[] = []
  on('env.get', (_, e) => ({ value: e.name === 'HOME' ? '/home/me' : undefined }))
  on('clock.now', () => ({ value: 1 }))
  on('fs.list', (_, e) => {
    const names = DIRS[e.path ?? '']
    if (!names) throw new Error('ENOENT')
    return { value: names.map(name => ({ name, kind: 'dir', size: 0, mtimeMs: 0, isLink: false })) }
  })
  on('fs.exists', (_, e) => ({ value: e.path in FILES }))
  on('fs.read', (_, e) => ({ value: FILES[e.path] ?? '' }))
  on('prompt.fill', (_, e) => {
    filled.push(e.text)
    return { isFilled: true }
  })
  on('command.register', () => ({ value: { command: 'flow-map' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...PANE, surface })
    expect((await ui.find({ type: 'Text', text: /^Flows$/ }))?.text).toBe('Flows')
    expect(await ui.find({ type: 'Text', text: /missing-unit\?/ })).toBeTruthy()
    expect(await ui.find({ type: 'Text', text: /loose/ })).toBeFalsy()

    await ui.press({ key: 'flow:backlog' })
    await ui.press({ key: 'backlog>1:prune-backlog' })
    await ui.press({ key: 'unit:snapshot-backlog' })
    await ui.unmount()
  }
  expect(filled.slice(0, 3)).toEqual(['/backlog ', 'Use the prune-backlog skill: ', '/snapshot-backlog '])
})
