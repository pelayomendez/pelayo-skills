import { expect, test } from 'claude-code/testing'

import { fillOf, lineOf, matches, parseGroups, parseSkill, parseSlotsFile, promptFor, settingsOf, summaryOf, viewOf } from './catalog'

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

test('an explicit Steps label, block descriptions and fenced headings', () => {
  const text = [
    '---',
    'name: f',
    'description: >-',
    '  Folded over',
    '  two lines.',
    '---',
    '```markdown',
    '## Units',
    '- `not-me`',
    '```',
    '## Units',
    'Steps, in order:',
    '- `a`',
    'Throughout:',
    '- `b`',
  ].join('\r\n')
  const skill = parseSkill(text, 'f')
  expect(skill?.description).toBe('Folded over two lines.')
  expect(skill?.steps).toEqual(['a'])
  expect(skill?.throughout).toEqual(['b'])
  expect(parseSkill('---\nname: x\n', 'x')).toBeUndefined()
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
  let draft = '  for ABC later'
  on('prompt.read', () => ({ value: { text: draft, cursor: 0 } }))
  on('prompt.fill', (_, e) => {
    filled.push(e.text)
    draft = ''
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
  expect(filled).toEqual(['/backlog for ABC later', 'Use the prune-backlog skill: ', '/snapshot-backlog ', '/backlog ', 'Use the prune-backlog skill: ', '/snapshot-backlog '])
})

test('a flow counts its stops, outside code fences only', () => {
  const text = `---
name: f
description: "F."
---
## Units

- \`a\`

## Steps

1. **Check.** a.
2. **Stop and ask.** Wait.
**3. Stop: you decide.** Wait again.
**Stop** when done is not a stop for you.

\`\`\`
**Stop and ask.** inside a fence
\`\`\`
`
  expect(parseSkill(text, 'f')?.stops).toBe(2)
  expect(parseSkill('---\nname: u\ndescription: U.\n---\n**Stop and ask.**\n', 'u')?.stops).toBeUndefined()
})

test('the unit filter matches the name or the summary', () => {
  const unit = { name: 'verify-claim', summary: 'Checks a claim', description: '' }
  expect(matches(unit, '')).toBe(true)
  expect(matches(unit, 'VERIFY')).toBe(true)
  expect(matches(unit, 'claim')).toBe(true)
  expect(matches(unit, 'browser')).toBe(false)
})

test('the pane marks your own flows, opens edit and new flow in the prompt', async ($, on) => {
  const filled: string[] = []
  on('env.get', (_, e) => ({ value: e.name === 'HOME' ? '/home/me' : undefined }))
  on('clock.now', () => ({ value: 1 }))
  on('fs.list', (_, e) => {
    const names = DIRS[e.path ?? '']
    if (!names) throw new Error('ENOENT')
    return { value: names.map(name => ({ name, kind: 'dir', size: 0, mtimeMs: 0, isLink: name !== 'backlog' ? true : false })) }
  })
  on('fs.exists', (_, e) => ({ value: e.path in FILES }))
  on('fs.read', (_, e) => ({ value: FILES[e.path] ?? '' }))
  on('prompt.read', () => ({ value: { text: '', cursor: 0 } }))
  on('prompt.fill', (_, e) => {
    filled.push(e.text)
    return { isFilled: true }
  })
  on('command.register', () => ({ value: { command: 'flow-map' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: /yours/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /^yatsude$/ })).toBeTruthy()
  await ui.press({ key: 'edit:backlog' })
  await ui.press({ key: 'new-flow' })
  expect(filled).toEqual(['/new-flow edit backlog ', '/new-flow '])
  await ui.unmount()
})

test('each stop sits after the last step named before it', () => {
  const text = `---
name: f
description: "F."
---
## Units

Steps, in order:

- \`a\`
- \`b\`
- \`c\`

## Steps

1. **Stop and ask** before anything.
2. Run \`a\`.
3. **Stop: you choose.** Then \`b\`.
4. \`c\`, then **Stop and ask**.
`
  const skill = parseSkill(text, 'f')
  expect(skill?.stops).toBe(3)
  expect(skill?.stopsAfter).toEqual([-1, 0, 2])
})

test('each slot runs inside the step its line names, else delegate', () => {
  const text = `---
name: tune
description: Tune.
---
## Units

- \`delegate\`
- \`review-change\`

## Slots

- \`tests\`: default, the method in areas
- \`deps\`: default, \`deps-audit\`
- \`review\`: step 2, through \`review-change\`

## Steps
- \`not-a-slot\`: no
`
  const skill = parseSkill(text, 'tune')
  expect(skill?.slots).toEqual([
    { name: 'tests', via: 'delegate' },
    { name: 'deps', via: 'delegate', fallback: 'deps-audit' },
    { name: 'review', via: 'review-change' },
  ])
})

test('the slots file names the user skill per slot, and it wins over the default', () => {
  const plugged = parseSlotsFile('# Slots\n\n- implement: coding-skills:tdd\n- tests: `test-review`\nnot a line\n')
  expect(plugged).toEqual({ implement: 'coding-skills:tdd', tests: 'test-review' })
  expect(fillOf({ name: 'tests', fallback: 'x' }, plugged)).toEqual({ skill: 'test-review', isPlugged: true })
  expect(fillOf({ name: 'deps', fallback: 'deps-audit' }, plugged)).toEqual({ skill: 'deps-audit', isPlugged: false })
  expect(fillOf({ name: 'retro' }, plugged)).toEqual({ skill: undefined, isPlugged: false })
})

test('a step counts the skills plugged into it, the legend names them, and a click puts one in the prompt', async ($, on) => {
  const filled: string[] = []
  const files: Record<string, string> = {
    '/home/me/.claude/skills/tune/SKILL.md': `---
name: tune
description: Tune.
disable-model-invocation: true
---
## Units

- \`delegate\`
- \`deps-audit\`

## Slots

- \`tests\`: default, the method in areas
- \`deps\`: default, \`deps-audit\`
`,
    '/home/me/.claude/skills/delegate/SKILL.md': UNIT('delegate'),
    '/home/me/.claude/skills/deps-audit/SKILL.md': UNIT('deps-audit'),
    '/home/me/.claude/slots.md': '- tests: coding-skills:test-review\n',
  }
  on('env.get', (_, e) => ({ value: e.name === 'HOME' ? '/home/me' : undefined }))
  on('clock.now', () => ({ value: 1 }))
  on('fs.list', (_, e) => {
    if (e.path !== '/home/me/.claude/skills') throw new Error('ENOENT')
    return { value: ['tune', 'delegate', 'deps-audit'].map(name => ({ name, kind: 'dir', size: 0, mtimeMs: 0, isLink: true })) }
  })
  on('fs.exists', (_, e) => ({ value: e.path in files }))
  on('fs.read', (_, e) => {
    if (!(e.path in files)) throw new Error('ENOENT')
    return { value: files[e.path] ?? "" }
  })
  on('prompt.read', () => ({ value: { text: '', cursor: 0 } }))
  on('prompt.fill', (_, e) => {
    filled.push(e.text)
    return { isFilled: true }
  })
  on('command.register', () => ({ value: { command: 'flow-map' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: /✦/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: / ✦1/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /tests slot, in delegate/ })).toBeTruthy()
  // A slot on its default is not plugged in.
  expect(await ui.find({ type: 'Button', key: 'plugged:deps:skill' })).toBeFalsy()
  await ui.press({ key: 'plugged:tests:skill' })
  expect(filled).toEqual(['Use the coding-skills:test-review skill: '])
  await ui.unmount()
})
