"use client"

/**
 * Export PDF Button Component
 * Handles PDF generation with loading state and download
 */

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import type { GeneratedPlan } from '@/types/plan'

interface ExportPDFButtonProps {
  plan: GeneratedPlan
  variant?: 'button' | 'dropdown-item'
  className?: string
}

export function ExportPDFButton({
  plan,
  variant = 'button',
  className,
}: ExportPDFButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error generating PDF')
      }

      // Get the blob from response
      const blob = await response.blob()

      // Get filename from Content-Disposition header or generate one
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = 'itinerary.pdf'
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      // Create download link and trigger download
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF export error:', err)
      setError(err instanceof Error ? err.message : 'Error generating PDF')
    } finally {
      setIsGenerating(false)
    }
  }

  // Dropdown menu item variant
  if (variant === 'dropdown-item') {
    return (
      <DropdownMenuItem
        onClick={handleExport}
        disabled={isGenerating}
        className={className}
      >
        {isGenerating ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        {isGenerating ? 'Generando PDF...' : 'Exportar itinerario'}
      </DropdownMenuItem>
    )
  }

  // Button variant
  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        onClick={handleExport}
        disabled={isGenerating}
        variant="outline"
        size="sm"
        className={className}
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generando PDF...
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            Exportar PDF
          </>
        )}
      </Button>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}
