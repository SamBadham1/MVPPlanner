import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  NodeResizer,
  Position,
  ConnectionMode,
  MarkerType,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from '@xyflow/react'
import {
  CATEGORIES,
  COMPONENTS,
  PALETTE_TREE,
  PROVIDERS,
  crossCloud,
  getDef,
  isContainer,
  relate,
  tierOf,
} from './catalog.js'
import { generateMarkdown, slugify } from './generateMarkdown.js'

const STORAGE_KEY = 'mvp-stack-planner:v1'
const DND_TYPE = 'application/mvp-component'

const EXAMPLE = {
  project: {
    name: 'My MVP',
    description: '',
  },
  nodes: [
    { id: 'ex-react', type: 'stack', position: { x: 40, y: 170 }, data: { type: 'react', name: 'Web app', notes: '' } },
    {
      id: 'ex-docker',
      type: 'box',
      position: { x: 320, y: 90 },
      width: 600,
      height: 210,
      data: { type: 'docker', name: 'Docker Compose', notes: '' },
    },
    {
      id: 'ex-api',
      type: 'stack',
      parentId: 'ex-docker',
      position: { x: 40, y: 80 },
      data: { type: 'fastapi', name: 'API', notes: '' },
    },
    {
      id: 'ex-db',
      type: 'stack',
      parentId: 'ex-docker',
      position: { x: 360, y: 80 },
      data: { type: 'mongodb', name: 'MongoDB', notes: '' },
    },
  ],
  edges: [
    { id: 'ex-e1', source: 'ex-react', sourceHandle: 'r', target: 'ex-api', targetHandle: 'l', label: 'HTTP / REST' },
    { id: 'ex-e2', source: 'ex-api', sourceHandle: 'r', target: 'ex-db', targetHandle: 'l', label: 'reads / writes' },
  ],
}

function loadSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (saved && Array.isArray(saved.nodes) && Array.isArray(saved.edges)) {
      const ids = new Set(saved.nodes.map((n) => n.id))
      // Plans saved before boxes existed stored hosting components as plain cards.
      const nodes = saved.nodes.map((n) => {
        const node = { ...n, parentId: ids.has(n.parentId) ? n.parentId : undefined }
        if (!isContainer(n.data.type)) return { ...node, type: 'stack' }
        return { ...node, type: 'box', width: n.width ?? BOX_SIZE.width, height: n.height ?? BOX_SIZE.height }
      })
      return { ...saved, nodes: sortParentsFirst(nodes) }
    }
  } catch {
    // ignore unreadable storage and fall back to the example
  }
  return EXAMPLE
}

const newId = () => Math.random().toString(36).slice(2, 10)

// ---------- Nesting helpers ----------
const STACK_SIZE = { width: 170, height: 64 }
const BOX_SIZE = { width: 360, height: 220 }
const BOX_HEAD = 52 // space kept clear for the box title
const BOX_PAD = 18

const sizeOf = (n) => {
  const fallback = n.type === 'box' ? BOX_SIZE : STACK_SIZE
  return {
    width: n.width ?? n.measured?.width ?? fallback.width,
    height: n.height ?? n.measured?.height ?? fallback.height,
  }
}

// React Flow needs a parent to come before its children in the nodes array.
function sortParentsFirst(ns) {
  const byId = new Map(ns.map((n) => [n.id, n]))
  const out = []
  const seen = new Set()
  const visit = (n) => {
    if (seen.has(n.id)) return
    seen.add(n.id)
    const parent = n.parentId && byId.get(n.parentId)
    if (parent) visit(parent)
    out.push(n)
  }
  ns.forEach(visit)
  return out
}

