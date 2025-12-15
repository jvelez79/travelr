"use client"

import { Button } from "@/components/ui/button"
import { Logo } from "@/components/Logo"
import { useCanvasContext } from "./CanvasContext"
import { useResponsiveLayout } from "./hooks/useResponsiveLayout"
import { HelpCircle, MoreVertical, RefreshCw, X, Menu } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ExportPDFButton } from "@/components/export/ExportPDFButton"
import type { GeneratedPlan } from "@/types/plan"

interface Trip {
  id: string
  destination: string
  origin: string
  startDate: string
  endDate: string
  travelers: number
}

interface CanvasHeaderProps {
  trip: Trip
  plan?: GeneratedPlan
  onStartOver: () => void
}

export function CanvasHeader({ trip, plan, onStartOver }: CanvasHeaderProps) {
  const { isSidebarOpen, setSidebarOpen } = useCanvasContext()
  const { isMobile, isTablet, isDesktop } = useResponsiveLayout()

  const formatDateRange = () => {
    if (!trip.startDate || !trip.endDate) return "Fechas por definir"
    const start = new Date(trip.startDate).toLocaleDateString("es", { day: "numeric", month: "short" })
    const end = new Date(trip.endDate).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" })
    return `${start} - ${end}`
  }

  return (
    <header className="h-14 border-b border-border bg-background flex items-center justify-between px-4 shrink-0">
      {/* Left side - Branding */}
      <div className="flex items-center gap-3">
        {(isMobile || isTablet) && (
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <Logo href="/" size="sm" showText={isDesktop} />
      </div>

      {/* Center - Trip info */}
      <div className="text-center flex-1 max-w-sm">
        <h1 className="font-semibold text-foreground text-sm sm:text-base truncate">
          {trip.destination}
        </h1>
        <p className="text-xs text-muted-foreground hidden sm:block">
          {formatDateRange()}
        </p>
      </div>

      {/* Right side - Actions */}
      <TooltipProvider delayDuration={300}>
        <div className="flex items-center gap-1">
          {/* Help button - Desktop only */}
          {isDesktop && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ayuda</TooltipContent>
            </Tooltip>
          )}

          {/* More options dropdown */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Opciones</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onStartOver}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reiniciar planificacion
              </DropdownMenuItem>
              {plan && (
                <ExportPDFButton plan={plan} variant="dropdown-item" />
              )}
              {!isDesktop && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Ayuda
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Close/Exit button - Desktop only */}
          {isDesktop && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
                  <a href="/">
                    <X className="h-4 w-4" />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Volver a mis viajes</TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>
    </header>
  )
}
