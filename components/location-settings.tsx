"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Settings, MapPin } from "lucide-react"

type LocationSettingsProps = {
  onLocationChange: (city: string, state: string) => void
  currentLocation: string
}

export function LocationSettings({ onLocationChange, currentLocation }: LocationSettingsProps) {
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  const handleSave = () => {
    if (city && state) {
      onLocationChange(city, state)
      setIsOpen(false)
      setCity("")
      setState("")
    }
  }

  const popularCities = [
    { city: "Rio de Janeiro", state: "RJ" },
    { city: "São Paulo", state: "SP" },
    { city: "Brasília", state: "DF" },
    { city: "Salvador", state: "BA" },
    { city: "Fortaleza", state: "CE" },
    { city: "Belo Horizonte", state: "MG" },
    { city: "Manaus", state: "AM" },
    { city: "Curitiba", state: "PR" },
    { city: "Recife", state: "PE" },
    { city: "Porto Alegre", state: "RS" },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-70 hover:opacity-100"
          title="Configurar localização"
        >
          <Settings className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Configurar Localização
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Localização atual: <span className="font-medium">{currentLocation}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                placeholder="Ex: Rio de Janeiro"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                placeholder="Ex: RJ"
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase())}
                maxLength={2}
              />
            </div>
          </div>

          <div>
            <Label>Cidades populares:</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {popularCities.map((location) => (
                <Button
                  key={`${location.city}-${location.state}`}
                  variant="outline"
                  size="sm"
                  className="justify-start text-xs"
                  onClick={() => {
                    setCity(location.city)
                    setState(location.state)
                  }}
                >
                  {location.city}, {location.state}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} disabled={!city || !state} className="flex-1">
              Salvar Localização
            </Button>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
