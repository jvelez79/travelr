"use client"

import { useState, useCallback, useRef } from "react"
import { Upload, FileText, X, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ReceiptUploaderProps {
  onFileSelect: (file: File) => void
  isProcessing?: boolean
  error?: string | null
  acceptedTypes?: string[]
  maxSizeMB?: number
}

export function ReceiptUploader({
  onFileSelect,
  isProcessing = false,
  error = null,
  acceptedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"],
  maxSizeMB = 10,
}: ReceiptUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const maxSizeBytes = maxSizeMB * 1024 * 1024

  const validateFile = useCallback((file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `Tipo de archivo no soportado. Usa PDF, JPG, PNG o WebP.`
    }
    if (file.size > maxSizeBytes) {
      return `El archivo es muy grande. Máximo ${maxSizeMB}MB.`
    }
    return null
  }, [acceptedTypes, maxSizeBytes, maxSizeMB])

  const handleFile = useCallback((file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setLocalError(validationError)
      return
    }
    setLocalError(null)
    setSelectedFile(file)
    onFileSelect(file)
  }, [validateFile, onFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }, [handleFile])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }, [handleFile])

  const handleClearFile = useCallback(() => {
    setSelectedFile(null)
    setLocalError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  const displayError = error || localError

  const getFileIcon = (file: File) => {
    if (file.type === "application/pdf") {
      return <FileText className="h-8 w-8 text-red-500" />
    }
    return <FileText className="h-8 w-8 text-blue-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 transition-all cursor-pointer",
          "flex flex-col items-center justify-center text-center",
          isDragging && "border-primary bg-primary/5",
          !isDragging && !displayError && "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
          displayError && "border-destructive/50 bg-destructive/5",
          isProcessing && "pointer-events-none opacity-60"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(",")}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isProcessing}
        />

        {isProcessing ? (
          <>
            <Loader2 className="h-10 w-10 text-primary animate-spin mb-3" />
            <p className="text-sm font-medium">Procesando archivo...</p>
            <p className="text-xs text-muted-foreground mt-1">
              Extrayendo información con AI
            </p>
          </>
        ) : selectedFile ? (
          <>
            {getFileIcon(selectedFile)}
            <p className="text-sm font-medium mt-2 truncate max-w-full px-4">
              {selectedFile.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(selectedFile.size)}
            </p>
          </>
        ) : (
          <>
            <Upload className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">
              Arrastra tu archivo aquí
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              o haz clic para seleccionar
            </p>
            <p className="text-xs text-muted-foreground mt-3">
              PDF, JPG, PNG, WebP - Máx {maxSizeMB}MB
            </p>
          </>
        )}
      </div>

      {/* Error Message */}
      {displayError && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{displayError}</span>
        </div>
      )}

      {/* Selected File Actions */}
      {selectedFile && !isProcessing && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleClearFile()
            }}
          >
            <X className="h-4 w-4 mr-1" />
            Cambiar archivo
          </Button>
        </div>
      )}
    </div>
  )
}
