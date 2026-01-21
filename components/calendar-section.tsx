"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight, Plus, Edit, Trash2, CalendarIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabaseClient"

type Note = {
  id: string
  date: string
  title: string
  description: string
  color: string
}

type CalendarSectionProps = {
  userId: string
}

export function CalendarSection({ userId }: CalendarSectionProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [noteTitle, setNoteTitle] = useState("")
  const [noteDescription, setNoteDescription] = useState("")
  const [noteColor, setNoteColor] = useState("blue")
  const { toast } = useToast()

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const { data, error } = await supabase
        .from("user_calendar_notes")
        .select("id, date, title, description, color, created_at, updated_at")
        .eq("user_id", userId)
        .order("date", { ascending: true })

      if (cancelled) return

      if (error) {
        toast({
          title: "Erro ao carregar",
          description: "Não foi possível carregar suas anotações.",
          variant: "destructive",
        })
        return
      }

      setNotes(
        (data ?? []).map((row: any) => ({
          id: row.id,
          date: row.date,
          title: row.title ?? "",
          description: row.description ?? "",
          color: row.color ?? "blue",
        })),
      )
    }

    load()

    return () => {
      cancelled = true
    }
  }, [userId, toast])

  const colors = [
    { name: "blue", class: "bg-blue-500", label: "Azul" },
    { name: "green", class: "bg-green-500", label: "Verde" },
    { name: "red", class: "bg-red-500", label: "Vermelho" },
    { name: "yellow", class: "bg-yellow-500", label: "Amarelo" },
    { name: "purple", class: "bg-purple-500", label: "Roxo" },
    { name: "pink", class: "bg-pink-500", label: "Rosa" },
  ]

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  }

  const getNotesForDate = (dateString: string) => {
    return notes.filter((note) => note.date === dateString)
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const handleDateClick = (day: number) => {
    const dateString = formatDate(currentDate.getFullYear(), currentDate.getMonth(), day)
    setSelectedDate(dateString)
  }

  const handleAddNote = async () => {
    if (!selectedDate) return

    const dateToUse = selectedDate
    const now = new Date().toISOString()

    if (editingNote) {
      const { data, error } = await supabase
        .from("user_calendar_notes")
        .update({
          date: dateToUse,
          title: noteTitle,
          description: noteDescription,
          color: noteColor,
          updated_at: now,
        })
        .eq("id", editingNote.id)
        .eq("user_id", userId)
        .select("id, date, title, description, color")
        .single()

      if (error || !data) {
        toast({
          title: "Erro ao salvar",
          description: "Não foi possível salvar a anotação.",
          variant: "destructive",
        })
        return
      }

      setNotes(notes.map((note) => (note.id === editingNote.id ? data : note)))
    } else {
      const { data, error } = await supabase
        .from("user_calendar_notes")
        .insert({
          user_id: userId,
          date: dateToUse,
          title: noteTitle,
          description: noteDescription,
          color: noteColor,
          created_at: now,
          updated_at: now,
        })
        .select("id, date, title, description, color")
        .single()

      if (error || !data) {
        toast({
          title: "Erro ao criar",
          description: "Não foi possível criar a anotação.",
          variant: "destructive",
        })
        return
      }

      setNotes([...notes, data])
    }

    setNoteTitle("")
    setNoteDescription("")
    setNoteColor("blue")
    setEditingNote(null)
    setIsDialogOpen(false)
  }

  const handleEditNote = (note: Note) => {
    setEditingNote(note)
    setNoteTitle(note.title)
    setNoteDescription(note.description)
    setNoteColor(note.color)
    setSelectedDate(note.date)
    setIsDialogOpen(true)
  }

  const handleDeleteNote = async (noteId: string) => {
    const prev = notes
    setNotes(notes.filter((note) => note.id !== noteId))

    const { error } = await supabase.from("user_calendar_notes").delete().eq("id", noteId).eq("user_id", userId)
    if (error) {
      setNotes(prev)
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover a anotação.",
        variant: "destructive",
      })
    }
  }

  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ]

  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)
  const today = new Date()
  const isCurrentMonth =
    today.getFullYear() === currentDate.getFullYear() && today.getMonth() === currentDate.getMonth()

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Calendário</h2>
        <p className="text-gray-200">Organize suas anotações e compromissos</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendário */}
        <div className="lg:col-span-2">
          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-none shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-xl">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Cabeçalho dos dias da semana */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-gray-600 dark:text-gray-400 p-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Dias do mês */}
              <div className="grid grid-cols-7 gap-1">
                {/* Espaços vazios para o primeiro dia do mês */}
                {Array.from({ length: firstDay }, (_, i) => (
                  <div key={`empty-${i}`} className="h-12"></div>
                ))}

                {/* Dias do mês */}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1
                  const dateString = formatDate(currentDate.getFullYear(), currentDate.getMonth(), day)
                  const dayNotes = getNotesForDate(dateString)
                  const isToday = isCurrentMonth && day === today.getDate()
                  const isSelected = selectedDate === dateString

                  return (
                    <div
                      key={day}
                      className={`h-12 p-1 border rounded cursor-pointer transition-all hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        isToday
                          ? "bg-blue-100 dark:bg-blue-900 border-blue-500"
                          : "border-gray-200 dark:border-gray-600"
                      } ${isSelected ? "ring-2 ring-blue-500" : ""}`}
                      onClick={() => handleDateClick(day)}
                    >
                      <div className="text-sm font-medium text-center">{day}</div>
                      {dayNotes.length > 0 && (
                        <div className="flex justify-center mt-1">
                          <div className="flex gap-1">
                            {dayNotes.slice(0, 3).map((note, index) => (
                              <div
                                key={index}
                                className={`w-1.5 h-1.5 rounded-full ${colors.find((c) => c.name === note.color)?.class || "bg-blue-500"}`}
                              ></div>
                            ))}
                            {dayNotes.length > 3 && <div className="text-xs text-gray-500">+</div>}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Painel lateral com anotações */}
        <div className="space-y-4">
          {/* Botão para adicionar nova anotação */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="w-full hover:bg-blue-600 active:bg-blue-700 dark:hover:bg-blue-600 dark:active:bg-blue-700"
                onClick={() => {
                  setEditingNote(null)
                  setNoteTitle("")
                  setNoteDescription("")
                  setNoteColor("blue")
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Anotação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingNote ? "Editar Anotação" : "Nova Anotação"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Data</label>
                  <Input
                    type="date"
                    value={selectedDate || ""}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Título</label>
                  <Input
                    placeholder="Ex: Aniversário do meu primeiro"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Descrição</label>
                  <Textarea
                    placeholder="Detalhes da anotação..."
                    value={noteDescription}
                    onChange={(e) => setNoteDescription(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Cor</label>
                  <div className="flex gap-2 mt-2">
                    {colors.map((color) => (
                      <button
                        key={color.name}
                        className={`w-8 h-8 rounded-full ${color.class} ${
                          noteColor === color.name ? "ring-2 ring-gray-400" : ""
                        }`}
                        onClick={() => setNoteColor(color.name)}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleAddNote} disabled={!noteTitle || !selectedDate} className="flex-1">
                    {editingNote ? "Salvar" : "Adicionar"}
                  </Button>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Lista de anotações do dia selecionado */}
          {selectedDate && (
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  {new Date(selectedDate + "T00:00:00").toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {getNotesForDate(selectedDate).length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                    Nenhuma anotação para este dia
                  </p>
                ) : (
                  getNotesForDate(selectedDate).map((note) => (
                    <div
                      key={note.id}
                      className="p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg border-l-4"
                      style={{
                        borderLeftColor:
                          colors.find((c) => c.name === note.color)?.class.replace("bg-", "#") || "#3b82f6",
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">{note.title}</h4>
                          {note.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{note.description}</p>
                          )}
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditNote(note)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteNote(note.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {/* Resumo das próximas anotações */}
          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Próximas Anotações</CardTitle>
            </CardHeader>
            <CardContent>
              {notes
                .filter((note) => new Date(note.date + "T00:00:00") >= new Date())
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .slice(0, 5)
                .map((note) => (
                  <div key={note.id} className="flex items-center gap-3 py-2 border-b last:border-b-0">
                    <div
                      className={`w-3 h-3 rounded-full ${colors.find((c) => c.name === note.color)?.class || "bg-blue-500"}`}
                    ></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{note.title}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(note.date + "T00:00:00").toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                ))}
              {notes.filter((note) => new Date(note.date + "T00:00:00") >= new Date()).length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">Nenhuma anotação futura</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
