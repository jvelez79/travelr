"use client"

import { DISCOVERY_CHIPS, type DiscoveryChip } from "@/types/explore"

interface DiscoveryChipsProps {
  selectedChipId: string | null
  onSelectChip: (chip: DiscoveryChip | null) => void
}

export function DiscoveryChips({ selectedChipId, onSelectChip }: DiscoveryChipsProps) {
  const handleChipClick = (chip: DiscoveryChip) => {
    if (selectedChipId === chip.id) {
      // Deselect if already selected
      onSelectChip(null)
    } else {
      onSelectChip(chip)
    }
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">
        ¿Qué te gustaría descubrir?
      </h3>
      <div className="flex flex-wrap gap-2">
        {DISCOVERY_CHIPS.map((chip) => {
          const isSelected = selectedChipId === chip.id
          return (
            <button
              key={chip.id}
              onClick={() => handleChipClick(chip)}
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5
                rounded-full text-sm font-medium
                transition-all duration-200
                ${isSelected
                  ? "bg-primary text-primary-foreground shadow-md scale-105"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }
              `}
            >
              <span>{chip.emoji}</span>
              <span>{chip.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
