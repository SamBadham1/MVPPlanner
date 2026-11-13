import { CATEGORIES, INFRA_CATEGORIES, PROVIDERS, getDef, relate } from './catalog.js'

const displayName = (c) => (c.name === c.def.label ? c.name : `${c.name} (${c.def.label})`)

export function slugify(text) {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'mvp'
  )
}

// Builds the Markdown brief from the canvas. The brief is written for an AI coding
// assistant: it describes what to build, in what order, and how the parts connect.
export function generateMarkdown({ project, nodes, edges }) {
  const title = project.name.trim() || 'Untitled MVP'

  const comps = nodes
    .map((n) => {
      const def = getDef(n.data.type)
      return {
        id: n.id,
        def,
        name: (n.data.name || def.label).trim(),
        notes: (n.data.notes || '').trim(),
        category: def.category,
        cat: CATEGORIES[def.category],
        provider: PROVIDERS[def.provider],
        parentId: n.parentId,
      }
    })
    .sort((a, b) => a.cat.order - b.cat.order)

  const byId = Object.fromEntries(comps.map((c) => [c.id, c]))

  // Nesting: a component placed inside a box on the canvas runs inside that box.
  for (const c of comps) c.parent = c.parentId ? byId[c.parentId] : undefined
  const childrenOf = (c) => comps.filter((x) => x.parent === c)
  const nested = comps.some((c) => c.parent)

  const links = edges
    .filter((e) => byId[e.source] && byId[e.target])
    .map((e) => {
      const a = byId[e.source]
      const b = byId[e.target]
      const rel = relate(a, b)
      const cross = a.provider && b.provider && a.provider !== b.provider
      return { a, b, label: (e.label || rel.label).trim(), text: rel.text, cross }
    })

  const linksOf = (c) => links.filter((l) => l.a.id === c.id || l.b.id === c.id)
  const out = []
  const push = (...lines) => out.push(...lines)

  // ----- Header -----
  push(`# ${title} — MVP Build Brief`, '')
  push(
    '> This document is a build brief for an AI coding assistant. It describes the planned',
    '> architecture of an MVP. Nothing has been built yet.',
    '',
  )

  push('## Instructions for the assistant', '')
  push(
    '- Build exactly the components listed below, using the named technologies. Do not add infrastructure that is not in this brief.',
    '- Follow the build order. Finish and verify each step before starting the next.',
    '- This is an MVP: prefer the simplest working implementation over abstractions, and skip anything not needed to meet the "Definition of done".',
    '- Never hard-code secrets. Read all configuration from environment variables and commit a `.env.example` with placeholder values.',
    '- The product description below says what the MVP is for. If it is too vague to decide what data or screens are needed, ask before building rather than inventing features.',
    '- Where a component requires an external account or credentials you do not have, stop and tell the user exactly what to create and which values to supply.',
    '',
  )

  // ----- Overview -----
  push('## Product overview', '')
  push(project.description.trim() || '_No description provided — ask the user what the MVP should do before building._', '')

  if (comps.length === 0) {
    push('## Architecture', '', '_No components were added to the plan._', '')
    return out.join('\n')
  }

  // ----- Architecture -----
  push('## Architecture', '')
  push('```mermaid', 'flowchart LR')
  const mid = Object.fromEntries(comps.map((c, i) => [c.id, `n${i + 1}`]))
  const esc = (s) => s.replace(/"/g, "'")
  const draw = (c, indent) => {
    const kids = childrenOf(c)
    if (!kids.length) return push(`${indent}${mid[c.id]}["${esc(displayName(c))}"]`)
    push(`${indent}subgraph ${mid[c.id]}["${esc(displayName(c))}"]`)
    for (const k of kids) draw(k, indent + '  ')
    push(`${indent}end`)
  }
  for (const c of comps.filter((c) => !c.parent)) draw(c, '  ')
  for (const l of links) {
    const tag = l.cross ? ` · ${l.a.provider.label} ↔ ${l.b.provider.label}` : ''
    push(`  ${mid[l.a.id]} ${l.cross ? '-.->' : '-->'}|"${esc(l.label + tag)}"| ${mid[l.b.id]}`)
  }
  push('```', '')

  push('| Component | Technology | Role | Cloud | Folder | Local port |', '| --- | --- | --- | --- | --- | --- |')
  for (const c of comps) {
    push(
      `| ${c.name} | ${c.def.type === 'custom' ? '—' : c.def.label} | ${c.cat.label} | ${c.provider?.label ?? '—'} | ${
        c.def.folder ? `\`${c.def.folder}/\`` : '—'
      } | ${c.def.port ?? '—'} |`,
    )
  }
  push('')

  if (nested) {
    push('### What runs inside what', '')
    push(
      'Nesting is deliberate: each item runs inside (is packaged, deployed or hosted by) the item it is indented under. Where a component\'s setup mentions its "connected components", that includes everything nested inside it.',
      '',
    )
    const tree = (c, depth) => {
      push(`${'  '.repeat(depth)}- ${displayName(c)}`)
      for (const k of childrenOf(c)) tree(k, depth + 1)
    }
    for (const c of comps.filter((c) => !c.parent && childrenOf(c).length)) tree(c, 0)
    push('')
  }

  const used = [...new Set(comps.map((c) => c.provider).filter(Boolean))]
  if (used.length === 1) {
    push(`**Cloud provider:** ${used[0].name} (${used[0].label}). Components marked "—" are not tied to a cloud.`, '')
  } else if (used.length > 1) {
    push(
      `**Cloud providers:** this plan deliberately spans ${used.map((p) => `${p.name} (${p.label})`).join(' and ')}. Keep each component on the provider shown in the table — do not consolidate onto one cloud.`,
      '',
    )
  }

  // ----- Connections -----
  push('## Connections', '')
  if (links.length === 0) {
    push('_No connections were drawn. Ask the user how the components should interact._', '')
  } else {
    for (const l of links) {
      push(`- **${l.a.name} → ${l.b.name}** (${l.label}): ${l.text}`)
      if (l.cross) {
        push(
          `  - **Cross-cloud (${l.a.provider.label} ↔ ${l.b.provider.label}):** these run on different providers, so they cannot use private networking or the platform's built-in identity to reach each other. Connect over a public HTTPS endpoint, authenticate with explicit credentials scoped to this one use (stored as a secret on the calling side), and expect extra latency and data-egress cost.`,
        )
      }
    }
    push('')
  }

  // ----- Components -----
  push('## Components', '')
  for (const c of comps) {
    push(`### ${displayName(c)}`, '')
    push(`- **Role:** ${c.cat.label}`)
    if (c.provider) push(`- **Cloud provider:** ${c.provider.name} (${c.provider.label})`)
    if (c.def.folder) push(`- **Code location:** \`${c.def.folder}/\``)
    if (c.def.port) push(`- **Default local port:** ${c.def.port}`)
    const cl = linksOf(c)
    if (cl.length) {
      push(`- **Connected to:** ${cl.map((l) => (l.a.id === c.id ? l.b.name : l.a.name)).join(', ')}`)
    } else if (comps.length > 1 && !c.parent && !childrenOf(c).length) {
      push('- **Connected to:** nothing — confirm with the user how this component is used.')
    }
    if (c.parent) {
      const chain = []
      for (let p = c.parent; p; p = p.parent) chain.push(p.name)
      push(`- **Runs inside:** ${chain.join(', which is inside ')}`)
    }
    if (childrenOf(c).length) push(`- **Contains:** ${childrenOf(c).map((k) => k.name).join(', ')}`)
    push('')
    if (c.notes) push('**Requirements from the user:**', '', c.notes, '')
    if (c.def.setup.length) {
      push('**Setup:**', '')
      for (const s of c.def.setup) push(`- ${s}`)
      push('')
    } else if (!c.notes) {
      push('_No details were given for this component. Ask the user what it should be._', '')
    }
    if (c.def.env?.length) {
      push(`**Environment variables:** ${c.def.env.map((v) => `\`${v}\``).join(', ')}`, '')
    }
  }

  // ----- Project structure -----
  const folders = [...new Set(comps.map((c) => c.def.folder).filter(Boolean))]
  const hasDocker = comps.some((c) => c.def.type === 'docker')
  push('## Project structure', '')
  push('```', `${slugify(title)}/`)
  const extraFiles = [...new Set(comps.flatMap((c) => c.def.files ?? []))]
  const entries = [
    ...folders.map((f) => `${f}/`),
    ...extraFiles,
    ...(hasDocker ? ['docker-compose.yml'] : []),
    '.env.example',
    '.gitignore',
    'README.md',
  ]
  entries.forEach((e, i) => push(`${i === entries.length - 1 ? '└──' : '├──'} ${e}`))
  push('```', '')

  // ----- Environment variables -----
  const envRows = []
  const seen = new Set()
  for (const c of comps) {
    for (const v of c.def.env ?? []) {
      if (seen.has(v)) continue
      seen.add(v)
      envRows.push(`| \`${v}\` | ${c.name} |`)
    }
  }
  if (envRows.length) {
    push('## Environment variables', '')
    push('| Variable | Needed for |', '| --- | --- |', ...envRows, '')
  }

  // ----- Build order -----
  push('## Build order', '')
  let step = 1
  push(`${step++}. Create the project layout above, with \`.gitignore\`, \`.env.example\` and a \`README.md\`.`)
  for (const c of comps) {
    const dn = displayName(c)
    if (c.category === 'repo') {
      push(`${step++}. Create the **${dn}** repository and push the initial layout.`)
    } else if (c.category === 'aidev') {
      push(
        `${step++}. Write the project instruction file for **${dn}** (see its component section) so the conventions in this brief are followed from the first commit.`,
      )
    } else if (c.category === 'identity') {
      push(`${step++}. Create the **${dn}** identity and grant it only the access listed under Connections.`)
    } else if (c.category === 'mcp') {
      push(`${step++}. Connect the **${dn}** server to the AI tool and confirm its tools are available.`)
    } else if (c.category === 'hosting' || c.category === 'cicd') {
      push(`${step++}. Configure **${dn}** for the components inside it or connected to it.`)
    } else {
      const deps = linksOf(c)
        .map((l) => (l.a.id === c.id ? l.b : l.a))
        .filter((o) => o.cat.order < c.cat.order && !INFRA_CATEGORIES.has(o.category))
        .map((o) => o.name)
      push(
        `${step++}. Set up **${dn}**${
          deps.length ? ` and wire it to ${deps.join(', ')}` : ''
        }. Verify it works on its own before moving on.`,
      )
    }
  }
  push(`${step++}. Write the README: prerequisites, environment variables, and the exact commands to run everything locally.`, '')

  // ----- Definition of done -----
  push('## Definition of done', '')
  push('- [ ] Every component in this brief exists and starts without errors using the commands in the README.')
  for (const l of links.filter((l) => !INFRA_CATEGORIES.has(l.a.category) && !INFRA_CATEGORIES.has(l.b.category))) {
    push(`- [ ] ${l.a.name} ↔ ${l.b.name} works end to end (${l.label}).`)
  }
  push('- [ ] The core flow from the product overview can be completed by a user in the running app.')
  push('- [ ] No secrets are committed; `.env.example` lists every variable.', '')

  return out.join('\n')
}
