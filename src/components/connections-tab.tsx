'use client'

import { useState, useCallback } from 'react'
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  NodeMouseHandler,
} from 'reactflow'
import 'reactflow/dist/style.css'
import type { Connection, Skill, Department } from '@prisma/client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ConnectionWithSkills = Connection & {
  toSkill: Skill & { department: Department }
  fromSkill?: Skill & { department: Department }
}

type SkillMinimal = {
  id: string
  name: string
  department?: { name: string } | null
}

interface Props {
  connections: ConnectionWithSkills[]
  incoming?: ConnectionWithSkills[]
  currentSkill: SkillMinimal
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatType(type: string): string {
  return type.replace(/_/g, '-')
}

function buildLayout(connections: ConnectionWithSkills[], currentSkill: SkillMinimal) {
  // Current skill node at center
  const centerNode: Node = {
    id: currentSkill.id,
    data: { label: currentSkill.name },
    position: { x: 300, y: 180 },
    style: {
      background: 'hsl(214 100% 55%)',
      color: '#fff',
      border: '2px solid hsl(214 91% 41%)',
      borderRadius: 8,
      fontWeight: 600,
      padding: '8px 16px',
    },
  }

  // Connected skill nodes arranged in a circle
  const connectedNodes: Node[] = connections.map((c, i) => {
    const angle = (2 * Math.PI * i) / Math.max(connections.length, 1)
    const radius = 180
    return {
      id: c.toSkill.id,
      data: {
        label: c.toSkill.department
          ? `${c.toSkill.name}\n${c.toSkill.department.name}`
          : c.toSkill.name,
      },
      position: {
        x: 300 + radius * Math.cos(angle),
        y: 180 + radius * Math.sin(angle),
      },
      style: {
        borderRadius: 8,
        padding: '6px 12px',
        fontSize: 13,
      },
    }
  })

  const edges: Edge[] = connections.map((c) => ({
    id: c.id,
    source: currentSkill.id,
    target: c.toSkill.id,
    label: formatType(c.type),
    animated: false,
  }))

  return { nodes: [centerNode, ...connectedNodes], edges }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ConnectionsTab({ connections, incoming = [], currentSkill }: Props) {
  const [showFallback, setShowFallback] = useState(false)
  const [selectedNodeLabel, setSelectedNodeLabel] = useState<string | null>(null)

  const { nodes, edges } = buildLayout(connections, currentSkill)

  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    const label = typeof node.data.label === 'string' ? node.data.label.split('\n')[0] : ''
    setSelectedNodeLabel(label)
  }, [])

  const hasConnections = connections.length > 0 || incoming.length > 0

  return (
    <div className="space-y-4">
      {/* Toggle button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setShowFallback((prev) => !prev)}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-raised px-3 py-1.5 text-body-sm font-medium text-foreground hover:bg-sunken transition-colors duration-fast focus-visible:outline-none focus-visible:shadow-focus"
          aria-pressed={showFallback}
        >
          {showFallback ? 'Show Graph' : 'Show List (Accessible)'}
        </button>

        {/* aria-live region for selected node announcements */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {selectedNodeLabel ? `Selected node: ${selectedNodeLabel}` : ''}
        </div>
      </div>

      {!hasConnections && (
        <p className="text-body-md text-muted-foreground">No connections defined yet.</p>
      )}

      {hasConnections && (
        <>
          {/* ACCESSIBLE FALLBACK TABLE — always rendered, toggled visibility */}
          <div
            className={showFallback ? '' : 'sr-only'}
            aria-label="Connection list"
          >
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-body-sm border-collapse">
                <thead className="bg-sunken border-b border-border">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-semibold text-foreground">From</th>
                    <th className="px-4 py-2.5 text-left font-semibold text-foreground">
                      Relationship
                    </th>
                    <th className="px-4 py-2.5 text-left font-semibold text-foreground">To</th>
                  </tr>
                </thead>
                <tbody>
                  {connections.map((c) => (
                    <tr key={c.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-2.5 text-foreground">{currentSkill.name}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{formatType(c.type)}</td>
                      <td className="px-4 py-2.5 text-foreground">{c.toSkill.name}</td>
                    </tr>
                  ))}
                  {incoming.map((c) => (
                    <tr key={c.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-2.5 text-foreground">
                        {c.fromSkill?.name ?? 'Unknown'}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{formatType(c.type)}</td>
                      <td className="px-4 py-2.5 text-foreground">{currentSkill.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* GRAPH VIEW */}
          {!showFallback && (
            <div
              role="application"
              aria-label="Skill connection graph - use arrow keys to navigate nodes"
              style={{ height: 400 }}
              className="rounded-lg border border-border overflow-hidden"
            >
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodeClick={onNodeClick}
                fitView
                attributionPosition="bottom-right"
              >
                <Background />
                <Controls />
              </ReactFlow>
            </div>
          )}
        </>
      )}
    </div>
  )
}
