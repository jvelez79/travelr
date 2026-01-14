"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/Logo"
import { useCanvasContext } from "./CanvasContext"
import { useResponsiveLayout } from "./hooks/useResponsiveLayout"
import { HelpCircle, MoreVertical, RefreshCw, X, Menu, LogOut, User, Sparkles, Compass, Search } from "lucide-react"
import Link from "next/link"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ExportPDFButton } from "@/components/export/ExportPDFButton"
import { useAuth } from "@/contexts/AuthContext"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import type { GeneratedPlan } from "@/types/plan"
import { parseLocalDate } from "@/lib/date-utils"

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
  const { user, signOut, isAdmin } = useAuth()
  const [isRegenerating, setIsRegenerating] = useState(false)

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.email) return "?"
    return user.email.charAt(0).toUpperCase()
  }

  // Admin: Regenerate trip without going through questions
  const handleRegenerate = async () => {
    if (!confirm('¿Regenerar todo el itinerario? Esto reemplazará todos los días actuales.')) {
      return
    }

    setIsRegenerating(true)
    try {
      const response = await fetch('/api/admin/regenerate-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId: trip.id, regenerateAll: true }),
      })

      const data = await response.json()

      if (response.ok) {
        alert(`Regeneración iniciada. Días: ${data.daysToRegenerate.join(', ')}`)
        // The page will update via Realtime subscription
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error regenerating:', error)
      alert('Error al regenerar el viaje')
    } finally {
      setIsRegenerating(false)
    }
  }

  const formatDateRange = () => {
    if (!trip.startDate || !trip.endDate) return "Fechas por definir"
    const start = parseLocalDate(trip.startDate).toLocaleDateString("es", { day: "numeric", month: "short" })
    const end = parseLocalDate(trip.endDate).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" })
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
          {/* Search button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2" asChild>
                <Link href={`/trips/${trip.id}/search`}>
                  <Search className="h-4 w-4" />
                  <span className="hidden sm:inline">Search</span>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Search places</TooltipContent>
          </Tooltip>

          {/* Explore button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2" asChild>
                <Link href={`/trips/${trip.id}/explore`}>
                  <Compass className="h-4 w-4" />
                  <span className="hidden sm:inline">Explore</span>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Discover things to do</TooltipContent>
          </Tooltip>

          {/* Theme toggle - Desktop only */}
          {isDesktop && <ThemeToggle />}

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
              {/* Admin-only: Regenerate with AI */}
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                    className="text-orange-600 focus:text-orange-600"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    {isRegenerating ? 'Regenerando...' : 'Regenerar con AI'}
                  </DropdownMenuItem>
                </>
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

          {/* User menu */}
          {user && (
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <button className="ml-2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full">
                      <Avatar size="sm">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Mi cuenta</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium truncate">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </TooltipProvider>
    </header>
  )
}
