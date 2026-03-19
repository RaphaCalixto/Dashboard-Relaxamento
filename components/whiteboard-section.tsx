"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
  type ReactFlowInstance,
  useEdgesState,
  useNodesState,
} from "@xyflow/react"
import { toPng } from "html-to-image"
import { jsPDF } from "jspdf"
import {
  BarChart3,
  Brain,
  Building2,
  Circle,
  Clock3,
  Diamond,
  FileImage,
  FileText,
  GitBranch,
  Loader2,
  Network,
  Palette,
  Plus,
  RectangleHorizontal,
  Repeat,
  Save,
  Shuffle,
  Trash2,
  Wand2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"

import "@xyflow/react/dist/style.css"

type NodeShape = "rectangle" | "rounded" | "circle" | "diamond"

type WhiteboardNodeData = {
  label: string
  shape: NodeShape
  fillColor: string
  textColor: string
  width: number
  height: number
}

type WhiteboardContent = {
  nodes: Node<WhiteboardNodeData>[]
  edges: Edge[]
  themeId: string
  viewport: {
    x: number
    y: number
    zoom: number
  }
}

type WhiteboardRow = {
  id: string
  name: string
  content: WhiteboardContent
  updatedAt: string
}

type WhiteboardSectionProps = {
  userId: string
}

type MermaidGenerationResponse = {
  mermaid?: string
  error?: string
}

type MermaidNodeDraft = {
  id: string
  label: string
  shape: NodeShape
}

type MermaidEdgeDraft = {
  sourceId: string
  targetId: string
  label?: string
}

const MIN_NODE_SIZE = 80
const MAX_NODE_SIZE = 420
const DEFAULT_NODE_SIZE = { width: 180, height: 90 }
const DEFAULT_THEME_ID = "corporativo-azul"

const TEMPLATE_BUTTONS = [
  { id: "flowchart", label: "Fluxograma", icon: GitBranch },
  { id: "mindmap", label: "Mapa Mental", icon: Brain },
  { id: "infographic", label: "Infografico", icon: BarChart3 },
  { id: "hierarchy", label: "Hierarquia", icon: Network },
  { id: "process", label: "Processo", icon: Repeat },
  { id: "organizational", label: "Organizacional", icon: Building2 },
  { id: "timeline", label: "Linha do Tempo", icon: Clock3 },
  { id: "zigzag", label: "Zigzag", icon: Shuffle },
] as const

type TemplateId = (typeof TEMPLATE_BUTTONS)[number]["id"]

type WhiteboardTheme = {
  id: string
  name: string
  canvasBg: string
  panelBg: string
  panelBorder: string
  dotColor: string
  edgeColor: string
  nodePalette: string[]
  textColor: string
  accent: string
}

const WHITEBOARD_THEMES: WhiteboardTheme[] = [
  {
    id: "corporativo-azul",
    name: "Corporativo Azul",
    canvasBg: "#050d1d",
    panelBg: "#0c1629",
    panelBorder: "#1c2e4e",
    dotColor: "#23416e",
    edgeColor: "#8eb4e7",
    nodePalette: ["#18b7df", "#2ba7d3", "#2f8cb9", "#2e6f9f"],
    textColor: "#edf6ff",
    accent: "#18b7df",
  },
  {
    id: "verde-tecnologico",
    name: "Verde Tecnologico",
    canvasBg: "#07180f",
    panelBg: "#0a2018",
    panelBorder: "#1c4c39",
    dotColor: "#215f42",
    edgeColor: "#67d7a3",
    nodePalette: ["#10b981", "#0f9f6f", "#0f855f", "#1f6f59"],
    textColor: "#ebfff5",
    accent: "#1dd47e",
  },
  {
    id: "gradiente-moderno",
    name: "Gradiente Moderno",
    canvasBg: "#0a0f26",
    panelBg: "#111630",
    panelBorder: "#2f3770",
    dotColor: "#3c4891",
    edgeColor: "#b5beff",
    nodePalette: ["#7c3aed", "#6366f1", "#3b82f6", "#06b6d4"],
    textColor: "#f3f5ff",
    accent: "#7c3aed",
  },
  {
    id: "minimalista-clean",
    name: "Minimalista Clean",
    canvasBg: "#101215",
    panelBg: "#171b22",
    panelBorder: "#2e353d",
    dotColor: "#3b434d",
    edgeColor: "#a3acb8",
    nodePalette: ["#4b5563", "#5b6572", "#6b7280", "#8d97a5"],
    textColor: "#f3f4f6",
    accent: "#9ca3af",
  },
  {
    id: "executivo-premium",
    name: "Executivo Premium",
    canvasBg: "#07132a",
    panelBg: "#0f1f3a",
    panelBorder: "#2d4b80",
    dotColor: "#3f64a1",
    edgeColor: "#78a9ff",
    nodePalette: ["#1d4ed8", "#2563eb", "#3b82f6", "#60a5fa"],
    textColor: "#ecf4ff",
    accent: "#3b82f6",
  },
  {
    id: "cores-quentes",
    name: "Cores Quentes",
    canvasBg: "#1c0f10",
    panelBg: "#2a1718",
    panelBorder: "#5d2b2d",
    dotColor: "#744242",
    edgeColor: "#f7a34a",
    nodePalette: ["#f59e0b", "#f97316", "#ef4444", "#ec4899"],
    textColor: "#fff6ef",
    accent: "#fb923c",
  },
  {
    id: "natureza",
    name: "Natureza",
    canvasBg: "#0b1714",
    panelBg: "#13231f",
    panelBorder: "#2b5b4e",
    dotColor: "#366f5f",
    edgeColor: "#7dd3b8",
    nodePalette: ["#34d399", "#10b981", "#2dd4bf", "#22c55e"],
    textColor: "#ecfdf5",
    accent: "#22c55e",
  },
  {
    id: "infografico-circular",
    name: "Infografico Circular",
    canvasBg: "#0f1022",
    panelBg: "#171832",
    panelBorder: "#333768",
    dotColor: "#484f95",
    edgeColor: "#9ba8ff",
    nodePalette: ["#22d3ee", "#a855f7", "#f59e0b", "#ef4444"],
    textColor: "#f7f8ff",
    accent: "#22d3ee",
  },
]

const emptyBoard: WhiteboardContent = {
  nodes: [],
  edges: [],
  themeId: DEFAULT_THEME_ID,
  viewport: { x: 0, y: 0, zoom: 1 },
}

const sanitizeNumber = (value: unknown, fallback: number, min: number, max: number) => {
  const n = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(max, n))
}

const normalizeNodeShape = (value: unknown): NodeShape => {
  if (value === "rectangle" || value === "rounded" || value === "circle" || value === "diamond") {
    return value
  }
  return "rounded"
}

const normalizeHexColor = (value: unknown, fallback: string) => {
  if (typeof value !== "string") return fallback
  const token = value.trim()
  if (!token) return fallback
  return token
}

const getThemeById = (themeId: string) => WHITEBOARD_THEMES.find((theme) => theme.id === themeId) ?? WHITEBOARD_THEMES[0]

const getThemeColor = (theme: WhiteboardTheme, index: number) => theme.nodePalette[index % theme.nodePalette.length] ?? theme.accent

type EdgeDecorationOptions = {
  withArrow?: boolean
  dashed?: boolean
  strokeWidth?: number
}

const buildNode = (
  id: string,
  position: { x: number; y: number },
  shape: NodeShape,
  overrides?: Partial<WhiteboardNodeData>,
): Node<WhiteboardNodeData> => ({
  id,
  type: "shapeNode",
  position,
  data: {
    label: overrides?.label ?? "Novo bloco",
    shape,
    fillColor: overrides?.fillColor ?? "#f8fafc",
    textColor: overrides?.textColor ?? "#0f172a",
    width: overrides?.width ?? DEFAULT_NODE_SIZE.width,
    height: overrides?.height ?? DEFAULT_NODE_SIZE.height,
  },
})

