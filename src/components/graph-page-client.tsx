'use client'

import { useState, useCallback } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  NodeMouseHandler,
} from 'reactflow'
import 'reactflow/dist/style.css'
import type { Skill, Department, Connection } from '@prisma/client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SkillWithDepartment = Skill & { department: Department | null }
type ConnectionWithSkills = Connection & {
  fromSkill: Skill
  toSkill: SkillWithDepartment
}

interface Props {
  skills: SkillWithDepartment[]
  connections: ConnectionWithSkills[]
}

// ---------------------------------------------------------------------------
// Build graph layout
// ---------------------------------------------------------------------------

function buildGraphLayout(skills: SkillWithDepartment[], connections: ConnectionWithSkills[]) {
  const COLS = Math.ceil(Math.sqrt(skills.length))
  const SPACING_X = 220
  const SPACING_Y = 130

  const nodes: Node[] = skills.map((skill, i) => ({
    id: skill.id,
    data: {
      label: skill.department ? `${skill.name}\n${skill.department.name}` : skill.name,
    },
    position: {
      x: (i % COLS) * SPACING_X,
      y: Math.floor(i / COLS) * SPACING_Y,
    },
    style: {
      borderRadius: 8,
      padding: '6px 12px',
      fontSize: 12,
      maxWidth: 180,
      whiteSpace: 'pre-wrap' as const,
    },
  }))

  const edges: Edge[] = connections.map((c) => ({
    id: c.id,
    source: c.fromSkillId,
    target: c.toSkillId,
    label: c.type.replace(/_/g, '-'),
    animated: false,
  }))

  return { nodes, edges }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GraphPageClient({ skills, connections }: Props) {
  const [showFallback, setShowFallback] = useState(false)
  const [selectedNodeLabel, setSelectedNodeLabel] = useState<string | null>(null)

  const { nodes, edges } = buildGraphLayout(skills, connections)

  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    const label = typeof node.data.label === 'string' ? node.data.label.split('\n')[0] : ''
    setSelectedNodeLabel(label)
  }, [])

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-heading-lg font-semibold text-foreground">Connection Graph</h1>
        <p className="text-body-md text-muted-foreground mt-1">
          Visualize relationships between skills and their dependencies.
        </p>
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setShowFallback((prev) => !prev)}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-raised px-3 py-1.5 text-body-sm font-medium text-foreground hover:bg-sunken transition-colors duration-fast focus-visible:outline-none focus-visible:shadow-focus"
          aria-pressed={showFallback}
        >
          {showFallback ? 'Show Graph' : 'Show List (Accessible)'}
        </button>

        {/* aria-live region for node announcements */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {selectedNodeLabel ? `Selected node: ${selectedNodeLabel}` : ''}
        </div>
      </div>

      {skills.length === 0 ? (
        <p className="text-body-md text-muted-foreground">No skills to display.</p>
      ) : (
        <>
          {/* ACCESSIBLE FALLBACK TABLE — always rendered, toggled visibility */}
          <div
            className={showFallback ? '' : 'sr-only'}
            aria-label="Skill connections list"
          >
            {connections.length === 0 ? (
              <p className="text-body-md text-muted-foreground">No connections defined yet.</p>
            ) : (
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
                        <td className="px-4 py-2.5 text-foreground">{c.fromSkill.name}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {c.type.replace(/_/g, '-')}
                        </td>
                        <td className="px-4 py-2.5 text-foreground">{c.toSkill.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* GRAPH VIEW */}
          {!showFallback && (
            <div
              role="application"
              aria-label="Skill connection graph - use arrow keys to navigate nodes"
              className="flex-1 min-h-[480px] rounded-lg border border-border overflow-hidden"
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
                <MiniMap />
              </ReactFlow>
            </div>
          )}
        </>
      )}
    </div>
  )
}
