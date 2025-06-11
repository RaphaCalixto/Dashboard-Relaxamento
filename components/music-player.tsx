"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Youtube, Music, Search, ExternalLink } from "lucide-react"

export function MusicPlayer() {
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [spotifyUrl, setSpotifyUrl] = useState("")
  const [currentVideo, setCurrentVideo] = useState("")
  const [spotifyEmbed, setSpotifyEmbed] = useState("")

  const handleYouTubeEmbed = () => {
    if (youtubeUrl) {
      // Extrair ID do vídeo do YouTube
      const videoId = extractYouTubeId(youtubeUrl)
      if (videoId) {
        setCurrentVideo(videoId)
      }
    }
  }

  const handleSpotifyEmbed = () => {
    if (spotifyUrl) {
      // Converter URL do Spotify para URL de embed
      const embedUrl = convertSpotifyUrlToEmbed(spotifyUrl)
      if (embedUrl) {
        setSpotifyEmbed(embedUrl)
      }
    }
  }

  const extractYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
  }

  const convertSpotifyUrlToEmbed = (url: string) => {
    // Exemplo: https://open.spotify.com/track/1dGr1c8CrMLDpV6mPbImSI -> https://open.spotify.com/embed/track/1dGr1c8CrMLDpV6mPbImSI
    if (url.includes("open.spotify.com")) {
      return url.replace("open.spotify.com", "open.spotify.com/embed")
    }
    return url
  }

  const popularPlaylists = [
    {
      title: "Lo-fi Hip Hop",
      description: "Música relaxante para estudar",
      videoId: "jfKfPfyJRdk",
      thumbnail: "🎵",
    },
    {
      title: "Piano",
      description: "Música clássica de piano",
      videoId: "H5ohDQ-umHM",
      thumbnail: "🎹",
    },
    {
      title: "Fauna",
      description: "Sons da natureza",
      videoId: "eKFTSSKCzWA",
      thumbnail: "🌿",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Central de Música</h2>
        <p className="text-gray-200">Integração com YouTube e Spotify para sua trilha sonora perfeita</p>
      </div>

      <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-none shadow-lg">
        <CardContent className="p-6">
          <Tabs defaultValue="youtube" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger
                value="youtube"
                className="flex items-center gap-2 data-[state=active]:bg-gray-200/80 dark:data-[state=active]:bg-gray-800/80 hover:bg-gray-100/80 dark:hover:bg-gray-700/80"
              >
                <Youtube className="h-4 w-4" />
                YouTube
              </TabsTrigger>
              <TabsTrigger
                value="spotify"
                className="flex items-center gap-2 data-[state=active]:bg-gray-200/80 dark:data-[state=active]:bg-gray-800/80 hover:bg-gray-100/80 dark:hover:bg-gray-700/80"
              >
                <Music className="h-4 w-4" />
                Spotify
              </TabsTrigger>
            </TabsList>

            <TabsContent value="youtube" className="space-y-6">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Cole o link do YouTube aqui..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleYouTubeEmbed}
                    className="hover:bg-blue-600 active:bg-blue-700 dark:hover:bg-blue-600 dark:active:bg-blue-700"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Carregar
                  </Button>
                </div>

                {currentVideo && (
                  <div className="aspect-video w-full">
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${currentVideo}?autoplay=1`}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="rounded-lg"
                    ></iframe>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Playlists Populares</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {popularPlaylists.map((playlist, index) => (
                    <Card
                      key={index}
                      className="cursor-pointer hover:shadow-md transition-shadow transform hover:-translate-y-1"
                    >
                      <CardContent className="p-4 text-center">
                        <div className="text-3xl mb-2">{playlist.thumbnail}</div>
                        <h3 className="font-semibold mb-1">{playlist.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{playlist.description}</p>
                        <Button
                          size="sm"
                          onClick={() => setCurrentVideo(playlist.videoId)}
                          className="w-full hover:bg-blue-600 active:bg-blue-700 dark:hover:bg-blue-600 dark:active:bg-blue-700"
                        >
                          Reproduzir
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="spotify" className="space-y-6">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Cole o link do Spotify aqui... (ex: https://open.spotify.com/playlist/...)"
                    value={spotifyUrl}
                    onChange={(e) => setSpotifyUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSpotifyEmbed}
                    className="hover:bg-blue-600 active:bg-blue-700 dark:hover:bg-blue-600 dark:active:bg-blue-700"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Carregar
                  </Button>
                </div>

                {spotifyEmbed && (
                  <div className="w-full h-[380px]">
                    <iframe
                      src={spotifyEmbed}
                      width="100%"
                      height="380"
                      frameBorder="0"
                      allow="encrypted-media"
                      className="rounded-lg"
                    ></iframe>
                  </div>
                )}

                <div className="bg-white/60 dark:bg-gray-800/60 p-6 rounded-lg text-center">
                  <Music className="h-12 w-12 mx-auto mb-4 text-green-600 dark:text-green-400" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Como usar o Spotify</h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    1. Abra o Spotify e encontre uma playlist ou música
                    <br />
                    2. Clique em "Compartilhar" e copie o link
                    <br />
                    3. Cole o link acima e clique em "Carregar"
                  </p>
                  <Button
                    variant="outline"
                    asChild
                    className="hover:bg-gray-200/50 dark:hover:bg-gray-700/50 active:bg-gray-300/50 dark:active:bg-gray-600/50"
                  >
                    <a href="https://open.spotify.com" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Abrir Spotify
                    </a>
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
