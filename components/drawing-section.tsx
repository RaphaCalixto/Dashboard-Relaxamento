"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Paintbrush,
  Eraser,
  Square,
  Circle,
  Minus,
  Type,
  RotateCcw,
  RotateCw,
  Trash2,
  Download,
  Layers,
  SlidersHorizontal,
  Palette,
} from "lucide-react"

type Tool = "brush" | "eraser" | "rectangle" | "circle" | "line" | "text"
type DrawingHistory = ImageData[]
type Layer = {
  id: string
  name: string
  visible: boolean
  canvas: HTMLCanvasElement
  context: CanvasRenderingContext2D
}

export function DrawingSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const textInputRef = useRef<HTMLInputElement>(null)
  const [tool, setTool] = useState<Tool>("brush")
  const [color, setColor] = useState("#000000")
  const [brushSize, setBrushSize] = useState([5])
  const [opacity, setOpacity] = useState([100])
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 })
  const [layers, setLayers] = useState<Layer[]>([])
  const [activeLayerIndex, setActiveLayerIndex] = useState(0)
  const [history, setHistory] = useState<DrawingHistory[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [textInput, setTextInput] = useState("")
  const [textFont, setTextFont] = useState("Arial")
  const [textSize, setTextSize] = useState([16])
  const [filter, setFilter] = useState("none")
  const [previewCanvas, setPreviewCanvas] = useState<HTMLCanvasElement | null>(null)

  // Função para obter coordenadas precisas do mouse
  const getMousePos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0 }

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }, [])

  // Inicializar canvas e primeira camada
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const container = canvas.parentElement
    if (container) {
      canvas.width = container.clientWidth
      canvas.height = 500 // Altura fixa para consistência
    }

    // Criar canvas de preview para formas
    const preview = document.createElement("canvas")
    preview.width = canvas.width
    preview.height = canvas.height
    setPreviewCanvas(preview)

    // Criar primeira camada
    const newLayer = createNewLayer("Camada 1")
    setLayers([newLayer])

    // Salvar estado inicial
    const context = canvas.getContext("2d")
    if (context) {
      // Configurar contexto para melhor qualidade
      context.imageSmoothingEnabled = true
      context.imageSmoothingQuality = "high"

      const initialState = context.getImageData(0, 0, canvas.width, canvas.height)
      setHistory([initialState])
      setHistoryIndex(0)
    }

    // Ajustar tamanho do canvas quando a janela for redimensionada
    const handleResize = () => {
      if (!canvasRef.current || !container) return

      const tempCanvas = document.createElement("canvas")
      const tempContext = tempCanvas.getContext("2d")
      if (!tempContext) return

      tempCanvas.width = canvas.width
      tempCanvas.height = canvas.height
      tempContext.drawImage(canvas, 0, 0)

      canvas.width = container.clientWidth
      canvas.height = 500

      const context = canvas.getContext("2d")
      if (context) {
        context.imageSmoothingEnabled = true
        context.imageSmoothingQuality = "high"
        context.drawImage(tempCanvas, 0, 0)
      }

      // Atualizar preview canvas também
      if (preview) {
        preview.width = canvas.width
        preview.height = canvas.height
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Função para criar uma nova camada
  const createNewLayer = (name: string): Layer => {
    const newCanvas = document.createElement("canvas")
    if (canvasRef.current) {
      newCanvas.width = canvasRef.current.width
      newCanvas.height = canvasRef.current.height
    } else {
      newCanvas.width = 800
      newCanvas.height = 500
    }

    const context = newCanvas.getContext("2d")
    if (!context) {
      throw new Error("Não foi possível obter o contexto do canvas")
    }

    // Configurar contexto para melhor qualidade
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = "high"

    return {
      id: Date.now().toString(),
      name,
      visible: true,
      canvas: newCanvas,
      context,
    }
  }

  // Função para adicionar uma nova camada
  const addLayer = () => {
    const newLayer = createNewLayer(`Camada ${layers.length + 1}`)
    setLayers([...layers, newLayer])
    setActiveLayerIndex(layers.length)
  }

  // Função para remover uma camada
  const removeLayer = (index: number) => {
    if (layers.length <= 1) return
    const newLayers = [...layers]
    newLayers.splice(index, 1)
    setLayers(newLayers)
    if (activeLayerIndex >= index) {
      setActiveLayerIndex(Math.max(0, activeLayerIndex - 1))
    }
    renderCanvas()
  }

  // Função para alternar visibilidade da camada
  const toggleLayerVisibility = (index: number) => {
    const newLayers = [...layers]
    newLayers[index].visible = !newLayers[index].visible
    setLayers(newLayers)
    renderCanvas()
  }

  // Função para renderizar todas as camadas visíveis no canvas principal
  const renderCanvas = useCallback(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")
    if (!context) return

    context.clearRect(0, 0, canvas.width, canvas.height)

    layers.forEach((layer) => {
      if (layer.visible) {
        context.drawImage(layer.canvas, 0, 0)
      }
    })

    // Desenhar preview se estiver desenhando formas
    if (isDrawing && (tool === "rectangle" || tool === "circle" || tool === "line") && previewCanvas) {
      context.drawImage(previewCanvas, 0, 0)
    }

    // Aplicar filtro se necessário
    if (filter !== "none" && context) {
      applyFilter(context, filter)
    }
  }, [layers, isDrawing, tool, previewCanvas, filter])

  // Aplicar filtros
  const applyFilter = (context: CanvasRenderingContext2D, filterType: string) => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    switch (filterType) {
      case "grayscale":
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
          data[i] = avg
          data[i + 1] = avg
          data[i + 2] = avg
        }
        break
      case "sepia":
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189)
          data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168)
          data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131)
        }
        break
      case "invert":
        for (let i = 0; i < data.length; i += 4) {
          data[i] = 255 - data[i]
          data[i + 1] = 255 - data[i + 1]
          data[i + 2] = 255 - data[i + 2]
        }
        break
      case "blur":
        // Implementação simplificada de blur
        context.filter = "blur(4px)"
        context.drawImage(canvas, 0, 0)
        context.filter = "none"
        return
      default:
        break
    }

    context.putImageData(imageData, 0, 0)
  }

  // Salvar estado atual no histórico
  const saveToHistory = () => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")
    if (!context) return

    const currentState = context.getImageData(0, 0, canvas.width, canvas.height)

    // Se estamos no meio do histórico, remover estados futuros
    if (historyIndex < history.length - 1) {
      setHistory(history.slice(0, historyIndex + 1))
    }

    setHistory([...history, currentState])
    setHistoryIndex(historyIndex + 1)
  }

  // Desfazer
  const undo = () => {
    if (historyIndex <= 0) return

    const newIndex = historyIndex - 1
    setHistoryIndex(newIndex)

    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")
    if (!context) return

    context.putImageData(history[newIndex], 0, 0)
  }

  // Refazer
  const redo = () => {
    if (historyIndex >= history.length - 1) return

    const newIndex = historyIndex + 1
    setHistoryIndex(newIndex)

    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")
    if (!context) return

    context.putImageData(history[newIndex], 0, 0)
  }

  // Limpar canvas
  const clearCanvas = () => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")
    if (!context) return

    context.clearRect(0, 0, canvas.width, canvas.height)

    // Limpar todas as camadas
    layers.forEach((layer) => {
      layer.context.clearRect(0, 0, layer.canvas.width, layer.canvas.height)
    })

    saveToHistory()
  }

  // Salvar desenho como imagem
  const saveDrawing = () => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current

    const link = document.createElement("a")
    link.download = "meu-desenho.png"
    link.href = canvas.toDataURL("image/png")
    link.click()
  }

  // Desenhar preview das formas
  const drawPreview = useCallback(
    (startX: number, startY: number, currentX: number, currentY: number) => {
      if (!previewCanvas) return

      const context = previewCanvas.getContext("2d")
      if (!context) return

      context.clearRect(0, 0, previewCanvas.width, previewCanvas.height)
      context.lineWidth = brushSize[0]
      context.strokeStyle =
        color +
        Math.round(opacity[0] * 2.55)
          .toString(16)
          .padStart(2, "0")
      context.fillStyle =
        color +
        Math.round(opacity[0] * 2.55)
          .toString(16)
          .padStart(2, "0")

      if (tool === "rectangle") {
        const width = currentX - startX
        const height = currentY - startY
        context.beginPath()
        context.rect(startX, startY, width, height)
        context.stroke()
      } else if (tool === "circle") {
        const radius = Math.sqrt(Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2))
        context.beginPath()
        context.arc(startX, startY, radius, 0, 2 * Math.PI)
        context.stroke()
      } else if (tool === "line") {
        context.beginPath()
        context.moveTo(startX, startY)
        context.lineTo(currentX, currentY)
        context.stroke()
      }
    },
    [previewCanvas, tool, brushSize, color, opacity],
  )

  // Manipuladores de eventos do mouse
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || layers.length === 0) return

    const pos = getMousePos(e)
    setIsDrawing(true)
    setStartPos(pos)
    setCurrentPos(pos)

    if (tool === "brush" || tool === "eraser") {
      const activeLayer = layers[activeLayerIndex]
      const context = activeLayer.context

      context.beginPath()
      context.moveTo(pos.x, pos.y)
      context.lineCap = "round"
      context.lineJoin = "round"
      context.lineWidth = brushSize[0]

      if (tool === "brush") {
        context.strokeStyle =
          color +
          Math.round(opacity[0] * 2.55)
            .toString(16)
            .padStart(2, "0")
        context.globalCompositeOperation = "source-over"
      } else {
        context.globalCompositeOperation = "destination-out"
      }
    } else if (tool === "text") {
      if (textInputRef.current) {
        textInputRef.current.style.left = `${pos.x}px`
        textInputRef.current.style.top = `${pos.y}px`
        textInputRef.current.style.display = "block"
        textInputRef.current.focus()
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current || layers.length === 0) return

    const pos = getMousePos(e)
    setCurrentPos(pos)

    if (tool === "brush" || tool === "eraser") {
      const activeLayer = layers[activeLayerIndex]
      const context = activeLayer.context

      context.lineTo(pos.x, pos.y)
      context.stroke()
      renderCanvas()
    } else if (tool === "rectangle" || tool === "circle" || tool === "line") {
      drawPreview(startPos.x, startPos.y, pos.x, pos.y)
      renderCanvas()
    }
  }

  const handleMouseUp = () => {
    if (!isDrawing || !canvasRef.current || layers.length === 0) return
    setIsDrawing(false)

    if (tool === "rectangle" || tool === "circle" || tool === "line") {
      const activeLayer = layers[activeLayerIndex]
      const context = activeLayer.context

      context.lineWidth = brushSize[0]
      context.strokeStyle =
        color +
        Math.round(opacity[0] * 2.55)
          .toString(16)
          .padStart(2, "0")
      context.fillStyle =
        color +
        Math.round(opacity[0] * 2.55)
          .toString(16)
          .padStart(2, "0")

      if (tool === "rectangle") {
        const width = currentPos.x - startPos.x
        const height = currentPos.y - startPos.y
        context.beginPath()
        context.rect(startPos.x, startPos.y, width, height)
        context.stroke()
      } else if (tool === "circle") {
        const radius = Math.sqrt(Math.pow(currentPos.x - startPos.x, 2) + Math.pow(currentPos.y - startPos.y, 2))
        context.beginPath()
        context.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI)
        context.stroke()
      } else if (tool === "line") {
        context.beginPath()
        context.moveTo(startPos.x, startPos.y)
        context.lineTo(currentPos.x, currentPos.y)
        context.stroke()
      }

      // Limpar preview
      if (previewCanvas) {
        const previewContext = previewCanvas.getContext("2d")
        if (previewContext) {
          previewContext.clearRect(0, 0, previewCanvas.width, previewCanvas.height)
        }
      }
    }

    // Resetar globalCompositeOperation para o padrão
    if (tool === "eraser" && layers[activeLayerIndex]) {
      layers[activeLayerIndex].context.globalCompositeOperation = "source-over"
    }

    renderCanvas()
    saveToHistory()
  }

  // Adicionar texto ao canvas
  const addTextToCanvas = () => {
    if (!textInput || !canvasRef.current || !textInputRef.current || layers.length === 0) return

    const activeLayer = layers[activeLayerIndex]
    const context = activeLayer.context

    const x = Number.parseInt(textInputRef.current.style.left)
    const y = Number.parseInt(textInputRef.current.style.top)

    context.font = `${textSize[0]}px ${textFont}`
    context.fillStyle =
      color +
      Math.round(opacity[0] * 2.55)
        .toString(16)
        .padStart(2, "0")
    context.fillText(textInput, x, y + textSize[0]) // Ajuste para posicionar o texto corretamente

    setTextInput("")
    if (textInputRef.current) {
      textInputRef.current.style.display = "none"
    }

    renderCanvas()
    saveToHistory()
  }

  // Atualizar renderização quando as camadas mudarem
  useEffect(() => {
    renderCanvas()
  }, [renderCanvas])

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Área de Desenho</h2>
        <p className="text-gray-200">Crie, desenhe e expresse sua criatividade</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Ferramentas */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Paintbrush className="h-5 w-5" />
                Ferramentas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={tool === "brush" ? "default" : "outline"}
                  className="flex flex-col items-center p-2 h-auto"
                  onClick={() => setTool("brush")}
                >
                  <Paintbrush className="h-5 w-5 mb-1" />
                  <span className="text-xs">Pincel</span>
                </Button>
                <Button
                  variant={tool === "eraser" ? "default" : "outline"}
                  className="flex flex-col items-center p-2 h-auto"
                  onClick={() => setTool("eraser")}
                >
                  <Eraser className="h-5 w-5 mb-1" />
                  <span className="text-xs">Borracha</span>
                </Button>
                <Button
                  variant={tool === "rectangle" ? "default" : "outline"}
                  className="flex flex-col items-center p-2 h-auto"
                  onClick={() => setTool("rectangle")}
                >
                  <Square className="h-5 w-5 mb-1" />
                  <span className="text-xs">Retângulo</span>
                </Button>
                <Button
                  variant={tool === "circle" ? "default" : "outline"}
                  className="flex flex-col items-center p-2 h-auto"
                  onClick={() => setTool("circle")}
                >
                  <Circle className="h-5 w-5 mb-1" />
                  <span className="text-xs">Círculo</span>
                </Button>
                <Button
                  variant={tool === "line" ? "default" : "outline"}
                  className="flex flex-col items-center p-2 h-auto"
                  onClick={() => setTool("line")}
                >
                  <Minus className="h-5 w-5 mb-1" />
                  <span className="text-xs">Linha</span>
                </Button>
                <Button
                  variant={tool === "text" ? "default" : "outline"}
                  className="flex flex-col items-center p-2 h-auto"
                  onClick={() => setTool("text")}
                >
                  <Type className="h-5 w-5 mb-1" />
                  <span className="text-xs">Texto</span>
                </Button>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <Label className="text-xs mb-1 block">Cor</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-10 h-10 p-1 cursor-pointer"
                    />
                    <Input type="text" value={color} onChange={(e) => setColor(e.target.value)} className="flex-1" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <Label className="text-xs">Tamanho do Pincel</Label>
                    <span className="text-xs">{brushSize[0]}px</span>
                  </div>
                  <Slider value={brushSize} onValueChange={setBrushSize} min={1} max={50} step={1} />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <Label className="text-xs">Opacidade</Label>
                    <span className="text-xs">{opacity[0]}%</span>
                  </div>
                  <Slider value={opacity} onValueChange={setOpacity} min={1} max={100} step={1} />
                </div>

                {tool === "text" && (
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs mb-1 block">Fonte</Label>
                      <Select value={textFont} onValueChange={setTextFont}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma fonte" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Arial">Arial</SelectItem>
                          <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                          <SelectItem value="Courier New">Courier New</SelectItem>
                          <SelectItem value="Georgia">Georgia</SelectItem>
                          <SelectItem value="Verdana">Verdana</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <Label className="text-xs">Tamanho do Texto</Label>
                        <span className="text-xs">{textSize[0]}px</span>
                      </div>
                      <Slider value={textSize} onValueChange={setTextSize} min={8} max={72} step={1} />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Camadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button onClick={addLayer} className="w-full">
                  <Layers className="h-4 w-4 mr-2" />
                  Nova Camada
                </Button>

                <div className="max-h-40 overflow-y-auto space-y-1">
                  {layers.map((layer, index) => (
                    <div
                      key={layer.id}
                      className={`flex items-center justify-between p-2 rounded ${
                        index === activeLayerIndex ? "bg-blue-100 dark:bg-blue-900" : "bg-gray-100 dark:bg-gray-800"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Switch checked={layer.visible} onCheckedChange={() => toggleLayerVisibility(index)} />
                        <span className="text-sm cursor-pointer" onClick={() => setActiveLayerIndex(index)}>
                          {layer.name}
                        </span>
                      </div>
                      {layers.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeLayer(index)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Select
                  value={filter}
                  onValueChange={(value) => {
                    setFilter(value)
                    renderCanvas()
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um filtro" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    <SelectItem value="grayscale">Escala de Cinza</SelectItem>
                    <SelectItem value="sepia">Sépia</SelectItem>
                    <SelectItem value="invert">Inverter</SelectItem>
                    <SelectItem value="blur">Desfoque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Área de desenho */}
        <div className="lg:col-span-3">
          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-none shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Área de Desenho
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={undo} disabled={historyIndex <= 0}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Desfazer
                  </Button>
                  <Button variant="outline" onClick={redo} disabled={historyIndex >= history.length - 1}>
                    <RotateCw className="h-4 w-4 mr-2" />
                    Refazer
                  </Button>
                  <Button variant="outline" onClick={clearCanvas}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpar
                  </Button>
                  <Button variant="default" onClick={saveDrawing}>
                    <Download className="h-4 w-4 mr-2" />
                    Salvar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative w-full bg-white rounded-lg shadow-inner">
                <canvas
                  ref={canvasRef}
                  className="w-full h-[500px] rounded-lg cursor-crosshair border border-gray-200"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  style={{ touchAction: "none" }}
                />
                {tool === "text" && (
                  <div className="absolute top-0 left-0 pointer-events-none">
                    <input
                      ref={textInputRef}
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      onBlur={addTextToCanvas}
                      onKeyDown={(e) => e.key === "Enter" && addTextToCanvas()}
                      className="absolute hidden p-1 border border-gray-300 bg-white pointer-events-auto"
                      style={{
                        fontFamily: textFont,
                        fontSize: `${textSize[0]}px`,
                      }}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-sm">Dicas de Desenho</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 list-disc pl-5">
                  <li>Use o pincel para desenho livre</li>
                  <li>A borracha remove partes do desenho</li>
                  <li>Experimente diferentes camadas para organizar seu trabalho</li>
                  <li>Ajuste a opacidade para efeitos de transparência</li>
                  <li>Salve seu trabalho regularmente</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-sm">Atalhos de Teclado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Ctrl+Z</div>
                  <div>Desfazer</div>
                  <div>Ctrl+Y</div>
                  <div>Refazer</div>
                  <div>B</div>
                  <div>Ferramenta Pincel</div>
                  <div>E</div>
                  <div>Ferramenta Borracha</div>
                  <div>T</div>
                  <div>Ferramenta Texto</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
