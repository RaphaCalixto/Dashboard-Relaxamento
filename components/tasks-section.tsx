"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Plus,
  Edit,
  Trash2,
  Save,
  Download,
  Upload,
  CheckSquare,
  Clock,
  PlayCircle,
  CheckCircle,
  ImageIcon,
  X,
  GripVertical,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type TaskStatus = "todo" | "inprogress" | "completed"

type Task = {
  id: string
  title: string
  description: string
  status: TaskStatus
  createdAt: string
  updatedAt: string
  priority: "low" | "medium" | "high"
  images: string[]
}

const statusConfig = {
  todo: {
    title: "A Fazer",
    icon: CheckSquare,
    color: "bg-gray-100 dark:bg-gray-800",
    borderColor: "border-gray-300 dark:border-gray-600",
    badgeColor: "bg-gray-500",
  },
  inprogress: {
    title: "Em Andamento",
    icon: PlayCircle,
    color: "bg-blue-50 dark:bg-blue-900/20",
    borderColor: "border-blue-300 dark:border-blue-600",
    badgeColor: "bg-blue-500",
  },
  completed: {
    title: "Concluídas",
    icon: CheckCircle,
    color: "bg-green-50 dark:bg-green-900/20",
    borderColor: "border-green-300 dark:border-green-600",
    badgeColor: "bg-green-500",
  },
}

const priorityColors = {
  low: "bg-green-500",
  medium: "bg-yellow-500",
  high: "bg-red-500",
}

