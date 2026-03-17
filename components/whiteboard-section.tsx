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
import { Circle, Diamond, FileImage, FileText, Plus, RectangleHorizontal, Save, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
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

const MIN_NODE_SIZE = 80
const MAX_NODE_SIZE = 420
const DEFAULT_NODE_SIZE = { width: 180, height: 90 }

const emptyBoard: WhiteboardContent = {
  nodes: [],
  edges: [],
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

const buildNode = (id: string, position: { x: number; y: number }, shape: NodeShape): Node<WhiteboardNodeData> => ({
  id,
  type: "shapeNode",
  position,
  data: {
    label: "Novo bloco",
    shape,
    fillColor: "#f8fafc",
    textColor: "#0f172a",
    width: DEFAULT_NODE_SIZE.width,
    height: DEFAULT_NODE_SIZE.height,
  },
})

const decorateEdge = (edge: Edge): Edge => ({
  ...edge,
  type: edge.type ?? "smoothstep",
  markerEnd: edge.markerEnd ?? {
    type: MarkerType.ArrowClosed,
    color: "#475569",
  },
  style: {
    stroke: "#475569",
    strokeWidth: 2,
    ...(edge.style ?? {}),
  },
})

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

  return { nodes, edges, viewport }
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
    style: edge.style,
    markerEnd: edge.markerEnd,
  })),
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
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance<Node<WhiteboardNodeData>, Edge> | null>(null)

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)

  const [exportScale, setExportScale] = useState(2)
  const [transparentExport, setTransparentExport] = useState(false)

  const canvasRef = useRef<HTMLDivElement>(null)
  const localUpdateRef = useRef<string | null>(null)

  const activeBoard = useMemo(() => boards.find((board) => board.id === activeBoardId) ?? null, [boards, activeBoardId])
  const selectedNode = useMemo(() => nodes.find((node) => node.id === selectedNodeId) ?? null, [nodes, selectedNodeId])

  const applyBoardContent = useCallback(
    async (content: WhiteboardContent) => {
      setIsHydratingBoard(true)
      setNodes(content.nodes)
      setEdges(content.edges)
      setViewport(content.viewport)
      setSelectedNodeId(null)
      setSelectedEdgeId(null)

      if (reactFlowInstance) {
        await reactFlowInstance.setViewport(content.viewport, { duration: 0 })
      }

      requestAnimationFrame(() => {
        setIsHydratingBoard(false)
      })
    },
    [reactFlowInstance, setEdges, setNodes],
  )

  const createBoard = useCallback(
    async (nameOverride?: string) => {
      const content: WhiteboardContent = {
        nodes: [buildNode(crypto.randomUUID(), { x: 80, y: 50 }, "rounded")],
        edges: [],
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
      const payload = serializeContent({ nodes, edges, viewport })

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
  }, [activeBoardId, edges, isHydratingBoard, isLoading, nodes, supportsWhiteboards, toast, userId, viewport])

  const handleConnect = useCallback(
    (connection: Connection) => {
      setEdges((currentEdges) =>
        addEdge(
          decorateEdge({
            id: crypto.randomUUID(),
            source: connection.source ?? "",
            target: connection.target ?? "",
            sourceHandle: connection.sourceHandle ?? undefined,
            targetHandle: connection.targetHandle ?? undefined,
          }),
          currentEdges,
        ),
      )
    },
    [setEdges],
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

    const node = buildNode(crypto.randomUUID(), basePosition, shape)
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

  const exportAsPng = async () => {
    if (!canvasRef.current || !activeBoard) return

    try {
      const dataUrl = await toPng(canvasRef.current, {
        cacheBust: true,
        pixelRatio: Math.max(1, exportScale),
        backgroundColor: transparentExport ? "transparent" : "#ffffff",
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
        backgroundColor: "#ffffff",
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
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Quadro Branco Colaborativo</h2>
        <p className="text-gray-200">Monte fluxogramas, mapas mentais e diagramas com canvas infinito.</p>
      </div>

      {!supportsWhiteboards && (
        <Card className="bg-amber-50/90 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700">
          <CardContent className="py-3 text-sm text-amber-900 dark:text-amber-200">
            Para habilitar o quadro branco, execute a migracao SQL `supabase/migrations/20260317_create_user_whiteboards.sql`.
          </CardContent>
        </Card>
      )}

      {supportsWhiteboards && (
        <div className="space-y-4">
          <Card className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-none shadow-lg">
            <CardContent className="p-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="whiteboard-select">Quadro</Label>
                <select
                  id="whiteboard-select"
                  className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
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

              <div className="flex items-center gap-2">
                <Input
                  value={boardNameInput}
                  onChange={(e) => setBoardNameInput(e.target.value)}
                  className="w-48"
                  placeholder="Nome do quadro"
                  disabled={!activeBoardId}
                />
                <Button type="button" variant="outline" onClick={renameActiveBoard} disabled={!activeBoardId}>
                  <Save className="h-4 w-4 mr-2" />
                  Renomear
                </Button>
              </div>

              <Button type="button" onClick={() => void createBoard()}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Quadro
              </Button>
              <Button type="button" variant="destructive" onClick={deleteActiveBoard} disabled={!activeBoardId}>
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>

              <div className="ml-auto flex items-center gap-2">
                {isSaving ? (
                  <Badge className="bg-amber-500 text-white border-transparent">Salvando...</Badge>
                ) : (
                  <Badge className="bg-emerald-600 text-white border-transparent">Salvo</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
            <Card className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-none shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-slate-800 dark:text-slate-100">Canvas Infinito</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div ref={canvasRef} className="h-[68vh] rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700">
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
                    proOptions={{ hideAttribution: true }}
                  >
                    <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
                    <MiniMap pannable zoomable />
                    <Controls />
                  </ReactFlow>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-none shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-slate-800 dark:text-slate-100">Adicionar Blocos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant="outline" onClick={() => addNode("rectangle")}>
                      <RectangleHorizontal className="h-4 w-4 mr-2" />
                      Retangulo
                    </Button>
                    <Button type="button" variant="outline" onClick={() => addNode("rounded")}>
                      <RectangleHorizontal className="h-4 w-4 mr-2" />
                      Cartao
                    </Button>
                    <Button type="button" variant="outline" onClick={() => addNode("circle")}>
                      <Circle className="h-4 w-4 mr-2" />
                      Circulo
                    </Button>
                    <Button type="button" variant="outline" onClick={() => addNode("diamond")}>
                      <Diamond className="h-4 w-4 mr-2" />
                      Losango
                    </Button>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Arraste para reposicionar e puxe das alcas para conectar o fluxo.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-none shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-slate-800 dark:text-slate-100">Edicao</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedNode ? (
                    <>
                      <div>
                        <Label htmlFor="node-label">Nome do bloco</Label>
                        <Input
                          id="node-label"
                          value={selectedNode.data.label}
                          onChange={(e) =>
                            updateSelectedNodeData((data) => ({
                              ...data,
                              label: e.target.value,
                            }))
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="node-shape">Forma</Label>
                        <select
                          id="node-shape"
                          value={selectedNode.data.shape}
                          onChange={(e) =>
                            updateSelectedNodeData((data) => ({
                              ...data,
                              shape: normalizeNodeShape(e.target.value),
                            }))
                          }
                          className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                        >
                          <option value="rectangle">Retangulo</option>
                          <option value="rounded">Cartao</option>
                          <option value="circle">Circulo</option>
                          <option value="diamond">Losango</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="node-fill">Cor do bloco</Label>
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
                          <Label htmlFor="node-text">Cor do texto</Label>
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
                        <Label>Tamanho</Label>
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
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Selecione um bloco ou conexao para editar ou excluir.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-none shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-slate-800 dark:text-slate-100">Exportacao</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>Upscale ({exportScale}x)</Label>
                    <Slider
                      min={1}
                      max={4}
                      step={1}
                      value={[exportScale]}
                      onValueChange={(v) => setExportScale(v[0] ?? 1)}
                      className="mt-2"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-sm">
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
                    <Button type="button" variant="outline" onClick={exportAsPdf}>
                      <FileText className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400">
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
