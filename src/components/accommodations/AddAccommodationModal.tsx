"use client"

import { useState, useCallback } from "react"
import { X, Search, Upload, Mail, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ReceiptUploader } from "./ReceiptUploader"
import { ExtractedDataConfirmation } from "./ExtractedDataConfirmation"
import { EmailForwardInstructions } from "./EmailForwardInstructions"
import type { ExtractedAccommodationData, AccommodationReservation } from "@/types/accommodation"
import { createReservationFromExtracted } from "@/types/accommodation"

type ModalStep = "select" | "upload" | "confirm" | "email"

interface AddAccommodationModalProps {
  tripId: string
  open: boolean
  onClose: () => void
  onAddReservation: (reservation: AccommodationReservation) => void
  onOpenHotelSearch?: () => void
}

export function AddAccommodationModal({
  tripId,
  open,
  onClose,
  onAddReservation,
  onOpenHotelSearch,
}: AddAccommodationModalProps) {
  const [step, setStep] = useState<ModalStep>("select")
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)
  const [extractedData, setExtractedData] = useState<ExtractedAccommodationData | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetState = useCallback(() => {
    setStep("select")
    setIsProcessing(false)
    setExtractError(null)
    setExtractedData(null)
    setIsSubmitting(false)
  }, [])

  const handleClose = useCallback(() => {
    resetState()
    onClose()
  }, [onClose, resetState])

  const handleFileSelect = useCallback(async (file: File) => {
    setIsProcessing(true)
    setExtractError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("tripId", tripId)

      const response = await fetch("/api/accommodations/extract", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to extract data")
      }

      setExtractedData(result.data)
      setStep("confirm")
    } catch (error) {
      console.error("Extract error:", error)
      setExtractError(error instanceof Error ? error.message : "Error al procesar el archivo")
    } finally {
      setIsProcessing(false)
    }
  }, [tripId])

  const handleConfirmData = useCallback(async (data: ExtractedAccommodationData) => {
    setIsSubmitting(true)

    try {
      const reservation = createReservationFromExtracted(tripId, data, "receipt_upload")
      onAddReservation(reservation)
      handleClose()
    } catch (error) {
      console.error("Error creating reservation:", error)
      setExtractError("Error al crear la reservación")
    } finally {
      setIsSubmitting(false)
    }
  }, [tripId, onAddReservation, handleClose])

  const handleHotelSearch = useCallback(() => {
    handleClose()
    onOpenHotelSearch?.()
  }, [handleClose, onOpenHotelSearch])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-2">
            {step !== "select" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (step === "confirm") {
                    setStep("upload")
                    setExtractedData(null)
                  } else {
                    setStep("select")
                  }
                }}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <CardTitle>
              {step === "select" && "Agregar Alojamiento"}
              {step === "upload" && "Subir Confirmación"}
              {step === "confirm" && "Confirmar Datos"}
              {step === "email" && "Forward de Email"}
            </CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent>
          {/* Step: Select Method */}
          {step === "select" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">
                Elige cómo quieres agregar tu alojamiento:
              </p>

              <Button
                variant="outline"
                className="w-full justify-start h-auto py-3"
                onClick={handleHotelSearch}
              >
                <Search className="h-5 w-5 mr-3 shrink-0" />
                <div className="text-left">
                  <p className="font-medium">Buscar hoteles</p>
                  <p className="text-xs text-muted-foreground">
                    Encuentra y compara precios en tiempo real
                  </p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start h-auto py-3"
                onClick={() => setStep("upload")}
              >
                <Upload className="h-5 w-5 mr-3 shrink-0" />
                <div className="text-left">
                  <p className="font-medium">Subir recibo/PDF</p>
                  <p className="text-xs text-muted-foreground">
                    Sube tu confirmación y extraemos la info con AI
                  </p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start h-auto py-3"
                onClick={() => setStep("email")}
              >
                <Mail className="h-5 w-5 mr-3 shrink-0" />
                <div className="text-left">
                  <p className="font-medium">Forward de email</p>
                  <p className="text-xs text-muted-foreground">
                    Reenvía tu confirmación a nuestra dirección
                  </p>
                </div>
              </Button>
            </div>
          )}

          {/* Step: Upload Receipt */}
          {step === "upload" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Sube tu confirmación de reserva (PDF o imagen) y extraeremos
                automáticamente toda la información.
              </p>

              <ReceiptUploader
                onFileSelect={handleFileSelect}
                isProcessing={isProcessing}
                error={extractError}
              />

              <p className="text-xs text-muted-foreground text-center">
                Funciona con confirmaciones de Booking.com, Expedia, Airbnb,
                Hotels.com y más
              </p>
            </div>
          )}

          {/* Step: Confirm Extracted Data */}
          {step === "confirm" && extractedData && (
            <ExtractedDataConfirmation
              data={extractedData}
              onConfirm={handleConfirmData}
              onCancel={() => {
                setStep("upload")
                setExtractedData(null)
              }}
              isSubmitting={isSubmitting}
            />
          )}

          {/* Step: Email Forward Instructions */}
          {step === "email" && (
            <EmailForwardInstructions tripId={tripId} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
