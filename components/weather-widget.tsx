"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Cloud, Sun, CloudRain, MapPin, RefreshCw, AlertCircle, Moon, CloudSnow } from "lucide-react"
import { LocationSettings } from "./location-settings"

type WeatherData = {
  location: string
  temperature: number
  condition: string
  humidity: number
  windSpeed: number
  icon: string
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData>({
    location: "Detectando...",
    temperature: 0,
    condition: "Carregando",
    humidity: 0,
    windSpeed: 0,
    icon: "loading",
  })
  const [loading, setLoading] = useState(false)
  const [locationError, setLocationError] = useState(false)

  // Função para determinar condição baseada no horário e localização
  const getRealisticWeather = (city: string, state: string) => {
    const now = new Date()
    const hour = now.getHours()
    const isNight = hour >= 18 || hour <= 6
    const isEvening = hour >= 17 && hour <= 19
    const isMorning = hour >= 6 && hour <= 9

    let baseTemp = 25
    let condition = "Parcialmente nublado"
    let icon = "partly-cloudy"

    // Ajustar temperatura baseada na região e horário
    if (state === "RJ") {
      baseTemp = isNight ? 22 : isMorning ? 24 : 28
      if (isNight) {
        condition = "Noite clara"
        icon = "clear-night"
      } else if (hour >= 12 && hour <= 16) {
        condition = "Ensolarado"
        icon = "sunny"
      } else {
        condition = "Parcialmente nublado"
        icon = "partly-cloudy"
      }
    } else if (state === "SP") {
      baseTemp = isNight ? 18 : isMorning ? 20 : 24
      if (isNight) {
        condition = "Noite nublada"
        icon = "cloudy-night"
      } else {
        condition = "Nublado"
        icon = "cloudy"
      }
    } else if (state === "BA" || state === "PE" || state === "CE") {
      baseTemp = isNight ? 26 : isMorning ? 28 : 32
      if (isNight) {
        condition = "Noite clara"
        icon = "clear-night"
      } else {
        condition = "Ensolarado"
        icon = "sunny"
      }
    } else if (state === "RS" || state === "SC" || state === "PR") {
      baseTemp = isNight ? 15 : isMorning ? 17 : 22
      if (isNight) {
        condition = "Noite fria"
        icon = "cold-night"
      } else if (Math.random() > 0.7) {
        condition = "Chuvisco"
        icon = "light-rain"
      } else {
        condition = "Nublado"
        icon = "cloudy"
      }
    }

    // Adicionar variação aleatória pequena
    const tempVariation = (Math.random() - 0.5) * 4
    baseTemp = Math.round(baseTemp + tempVariation)

    return {
      temperature: baseTemp,
      condition,
      icon,
      humidity: Math.floor(Math.random() * 20) + 65, // 65-85%
      windSpeed: Math.floor(Math.random() * 10) + 8, // 8-18 km/h
    }
  }

  // Detectar localização do usuário
  const detectLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          getCityFromCoordinates(latitude, longitude)
        },
        (error) => {
          console.error("Erro ao obter localização:", error)
          setLocationError(true)
          // Fallback para Rio de Janeiro
          const weatherData = getRealisticWeather("Rio de Janeiro", "RJ")
          setWeather({
            location: "Rio de Janeiro, RJ",
            ...weatherData,
          })
        },
      )
    } else {
      setLocationError(true)
      // Fallback para Rio de Janeiro
      const weatherData = getRealisticWeather("Rio de Janeiro", "RJ")
      setWeather({
        location: "Rio de Janeiro, RJ",
        ...weatherData,
      })
    }
  }

  // Converter coordenadas em nome da cidade (simulado)
  const getCityFromCoordinates = (lat: number, lon: number) => {
    let city = "Rio de Janeiro"
    let state = "RJ"

    // Coordenadas aproximadas de algumas cidades brasileiras
    if (lat >= -23.0 && lat <= -22.5 && lon >= -43.8 && lon <= -43.1) {
      city = "Rio de Janeiro"
      state = "RJ"
    } else if (lat >= -23.8 && lat <= -23.3 && lon >= -46.9 && lon <= -46.3) {
      city = "São Paulo"
      state = "SP"
    } else if (lat >= -15.9 && lat <= -15.6 && lon >= -48.1 && lon <= -47.8) {
      city = "Brasília"
      state = "DF"
    } else if (lat >= -30.2 && lat <= -29.9 && lon >= -51.3 && lon <= -51.0) {
      city = "Porto Alegre"
      state = "RS"
    } else if (lat >= -12.3 && lat <= -12.0 && lon >= -38.6 && lon <= -38.3) {
      city = "Salvador"
      state = "BA"
    } else if (lat >= -8.2 && lat <= -7.9 && lon >= -35.0 && lon <= -34.7) {
      city = "Recife"
      state = "PE"
    }

    const weatherData = getRealisticWeather(city, state)
    setWeather({
      location: `${city}, ${state}`,
      ...weatherData,
    })
  }

  const handleLocationChange = (city: string, state: string) => {
    const weatherData = getRealisticWeather(city, state)
    setWeather({
      location: `${city}, ${state}`,
      ...weatherData,
    })
    setLocationError(false)
  }

  // Detectar localização ao carregar o componente
  useEffect(() => {
    detectLocation()
  }, [])

  // Atualizar clima a cada 10 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      if (weather.location !== "Detectando...") {
        const [city, state] = weather.location.split(", ")
        const weatherData = getRealisticWeather(city, state)
        setWeather((prev) => ({
          ...prev,
          ...weatherData,
        }))
      }
    }, 600000) // 10 minutos

    return () => clearInterval(interval)
  }, [weather.location])

  const getWeatherIcon = (iconType: string) => {
    switch (iconType) {
      case "sunny":
        return <Sun className="h-5 w-5 text-yellow-500" />
      case "clear-night":
        return <Moon className="h-5 w-5 text-blue-300" />
      case "cloudy":
        return <Cloud className="h-5 w-5 text-gray-500" />
      case "cloudy-night":
        return <Cloud className="h-5 w-5 text-gray-400" />
      case "partly-cloudy":
        return <Cloud className="h-5 w-5 text-gray-400" />
      case "light-rain":
        return <CloudRain className="h-5 w-5 text-blue-400" />
      case "cold-night":
        return <CloudSnow className="h-5 w-5 text-blue-200" />
      default:
        return <Cloud className="h-5 w-5 text-gray-400" />
    }
  }

  const refreshWeather = async () => {
    setLoading(true)
    setTimeout(() => {
      if (weather.location !== "Detectando...") {
        const [city, state] = weather.location.split(", ")
        const weatherData = getRealisticWeather(city, state)
        setWeather((prev) => ({
          ...prev,
          ...weatherData,
        }))
      }
      setLoading(false)
    }, 1000)
  }

  return (
    <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-none shadow-lg">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-blue-600 dark:text-blue-400" />
            <span className="text-xs text-gray-700 dark:text-gray-300 truncate max-w-[120px]">{weather.location}</span>
            {locationError && (
              <AlertCircle className="h-3 w-3 text-orange-500" title="Localização detectada automaticamente" />
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={refreshWeather} disabled={loading}>
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <LocationSettings onLocationChange={handleLocationChange} currentLocation={weather.location} />
          </div>
        </div>

        <div className="flex items-center justify-between mt-1">
          <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{weather.temperature}°C</div>
          {getWeatherIcon(weather.icon)}
        </div>

        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{weather.condition}</div>
      </CardContent>
    </Card>
  )
}
