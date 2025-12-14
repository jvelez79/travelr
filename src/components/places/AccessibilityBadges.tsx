"use client"

import type { AccessibilityOptions } from "@/types/explore"

interface AccessibilityBadgesProps {
  accessibility?: AccessibilityOptions
  compact?: boolean
}

const ACCESSIBILITY_ITEMS = [
  { key: 'wheelchairAccessibleEntrance', label: 'Entrada accesible', icon: '♿' },
  { key: 'wheelchairAccessibleParking', label: 'Estacionamiento accesible', icon: '🅿️' },
  { key: 'wheelchairAccessibleRestroom', label: 'Baño accesible', icon: '🚻' },
  { key: 'wheelchairAccessibleSeating', label: 'Asientos accesibles', icon: '🪑' },
] as const

export function AccessibilityBadges({ accessibility, compact = false }: AccessibilityBadgesProps) {
  if (!accessibility) return null

  const availableItems = ACCESSIBILITY_ITEMS.filter(
    item => accessibility[item.key as keyof AccessibilityOptions] === true
  )

  if (availableItems.length === 0) return null

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs">♿</span>
        <span className="text-xs text-muted-foreground">Accesible</span>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Accesibilidad
      </h5>
      <div className="flex flex-wrap gap-1.5">
        {availableItems.map(item => (
          <span
            key={item.key}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-xs rounded-md"
            title={item.label}
          >
            {item.icon} {item.label}
          </span>
        ))}
      </div>
    </div>
  )
}