// Works out the nesting after components have been dropped or dragged.
//
//   nodes     every node on the canvas
//   absById   Map of id -> absolute canvas position
//   movedIds  the nodes that were just dropped
//
// For each moved node:
//   1. It goes inside the innermost box under its centre that is allowed to contain it.
//   2. If it is a box, it wraps the neighbouring components it was dropped over.
//   3. Only the boxes around something that just changed place grow to fit it; a box
//      that was merely passed over keeps the size the user gave it.
//
// Which of two boxes is the outer one is decided by tier (cloud account > host >
// container) and, where tiers are equal or unknown, by size.
function settle(nodes, absById, movedIds) {
  const rects = new Map(
    nodes.map((n) => {
      const abs = absById.get(n.id) ?? n.position
      const s = sizeOf(n)
      return [
        n.id,
        { id: n.id, box: n.type === 'box', tier: tierOf(n.data.type), parentId: n.parentId, x: abs.x, y: abs.y, w: s.width, h: s.height },
      ]
    }),
  )
  const all = () => [...rects.values()]
  const centreIn = (a, b) => {
    const cx = a.x + a.w / 2
    const cy = a.y + a.h / 2
    return cx >= b.x && cx <= b.x + b.w && cy >= b.y && cy <= b.y + b.h
  }
  const depth = (r) => {
    let d = 0
    for (let p = rects.get(r.parentId); p; p = rects.get(p.parentId)) d++
    return d
  }
  const canContain = (outer, inner) => {
    if (!inner.box) return true
    if (outer.tier != null && inner.tier != null && outer.tier !== inner.tier) return outer.tier < inner.tier
    return outer.w * outer.h > inner.w * inner.h
  }
  const descendants = (id) => {
    const found = new Set()
    let grew = true
    while (grew) {
      grew = false
      for (const r of rects.values()) {
        if (r.parentId && !found.has(r.id) && (r.parentId === id || found.has(r.parentId))) {
          found.add(r.id)
          grew = true
        }
      }
    }
    return found
  }
  // Grow every box around `c` (outwards, in any direction) until `c` fits inside.
  const fit = (c) => {
    for (let p = rects.get(c.parentId); p; c = p, p = rects.get(p.parentId)) {
      const left = Math.min(p.x, c.x - BOX_PAD)
      const top = Math.min(p.y, c.y - BOX_HEAD)
      const right = Math.max(p.x + p.w, c.x + c.w + BOX_PAD)
      const bottom = Math.max(p.y + p.h, c.y + c.h + BOX_PAD)
      Object.assign(p, { x: left, y: top, w: right - left, h: bottom - top })
    }
  }

  for (const id of movedIds) {
    const d = rects.get(id)
    if (!d) continue
    const banned = descendants(id).add(id)

    const under = all()
      .filter((r) => r.box && !banned.has(r.id) && centreIn(d, r))
      .sort((a, b) => depth(b) - depth(a))
    d.parentId = under.find((r) => canContain(r, d))?.id

    if (d.box) {
      for (const n of all()) {
        if (banned.has(n.id) || movedIds.includes(n.id)) continue
        if ((n.parentId ?? null) !== (d.parentId ?? null)) continue // only wrap neighbours
        const overlaps = centreIn(n, d) || (n.box && centreIn(d, n))
        if (overlaps && canContain(d, n)) {
          n.parentId = d.id
          fit(n)
        }
      }
    }
    fit(d)
  }

  return sortParentsFirst(
    nodes.map((n) => {
      const r = rects.get(n.id)
      const p = rects.get(r.parentId)
      return {
        ...n,
        parentId: r.parentId,
        position: p ? { x: r.x - p.x, y: r.y - p.y } : { x: r.x, y: r.y },
        ...(r.box ? { width: r.w, height: r.h } : {}),
      }
    }),
  )
}

const HANDLES = (
  <>
    <Handle type="source" position={Position.Top} id="t" />
    <Handle type="source" position={Position.Right} id="r" />
    <Handle type="source" position={Position.Bottom} id="b" />
    <Handle type="source" position={Position.Left} id="l" />
  </>
)

// A hosting / container component: a resizable box other components sit inside.
function BoxNode({ data, selected }) {
  const def = getDef(data.type)
  const cat = CATEGORIES[def.category]
  const name = data.name || def.label
  return (
    <div className={`box-node${selected ? ' selected' : ''}`} style={{ '--accent': cat.color }}>
      <NodeResizer isVisible={selected} minWidth={220} minHeight={130} />
      {HANDLES}
      <div className="box-head">
        <span className="box-name">{name}</span>
        {name !== def.label && def.type !== 'group' && <span className="box-tech">{def.label}</span>}
        <ProviderBadge provider={def.provider} />
      </div>
    </div>
  )
}