const decorateEdge = (edge: Edge, edgeColor = "#475569", options?: EdgeDecorationOptions): Edge => {
  const edgeData = (edge.data ?? {}) as { disableArrow?: boolean }
  const withArrow = options?.withArrow ?? !edgeData.disableArrow

  return {
    ...edge,
    type: edge.type ?? "smoothstep",
    markerEnd: withArrow
      ? {
          type: MarkerType.ArrowClosed,
          color: edgeColor,
        }
      : undefined,
    style: {
      stroke: edgeColor,
      strokeWidth: options?.strokeWidth ?? 2,
      ...(options?.dashed ? { strokeDasharray: "6 6" } : {}),
      ...(edge.style ?? {}),
    },
  }
}

const deserializeContent = (raw: unknown): WhiteboardContent => {
  if (!raw || typeof raw !== "object") return emptyBoard

  const content = raw as any

  const nodes: Node<WhiteboardNodeData>[] = Array.isArray(content.nodes)
    ? content.nodes.map((node: any, index: number) => {
        const id = typeof node?.id === "string" && node.id.trim() ? node.id : `node-${index}`
        const position = {
          x: sanitizeNumber(node?.position?.x, index * 40, -200000, 200000),
          y: sanitizeNumber(node?.position?.y, index * 30, -200000, 200000),
        }
        const shape = normalizeNodeShape(node?.data?.shape)
        return {
          id,
          type: "shapeNode",
          position,
          data: {
            label: typeof node?.data?.label === "string" ? node.data.label : "Bloco",
            shape,
            fillColor: normalizeHexColor(node?.data?.fillColor, "#f8fafc"),
            textColor: normalizeHexColor(node?.data?.textColor, "#0f172a"),
            width: sanitizeNumber(node?.data?.width, DEFAULT_NODE_SIZE.width, MIN_NODE_SIZE, MAX_NODE_SIZE),
            height: sanitizeNumber(node?.data?.height, DEFAULT_NODE_SIZE.height, MIN_NODE_SIZE, MAX_NODE_SIZE),
          },
        } satisfies Node<WhiteboardNodeData>
      })
    : []

  const edges: Edge[] = Array.isArray(content.edges)
    ? content.edges
        .filter((edge: any) => typeof edge?.source === "string" && typeof edge?.target === "string")
        .map((edge: any, index: number) =>
          decorateEdge({
            id: typeof edge.id === "string" ? edge.id : `edge-${index}`,
            source: edge.source,
            target: edge.target,
            sourceHandle: typeof edge.sourceHandle === "string" ? edge.sourceHandle : undefined,
            targetHandle: typeof edge.targetHandle === "string" ? edge.targetHandle : undefined,
            type: typeof edge.type === "string" ? edge.type : "smoothstep",
            data: edge.data ?? undefined,
            style: edge.style ?? undefined,
            markerEnd: edge.markerEnd ?? undefined,
          }),
        )
    : []

  const viewport = {
    x: sanitizeNumber(content.viewport?.x, 0, -200000, 200000),
    y: sanitizeNumber(content.viewport?.y, 0, -200000, 200000),
    zoom: sanitizeNumber(content.viewport?.zoom, 1, 0.1, 4),
  }

  const rawThemeId = typeof content.themeId === "string" ? content.themeId : DEFAULT_THEME_ID
  const themeId = WHITEBOARD_THEMES.some((theme) => theme.id === rawThemeId) ? rawThemeId : DEFAULT_THEME_ID

  return { nodes, edges, themeId, viewport }
}

const serializeContent = (content: WhiteboardContent) => ({
  nodes: content.nodes.map((node) => ({
    id: node.id,
    type: "shapeNode",
    position: {
      x: node.position.x,
      y: node.position.y,
    },
    data: {
      label: node.data.label,
      shape: node.data.shape,
      fillColor: node.data.fillColor,
      textColor: node.data.textColor,
      width: node.data.width,
      height: node.data.height,
    },
  })),
  edges: content.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    type: edge.type ?? "smoothstep",
    data: edge.data,
    style: edge.style,
    markerEnd: edge.markerEnd,
  })),
  themeId: content.themeId,
  viewport: content.viewport,
})

const shapeButtonStyle = {
  rectangle: "rounded-md",
  rounded: "rounded-2xl",
  circle: "rounded-full",
  diamond: "",
}

function ShapeNode({ data, selected }: NodeProps<WhiteboardNodeData>) {
  const sizeStyle = {
    width: data.width,
    height: data.height,
  }

  const shapeStyle =
    data.shape === "diamond"
      ? { clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" as const }
      : undefined

  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} className="h-2.5 w-2.5 !bg-slate-500" />
      <Handle type="target" position={Position.Left} className="h-2.5 w-2.5 !bg-slate-500" />
      <Handle type="source" position={Position.Bottom} className="h-2.5 w-2.5 !bg-slate-500" />
      <Handle type="source" position={Position.Right} className="h-2.5 w-2.5 !bg-slate-500" />

      <div
        className={cn(
          "flex items-center justify-center px-3 text-center text-sm font-medium shadow-md transition-all",
          shapeButtonStyle[data.shape],
          selected ? "ring-2 ring-blue-500 ring-offset-2" : "ring-1 ring-black/10",
        )}
        style={{
          ...sizeStyle,
          ...shapeStyle,
          backgroundColor: data.fillColor,
          color: data.textColor,
        }}
      >
        <span className="line-clamp-4 break-words">{data.label || "Bloco"}</span>
      </div>
    </div>
  )
}

const nodeTypes = {
  shapeNode: ShapeNode,
}

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "") || "quadro"

