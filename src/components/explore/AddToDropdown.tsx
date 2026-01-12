'use client'

import { useState, useCallback } from 'react'
import { Plus, Calendar, List, Check, Loader2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { ItineraryDay } from '@/types/plan'

interface AddToDropdownProps {
  // Itinerary days for "Add to Day X" options
  days: ItineraryDay[]
  // Callbacks
  onAddToThingsToDo: () => Promise<void>
  onAddToDay: (dayNumber: number) => Promise<void>
  // State
  isAdded?: boolean
  isLoading?: boolean
  // Styling
  className?: string
  buttonClassName?: string
  variant?: 'default' | 'compact' | 'icon-only'
}

export function AddToDropdown({
  days,
  onAddToThingsToDo,
  onAddToDay,
  isAdded = false,
  isLoading = false,
  className,
  buttonClassName,
  variant = 'default',
}: AddToDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [addingTo, setAddingTo] = useState<string | null>(null)

  const handleAddToThingsToDo = useCallback(async () => {
    setAddingTo('list')
    try {
      await onAddToThingsToDo()
    } finally {
      setAddingTo(null)
      setIsOpen(false)
    }
  }, [onAddToThingsToDo])

  const handleAddToDay = useCallback(async (dayNumber: number) => {
    setAddingTo(`day-${dayNumber}`)
    try {
      await onAddToDay(dayNumber)
    } finally {
      setAddingTo(null)
      setIsOpen(false)
    }
  }, [onAddToDay])

  // If already added, show check icon
  if (isAdded) {
    return (
      <div
        className={cn(
          'flex items-center justify-center',
          'w-9 h-9 rounded-full',
          'bg-emerald-500 text-white',
          'shadow-lg',
          className
        )}
      >
        <Check className="w-4 h-4" strokeWidth={2.5} />
      </div>
    )
  }

  const isButtonLoading = isLoading || addingTo !== null

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex items-center justify-center',
            'transition-all duration-200',
            'shadow-lg backdrop-blur-sm',
            variant === 'icon-only' && 'w-9 h-9 rounded-full bg-white/90 text-slate-700 hover:bg-primary hover:text-white hover:scale-110',
            variant === 'default' && 'gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90',
            variant === 'compact' && 'gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 text-sm',
            isButtonLoading && 'opacity-70 cursor-wait',
            buttonClassName
          )}
          disabled={isButtonLoading}
          aria-label="Agregar"
        >
          {isButtonLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" strokeWidth={2.5} />
          )}
          {variant !== 'icon-only' && (
            <span>{isButtonLoading ? 'Agregando...' : 'Agregar'}</span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        {/* Add to Things To Do */}
        <DropdownMenuItem
          onClick={handleAddToThingsToDo}
          disabled={addingTo !== null}
          className="gap-3 py-2.5"
        >
          {addingTo === 'list' ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          ) : (
            <List className="w-4 h-4 text-primary" />
          )}
          <div className="flex flex-col">
            <span className="font-medium">Agregar a lista general</span>
            <span className="text-xs text-muted-foreground">
              Para decidir despues
            </span>
          </div>
        </DropdownMenuItem>

        {/* Add to specific day */}
        {days.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              Agregar a dia especifico
            </div>
            <div className="max-h-[200px] overflow-y-auto">
              {days.map((day) => (
                <DropdownMenuItem
                  key={day.day}
                  onClick={() => handleAddToDay(day.day)}
                  disabled={addingTo !== null}
                  className="gap-3 py-2"
                >
                  {addingTo === `day-${day.day}` ? (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  ) : (
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                      {day.day}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {day.title || `Dia ${day.day}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {day.timeline.length} {day.timeline.length === 1 ? 'actividad' : 'actividades'}
                    </p>
                  </div>
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                </DropdownMenuItem>
              ))}
            </div>
          </>
        )}

        {/* Empty state if no days */}
        {days.length === 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-3 py-2 text-xs text-muted-foreground text-center">
              Genera tu itinerario para agregar a dias especificos
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
