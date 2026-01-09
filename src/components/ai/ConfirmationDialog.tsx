/**
 * ConfirmationDialog Component
 *
 * Inline confirmation dialog shown within chat messages
 * when the AI requests confirmation for destructive actions
 */

"use client"

import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface ConfirmationDialogProps {
  message: string
  onConfirm: () => void
  onCancel: () => void
  disabled?: boolean
}

export function ConfirmationDialog({
  message,
  onConfirm,
  onCancel,
  disabled = false,
}: ConfirmationDialogProps) {
  return (
    <div className="border border-warning/30 bg-warning/5 rounded-lg p-4 my-2">
      <div className="flex gap-3">
        <div className="shrink-0">
          <AlertTriangle className="w-5 h-5 text-warning" />
        </div>
        <div className="flex-1 space-y-3">
          <p className="text-sm text-foreground leading-relaxed">
            {message}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={onConfirm}
              disabled={disabled}
            >
              Confirmar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onCancel}
              disabled={disabled}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
