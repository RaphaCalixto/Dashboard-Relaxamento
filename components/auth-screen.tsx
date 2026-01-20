"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Brain, Sparkles } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

type AuthScreenProps = {
  onSignedIn?: () => void
}

export function AuthScreen({ onSignedIn }: AuthScreenProps) {
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useMemo(() => {
    if (!email.trim() || !password) return false
    if (mode === "signUp" && !name.trim()) return false
    return true
  }, [email, password, name, mode])

  useEffect(() => {
    setError(null)
  }, [mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      if (mode === "signUp") {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              name: name.trim(),
            },
          },
        })

        if (signUpError) throw signUpError

        onSignedIn?.()
        return
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (signInError) throw signInError

      onSignedIn?.()
    } catch (err: any) {
      setError(err?.message ?? "Erro ao autenticar")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      </div>

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
              {mode === "signIn" ? "Entrar" : "Criar conta"}
            </CardTitle>

            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              {mode === "signIn" ? "Acesse sua conta para entrar no dashboard" : "Crie sua conta para salvar seus dados"}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signUp" ? (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nome (como vai aparecer)
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Digite seu nome..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={30}
                    disabled={isSubmitting}
                    autoComplete="name"
                  />
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Crie uma senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  autoComplete={mode === "signIn" ? "current-password" : "new-password"}
                />
              </div>

              {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

              <Button type="submit" disabled={!canSubmit || isSubmitting} className="w-full">
                {isSubmitting ? "Aguarde..." : mode === "signIn" ? "Entrar" : "Criar conta"}
              </Button>
            </form>

            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                className="text-sm"
                onClick={() => setMode(mode === "signIn" ? "signUp" : "signIn")}
                disabled={isSubmitting}
              >
                {mode === "signIn" ? "Ainda não tem conta? Criar" : "Já tem conta? Entrar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
