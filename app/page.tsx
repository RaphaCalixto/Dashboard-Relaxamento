"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { GamesSection } from "@/components/games-section"
import { AmbientSounds } from "@/components/ambient-sounds"
import { MusicPlayer } from "@/components/music-player"
import { CalendarSection } from "@/components/calendar-section"
import { DrawingSection } from "@/components/drawing-section"
import { TasksSection } from "@/components/tasks-section"
import { AuthScreen } from "@/components/auth-screen"
import { WeatherWidget } from "@/components/weather-widget"
import { CurrencyWidget } from "@/components/currency-widget"
import { ClockWidget } from "@/components/clock-widget"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Brain,
  Waves,
  Home,
  Gamepad2,
  Volume2,
  Music,
  ImageIcon,
  Calendar,
  Palette,
  Upload,
  CheckSquare,
  User,
  Edit,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTheme } from "next-themes"
import { supabase } from "@/lib/supabaseClient"

const wallpapers = [
  { name: "Oceano", url: "/images/ocean-bg.png" },
  {
    name: "Montanhas",
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop",
  },
  {
    name: "Floresta",
    url: "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=2072&auto=format&fit=crop",
  },
  {
    name: "Céu Estrelado",
    url: "https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?q=80&w=2072&auto=format&fit=crop",
  },
]

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState("overview")
  const [wallpaper, setWallpaper] = useState(wallpapers[0].url)
  const [customWallpaperUrl, setCustomWallpaperUrl] = useState("")
  const [uploadedWallpapers, setUploadedWallpapers] = useState<Array<{ name: string; url: string }>>([])
  const [userName, setUserName] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [newName, setNewName] = useState("")
  const { theme } = useTheme()

  // Carregar sessão do Supabase e observar mudanças
  useEffect(() => {
    let mounted = true

    const load = async () => {
      const { data } = await supabase.auth.getUser()
      const user = data.user
      const name = (user?.user_metadata as any)?.name
      if (mounted) {
        setUserName(typeof name === "string" && name.trim() ? name : null)
        setUserEmail(typeof user?.email === "string" ? user.email : null)
        setIsAuthenticated(!!user)
        setIsAuthReady(true)
      }
    }

    load()

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null
      const name = (user?.user_metadata as any)?.name
      if (mounted) {
        setUserName(typeof name === "string" && name.trim() ? name : null)
        setUserEmail(typeof user?.email === "string" ? user.email : null)
        setIsAuthenticated(!!user)
        setIsAuthReady(true)
      }
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const displayName = userName ?? (userEmail ? userEmail.split("@")[0] : "")

  // Editar nome do usuário
  const handleNameEdit = () => {
    if (newName.trim()) {
      const nextName = newName.trim()
      supabase.auth
        .updateUser({
          data: { name: nextName },
        })
        .then(({ error }) => {
          if (!error) {
            setUserName(nextName)
            setIsEditingName(false)
            setNewName("")
          }
        })
    }
  }

  // Se ainda não carregou auth, evitar flash
  if (!isAuthReady) {
    return null
  }

  // Se não tem usuário autenticado, mostrar tela de login/cadastro
  if (!isAuthenticated) {
    return <AuthScreen />
  }

  const renderContent = () => {
    switch (activeSection) {
      case "games":
        return <GamesSection />
      case "sounds":
        return <AmbientSounds />
      case "music":
        return <MusicPlayer />
      case "calendar":
        return <CalendarSection />
      case "drawing":
        return <DrawingSection />
      case "tasks":
        return <TasksSection />
      default:
        return (
          <div className="space-y-6">
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
                  <Brain className="h-5 w-5" />
                  Bem-vindo de volta, {displayName}! 👋
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Este é seu espaço pessoal para relaxar e manter a produtividade. Explore as diferentes seções usando
                  os ícones na parte inferior da tela.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                  <div
                    className="text-center p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg cursor-pointer hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all"
                    onClick={() => setActiveSection("sounds")}
                  >
                    <Waves className="h-8 w-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-semibold text-blue-800 dark:text-blue-300">Sons Ambientes</h3>
                    <p className="text-sm text-blue-600 dark:text-blue-400">Relaxe com sons da natureza</p>
                  </div>
                  <div
                    className="text-center p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg cursor-pointer hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all"
                    onClick={() => setActiveSection("games")}
                  >
                    <Gamepad2 className="h-8 w-8 mx-auto mb-2 text-green-600 dark:text-green-400" />
                    <h3 className="font-semibold text-green-800 dark:text-green-300">Jogos</h3>
                    <p className="text-sm text-green-600 dark:text-green-400">Exercite sua mente</p>
                  </div>
                  <div
                    className="text-center p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg cursor-pointer hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all"
                    onClick={() => setActiveSection("music")}
                  >
                    <Music className="h-8 w-8 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
                    <h3 className="font-semibold text-purple-800 dark:text-purple-300">Música</h3>
                    <p className="text-sm text-purple-600 dark:text-purple-400">Ouça suas playlists favoritas</p>
                  </div>
                  <div
                    className="text-center p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg cursor-pointer hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all"
                    onClick={() => setActiveSection("calendar")}
                  >
                    <Calendar className="h-8 w-8 mx-auto mb-2 text-orange-600 dark:text-orange-400" />
                    <h3 className="font-semibold text-orange-800 dark:text-orange-300">Calendário</h3>
                    <p className="text-sm text-orange-600 dark:text-orange-400">Organize suas anotações</p>
                  </div>
                  <div
                    className="text-center p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg cursor-pointer hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all"
                    onClick={() => setActiveSection("drawing")}
                  >
                    <Palette className="h-8 w-8 mx-auto mb-2 text-pink-600 dark:text-pink-400" />
                    <h3 className="font-semibold text-pink-800 dark:text-pink-300">Desenho</h3>
                    <p className="text-sm text-pink-600 dark:text-pink-400">Expresse sua criatividade</p>
                  </div>
                  <div
                    className="text-center p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg cursor-pointer hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all"
                    onClick={() => setActiveSection("tasks")}
                  >
                    <CheckSquare className="h-8 w-8 mx-auto mb-2 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="font-semibold text-indigo-800 dark:text-indigo-300">Tarefas</h3>
                    <p className="text-sm text-indigo-600 dark:text-indigo-400">Organize seus projetos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )
    }
  }

  const handleWallpaperChange = (url: string) => {
    setWallpaper(url)
  }

  const handleCustomWallpaper = () => {
    if (customWallpaperUrl) {
      setWallpaper(customWallpaperUrl)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        if (result) {
          const newWallpaper = {
            name: file.name.split(".")[0],
            url: result,
          }
          setUploadedWallpapers((prev) => [...prev, newWallpaper])
          setWallpaper(result)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const removeUploadedWallpaper = (index: number) => {
    setUploadedWallpapers((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col relative bg-cover bg-center"
      style={{ backgroundImage: `url(${wallpaper})` }}
    >
      {/* Overlay escuro para melhorar legibilidade */}
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 z-0"></div>

      {/* Conteúdo principal */}
      <div className="relative z-10 flex flex-col h-screen">
        {/* Header com tema, wallpaper e nome do usuário */}
        <header className="flex justify-between items-center p-4">
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-white/20 backdrop-blur-md border-white/20 hover:bg-white/30 active:bg-gray-400/30"
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Escolha um wallpaper</DialogTitle>
                </DialogHeader>

                {/* Wallpapers padrão */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Wallpapers Padrão</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {wallpapers.map((wp) => (
                      <div
                        key={wp.name}
                        className={cn(
                          "relative aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition-all hover:opacity-90 active:opacity-75",
                          wallpaper === wp.url ? "border-blue-500" : "border-transparent",
                        )}
                        onClick={() => handleWallpaperChange(wp.url)}
                      >
                        <img src={wp.url || "/placeholder.svg"} alt={wp.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20 flex items-end p-2">
                          <span className="text-white text-sm font-medium">{wp.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upload de imagem local */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Carregar do Computador</h3>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Clique para selecionar uma imagem do seu computador
                    </p>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="wallpaper-upload"
                    />
                    <Label htmlFor="wallpaper-upload" className="cursor-pointer">
                      <Button type="button" variant="outline" className="pointer-events-none">
                        <Upload className="h-4 w-4 mr-2" />
                        Selecionar Imagem
                      </Button>
                    </Label>
                    <p className="text-xs text-gray-500 mt-2">Formatos suportados: JPG, PNG, GIF, WebP</p>
                  </div>
                </div>

                {/* Imagens carregadas */}
                {uploadedWallpapers.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-3">Suas Imagens</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {uploadedWallpapers.map((wp, index) => (
                        <div
                          key={index}
                          className={cn(
                            "relative aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition-all hover:opacity-90 active:opacity-75 group",
                            wallpaper === wp.url ? "border-blue-500" : "border-transparent",
                          )}
                        >
                          <img
                            src={wp.url || "/placeholder.svg"}
                            alt={wp.name}
                            className="w-full h-full object-cover"
                            onClick={() => handleWallpaperChange(wp.url)}
                          />
                          <div className="absolute inset-0 bg-black/20 flex items-end p-2">
                            <span className="text-white text-sm font-medium flex-1">{wp.name}</span>
                            <Button
                              variant="destructive"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeUploadedWallpaper(index)
                              }}
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* URL personalizada */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">URL Personalizada</h3>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="custom-wallpaper">Cole a URL de uma imagem</Label>
                    <div className="flex gap-2">
                      <Input
                        id="custom-wallpaper"
                        placeholder="https://exemplo.com/imagem.jpg"
                        value={customWallpaperUrl}
                        onChange={(e) => setCustomWallpaperUrl(e.target.value)}
                      />
                      <Button onClick={handleCustomWallpaper} disabled={!customWallpaperUrl}>
                        Aplicar
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <ThemeToggle />
          </div>

          {/* Nome do usuário e widgets */}
          <div className="flex items-center gap-4">
            {/* Nome do usuário */}
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-lg px-3 py-2 border border-white/20">
              <User className="h-4 w-4 text-white" />
              <span className="text-white font-medium">Bem-vindo, {displayName}</span>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={handleSignOut}
              >
                Sair
              </Button>
              <Dialog open={isEditingName} onOpenChange={setIsEditingName}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-white hover:bg-white/20"
                    onClick={() => setNewName(displayName)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Alterar Nome</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="new-name">Novo nome</Label>
                      <Input
                        id="new-name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Digite seu novo nome..."
                        maxLength={30}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleNameEdit} disabled={!newName.trim()} className="flex-1">
                        Salvar
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditingName(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Widgets */}
            <div className="flex gap-2">
              <div className="w-40">
                <ClockWidget />
              </div>
              <div className="w-48">
                <WeatherWidget />
              </div>
              <div className="w-48">
                <CurrencyWidget />
              </div>
            </div>
          </div>
        </header>

        {/* Conteúdo principal */}
        <main className="flex-1 overflow-auto px-4 py-6">
          <div className="container mx-auto max-w-6xl">{renderContent()}</div>
        </main>

        {/* Navegação inferior */}
        <nav className="p-4">
          <div className="bg-white/30 dark:bg-gray-900/30 backdrop-blur-md rounded-full max-w-2xl mx-auto flex justify-center">
            <div className="flex justify-center space-x-2 p-1">
              {[
                { id: "overview", icon: Home, label: "Visão Geral" },
                { id: "games", icon: Gamepad2, label: "Jogos" },
                { id: "sounds", icon: Volume2, label: "Sons" },
                { id: "music", icon: Music, label: "Música" },
                { id: "calendar", icon: Calendar, label: "Calendário" },
                { id: "drawing", icon: Palette, label: "Desenho" },
                { id: "tasks", icon: CheckSquare, label: "Tarefas" },
              ].map((item) => (
                <Button
                  key={item.id}
                  variant={activeSection === item.id ? "default" : "ghost"}
                  className={cn(
                    "flex flex-col items-center py-2 px-4 h-auto gap-1 transition-all",
                    activeSection === item.id
                      ? "bg-gray-200/80 text-gray-900 dark:bg-gray-800/80 dark:text-white hover:bg-gray-300/80 dark:hover:bg-gray-700/80"
                      : "text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-gray-800/50 active:bg-gray-400/30 dark:active:bg-gray-700/30",
                  )}
                  onClick={() => setActiveSection(item.id)}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-xs">{item.label}</span>
                </Button>
              ))}
            </div>
          </div>
        </nav>
      </div>
    </div>
  )
}
