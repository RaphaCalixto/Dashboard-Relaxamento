"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, DollarSign, RefreshCw } from "lucide-react"

export function CurrencyWidget() {
  const [currency, setCurrency] = useState({
    usdToBrl: 5.45, // Valor mais atual para 2025
    change: 0.08,
    changePercent: 1.49,
    lastUpdate: new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    nextUpdate: "",
  })
  const [loading, setLoading] = useState(false)

  // Calcular próxima atualização (14:00 do próximo dia)
  const getNextUpdateTime = () => {
    const now = new Date()
    const nextUpdate = new Date()

    // Se já passou das 14:00 hoje, próxima atualização é amanhã às 14:00
    if (now.getHours() >= 14) {
      nextUpdate.setDate(nextUpdate.getDate() + 1)
    }

    nextUpdate.setHours(14, 0, 0, 0)

    return (
      nextUpdate.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }) + " às 14:00"
    )
  }

  useEffect(() => {
    setCurrency((prev) => ({
      ...prev,
      nextUpdate: getNextUpdateTime(),
    }))
  }, [])

  const refreshCurrency = async () => {
    setLoading(true)

    // Simular chamada de API com valores mais realistas para 2025
    setTimeout(() => {
      const baseRate = 5.45 // Taxa base mais atual
      const variation = (Math.random() - 0.5) * 0.2 // Variação de ±0.10
      const newRate = Number((baseRate + variation).toFixed(2))
      const change = Number((newRate - currency.usdToBrl).toFixed(2))
      const changePercent = Number(((change / currency.usdToBrl) * 100).toFixed(2))

      setCurrency({
        usdToBrl: newRate,
        change: change,
        changePercent: changePercent,
        lastUpdate: new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        nextUpdate: getNextUpdateTime(),
      })
      setLoading(false)
    }, 1000)
  }

  // Verificar se é hora de atualizar automaticamente (14:00)
  useEffect(() => {
    const checkForUpdate = () => {
      const now = new Date()
      if (now.getHours() === 14 && now.getMinutes() === 0) {
        refreshCurrency()
      }
    }

    const interval = setInterval(checkForUpdate, 60000) // Verificar a cada minuto
    return () => clearInterval(interval)
  }, [])

  const isPositive = currency.change >= 0

  return (
    <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-none shadow-lg">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3 text-green-600 dark:text-green-400" />
            <span className="text-xs text-gray-700 dark:text-gray-300">USD/BRL</span>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={refreshCurrency} disabled={loading}>
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <div className="flex items-center justify-between mt-1">
          <div className="text-xl font-bold text-gray-900 dark:text-gray-100">R$ {currency.usdToBrl.toFixed(2)}</div>
          <div className={`flex items-center gap-1 ${isPositive ? "text-red-600" : "text-green-600"}`}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span className="text-xs font-medium">
              {isPositive ? "+" : ""}
              {currency.changePercent.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Próxima: {currency.nextUpdate}</div>
      </CardContent>
    </Card>
  )
}
