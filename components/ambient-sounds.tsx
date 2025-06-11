"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, Volume2, CheckCircle } from "lucide-react"

const sounds = [
  {
    id: "thunder",
    name: "Trovão",
    icon: "⛈️",
    description: "Sons de tempestade relaxantes",
    youtubeId: "nDq6TstdEi8", // Rain and Thunder Sounds
  },
  {
    id: "rain",
    name: "Chuva",
    icon: "🌧️",
    description: "Chuva suave e constante",
    youtubeId: "q76bMs-NwRk", // Rain Sounds for Sleeping
  },
  {
    id: "field",
    name: "Campo",
    icon: "🌾",
    description: "Sons da natureza no campo",
    youtubeId: "eKFTSSKCzWA", // Forest Sounds
  },
  {
    id: "traffic",
    name: "Trânsito",
    icon: "🚗",
    description: "Ruído urbano suave",
    youtubeId: "1KaOrSuWZeM", // City Traffic Ambience
  },
  {
    id: "waterfall",
    name: "Cachoeira",
    icon: "💧",
    description: "Água corrente relaxante",
    youtubeId: "eOsmVZYGg8w", // Waterfall Sounds
  },
  {
    id: "ocean",
    name: "Oceano",
    icon: "🌊",
    description: "Ondas do mar relaxantes",
    youtubeId: "V1bFr2SWP1I", // Ocean Waves
  },
]

export function AmbientSounds() {
  const [playingSound, setPlayingSound] = useState<string | null>(null)
  const [volume, setVolume] = useState([50])
  const [loading, setLoading] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  // Limpar iframe quando componente for desmontado
  useEffect(() => {
    return () => {
      if (iframeRef.current) {
        iframeRef.current.src = ""
        if (iframeRef.current.parentNode) {
          iframeRef.current.parentNode.removeChild(iframeRef.current)
        }
      }
    }
  }, [])

  const toggleSound = async (soundId: string) => {
    setLoading(true)

    try {
      if (playingSound === soundId) {
        // Parar som atual
        if (iframeRef.current) {
          iframeRef.current.src = ""
          iframeRef.current.style.display = "none"
        }
        setPlayingSound(null)
      } else {
        // Parar som anterior se houver
        if (iframeRef.current) {
          iframeRef.current.src = ""
        }

        const sound = sounds.find((s) => s.id === soundId)
        if (sound) {
          loadYouTubeAudio(sound)
        }
      }
    } catch (error) {
      console.error("Erro ao reproduzir áudio:", error)
    } finally {
      setLoading(false)
    }
  }

  // Função para carregar áudio do YouTube
  const loadYouTubeAudio = (sound: (typeof sounds)[0]) => {
    try {
      // Criar ou reutilizar iframe do YouTube
      if (!iframeRef.current) {
        const iframe = document.createElement("iframe")
        iframe.style.display = "none"
        iframe.style.position = "fixed"
        iframe.style.top = "-1000px"
        iframe.style.left = "-1000px"
        iframe.style.width = "1px"
        iframe.style.height = "1px"
        iframe.allow = "autoplay"
        document.body.appendChild(iframe)
        iframeRef.current = iframe
      }

      // URL do YouTube com parâmetros para autoplay e loop
      const youtubeUrl = `https://www.youtube.com/embed/${sound.youtubeId}?autoplay=1&loop=1&playlist=${sound.youtubeId}&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&fs=0&cc_load_policy=0&start=0&end=0`

      iframeRef.current.src = youtubeUrl
      iframeRef.current.style.display = "block"

      setPlayingSound(sound.id)
      console.log(`Reproduzindo ${sound.name} via YouTube`)
    } catch (error) {
      console.error("Erro ao carregar YouTube:", error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Sons Ambientes</h2>
        <p className="text-gray-200">Relaxe com sons da natureza e ambientes</p>
      </div>

      <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-none shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Controle de Volume
            {playingSound && <CheckCircle className="h-4 w-4 text-green-500" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">0</span>
            <Slider value={volume} onValueChange={setVolume} max={100} step={1} className="flex-1" />
            <span className="text-sm text-gray-600 dark:text-gray-400">100</span>
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200 min-w-[3rem]">{volume[0]}%</span>
          </div>

          {playingSound && (
            <div className="mt-2 text-xs text-green-600 dark:text-green-400 flex items-center gap-2">
              <CheckCircle className="h-3 w-3" />
              <span>♪ Reproduzindo via YouTube</span>
            </div>
          )}

          <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
            💡 Dica: O controle de volume do YouTube está integrado ao player. Use os controles do seu navegador para
            ajustar o volume geral.
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sounds.map((sound) => (
          <Card
            key={sound.id}
            className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-none shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
          >
            <CardHeader className="text-center">
              <div className="text-4xl mb-2">{sound.icon}</div>
              <CardTitle className="text-xl">{sound.name}</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600 dark:text-gray-400 text-sm">{sound.description}</p>

              <Button
                onClick={() => toggleSound(sound.id)}
                variant={playingSound === sound.id ? "default" : "outline"}
                disabled={loading}
                className={`w-full ${
                  playingSound === sound.id
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
                }`}
              >
                {loading ? (
                  "Carregando..."
                ) : playingSound === sound.id ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pausar
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Reproduzir
                  </>
                )}
              </Button>

              {playingSound === sound.id && (
                <div className="text-xs text-green-600 font-medium flex items-center justify-center gap-2">
                  <CheckCircle className="h-3 w-3" />
                  <span>Tocando via YouTube</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border-none shadow-lg">
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Como Usar</h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              1. Clique em "Reproduzir" para iniciar um som ambiente
              <br />
              2. Os áudios são reproduzidos diretamente do YouTube para garantir qualidade
              <br />
              3. Clique em "Pausar" para parar o som completamente
              <br />
              4. Use o controle de volume do seu navegador para ajustar o áudio
              <br />
              5. Apenas um som pode tocar por vez
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
