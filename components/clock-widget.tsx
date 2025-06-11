"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Clock } from "lucide-react"

export function ClockWidget() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "America/Sao_Paulo",
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      timeZone: "America/Sao_Paulo",
    })
  }

  return (
    <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-none shadow-lg">
      <CardContent className="p-3">
        <div className="flex items-center gap-1 mb-1">
          <Clock className="h-3 w-3 text-blue-600 dark:text-blue-400" />
          <span className="text-xs text-gray-700 dark:text-gray-300">Horário</span>
        </div>

        <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatTime(time)}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{formatDate(time)}</div>
      </CardContent>
    </Card>
  )
}
