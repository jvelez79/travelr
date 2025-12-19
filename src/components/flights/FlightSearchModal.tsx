"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { X, Search, ExternalLink, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { openSkyscannerSearch, validateFlightSearchParams } from "@/lib/flights"
import type { FlightSearchParams } from "@/lib/flights/types"

interface FlightSearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  destination: string
  startDate: string
  endDate: string
  travelers: number
}

export function FlightSearchModal({
  open,
  onOpenChange,
  destination,
  startDate,
  endDate,
  travelers,
}: FlightSearchModalProps) {
  // Form state
  const [origin, setOrigin] = useState("")
  const [dest, setDest] = useState("")
  const [outboundDate, setOutboundDate] = useState(startDate)
  const [inboundDate, setInboundDate] = useState(endDate)
  const [adults, setAdults] = useState(travelers)
  const [children, setChildren] = useState(0)
  const [cabinClass, setCabinClass] = useState<'economy' | 'premium_economy' | 'business' | 'first'>('economy')
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setOrigin("")
      setDest("")
      setOutboundDate(startDate)
      setInboundDate(endDate)
      setAdults(travelers)
      setChildren(0)
      setCabinClass('economy')
      setValidationErrors([])
    }
  }, [open, startDate, endDate, travelers])

  const handleSearch = () => {
    // Build params
    const params: FlightSearchParams = {
      origin: origin.trim().toUpperCase(),
      destination: dest.trim().toUpperCase(),
      outboundDate,
      inboundDate,
      adults,
      children,
      cabinClass,
    }

    // Validate
    const validation = validateFlightSearchParams(params)
    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      return
    }

    // Clear errors
    setValidationErrors([])

    // Open Skyscanner in new tab
    openSkyscannerSearch(params)

    // Close modal
    onOpenChange(false)
  }

  // Format IATA code input (uppercase, max 3 chars)
  const handleIATAInput = (value: string, setter: (val: string) => void) => {
    const formatted = value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3)
    setter(formatted)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "p-0 gap-0 overflow-hidden flex flex-col",
          // Mobile: full screen
          "w-screen h-auto max-w-none rounded-none",
          // Desktop: standard modal
          "md:w-[550px] md:max-w-[550px] md:rounded-lg"
        )}
        showCloseButton={false}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background md:px-6 md:py-4">
          <DialogTitle className="text-lg font-semibold">Buscar vuelos</DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
            <span className="sr-only">Cerrar</span>
          </Button>
        </div>

        {/* Info Banner */}
        <div className="px-4 py-3 bg-muted/30 border-b border-border md:px-6">
          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription className="text-sm">
              Te llevaremos a Skyscanner para comparar precios. Regresa aquí para agregar los detalles del vuelo.
            </AlertDescription>
          </Alert>
        </div>

        {/* Form */}
        <div className="px-4 py-4 space-y-4 overflow-y-auto max-h-[70vh] md:px-6 md:py-5">
          {/* Airport Codes */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="origin" className="text-sm font-medium">
                Origen (código IATA)
              </Label>
              <Input
                id="origin"
                placeholder="SJU"
                value={origin}
                onChange={(e) => handleIATAInput(e.target.value, setOrigin)}
                maxLength={3}
                className="uppercase font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Ej: SJU (San Juan)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination" className="text-sm font-medium">
                Destino (código IATA)
              </Label>
              <Input
                id="destination"
                placeholder="SJO"
                value={dest}
                onChange={(e) => handleIATAInput(e.target.value, setDest)}
                maxLength={3}
                className="uppercase font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Ej: SJO (San José)
              </p>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="outbound" className="text-sm font-medium">
                Fecha de salida
              </Label>
              <Input
                id="outbound"
                type="date"
                value={outboundDate}
                onChange={(e) => setOutboundDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inbound" className="text-sm font-medium">
                Fecha de regreso
              </Label>
              <Input
                id="inbound"
                type="date"
                value={inboundDate}
                onChange={(e) => setInboundDate(e.target.value)}
              />
            </div>
          </div>

          {/* Passengers */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="adults" className="text-sm font-medium">
                Adultos
              </Label>
              <Input
                id="adults"
                type="number"
                min="1"
                max="9"
                value={adults}
                onChange={(e) => setAdults(parseInt(e.target.value) || 1)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="children" className="text-sm font-medium">
                Niños
              </Label>
              <Input
                id="children"
                type="number"
                min="0"
                max="9"
                value={children}
                onChange={(e) => setChildren(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Cabin Class */}
          <div className="space-y-2">
            <Label htmlFor="cabinClass" className="text-sm font-medium">
              Clase
            </Label>
            <Select
              value={cabinClass}
              onValueChange={(value) => setCabinClass(value as typeof cabinClass)}
            >
              <SelectTrigger id="cabinClass">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="economy">Económica</SelectItem>
                <SelectItem value="premium_economy">Económica Premium</SelectItem>
                <SelectItem value="business">Ejecutiva</SelectItem>
                <SelectItem value="first">Primera Clase</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, idx) => (
                    <li key={idx} className="text-sm">{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border bg-muted/30 md:px-6 md:py-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSearch}
            className="gap-2"
          >
            <Search className="w-4 h-4" />
            Buscar en Skyscanner
            <ExternalLink className="w-3 h-3" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
