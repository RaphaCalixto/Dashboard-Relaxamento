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
  CheckSquare,
  Clock,
  PlayCircle,
  CheckCircle,
  ImageIcon,
  X,
  GripVertical,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabaseClient"

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

type TasksSectionProps = {
  userId: string
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

export function TasksSection({ userId }: TasksSectionProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [taskTitle, setTaskTitle] = useState("")
  const [taskDescription, setTaskDescription] = useState("")
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high">("medium")
  const [taskImages, setTaskImages] = useState<string[]>([])
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const { data, error } = await supabase
        .from("user_tasks")
        .select("id, title, description, status, priority, images, created_at, updated_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (cancelled) return

      if (error) {
        toast({
          title: "Erro ao carregar",
          description: "Não foi possível carregar suas tarefas.",
          variant: "destructive",
        })
        return
      }

      setTasks(
        (data ?? []).map((row: any) => ({
          id: row.id,
          title: row.title ?? "",
          description: row.description ?? "",
          status: row.status,
          priority: row.priority,
          images: Array.isArray(row.images) ? row.images : [],
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })),
      )
    }

    load()

    return () => {
      cancelled = true
    }
  }, [userId, toast])

  const handleAddTask = async () => {
    if (!taskTitle.trim()) return

    const now = new Date().toISOString()

    if (editingTask) {
      const { data, error } = await supabase
        .from("user_tasks")
        .update({
          title: taskTitle.trim(),
          description: taskDescription,
          priority: taskPriority,
          images: taskImages,
          updated_at: now,
        })
        .eq("id", editingTask.id)
        .eq("user_id", userId)
        .select("id, title, description, status, priority, images, created_at, updated_at")
        .single()

      if (error || !data) {
        toast({
          title: "Erro ao salvar",
          description: "Não foi possível salvar a tarefa.",
          variant: "destructive",
        })
        return
      }

      setTasks(
        tasks.map((t) =>
          t.id === editingTask.id
            ? {
                id: data.id,
                title: data.title ?? "",
                description: data.description ?? "",
                status: data.status,
                priority: data.priority,
                images: Array.isArray(data.images) ? data.images : [],
                createdAt: data.created_at,
                updatedAt: data.updated_at,
              }
            : t,
        ),
      )
    } else {
      const { data, error } = await supabase
        .from("user_tasks")
        .insert({
          user_id: userId,
          title: taskTitle.trim(),
          description: taskDescription,
          status: "todo",
          priority: taskPriority,
          images: taskImages,
          created_at: now,
          updated_at: now,
        })
        .select("id, title, description, status, priority, images, created_at, updated_at")
        .single()

      if (error || !data) {
        toast({
          title: "Erro ao criar",
          description: "Não foi possível criar a tarefa.",
          variant: "destructive",
        })
        return
      }

      setTasks([
        {
          id: data.id,
          title: data.title ?? "",
          description: data.description ?? "",
          status: data.status,
          priority: data.priority,
          images: Array.isArray(data.images) ? data.images : [],
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        },
        ...tasks,
      ])
    }

    resetForm()
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setTaskTitle(task.title)
    setTaskDescription(task.description)
    setTaskPriority(task.priority)
    setTaskImages(task.images)
    setIsDialogOpen(true)
  }

  const handleDeleteTask = async (taskId: string) => {
    const prev = tasks
    setTasks(tasks.filter((task) => task.id !== taskId))

    const { error } = await supabase.from("user_tasks").delete().eq("id", taskId).eq("user_id", userId)
    if (error) {
      setTasks(prev)
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover a tarefa.",
        variant: "destructive",
      })
    }
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
      const updatedAt = new Date().toISOString()
      setTasks(tasks.map((task) => (task.id === draggedTask.id ? { ...task, status: newStatus, updatedAt } : task)))
      supabase
        .from("user_tasks")
        .update({ status: newStatus, updated_at: updatedAt })
        .eq("id", draggedTask.id)
        .eq("user_id", userId)
        .then(({ error }) => {
          if (error) {
            toast({
              title: "Erro ao mover",
              description: "Não foi possível atualizar o status da tarefa.",
              variant: "destructive",
            })
          }
        })
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