const normalizeMermaidLabel = (value: string, fallback: string) => {
  const cleaned = value.trim().replace(/^["'`]+|["'`]+$/g, "").replace(/\s+/g, " ")
  return cleaned || fallback
}

const parseMermaidNodeToken = (token: string): MermaidNodeDraft | null => {
  const normalized = token.trim()
  if (!normalized) return null

  const idMatch = normalized.match(/^([A-Za-z][A-Za-z0-9_]*)/)
  if (!idMatch) return null

  const id = idMatch[1]
  const remainder = normalized.slice(id.length).trim()
  if (!remainder) {
    return {
      id,
      label: id,
      shape: "rounded",
    }
  }

  const patterns: Array<{ open: string; close: string; shape: NodeShape }> = [
    { open: "((", close: "))", shape: "circle" },
    { open: "{", close: "}", shape: "diamond" },
    { open: "[", close: "]", shape: "rectangle" },
    { open: "(", close: ")", shape: "rounded" },
  ]

  for (const pattern of patterns) {
    if (!remainder.startsWith(pattern.open) || !remainder.endsWith(pattern.close)) continue

    const label = remainder.slice(pattern.open.length, remainder.length - pattern.close.length)
    return {
      id,
      label: normalizeMermaidLabel(label, id),
      shape: pattern.shape,
    }
  }

  return {
    id,
    label: normalizeMermaidLabel(remainder, id),
    shape: "rounded",
  }
}

const mergeMermaidNodeDraft = (current: MermaidNodeDraft | undefined, incoming: MermaidNodeDraft) => {
  if (!current) return incoming
  const nextLabel = current.label === current.id ? incoming.label : current.label
  const nextShape = current.shape === "rounded" ? incoming.shape : current.shape
  return {
    ...current,
    label: nextLabel,
    shape: nextShape,
  }
}

const parseMermaidToWhiteboard = (
  mermaid: string,
  theme: WhiteboardTheme,
): { nodes: Node<WhiteboardNodeData>[]; edges: Edge[]; viewport: WhiteboardContent["viewport"] } | null => {
  const statements = mermaid
    .split(/\r?\n/)
    .flatMap((line) => line.split(";"))
    .map((line) => line.trim())
    .filter(Boolean)

  const nodeMap = new Map<string, MermaidNodeDraft>()
  const edgeDrafts: MermaidEdgeDraft[] = []

  statements.forEach((statement) => {
    if (/^(flowchart|graph)\b/i.test(statement)) return
    if (/^(%%|classDef|class|style|linkStyle|subgraph|end)\b/i.test(statement)) return

    const edgeMatch = statement.match(/^(.+?)\s*-->\s*(?:\|([^|]+)\|\s*)?(.+)$/)
    if (edgeMatch) {
      const sourceToken = parseMermaidNodeToken(edgeMatch[1])
      const targetToken = parseMermaidNodeToken(edgeMatch[3])

      if (!sourceToken || !targetToken) return

      nodeMap.set(sourceToken.id, mergeMermaidNodeDraft(nodeMap.get(sourceToken.id), sourceToken))
      nodeMap.set(targetToken.id, mergeMermaidNodeDraft(nodeMap.get(targetToken.id), targetToken))

      edgeDrafts.push({
        sourceId: sourceToken.id,
        targetId: targetToken.id,
        label: edgeMatch[2] ? normalizeMermaidLabel(edgeMatch[2], "") : undefined,
      })
      return
    }

    const isolated = parseMermaidNodeToken(statement)
    if (!isolated) return

    nodeMap.set(isolated.id, mergeMermaidNodeDraft(nodeMap.get(isolated.id), isolated))
  })

  if (nodeMap.size === 0) return null

  const ids = Array.from(nodeMap.keys())
  const adjacency = new Map<string, string[]>()
  const indegree = new Map<string, number>()
  const uniqueEdges = new Map<string, MermaidEdgeDraft>()

  ids.forEach((id) => {
    adjacency.set(id, [])
    indegree.set(id, 0)
  })

  edgeDrafts.forEach((edge) => {
    if (!nodeMap.has(edge.sourceId) || !nodeMap.has(edge.targetId)) return
    const edgeKey = `${edge.sourceId}::${edge.targetId}::${edge.label ?? ""}`
    if (uniqueEdges.has(edgeKey)) return
    uniqueEdges.set(edgeKey, edge)

    adjacency.set(edge.sourceId, [...(adjacency.get(edge.sourceId) ?? []), edge.targetId])
    indegree.set(edge.targetId, (indegree.get(edge.targetId) ?? 0) + 1)
  })

  const levelByNode = new Map<string, number>(ids.map((id) => [id, 0]))
  const indegreeQueue = new Map(indegree)
  const queue = ids.filter((id) => (indegreeQueue.get(id) ?? 0) === 0)
  const processed = new Set<string>()

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) continue
    processed.add(current)

    const currentLevel = levelByNode.get(current) ?? 0
    const targets = adjacency.get(current) ?? []

    targets.forEach((target) => {
      const nextLevel = Math.max(levelByNode.get(target) ?? 0, currentLevel + 1)
      levelByNode.set(target, nextLevel)

      const nextIndegree = (indegreeQueue.get(target) ?? 0) - 1
      indegreeQueue.set(target, nextIndegree)
      if (nextIndegree === 0) {
        queue.push(target)
      }
    })
  }

  if (processed.size < ids.length) {
    let fallbackLevel = Math.max(0, ...Array.from(levelByNode.values())) + 1
    ids.forEach((id) => {
      if (processed.has(id)) return
      levelByNode.set(id, fallbackLevel)
      fallbackLevel += 1
    })
  }

  const levels = new Map<number, string[]>()
  ids.forEach((id) => {
    const level = levelByNode.get(id) ?? 0
    const entries = levels.get(level) ?? []
    entries.push(id)
    levels.set(level, entries)
  })

  levels.forEach((group, level) => {
    group.sort((a, b) => {
      const first = nodeMap.get(a)?.label ?? a
      const second = nodeMap.get(b)?.label ?? b
      return first.localeCompare(second, "pt-BR")
    })
    levels.set(level, group)
  })

  const sortedLevels = Array.from(levels.keys()).sort((a, b) => a - b)
  const maxRows = Math.max(1, ...Array.from(levels.values()).map((group) => group.length))
  const xSpacing = 300
  const ySpacing = 170

  const nodes: Node<WhiteboardNodeData>[] = []
  let colorIndex = 0

  sortedLevels.forEach((level) => {
    const group = levels.get(level) ?? []
    const yOffset = 120 + ((maxRows - group.length) * ySpacing) / 2

    group.forEach((nodeId, rowIndex) => {
      const draft = nodeMap.get(nodeId)
      if (!draft) return

      const baseWidth = draft.shape === "circle" ? 144 : draft.shape === "diamond" ? 210 : 220
      const baseHeight = draft.shape === "circle" ? 144 : draft.shape === "diamond" ? 120 : 92
      const textScale = draft.shape === "circle" ? 14 : 28
      const extraLines = Math.max(0, Math.ceil(draft.label.length / textScale) - 1)
      const width = sanitizeNumber(baseWidth + Math.min(100, extraLines * 16), baseWidth, MIN_NODE_SIZE, MAX_NODE_SIZE)
      const height = sanitizeNumber(baseHeight + extraLines * 18, baseHeight, MIN_NODE_SIZE, MAX_NODE_SIZE)

      nodes.push(
        buildNode(
          nodeId,
          {
            x: 120 + level * xSpacing,
            y: yOffset + rowIndex * ySpacing,
          },
          draft.shape,
          {
            label: draft.label,
            fillColor: getThemeColor(theme, colorIndex),
            textColor: theme.textColor,
            width,
            height,
          },
        ),
      )
      colorIndex += 1
    })
  })

  const edges = Array.from(uniqueEdges.values()).map((edge) =>
    decorateEdge(
      {
        id: crypto.randomUUID(),
        source: edge.sourceId,
        target: edge.targetId,
        label: edge.label,
        type: "smoothstep",
      },
      theme.edgeColor,
    ),
  )

  return {
    nodes,
    edges,
    viewport: { x: 0, y: 0, zoom: 1 },
  }
}

const buildLinearTemplate = (
  labels: string[],
  shapes: NodeShape[],
  theme: WhiteboardTheme,
): { nodes: Node<WhiteboardNodeData>[]; edges: Edge[] } => {
  const nodes = labels.map((label, index) =>
    buildNode(
      crypto.randomUUID(),
      { x: 120 + index * 230, y: 220 + (index % 2 === 0 ? 0 : 36) },
      shapes[index] ?? "rounded",
      {
        label,
        fillColor: getThemeColor(theme, index),
        textColor: theme.textColor,
        width: shapes[index] === "circle" ? 136 : 188,
        height: shapes[index] === "circle" ? 136 : 88,
      },
    ),
  )

  const edges = nodes
    .slice(0, -1)
    .map((node, index) =>
      decorateEdge(
        {
          id: crypto.randomUUID(),
          source: node.id,
          target: nodes[index + 1]?.id ?? "",
        },
        theme.edgeColor,
      ),
    )

  return { nodes, edges }
}