export function TasksSection() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [taskTitle, setTaskTitle] = useState("")
  const [taskDescription, setTaskDescription] = useState("")
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high">("medium")
  const [taskImages, setTaskImages] = useState<string[]>([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Carregar tarefas do localStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem("dashboard-tasks")
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks)
        setTasks(parsedTasks)
      } catch (error) {
        console.error("Erro ao carregar tarefas:", error)
        initializeExampleTasks()
      }
    } else {
      initializeExampleTasks()
    }
  }, [])

  const initializeExampleTasks = () => {
    const exampleTasks: Task[] = [
      {
        id: "1",
        title: "Estudar React",
        description: "Revisar conceitos de hooks e context API",
        status: "todo",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        priority: "high",
        images: [],
      },
      {
        id: "2",
        title: "Exercitar-se",
        description: "30 minutos de caminhada no parque",
        status: "inprogress",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        priority: "medium",
        images: [],
      },
      {
        id: "3",
        title: "Ler livro",
        description: "Terminar capítulo 5 do livro de JavaScript",
        status: "completed",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        priority: "low",
        images: [],
      },
    ]
    setTasks(exampleTasks)
    setHasUnsavedChanges(true)
  }

  // Salvar tarefas manualmente
  const saveTasks = () => {
    try {
      localStorage.setItem("dashboard-tasks", JSON.stringify(tasks))
      setHasUnsavedChanges(false)
      toast({
        title: "Tarefas salvas!",
        description: "Suas tarefas foram salvas com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao salvar tarefas:", error)
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as tarefas. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  // Exportar tarefas como arquivo JSON
  const exportTasks = () => {
    try {
      const dataStr = JSON.stringify(tasks, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `tarefas-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Tarefas exportadas!",
        description: "Arquivo baixado com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao exportar tarefas:", error)
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível exportar as tarefas.",
        variant: "destructive",
      })
    }
  }

  // Importar tarefas de arquivo JSON
  const importTasks = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === "application/json") {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const result = e.target?.result as string
          const importedTasks = JSON.parse(result)

          if (Array.isArray(importedTasks) && importedTasks.every(isValidTask)) {
            setTasks(importedTasks)
            setHasUnsavedChanges(true)
            toast({
              title: "Tarefas importadas!",
              description: `${importedTasks.length} tarefas foram importadas com sucesso.`,
            })
          } else {
            throw new Error("Formato de arquivo inválido")
          }
        } catch (error) {
          console.error("Erro ao importar tarefas:", error)
          toast({
            title: "Erro ao importar",
            description: "Arquivo inválido ou corrompido.",
            variant: "destructive",
          })
        }
      }
      reader.readAsText(file)
    } else {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione um arquivo JSON válido.",
        variant: "destructive",
      })
    }

    event.target.value = ""
  }

  const isValidTask = (task: any): task is Task => {
    return (
      typeof task === "object" &&
      typeof task.id === "string" &&
      typeof task.title === "string" &&
      typeof task.description === "string" &&
      ["todo", "inprogress", "completed"].includes(task.status) &&
      typeof task.createdAt === "string" &&
      typeof task.updatedAt === "string" &&
      ["low", "medium", "high"].includes(task.priority) &&
      Array.isArray(task.images)
    )
  }

  const handleAddTask = () => {
    if (!taskTitle.trim()) return

    const newTask: Task = {
      id: Date.now().toString(),
      title: taskTitle,
      description: taskDescription,
      status: "todo",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      priority: taskPriority,
      images: taskImages,
    }

    if (editingTask) {
      setTasks(
        tasks.map((task) =>
          task.id === editingTask.id ? { ...newTask, id: editingTask.id, createdAt: editingTask.createdAt } : task,
        ),
      )
    } else {
      setTasks([...tasks, newTask])
    }

    resetForm()
    setHasUnsavedChanges(true)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setTaskTitle(task.title)
    setTaskDescription(task.description)
    setTaskPriority(task.priority)
    setTaskImages(task.images)
    setIsDialogOpen(true)
  }

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter((task) => task.id !== taskId))
    setHasUnsavedChanges(true)
  }

  const resetForm = () => {
    setTaskTitle("")
    setTaskDescription("")
    setTaskPriority("medium")
    setTaskImages([])
    setEditingTask(null)
    setIsDialogOpen(false)
  }

  // Adicionar imagem à tarefa
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        if (result) {
          setTaskImages([...taskImages, result])
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = (index: number) => {
    setTaskImages(taskImages.filter((_, i) => i !== index))
  }

  // Funções de drag and drop
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverStatus(status)
  }

  const handleDragLeave = () => {
    setDragOverStatus(null)
  }

  const handleDrop = (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault()
    setDragOverStatus(null)

    if (draggedTask && draggedTask.status !== newStatus) {
      setTasks(
        tasks.map((task) =>
          task.id === draggedTask.id ? { ...task, status: newStatus, updatedAt: new Date().toISOString() } : task,
        ),
      )
      setHasUnsavedChanges(true)
    }
    setDraggedTask(null)
  }

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((task) => task.status === status)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Gerenciador de Tarefas</h2>
        <p className="text-gray-200">Organize seus projetos e acompanhe o progresso</p>
      </div>

      {/* Barra de ações */}
      <div className="flex flex-wrap gap-2 justify-center">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm()
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Tarefa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTask ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="task-title">Título</Label>
                <Input
                  id="task-title"
                  placeholder="Ex: Estudar React"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="task-description">Descrição</Label>
                <Textarea
                  id="task-description"
                  placeholder="Detalhes da tarefa..."
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="task-priority">Prioridade</Label>
                <select
                  id="task-priority"
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as "low" | "medium" | "high")}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                </select>
              </div>

              <div>
                <Label>Imagens</Label>
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Adicionar Imagem
                  </Button>

                  {taskImages.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {taskImages.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image || "/placeholder.svg"}
                            alt={`Imagem ${index + 1}`}
                            className="w-full h-24 object-cover rounded border"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleAddTask} disabled={!taskTitle.trim()} className="flex-1">
                  {editingTask ? "Salvar" : "Adicionar"}
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Button
          onClick={saveTasks}
          variant={hasUnsavedChanges ? "default" : "outline"}
          className={hasUnsavedChanges ? "bg-green-600 hover:bg-green-700" : ""}
        >
          <Save className="h-4 w-4 mr-2" />
          {hasUnsavedChanges ? "Salvar Tarefas*" : "Tarefas Salvas"}
        </Button>

        <Button onClick={exportTasks} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>

        <div>
          <Input type="file" accept=".json" onChange={importTasks} className="hidden" id="import-tasks" />
          <Button variant="outline" asChild>
            <label htmlFor="import-tasks" className="cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </label>
          </Button>
        </div>

        {hasUnsavedChanges && (
          <span className="text-yellow-300 text-sm flex items-center">* Você tem alterações não salvas</span>
        )}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {(["todo", "inprogress", "completed"] as TaskStatus[]).map((status) => {
          const config = statusConfig[status]
          const statusTasks = getTasksByStatus(status)

          return (
            <div key={status} className="space-y-4">
              <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-none shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <config.icon className="h-5 w-5" />
                    {config.title}
                    <Badge variant="secondary" className={`${config.badgeColor} text-white`}>
                      {statusTasks.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
              </Card>

              {/* Drop Zone */}
              <div
                className={`min-h-[400px] p-4 rounded-lg border-2 border-dashed transition-colors ${
                  dragOverStatus === status
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50"
                }`}
                onDragOver={(e) => handleDragOver(e, status)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, status)}
              >
                <div className="space-y-3">
                  {statusTasks.map((task) => (
                    <Card
                      key={task.id}
                      className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow cursor-move"
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-gray-400" />
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{task.title}</h3>
                          </div>
                          <div className="flex items-center gap-1">
                            <div
                              className={`w-3 h-3 rounded-full ${priorityColors[task.priority]}`}
                              title={`Prioridade ${task.priority === "low" ? "Baixa" : task.priority === "medium" ? "Média" : "Alta"}`}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleEditTask(task)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteTask(task.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {task.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{task.description}</p>
                        )}

                        {task.images.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            {task.images.slice(0, 4).map((image, index) => (
                              <img
                                key={index}
                                src={image || "/placeholder.svg"}
                                alt={`Imagem ${index + 1}`}
                                className="w-full h-16 object-cover rounded border"
                              />
                            ))}
                            {task.images.length > 4 && (
                              <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded border h-16">
                                <span className="text-xs text-gray-500">+{task.images.length - 4} mais</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>
                            <Clock className="h-3 w-3 inline mr-1" />
                            {new Date(task.updatedAt).toLocaleDateString("pt-BR")}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {task.priority === "low" ? "Baixa" : task.priority === "medium" ? "Média" : "Alta"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {statusTasks.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <config.icon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhuma tarefa {config.title.toLowerCase()}</p>
                      <p className="text-xs mt-1">Arraste tarefas para cá ou crie uma nova</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Instruções */}
      <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border-none shadow-lg">
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Como Usar</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
              <div>
                <h4 className="font-medium mb-2">Gerenciar Tarefas:</h4>
                <ul className="text-left space-y-1">
                  <li>• Clique em "Nova Tarefa" para adicionar</li>
                  <li>• Adicione imagens e defina prioridades</li>
                  <li>• Use os ícones para editar ou excluir</li>
                  <li>• Salve regularmente suas alterações</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Arrastar e Soltar:</h4>
                <ul className="text-left space-y-1">
                  <li>• Arraste tarefas entre as colunas</li>
                  <li>• A Fazer → Em Andamento → Concluídas</li>
                  <li>• As mudanças são salvas automaticamente</li>
                  <li>• Use o ícone de arrastar para mover</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
