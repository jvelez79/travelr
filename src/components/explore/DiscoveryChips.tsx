"use client"

import { DISCOVERY_CHIPS, type DiscoveryChip } from "@/types/explore"
import { cn } from "@/lib/utils"

interface DiscoveryChipsProps {
  selectedChipId: string | null
  onSelectChip: (chip: DiscoveryChip | null) => void
  compact?: boolean
}

export function DiscoveryChips({ selectedChipId, onSelectChip, compact = false }: DiscoveryChipsProps) {
  const handleChipClick = (chip: DiscoveryChip) => {
    if (selectedChipId === chip.id) {
      onSelectChip(null)
    } else {
      onSelectChip(chip)
    }
  }

  return (
    <div className={cn("flex flex-wrap gap-2", compact && "gap-1.5")}>
      {DISCOVERY_CHIPS.map((chip) => {
        const isSelected = selectedChipId === chip.id
        return (
          <button
            key={chip.id}
            onClick={() => handleChipClick(chip)}
            className={cn(
              "inline-flex items-center gap-1.5",
              "rounded-full text-sm font-medium",
              "transition-all duration-200",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              compact ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5",
              isSelected
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <span className={cn(compact ? "text-sm" : "text-base")}>{chip.emoji}</span>
            <span>{chip.label}</span>
          </button>
        )
      })}
    </div>
  )
}