const buildTemplate = (
  templateId: TemplateId,
  theme: WhiteboardTheme,
  hint?: string,
): { nodes: Node<WhiteboardNodeData>[]; edges: Edge[]; viewport: WhiteboardContent["viewport"] } => {
  const cleanHint = hint?.trim()
  const parsed = cleanHint
    ? cleanHint
        .split(/[>\n;,|]/)
        .map((part) => part.trim())
        .filter(Boolean)
    : []

  if (templateId === "flowchart") {
    const labels = parsed.length >= 3 ? parsed.slice(0, 10) : ["Inicio", "Planejamento", "Execucao", "Monitoramento", "Concluido"]
    const shapeCycle: NodeShape[] = ["rounded", "rectangle", "diamond", "circle", "rounded"]
    const shapes = labels.map((_, index) => shapeCycle[index % shapeCycle.length] ?? "rounded")
    const linear = buildLinearTemplate(labels, shapes, theme)
    return { nodes: linear.nodes, edges: linear.edges, viewport: { x: -80, y: -80, zoom: 0.86 } }
  }

  if (templateId === "mindmap") {
    const center = buildNode(crypto.randomUUID(), { x: 560, y: 220 }, "circle", {
      label: cleanHint || "Tema Central",
      fillColor: getThemeColor(theme, 0),
      textColor: theme.textColor,
      width: 170,
      height: 170,
    })

    const branchLabels = parsed.length >= 4 ? parsed.slice(0, 8) : ["Ideia 1", "Ideia 2", "Ideia 3", "Ideia 4", "Detalhes", "Acoes"]
    const nodes = [center]
    const edges: Edge[] = []

    branchLabels.forEach((label, index) => {
      const angle = (Math.PI * 2 * index) / branchLabels.length
      const child = buildNode(
        crypto.randomUUID(),
        {
          x: 560 + Math.cos(angle) * 320,
          y: 220 + Math.sin(angle) * 320,
        },
        index % 2 === 0 ? "rounded" : "rectangle",
        {
          label,
          fillColor: getThemeColor(theme, index + 1),
          textColor: theme.textColor,
          width: 170,
          height: 84,
        },
      )
      nodes.push(child)
      edges.push(
        decorateEdge(
          {
            id: crypto.randomUUID(),
            source: center.id,
            target: child.id,
          },
          theme.edgeColor,
        ),
      )
    })

    return { nodes, edges, viewport: { x: -220, y: -180, zoom: 0.72 } }
  }

  if (templateId === "infographic") {
    const center = buildNode(crypto.randomUUID(), { x: 560, y: 240 }, "circle", {
      label: parsed[0] ?? "INFOGRAFICO",
      fillColor: getThemeColor(theme, 0),
      textColor: theme.textColor,
      width: 230,
      height: 230,
    })

    const topicLabels =
      parsed.length >= 5
        ? parsed.slice(1, 9)
        : ["Contexto", "Problema", "Analise", "Insights", "Processo", "Resultados", "Acao", "Conclusao"]

    const nodes = [center]
    const edges: Edge[] = []

    topicLabels.forEach((label, index) => {
      const angle = -Math.PI / 2 + (Math.PI * 2 * index) / topicLabels.length
      const item = buildNode(
        crypto.randomUUID(),
        {
          x: 560 + Math.cos(angle) * 400,
          y: 240 + Math.sin(angle) * 320,
        },
        "rounded",
        {
          label,
          fillColor: getThemeColor(theme, index + 1),
          textColor: theme.textColor,
          width: 200,
          height: 90,
        },
      )
      nodes.push(item)
      edges.push(
        decorateEdge(
          {
            id: crypto.randomUUID(),
            source: center.id,
            target: item.id,
            data: { disableArrow: true },
          },
          getThemeColor(theme, index + 1),
          { withArrow: false, strokeWidth: 3 },
        ),
      )
    })

    return { nodes, edges, viewport: { x: -250, y: -220, zoom: 0.62 } }
  }

  if (templateId === "hierarchy") {
    const root = buildNode(crypto.randomUUID(), { x: 560, y: 20 }, "circle", {
      label: parsed[0] ?? "Diretoria",
      fillColor: getThemeColor(theme, 0),
      textColor: theme.textColor,
      width: 120,
      height: 120,
    })

    const middleLabels = parsed.length >= 4 ? parsed.slice(1, 4) : ["Operacoes", "Marketing", "Tecnologia"]
    const leafLabels =
      parsed.length >= 10 ? parsed.slice(4, 10) : ["Equipe A", "Equipe B", "Equipe C", "Equipe D", "Equipe E", "Equipe F"]

    const middleNodes = middleLabels.map((label, index) =>
      buildNode(
        crypto.randomUUID(),
        { x: 210 + index * 330, y: 220 },
        "circle",
        {
          label,
          fillColor: getThemeColor(theme, index + 1),
          textColor: theme.textColor,
          width: 112,
          height: 112,
        },
      ),
    )

    const leafNodes = leafLabels.map((label, index) =>
      buildNode(
        crypto.randomUUID(),
        { x: 120 + index * 180, y: 420 },
        "circle",
        {
          label,
          fillColor: getThemeColor(theme, index + 4),
          textColor: theme.textColor,
          width: 104,
          height: 104,
        },
      ),
    )

    const nodes = [root, ...middleNodes, ...leafNodes]
    const edges: Edge[] = []

    middleNodes.forEach((node) => {
      edges.push(
        decorateEdge(
          {
            id: crypto.randomUUID(),
            source: root.id,
            target: node.id,
            data: { disableArrow: true },
          },
          theme.edgeColor,
          { withArrow: false, dashed: true },
        ),
      )
    })

    leafNodes.forEach((node, index) => {
      const ownerIndex = Math.min(middleNodes.length - 1, Math.floor((index * middleNodes.length) / leafNodes.length))
      const owner = middleNodes[ownerIndex]
      if (!owner) return

      edges.push(
        decorateEdge(
          {
            id: crypto.randomUUID(),
            source: owner.id,
            target: node.id,
            data: { disableArrow: true },
          },
          theme.edgeColor,
          { withArrow: false, dashed: true },
        ),
      )
    })

    return { nodes, edges, viewport: { x: -220, y: -80, zoom: 0.7 } }
  }

  if (templateId === "timeline") {
    const labels = parsed.length >= 3 ? parsed.slice(0, 10) : ["Q1", "Q2", "Q3", "Q4", "Lancamento"]
    const nodes = labels.map((label, index) =>
      buildNode(
        crypto.randomUUID(),
        { x: 140 + index * 240, y: index % 2 === 0 ? 200 : 340 },
        index % 2 === 0 ? "circle" : "rounded",
        {
          label,
          fillColor: getThemeColor(theme, index),
          textColor: theme.textColor,
          width: index % 2 === 0 ? 128 : 176,
          height: index % 2 === 0 ? 128 : 84,
        },
      ),
    )
    const edges = nodes
      .slice(0, -1)
      .map((node, index) =>
        decorateEdge(
          {
            id: crypto.randomUUID(),
            source: node.id,
            target: nodes[index + 1]?.id ?? "",
          },
          theme.edgeColor,
        ),
      )
    return { nodes, edges, viewport: { x: -80, y: -90, zoom: 0.84 } }
  }

  const fallbackLabels =
    parsed.length >= 3 ? parsed.slice(0, 8) : ["Inicio", "Planejamento", "Execucao", "Analise", "Resultado", "Concluido"]
  const fallbackShapes: NodeShape[] = ["rounded", "rectangle", "diamond", "circle", "rectangle", "rounded", "diamond", "circle"]
  const linear = buildLinearTemplate(fallbackLabels, fallbackShapes, theme)

  return { nodes: linear.nodes, edges: linear.edges, viewport: { x: -80, y: -80, zoom: 0.86 } }
}

