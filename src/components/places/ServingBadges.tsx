"use client"

import type { ServingOptions } from "@/types/explore"

interface ServingBadgesProps {
  servingOptions?: ServingOptions
  compact?: boolean
}

const SERVING_ITEMS = [
  { key: 'servesVegetarianFood', label: 'Vegetariano', icon: '🥬' },
  { key: 'servesCoffee', label: 'Café', icon: '☕' },
  { key: 'servesBeer', label: 'Cerveza', icon: '🍺' },
  { key: 'servesWine', label: 'Vino', icon: '🍷' },
  { key: 'servesCocktails', label: 'Cócteles', icon: '🍹' },
  { key: 'servesDessert', label: 'Postres', icon: '🍰' },
] as const

export function ServingBadges({ servingOptions, compact = false }: ServingBadgesProps) {
  if (!servingOptions) return null

  const availableItems = SERVING_ITEMS.filter(
    item => servingOptions[item.key as keyof ServingOptions] === true
  )

  if (availableItems.length === 0) return null

  if (compact) {
    // Show only icons in compact mode
    return (
      <div className="flex items-center gap-1">
        {availableItems.slice(0, 4).map(item => (
          <span key={item.key} title={item.label} className="text-sm">
            {item.icon}
          </span>
        ))}
        {availableItems.length > 4 && (
          <span className="text-xs text-muted-foreground">+{availableItems.length - 4}</span>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Menú
      </h5>
      <div className="flex flex-wrap gap-1.5">
        {availableItems.map(item => (
          <span
            key={item.key}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 text-xs rounded-md"
          >
            {item.icon} {item.label}
          </span>
        ))}
      </div>
    </div>
  )
}
