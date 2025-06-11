"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Brain, Sparkles, ArrowRight } from "lucide-react"

type WelcomeScreenProps = {
  onNameSubmit: (name: string) => void
}

export function WelcomeScreen({ onNameSubmit }: WelcomeScreenProps) {
  const [name, setName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      setIsSubmitting(true)
      // Pequeno delay para dar feedback visual
      setTimeout(() => {
        onNameSubmit(name.trim())
      }, 500)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 relative overflow-hidden">
      {/* Elementos decorativos de fundo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      {/* Partículas flutuantes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          ></div>
        ))}
      </div>

      {/* Conteúdo principal */}
      <div className="relative z-10 w-full max-w-md px-6">
        <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-none shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Brain className="h-16 w-16 text-blue-600 dark:text-blue-400" />
                <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Bem-vindo ao Dashboard de Relaxamento
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              Seu espaço pessoal para relaxar, jogar, organizar tarefas e manter a produtividade. Vamos começar
              conhecendo você!
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user-name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Como você gostaria de ser chamado?
                </Label>
                <Input
                  id="user-name"
                  type="text"
                  placeholder="Digite seu nome..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 text-center text-lg border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                  maxLength={30}
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                disabled={!name.trim() || isSubmitting}
                className="w-full py-3 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Entrando...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    Entrar no Dashboard
                    <ArrowRight className="h-5 w-5" />
                  </div>
                )}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Seu nome será salvo localmente e você poderá alterá-lo a qualquer momento
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Recursos em destaque */}
        <div className="mt-8 grid grid-cols-2 gap-4 text-center">
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-white">
            <div className="text-2xl mb-2">🎮</div>
            <p className="text-sm font-medium">Jogos Relaxantes</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-white">
            <div className="text-2xl mb-2">🎵</div>
            <p className="text-sm font-medium">Sons Ambientes</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-white">
            <div className="text-2xl mb-2">📅</div>
            <p className="text-sm font-medium">Organização</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-white">
            <div className="text-2xl mb-2">🎨</div>
            <p className="text-sm font-medium">Criatividade</p>
          </div>
        </div>
      </div>
    </div>
  )
}