function StackNode({ data, selected }) {
  const def = getDef(data.type)
  const cat = CATEGORIES[def.category]
  const name = data.name || def.label
  return (
    <div className={`stack-node${selected ? ' selected' : ''}`} style={{ '--accent': cat.color }}>
      {HANDLES}
      <div className="stack-node-cat">
        {cat.label}
        <ProviderBadge provider={def.provider} />
      </div>
      <div className="stack-node-name">{name}</div>
      {name !== def.label && def.type !== 'custom' && <div className="stack-node-tech">{def.label}</div>}
    </div>
  )
}

function ProviderBadge({ provider }) {
  const p = PROVIDERS[provider]
  if (!p) return null
  return (
    <span className="provider-badge" style={{ '--provider': p.color }} title={p.name}>
      {p.label}
    </span>
  )
}

const nodeTypes = { stack: StackNode, box: BoxNode }

const defaultEdgeOptions = {
  markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
}

export default function App() {
  const initial = useMemo(loadSaved, [])
  const [project, setProject] = useState(initial.project ?? EXAMPLE.project)
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges)
  const [preview, setPreview] = useState(null)
  const [copied, setCopied] = useState(false)
  const { screenToFlowPosition, fitView, getInternalNode, getNodes } = useReactFlow()

  // Absolute canvas position of every node currently on the canvas.
  const absMap = useCallback(
    (all) =>
      new Map(all.map((n) => [n.id, getInternalNode(n.id)?.internals.positionAbsolute ?? n.position])),
    [getInternalNode],
  )

  // Persist the plan between visits.
  useEffect(() => {
    const data = {
      project,
      nodes: nodes.map(({ id, type, position, data, parentId, width, height }) => ({
        id,
        type,
        position,
        data,
        parentId,
        ...(type === 'box' ? { width, height } : {}),
      })),
      edges: edges.map(({ id, source, sourceHandle, target, targetHandle, label }) => ({
        id,
        source,
        sourceHandle,
        target,
        targetHandle,
        label,
      })),
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // storage unavailable — the planner still works, it just won't remember
    }
  }, [project, nodes, edges])

  const addComponent = useCallback(
    // `position` is the new component's top-left corner in canvas coordinates.
    (type, position) => {
      const def = getDef(type)
      const box = isContainer(type)
      const node = {
        id: newId(),
        type: box ? 'box' : 'stack',
        position,
        selected: true,
        data: { type, name: def.type === 'custom' ? 'Custom component' : def.label, notes: '' },
        ...(box ? { ...BOX_SIZE } : {}),
      }
      const existing = getNodes()
      const abs = absMap(existing).set(node.id, position)
      setNodes(settle([...existing.map((n) => ({ ...n, selected: false })), node], abs, [node.id]))
    },
    [setNodes, absMap, getNodes],
  )

  // After a drag, work out again what sits inside what.
  const onNodeDragStop = useCallback(
    (_event, _node, dragged) => {
      const all = getNodes()
      const draggedIds = new Set(dragged.map((n) => n.id))
      // A component dragged along with its box just travels with it.
      const moved = dragged.filter((n) => !(n.parentId && draggedIds.has(n.parentId))).map((n) => n.id)
      if (moved.length) setNodes(settle(all, absMap(all), moved))
    },
    [getNodes, absMap, setNodes],
  )

  const onDrop = useCallback(
    (event) => {
      event.preventDefault()
      const type = event.dataTransfer.getData(DND_TYPE)
      if (!type) return
      const pos = screenToFlowPosition({ x: event.clientX, y: event.clientY })
      const size = isContainer(type) ? BOX_SIZE : STACK_SIZE
      addComponent(type, { x: pos.x - size.width / 2, y: pos.y - size.height / 2 })
    },
    [screenToFlowPosition, addComponent],
  )

  const onDragOver = useCallback((event) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }, [])

  // Clicking a palette item (instead of dragging) drops it near the middle of the canvas.
  const addAtCentre = (type) => {
    const el = document.querySelector('.canvas')
    const r = el.getBoundingClientRect()
    const pos = screenToFlowPosition({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
    const jitter = () => Math.round((Math.random() - 0.5) * 120)
    addComponent(type, { x: pos.x - 80 + jitter(), y: pos.y - 30 + jitter() })
  }

  const onConnect = useCallback(
    (conn) => {
      const info = (id) => {
        const n = nodes.find((x) => x.id === id)
        const def = getDef(n.data.type)
        return { name: n.data.name || def.label, category: def.category }
      }
      const label = relate(info(conn.source), info(conn.target)).label
      setEdges((es) => addEdge({ ...conn, id: newId(), label }, es))
    },
    [nodes, setEdges],
  )

  // Connections between two different cloud providers are drawn dashed and tagged "GCP ↔ AWS".
  const crossOf = useCallback(
    (edge) => {
      const a = nodes.find((n) => n.id === edge.source)
      const b = nodes.find((n) => n.id === edge.target)
      return a && b ? crossCloud(a.data.type, b.data.type) : null
    },
    [nodes],
  )
  const displayEdges = useMemo(
    () =>
      edges.map((e) => {
        const cross = crossOf(e)
        if (!cross) return e
        const tag = `${cross[0].label} ↔ ${cross[1].label}`
        return { ...e, className: 'cross-cloud', label: e.label ? `${e.label} · ${tag}` : tag }
      }),
    [edges, crossOf],
  )

  const selectedNode = nodes.find((n) => n.selected)
  const selectedEdge = !selectedNode ? edges.find((e) => e.selected) : undefined

  const updateNode = (id, patch) =>
    setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)))
  const updateEdge = (id, patch) => setEdges((es) => es.map((e) => (e.id === id ? { ...e, ...patch } : e)))
  // Removing a box keeps what was inside it: the contents move out to the next level up.
  const removeNodes = useCallback(
    (ids) => {
      setNodes((ns) => {
        const byId = new Map(ns.map((n) => [n.id, n]))
        return ns
          .filter((n) => !ids.has(n.id))
          .map((n) => {
            if (!n.parentId || !ids.has(n.parentId)) return n
            const position = { ...n.position }
            let p = byId.get(n.parentId)
            while (p && ids.has(p.id)) {
              position.x += p.position.x
              position.y += p.position.y
              p = p.parentId ? byId.get(p.parentId) : undefined
            }
            return { ...n, position, parentId: p?.id }
          })
      })
      setEdges((es) => es.filter((e) => !ids.has(e.source) && !ids.has(e.target)))
    },
    [setNodes, setEdges],
  )
  const removeNode = (id) => removeNodes(new Set([id]))
  const removeEdge = (id) => setEdges((es) => es.filter((e) => e.id !== id))

  // Delete / Backspace removes the selection (handled here so boxes keep their contents).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return
      if (e.target.closest?.('input, textarea, select, [contenteditable="true"], .modal')) return
      const ids = new Set(nodes.filter((n) => n.selected).map((n) => n.id))
      const hasEdges = edges.some((ed) => ed.selected)
      if (!ids.size && !hasEdges) return
      e.preventDefault()
      if (hasEdges) setEdges((es) => es.filter((ed) => !ed.selected))
      if (ids.size) removeNodes(ids)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [nodes, edges, removeNodes, setEdges])

  const clearAll = () => {
    if (nodes.length && !window.confirm('Remove every component and connection from the canvas?')) return
    setNodes([])
    setEdges([])
  }

  const loadExample = () => {
    if (nodes.length && !window.confirm('Replace the current canvas with the example stack?')) return
    setNodes(EXAMPLE.nodes)
    setEdges(EXAMPLE.edges)
    setTimeout(() => fitView({ padding: 0.3, maxZoom: 1 }), 50)
  }

  const buildMarkdown = () => generateMarkdown({ project, nodes, edges })
  const fileName = `${slugify(project.name)}-build-brief.md`

  const download = (text) => {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown' }))
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
  }

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      window.alert('Could not copy to the clipboard — use Download instead.')
    }
  }

  const edgeEnds = selectedEdge && {
    a: nodes.find((n) => n.id === selectedEdge.source),
    b: nodes.find((n) => n.id === selectedEdge.target),
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">MVP Stack Planner</div>
        <input
          className="project-name"
          value={project.name}
          onChange={(e) => setProject({ ...project, name: e.target.value })}
          placeholder="Project name"
          aria-label="Project name"
        />
        <div className="spacer" />
        <button className="btn ghost" onClick={loadExample}>
          Load example
        </button>
        <button className="btn ghost" onClick={clearAll} disabled={!nodes.length}>
          Clear
        </button>
        <button className="btn" onClick={() => setPreview(buildMarkdown())}>
          Preview brief
        </button>
        <button className="btn primary" onClick={() => download(buildMarkdown())}>
          Download .md
        </button>
      </header>

      <Palette onAdd={addAtCentre} />

      <main className="canvas" onDrop={onDrop} onDragOver={onDragOver}>
        <ReactFlow
          nodes={nodes}
          edges={displayEdges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          deleteKeyCode={null}
          isValidConnection={(c) => c.source !== c.target}
          connectionMode={ConnectionMode.Loose}
          defaultEdgeOptions={defaultEdgeOptions}
          colorMode="dark"
          fitView
          fitViewOptions={{ padding: 0.3, maxZoom: 1 }}
          proOptions={{ hideAttribution: false }}
        >
          <Background gap={20} size={1} />
          <Controls />
        </ReactFlow>
        {!nodes.length && (
          <div className="empty">
            <strong>Your canvas is empty</strong>
            <span>Drag a component in from the left to start planning your stack.</span>
          </div>
        )}
      </main>

      <aside className="inspector">
        {selectedNode ? (
          <NodeInspector
            key={selectedNode.id}
            node={selectedNode}
            parent={nodes.find((n) => n.id === selectedNode.parentId)}
            contents={nodes.filter((n) => n.parentId === selectedNode.id)}
            onChange={(patch) => updateNode(selectedNode.id, patch)}
            onRemove={() => removeNode(selectedNode.id)}
          />
        ) : selectedEdge ? (
          <>
            <h2>Connection</h2>
            <p className="muted">
              {edgeEnds.a?.data.name} → {edgeEnds.b?.data.name}
            </p>
            <label>
              Label
              <input
                value={selectedEdge.label ?? ''}
                onChange={(e) => updateEdge(selectedEdge.id, { label: e.target.value })}
                placeholder="e.g. HTTP / REST"
              />
            </label>
            {crossOf(selectedEdge) && (
              <p className="cross-note">
                Crosses cloud providers: {crossOf(selectedEdge)[0].name} ↔ {crossOf(selectedEdge)[1].name}. The brief
                will tell the AI tool to handle credentials and networking between them.
              </p>
            )}
            <button className="btn danger" onClick={() => removeEdge(selectedEdge.id)}>
              Remove connection
            </button>
          </>
        ) : (
          <>
            <h2>Project</h2>
            <label>
              What should the MVP do?
              <textarea
                rows={8}
                value={project.description}
                onChange={(e) => setProject({ ...project, description: e.target.value })}
                placeholder="e.g. A booking tool where customers pick a time slot and the owner sees upcoming bookings."
              />
            </label>
            <p className="muted">This goes at the top of the brief so the AI tool knows what it is building.</p>
            <h2>How it works</h2>
            <ol className="steps">
              <li>Drag components onto the canvas.</li>
              <li>Drag from a dot on one component to another to connect them.</li>
              <li>
                Hosting and container components are boxes: drop other components inside them, and boxes inside
                boxes.
              </li>
              <li>Select a component to rename it or add requirements.</li>
              <li>Download the brief and hand it to your AI coding tool.</li>
            </ol>
            <p className="muted">Select something and press Delete to remove it.</p>
            <p className="muted">
              A dashed line means the connection runs between two different cloud providers.
            </p>
          </>
        )}
      </aside>

      {preview !== null && (
        <div className="modal-backdrop" onClick={() => setPreview(null)}>
          <div className="modal" role="dialog" aria-label="Brief preview" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <strong>{fileName}</strong>
              <div className="spacer" />
              <button className="btn" onClick={() => copy(preview)}>
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button className="btn primary" onClick={() => download(preview)}>
                Download
              </button>
              <button className="btn ghost" onClick={() => setPreview(null)}>
                Close
              </button>
            </div>
            <pre className="modal-body">{preview}</pre>
          </div>
        </div>
      )}
    </div>
  )
}

