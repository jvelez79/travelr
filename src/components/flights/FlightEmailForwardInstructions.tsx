"use client"

import { useState } from "react"
import { Copy, Check, Clock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface FlightEmailForwardInstructionsProps {
  tripId: string
  inboundDomain?: string
}

export function FlightEmailForwardInstructions({
  tripId,
  inboundDomain = "inbound.travelr.app",
}: FlightEmailForwardInstructionsProps) {
  const [copied, setCopied] = useState(false)

  // Use full tripId to ensure proper matching in webhook
  const emailAddress = `trip-${tripId}@${inboundDomain}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(emailAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Email Address */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Tu dirección personal para este viaje:
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1 p-3 bg-muted rounded-lg font-mono text-sm break-all">
            {emailAddress}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopy}
            className="shrink-0"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <div className="space-y-4">
        <p className="text-sm font-medium">Cómo funciona:</p>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium shrink-0">
              1
            </div>
            <div className="flex-1">
              <p className="text-sm">
                Busca el email de confirmación de tu vuelo (de la aerolínea o agencia de viajes)
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium shrink-0">
              2
            </div>
            <div className="flex-1">
              <p className="text-sm">
                Haz clic en "Reenviar" (Forward) y envíalo a la dirección de arriba
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium shrink-0">
              3
            </div>
            <div className="flex-1">
              <p className="text-sm">
                En segundos extraemos la información y aparece en tu lista de vuelos
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Supported Airlines */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Compatible con todas las aerolíneas:</p>
        <div className="flex flex-wrap gap-2">
          {["American", "Delta", "United", "COPA", "Avianca", "Southwest", "JetBlue", "Spirit"].map((airline) => (
            <span
              key={airline}
              className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full"
            >
              {airline}
            </span>
          ))}
        </div>
      </div>

      {/* Processing Time Note */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-800">
              El procesamiento toma unos segundos. Si no aparece en 1 minuto, intenta
              subiendo el PDF/imagen directamente.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Beta Notice */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
            <div className="text-xs text-yellow-800">
              <p className="font-medium">Función en Beta</p>
              <p className="mt-1">
                Esta función requiere configuración adicional del servidor.
                Por ahora, usa la opción de subir recibo/PDF que funciona inmediatamente.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