export function WhiteboardSection({ userId }: WhiteboardSectionProps) {
  const { toast } = useToast()

  const [boards, setBoards] = useState<WhiteboardRow[]>([])
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null)
  const [boardNameInput, setBoardNameInput] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [supportsWhiteboards, setSupportsWhiteboards] = useState(true)
  const [isHydratingBoard, setIsHydratingBoard] = useState(false)

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<WhiteboardNodeData>>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 })
  const [themeId, setThemeId] = useState(DEFAULT_THEME_ID)
  const [diagramPrompt, setDiagramPrompt] = useState("")
  const [generatedMermaid, setGeneratedMermaid] = useState("")
  const [isGeneratingDiagram, setIsGeneratingDiagram] = useState(false)
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance<Node<WhiteboardNodeData>, Edge> | null>(null)

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)

  const [exportScale, setExportScale] = useState(2)
  const [transparentExport, setTransparentExport] = useState(false)

  const canvasRef = useRef<HTMLDivElement>(null)
  const localUpdateRef = useRef<string | null>(null)

  const activeBoard = useMemo(() => boards.find((board) => board.id === activeBoardId) ?? null, [boards, activeBoardId])
  const selectedNode = useMemo(() => nodes.find((node) => node.id === selectedNodeId) ?? null, [nodes, selectedNodeId])
  const activeTheme = useMemo(() => getThemeById(themeId), [themeId])

  const fitCanvasToContent = useCallback(
    (duration = 280) => {
      if (!reactFlowInstance) return

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          const fitResult = reactFlowInstance.fitView({
            padding: 0.2,
            duration,
            includeHiddenNodes: true,
            minZoom: 0.2,
            maxZoom: 1.4,
          })

          void Promise.resolve(fitResult).finally(() => {
            setViewport(reactFlowInstance.getViewport())
          })
        })
      })
    },
    [reactFlowInstance],
  )

  const applyBoardContent = useCallback(
    async (content: WhiteboardContent) => {
      setIsHydratingBoard(true)
      setNodes(content.nodes)
      setEdges(content.edges)
      setThemeId(content.themeId)
      setSelectedNodeId(null)
      setSelectedEdgeId(null)

      if (reactFlowInstance) {
        if (content.nodes.length > 0) {
          fitCanvasToContent(0)
        } else {
          const emptyViewport = { x: 0, y: 0, zoom: 1 }
          setViewport(emptyViewport)
          await reactFlowInstance.setViewport(emptyViewport, { duration: 0 })
        }
      } else {
        setViewport(content.viewport)
      }

      requestAnimationFrame(() => {
        setIsHydratingBoard(false)
      })
    },
    [fitCanvasToContent, reactFlowInstance, setEdges, setNodes],
  )

  const createBoard = useCallback(
    async (nameOverride?: string) => {
      const theme = getThemeById(DEFAULT_THEME_ID)
      const content: WhiteboardContent = {
        nodes: [
          buildNode(crypto.randomUUID(), { x: 120, y: 100 }, "rounded", {
            label: "Novo fluxo",
            fillColor: getThemeColor(theme, 0),
            textColor: theme.textColor,
          }),
        ],
        edges: [],
        themeId: DEFAULT_THEME_ID,
        viewport: { x: 0, y: 0, zoom: 1 },
      }

      const boardName = nameOverride?.trim() || "Novo Quadro"
      const now = new Date().toISOString()

      const { data, error } = await supabase
        .from("user_whiteboards")
        .insert({
          user_id: userId,
          name: boardName,
          content: serializeContent(content),
          updated_at: now,
        })
        .select("id, name, content, updated_at")
        .single()

      if (error || !data) {
        toast({
          title: "Erro ao criar quadro",
          description: "Nao foi possivel criar um novo quadro.",
          variant: "destructive",
        })
        return null
      }

      const nextBoard: WhiteboardRow = {
        id: data.id,
        name: typeof data.name === "string" ? data.name : boardName,
        content: deserializeContent(data.content),
        updatedAt: typeof data.updated_at === "string" ? data.updated_at : now,
      }

      setBoards((prev) => [nextBoard, ...prev])
      setActiveBoardId(nextBoard.id)
      setBoardNameInput(nextBoard.name)
      return nextBoard
    },
    [toast, userId],
  )

  useEffect(() => {
    let cancelled = false

    const loadBoards = async () => {
      setIsLoading(true)

      const { data, error } = await supabase
        .from("user_whiteboards")
        .select("id, name, content, updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })

      if (cancelled) return

      const tableMissing =
        !!error &&
        typeof error.message === "string" &&
        (error.message.toLowerCase().includes("user_whiteboards") || error.message.toLowerCase().includes("does not exist"))

      if (tableMissing) {
        setSupportsWhiteboards(false)
        setBoards([])
        setNodes([])
        setEdges([])
        setIsLoading(false)
        return
      }

      if (error) {
        toast({
          title: "Erro ao carregar quadros",
          description: "Nao foi possivel carregar seus mapas mentais e fluxos.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      setSupportsWhiteboards(true)

      const loadedBoards: WhiteboardRow[] = (data ?? []).map((row: any) => ({
        id: row.id,
        name: typeof row.name === "string" && row.name.trim() ? row.name : "Quadro",
        content: deserializeContent(row.content),
        updatedAt: typeof row.updated_at === "string" ? row.updated_at : new Date().toISOString(),
      }))

      if (loadedBoards.length === 0) {
        await createBoard("Meu primeiro quadro")
      } else {
        setBoards(loadedBoards)
        const firstBoard = loadedBoards[0]
        setActiveBoardId(firstBoard.id)
        setBoardNameInput(firstBoard.name)
      }

      setIsLoading(false)
    }

    loadBoards()

    return () => {
      cancelled = true
    }
  }, [createBoard, toast, userId])

  useEffect(() => {
    if (!supportsWhiteboards || !activeBoard) return
    setBoardNameInput(activeBoard.name)
    void applyBoardContent(activeBoard.content)
  }, [activeBoard?.id, supportsWhiteboards, applyBoardContent])

  useEffect(() => {
    if (!supportsWhiteboards || !activeBoardId) return

    const channel = supabase
      .channel(`whiteboard-sync-${activeBoardId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_whiteboards",
          filter: `id=eq.${activeBoardId}`,
        },
        async (payload) => {
          const remoteUpdatedAt = typeof payload.new?.updated_at === "string" ? payload.new.updated_at : null
          if (remoteUpdatedAt && localUpdateRef.current === remoteUpdatedAt) return

          const nextContent = deserializeContent(payload.new?.content)
          setBoards((prev) =>
            prev.map((board) =>
              board.id === activeBoardId
                ? {
                    ...board,
                    content: nextContent,
                    updatedAt: remoteUpdatedAt ?? board.updatedAt,
                  }
                : board,
            ),
          )

          await applyBoardContent(nextContent)
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [activeBoardId, applyBoardContent, supportsWhiteboards])

  useEffect(() => {
    if (!supportsWhiteboards || !activeBoardId || isHydratingBoard || isLoading) return

    const timer = window.setTimeout(async () => {
      const updatedAt = new Date().toISOString()
      const payload = serializeContent({ nodes, edges, themeId, viewport })

      setIsSaving(true)
      const { error } = await supabase
        .from("user_whiteboards")
        .update({
          content: payload,
          updated_at: updatedAt,
        })
        .eq("id", activeBoardId)
        .eq("user_id", userId)

      setIsSaving(false)

      if (error) {
        toast({
          title: "Erro ao salvar",
          description: "Nao foi possivel salvar o quadro atual.",
          variant: "destructive",
        })
        return
      }

      localUpdateRef.current = updatedAt

      setBoards((prev) => {
        const next = prev.map((board) =>
          board.id === activeBoardId
            ? {
                ...board,
                content: deserializeContent(payload),
                updatedAt,
              }
            : board,
        )
        return next.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      })
    }, 700)

    return () => {
      window.clearTimeout(timer)
    }
  }, [activeBoardId, edges, isHydratingBoard, isLoading, nodes, supportsWhiteboards, themeId, toast, userId, viewport])

  const handleConnect = useCallback(
    (connection: Connection) => {
      setEdges((currentEdges) =>
        addEdge(
          decorateEdge(
            {
              id: crypto.randomUUID(),
              source: connection.source ?? "",
              target: connection.target ?? "",
              sourceHandle: connection.sourceHandle ?? undefined,
              targetHandle: connection.targetHandle ?? undefined,
            },
            activeTheme.edgeColor,
          ),
          currentEdges,
        ),
      )
    },
    [setEdges, activeTheme.edgeColor],
  )

  const addNode = (shape: NodeShape) => {
    const basePosition = (() => {
      if (!reactFlowInstance || !canvasRef.current) {
        return { x: 80 + nodes.length * 20, y: 50 + nodes.length * 20 }
      }

      const rect = canvasRef.current.getBoundingClientRect()
      const center = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      }
      return reactFlowInstance.screenToFlowPosition(center)
    })()

    const node = buildNode(crypto.randomUUID(), basePosition, shape, {
      fillColor: getThemeColor(activeTheme, nodes.length),
      textColor: activeTheme.textColor,
      width: shape === "circle" ? 132 : DEFAULT_NODE_SIZE.width,
      height: shape === "circle" ? 132 : DEFAULT_NODE_SIZE.height,
    })
    setNodes((prev) => [...prev, node])
    setSelectedNodeId(node.id)
  }

  const updateSelectedNodeData = (updater: (data: WhiteboardNodeData) => WhiteboardNodeData) => {
    if (!selectedNodeId) return
    setNodes((prev) =>
      prev.map((node) =>
        node.id === selectedNodeId
          ? {
              ...node,
              data: updater(node.data),
            }
          : node,
      ),
    )
  }

  const deleteSelectedNode = () => {
    if (!selectedNodeId) return
    const nodeId = selectedNodeId
    setNodes((prev) => prev.filter((node) => node.id !== nodeId))
    setEdges((prev) => prev.filter((edge) => edge.source !== nodeId && edge.target !== nodeId))
    setSelectedNodeId(null)
  }

  const deleteSelectedEdge = () => {
    if (!selectedEdgeId) return
    setEdges((prev) => prev.filter((edge) => edge.id !== selectedEdgeId))
    setSelectedEdgeId(null)
  }

  const renameActiveBoard = async () => {
    if (!activeBoardId) return
    const nextName = boardNameInput.trim()
    if (!nextName) return

    const { error } = await supabase
      .from("user_whiteboards")
      .update({ name: nextName, updated_at: new Date().toISOString() })
      .eq("id", activeBoardId)
      .eq("user_id", userId)

    if (error) {
      toast({
        title: "Erro ao renomear",
        description: "Nao foi possivel atualizar o nome do quadro.",
        variant: "destructive",
      })
      return
    }

    setBoards((prev) => prev.map((board) => (board.id === activeBoardId ? { ...board, name: nextName } : board)))
    toast({
      title: "Nome atualizado",
      description: "O quadro foi renomeado com sucesso.",
    })
  }

  const deleteActiveBoard = async () => {
    if (!activeBoardId) return
    if (!window.confirm("Deseja remover este quadro?")) return

    const deletedId = activeBoardId
    const { error } = await supabase.from("user_whiteboards").delete().eq("id", deletedId).eq("user_id", userId)

    if (error) {
      toast({
        title: "Erro ao remover",
        description: "Nao foi possivel remover o quadro selecionado.",
        variant: "destructive",
      })
      return
    }

    const remaining = boards.filter((board) => board.id !== deletedId)
    setBoards(remaining)

    if (remaining.length === 0) {
      setActiveBoardId(null)
      void createBoard("Meu primeiro quadro")
      return
    }

    const nextBoard = remaining[0]
    setActiveBoardId(nextBoard.id)
    setBoardNameInput(nextBoard.name)
    void applyBoardContent(nextBoard.content)
  }

  const applyThemePreset = (nextThemeId: string) => {
    const theme = getThemeById(nextThemeId)
    setThemeId(nextThemeId)

    setEdges((prev) => prev.map((edge) => decorateEdge(edge, theme.edgeColor)))
    setNodes((prev) =>
      prev.map((node, index) => ({
        ...node,
        data: {
          ...node.data,
          fillColor: getThemeColor(theme, index),
          textColor: theme.textColor,
        },
      })),
    )
  }

  const applyTemplateById = (templateId: TemplateId, promptHint?: string) => {
    const template = buildTemplate(templateId, activeTheme, promptHint)
    setNodes(template.nodes)
    setEdges(template.edges)
    setGeneratedMermaid("")
    setSelectedNodeId(null)
    setSelectedEdgeId(null)
    if (reactFlowInstance) {
      fitCanvasToContent(260)
    } else {
      setViewport(template.viewport)
    }
  }

  const handleGenerateDiagram = async () => {
    const prompt = diagramPrompt.trim()
    if (!prompt) {
      toast({
        title: "Descreva seu diagrama",
        description: "Digite uma ideia para gerar a estrutura inicial.",
      })
      return
    }

    setIsGeneratingDiagram(true)

    try {
      const response = await fetch("/api/diagram-mermaid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      })

      const payload = (await response.json()) as MermaidGenerationResponse

      if (!response.ok) {
        throw new Error(payload.error ?? "Nao foi possivel gerar o diagrama com IA.")
      }

      const mermaid = typeof payload.mermaid === "string" ? payload.mermaid.trim() : ""
      if (!mermaid) {
        throw new Error("A IA nao retornou um Mermaid valido.")
      }

      setGeneratedMermaid(mermaid)

      const generatedDiagram = parseMermaidToWhiteboard(mermaid, activeTheme)
      if (!generatedDiagram) {
        applyTemplateById("flowchart", prompt)
        setGeneratedMermaid(mermaid)
        toast({
          title: "Mermaid recebido com ajustes",
          description: "A IA respondeu, mas usamos um template padrao para manter o fluxo pronto.",
        })
        return
      }

      setNodes(generatedDiagram.nodes)
      setEdges(generatedDiagram.edges)
      setSelectedNodeId(null)
      setSelectedEdgeId(null)

      if (reactFlowInstance) {
        fitCanvasToContent(320)
      } else {
        setViewport(generatedDiagram.viewport)
      }

      toast({
        title: "Diagrama gerado com IA",
        description: "Estrutura Mermaid criada automaticamente a partir da sua descricao.",
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao gerar o diagrama com IA."
      toast({
        title: "Erro ao gerar diagrama",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsGeneratingDiagram(false)
    }
  }

  const resetCurrentBoard = () => {
    setNodes([
      buildNode(crypto.randomUUID(), { x: 120, y: 100 }, "rounded", {
        label: "Novo bloco",
        fillColor: getThemeColor(activeTheme, 0),
        textColor: activeTheme.textColor,
      }),
    ])
    setEdges([])
    setGeneratedMermaid("")
    setSelectedNodeId(null)
    setSelectedEdgeId(null)
    if (reactFlowInstance) {
      fitCanvasToContent(220)
    } else {
      setViewport({ x: 0, y: 0, zoom: 1 })
    }
  }

  const exportAsPng = async () => {
    if (!canvasRef.current || !activeBoard) return

    try {
      const dataUrl = await toPng(canvasRef.current, {
        cacheBust: true,
        pixelRatio: Math.max(1, exportScale),
        backgroundColor: transparentExport ? "transparent" : activeTheme.canvasBg,
      })

      const link = document.createElement("a")
      link.href = dataUrl
      link.download = `${slugify(activeBoard.name)}.png`
      link.click()
    } catch {
      toast({
        title: "Erro ao exportar",
        description: "Nao foi possivel gerar a imagem.",
        variant: "destructive",
      })
    }
  }

  const exportAsPdf = async () => {
    if (!canvasRef.current || !activeBoard) return

    try {
      const dataUrl = await toPng(canvasRef.current, {
        cacheBust: true,
        pixelRatio: Math.max(1, exportScale),
        backgroundColor: activeTheme.canvasBg,
      })

      const rect = canvasRef.current.getBoundingClientRect()
      const width = rect.width * Math.max(1, exportScale)
      const height = rect.height * Math.max(1, exportScale)

      const pdf = new jsPDF({
        orientation: width >= height ? "landscape" : "portrait",
        unit: "px",
        format: [width, height],
      })

      pdf.addImage(dataUrl, "PNG", 0, 0, width, height)
      pdf.save(`${slugify(activeBoard.name)}.pdf`)
    } catch {
      toast({
        title: "Erro ao exportar",
        description: "Nao foi possivel gerar o PDF.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="w-full space-y-4">

      {!supportsWhiteboards && (
        <Card className="bg-amber-50/90 border-amber-300">
          <CardContent className="py-3 text-sm text-amber-900">
            Para habilitar o quadro branco, execute a migracao SQL `supabase/migrations/20260317_create_user_whiteboards.sql`.
          </CardContent>
        </Card>
      )}

      {supportsWhiteboards && (
        <div className="space-y-4">
          <Card
            className="border backdrop-blur-sm"
            style={{
              backgroundColor: `${activeTheme.panelBg}dd`,
              borderColor: activeTheme.panelBorder,
            }}
          >
            <CardContent className="p-3 md:p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-[220px] flex items-center gap-2 text-slate-100">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                    style={{ backgroundColor: activeTheme.accent, color: activeTheme.textColor }}
                  >
                    F
                  </div>
                  <div>
                    <p className="text-sm font-semibold">FlowGen</p>
                    <p className="text-xs text-slate-300">Gerador inteligente de diagramas</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Label htmlFor="whiteboard-select" className="text-slate-200">
                    Quadro
                  </Label>
                  <select
                    id="whiteboard-select"
                    className="h-9 rounded-md border px-3 text-sm text-slate-100"
                    style={{
                      borderColor: activeTheme.panelBorder,
                      backgroundColor: activeTheme.canvasBg,
                    }}
                    value={activeBoardId ?? ""}
                    onChange={(e) => setActiveBoardId(e.target.value)}
                    disabled={isLoading || boards.length === 0}
                  >
                    {boards.map((board) => (
                      <option key={board.id} value={board.id}>
                        {board.name}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  value={boardNameInput}
                  onChange={(e) => setBoardNameInput(e.target.value)}
                  className="h-9 w-[230px] text-slate-100"
                  style={{
                    borderColor: activeTheme.panelBorder,
                    backgroundColor: activeTheme.canvasBg,
                  }}
                  placeholder="Nome do quadro"
                  disabled={!activeBoardId}
                />

                <Button
                  type="button"
                  variant="outline"
                  className="h-9 text-slate-100"
                  style={{ borderColor: activeTheme.panelBorder, backgroundColor: activeTheme.canvasBg }}
                  onClick={renameActiveBoard}
                  disabled={!activeBoardId}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Renomear
                </Button>

                <div className="ml-auto flex items-center gap-2">
                  <Button type="button" className="h-9" onClick={() => void createBoard()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo
                  </Button>
                  <Button type="button" className="h-9" onClick={exportAsPng}>
                    <FileImage className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                  <Button type="button" variant="destructive" className="h-9" onClick={deleteActiveBoard} disabled={!activeBoardId}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                  {isSaving ? (
                    <Badge className="bg-amber-500 text-white border-transparent">Salvando...</Badge>
                  ) : (
                    <Badge className="bg-emerald-600 text-white border-transparent">Salvo</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
            <Card
              className="h-[74vh] border"
              style={{
                backgroundColor: `${activeTheme.panelBg}e6`,
                borderColor: activeTheme.panelBorder,
              }}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm uppercase tracking-wide text-slate-200">Descreva seu diagrama</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={diagramPrompt}
                  onChange={(e) => setDiagramPrompt(e.target.value)}
                  placeholder="Ex: Fluxo de atendimento ao cliente > triagem > aprovacao > entrega"
                  rows={4}
                  className="resize-none text-slate-100"
                  style={{ borderColor: activeTheme.panelBorder, backgroundColor: activeTheme.canvasBg }}
                />

                <Button
                  type="button"
                  className="w-full"
                  style={{ backgroundColor: activeTheme.accent, color: activeTheme.textColor }}
                  onClick={() => void handleGenerateDiagram()}
                  disabled={isGeneratingDiagram}
                >
                  {isGeneratingDiagram ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
                  {isGeneratingDiagram ? "Gerando com IA..." : "Gerar Diagrama"}
                </Button>

                {generatedMermaid ? (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-300">Mermaid gerado pela IA</h4>
                    <Textarea
                      readOnly
                      value={generatedMermaid}
                      rows={7}
                      className="resize-none text-slate-100 text-xs leading-relaxed"
                      style={{ borderColor: activeTheme.panelBorder, backgroundColor: activeTheme.canvasBg }}
                    />
                  </div>
                ) : null}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-300">Templates rapidos</h4>
                    <Button type="button" variant="ghost" className="h-7 px-2 text-xs text-slate-300" onClick={resetCurrentBoard}>
                      Limpar
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {TEMPLATE_BUTTONS.map((template) => {
                      const Icon = template.icon
                      return (
                        <Button
                          key={template.id}
                          type="button"
                          variant="outline"
                          className="h-11 justify-start gap-2 whitespace-normal px-2 text-[11px] leading-tight text-slate-100"
                          style={{ borderColor: activeTheme.panelBorder, backgroundColor: activeTheme.canvasBg }}
                          onClick={() => applyTemplateById(template.id)}
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0" />
                          <span className="min-w-0 break-words text-left">{template.label}</span>
                        </Button>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-300">Tema de cores</h4>
                  <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                    {WHITEBOARD_THEMES.map((theme) => {
                      const selected = theme.id === themeId
                      return (
                        <button
                          key={theme.id}
                          type="button"
                          className={cn(
                            "w-full rounded-md border px-2.5 py-2 text-left transition",
                            selected ? "ring-2 ring-cyan-400" : "hover:border-slate-400",
                          )}
                          style={{
                            borderColor: theme.panelBorder,
                            backgroundColor: theme.panelBg,
                          }}
                          onClick={() => applyThemePreset(theme.id)}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm text-slate-100">{theme.name}</span>
                            <Palette className="h-3.5 w-3.5 text-slate-300" />
                          </div>
                          <div className="mt-2 flex items-center gap-1.5">
                            {theme.nodePalette.map((dot) => (
                              <span
                                key={`${theme.id}-${dot}`}
                                className="h-3.5 w-3.5 rounded-full border border-white/10"
                                style={{ backgroundColor: dot }}
                              />
                            ))}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="h-[74vh] border"
              style={{
                backgroundColor: activeTheme.canvasBg,
                borderColor: activeTheme.panelBorder,
              }}
            >
              <CardContent className="h-full p-2 md:p-3">
                <div
                  ref={canvasRef}
                  className="h-full w-full rounded-lg overflow-hidden border"
                  style={{
                    borderColor: activeTheme.panelBorder,
                    backgroundColor: activeTheme.canvasBg,
                  }}
                >
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={handleConnect}
                    onMoveEnd={(_, nextViewport) => setViewport(nextViewport)}
                    onInit={setReactFlowInstance}
                    onPaneClick={() => {
                      setSelectedNodeId(null)
                      setSelectedEdgeId(null)
                    }}
                    onNodeClick={(_, node) => {
                      setSelectedNodeId(node.id)
                      setSelectedEdgeId(null)
                    }}
                    onEdgeClick={(_, edge) => {
                      setSelectedEdgeId(edge.id)
                      setSelectedNodeId(null)
                    }}
                    fitView
                    minZoom={0.2}
                    maxZoom={2.5}
                    proOptions={{ hideAttribution: true }}
                  >
                    <Background variant={BackgroundVariant.Dots} gap={20} size={1} color={activeTheme.dotColor} />
                    <MiniMap
                      pannable
                      zoomable
                      nodeColor={(node) => node.data?.fillColor || activeTheme.accent}
                      style={{
                        background: activeTheme.panelBg,
                        border: `1px solid ${activeTheme.panelBorder}`,
                      }}
                    />
                    <Controls
                      style={{
                        background: activeTheme.panelBg,
                        border: `1px solid ${activeTheme.panelBorder}`,
                        color: activeTheme.textColor,
                      }}
                    />
                  </ReactFlow>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4 h-[74vh] overflow-y-auto pr-1">
              <Card className="border" style={{ backgroundColor: `${activeTheme.panelBg}e6`, borderColor: activeTheme.panelBorder }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-slate-100">Adicionar Blocos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="text-slate-100"
                      style={{ borderColor: activeTheme.panelBorder, backgroundColor: activeTheme.canvasBg }}
                      onClick={() => addNode("rectangle")}
                    >
                      <RectangleHorizontal className="h-4 w-4 mr-2" />
                      Retangulo
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="text-slate-100"
                      style={{ borderColor: activeTheme.panelBorder, backgroundColor: activeTheme.canvasBg }}
                      onClick={() => addNode("rounded")}
                    >
                      <RectangleHorizontal className="h-4 w-4 mr-2" />
                      Cartao
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="text-slate-100"
                      style={{ borderColor: activeTheme.panelBorder, backgroundColor: activeTheme.canvasBg }}
                      onClick={() => addNode("circle")}
                    >
                      <Circle className="h-4 w-4 mr-2" />
                      Circulo
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="text-slate-100"
                      style={{ borderColor: activeTheme.panelBorder, backgroundColor: activeTheme.canvasBg }}
                      onClick={() => addNode("diamond")}
                    >
                      <Diamond className="h-4 w-4 mr-2" />
                      Losango
                    </Button>
                  </div>
                  <p className="text-xs text-slate-300">
                    Arraste para reposicionar e puxe das alcas para conectar o fluxo.
                  </p>
                </CardContent>
              </Card>

              <Card className="border" style={{ backgroundColor: `${activeTheme.panelBg}e6`, borderColor: activeTheme.panelBorder }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-slate-100">Edicao</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedNode ? (
                    <>
                      <div>
                        <Label htmlFor="node-label" className="text-slate-200">
                          Nome do bloco
                        </Label>
                        <Input
                          id="node-label"
                          value={selectedNode.data.label}
                          onChange={(e) =>
                            updateSelectedNodeData((data) => ({
                              ...data,
                              label: e.target.value,
                            }))
                          }
                          className="text-slate-100"
                          style={{ borderColor: activeTheme.panelBorder, backgroundColor: activeTheme.canvasBg }}
                        />
                      </div>

                      <div>
                        <Label htmlFor="node-shape" className="text-slate-200">
                          Forma
                        </Label>
                        <select
                          id="node-shape"
                          value={selectedNode.data.shape}
                          onChange={(e) =>
                            updateSelectedNodeData((data) => ({
                              ...data,
                              shape: normalizeNodeShape(e.target.value),
                            }))
                          }
                          className="w-full rounded-md border px-3 py-2 text-sm text-slate-100"
                          style={{ borderColor: activeTheme.panelBorder, backgroundColor: activeTheme.canvasBg }}
                        >
                          <option value="rectangle">Retangulo</option>
                          <option value="rounded">Cartao</option>
                          <option value="circle">Circulo</option>
                          <option value="diamond">Losango</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="node-fill" className="text-slate-200">
                            Cor do bloco
                          </Label>
                          <Input
                            id="node-fill"
                            type="color"
                            value={selectedNode.data.fillColor}
                            onChange={(e) =>
                              updateSelectedNodeData((data) => ({
                                ...data,
                                fillColor: e.target.value,
                              }))
                            }
                            className="h-10 p-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="node-text" className="text-slate-200">
                            Cor do texto
                          </Label>
                          <Input
                            id="node-text"
                            type="color"
                            value={selectedNode.data.textColor}
                            onChange={(e) =>
                              updateSelectedNodeData((data) => ({
                                ...data,
                                textColor: e.target.value,
                              }))
                            }
                            className="h-10 p-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-slate-200">Tamanho</Label>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <Input
                            type="number"
                            min={MIN_NODE_SIZE}
                            max={MAX_NODE_SIZE}
                            value={selectedNode.data.width}
                            onChange={(e) =>
                              updateSelectedNodeData((data) => ({
                                ...data,
                                width: sanitizeNumber(e.target.value, data.width, MIN_NODE_SIZE, MAX_NODE_SIZE),
                              }))
                            }
                            className="text-slate-100"
                            style={{ borderColor: activeTheme.panelBorder, backgroundColor: activeTheme.canvasBg }}
                          />
                          <Input
                            type="number"
                            min={MIN_NODE_SIZE}
                            max={MAX_NODE_SIZE}
                            value={selectedNode.data.height}
                            onChange={(e) =>
                              updateSelectedNodeData((data) => ({
                                ...data,
                                height: sanitizeNumber(e.target.value, data.height, MIN_NODE_SIZE, MAX_NODE_SIZE),
                              }))
                            }
                            className="text-slate-100"
                            style={{ borderColor: activeTheme.panelBorder, backgroundColor: activeTheme.canvasBg }}
                          />
                        </div>
                      </div>

                      <Button type="button" variant="destructive" className="w-full" onClick={deleteSelectedNode}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir Bloco
                      </Button>
                    </>
                  ) : selectedEdgeId ? (
                    <Button type="button" variant="destructive" className="w-full" onClick={deleteSelectedEdge}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir Conexao
                    </Button>
                  ) : (
                    <p className="text-sm text-slate-300">
                      Selecione um bloco ou conexao para editar ou excluir.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="border" style={{ backgroundColor: `${activeTheme.panelBg}e6`, borderColor: activeTheme.panelBorder }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-slate-100">Exportacao</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-slate-200">Upscale ({exportScale}x)</Label>
                    <Slider
                      min={1}
                      max={4}
                      step={1}
                      value={[exportScale]}
                      onValueChange={(v) => setExportScale(v[0] ?? 1)}
                      className="mt-2"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-sm text-slate-200">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={transparentExport}
                      onChange={(e) => setTransparentExport(e.target.checked)}
                    />
                    Exportar imagem transparente
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" onClick={exportAsPng}>
                      <FileImage className="h-4 w-4 mr-2" />
                      PNG
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={exportAsPdf}
                      className="text-slate-100"
                      style={{ borderColor: activeTheme.panelBorder, backgroundColor: activeTheme.canvasBg }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                  </div>

                  <p className="text-xs text-slate-300">
                    O quadro salva automaticamente no banco enquanto voce edita.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