function NodeInspector({ node, parent, contents, onChange, onRemove }) {
  const def = getDef(node.data.type)
  const cat = CATEGORIES[def.category]
  const isBox = node.type === 'box'
  return (
    <>
      <h2>{def.label}</h2>
      <p className="muted" style={{ color: cat.color }}>
        {cat.label}
        <ProviderBadge provider={def.provider} />
      </p>
      {parent && <p className="muted">Inside: {parent.data.name}. Drag it out of the box to move it out.</p>}
      {isBox && (
        <p className="muted">
          {contents.length
            ? `Contains: ${contents.map((n) => n.data.name).join(', ')}.`
            : 'Drag components into this box to place them inside it.'}{' '}
          Drag a corner to resize.
        </p>
      )}
      <label>
        Name in your plan
        <input value={node.data.name} onChange={(e) => onChange({ name: e.target.value })} />
      </label>
      <label>
        Requirements / notes
        <textarea
          rows={7}
          value={node.data.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder={
            def.type === 'custom'
              ? 'Describe what this is and which technology to use.'
              : 'Anything specific this part must do — endpoints, screens, collections, rules…'
          }
        />
      </label>
      {def.setup.length > 0 && (
        <details>
          <summary>What the brief will say</summary>
          <ul className="setup">
            {def.setup.map((s) => (
              <li key={s}>{s.replace(/`/g, '')}</li>
            ))}
          </ul>
        </details>
      )}
      <button className="btn danger" onClick={onRemove}>
        {isBox && contents.length ? 'Remove box (keeps contents)' : 'Remove component'}
      </button>
    </>
  )
}

const DEFAULT_OPEN = ['Frontend', 'API / Backend', 'Data', 'Data/Databases']

function Palette({ onAdd }) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(() => new Set(DEFAULT_OPEN))
  const term = search.trim().toLowerCase()

  const matches = (c) => {
    if (!term) return true
    const p = PROVIDERS[c.provider]
    return `${c.label} ${c.blurb} ${CATEGORIES[c.category].label} ${p?.label ?? ''} ${p?.name ?? ''}`
      .toLowerCase()
      .includes(term)
  }
  const itemsOf = (node) =>
    COMPONENTS.filter(
      (c) =>
        (node.provider
          ? c.provider === node.provider
          : !c.provider && node.cats.includes(c.category) && (c.group ?? null) === (node.group ?? null)) && matches(c),
    ).sort((a, b) => CATEGORIES[a.category].order - CATEGORIES[b.category].order)
  const count = (node) =>
    node.children ? node.children.reduce((n, ch) => n + count(ch), 0) : itemsOf(node).length

  const toggle = (key) =>
    setOpen((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })

  const renderNode = (node, parent, depth) => {
    const key = parent ? `${parent}/${node.label}` : node.label
    const total = count(node)
    if (!total) return null
    const isOpen = term ? true : open.has(key)
    return (
      <div className="tree-node" key={key}>
        <button className={`tree-head depth-${depth}`} aria-expanded={isOpen} onClick={() => toggle(key)}>
          <span className="caret" aria-hidden="true" />
          <span className="tree-label">{node.label}</span>
          <span className="tree-count">{total}</span>
        </button>
        {isOpen && (
          <div className="tree-body">
            {node.children
              ? node.children.map((ch) => renderNode(ch, key, depth + 1))
              : itemsOf(node).map((c) => {
                  const cat = CATEGORIES[c.category]
                  return (
                    <button
                      key={c.type}
                      className="palette-item"
                      style={{ '--accent': cat.color }}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData(DND_TYPE, c.type)
                        e.dataTransfer.effectAllowed = 'copy'
                      }}
                      onClick={() => onAdd(c.type)}
                    >
                      <span className="palette-label">{c.label}</span>
                      <span className="palette-blurb">{node.provider ? `${cat.label} · ${c.blurb}` : c.blurb}</span>
                    </button>
                  )
                })}
          </div>
        )}
      </div>
    )
  }

  const tree = PALETTE_TREE.map((n) => renderNode(n, '', 0)).filter(Boolean)

  return (
    <aside className="palette">
      <input
        className="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search components…"
        aria-label="Search components"
      />
      <p className="hint">Drag onto the canvas, or click to add.</p>
      <div className="tree">{tree}</div>
      {!tree.length && <p className="hint">Nothing matches “{search}”. Try the Custom component.</p>}
    </aside>
  )
}
