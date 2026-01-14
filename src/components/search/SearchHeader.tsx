/**
 * SearchHeader Component
 *
 * Search bar + category filter chips + back button.
 */

"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { SEARCH_CATEGORY_CHIPS } from "@/types/search"
import type { PlaceCategory } from "@/types/explore"

interface SearchHeaderProps {
  tripId: string
  destination: string
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedCategory: PlaceCategory
  onCategoryChange: (category: PlaceCategory) => void
}

export function SearchHeader({
  tripId,
  destination,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
}: SearchHeaderProps) {
  const router = useRouter()

  const handleCategoryClick = (categoryId: PlaceCategory) => {
    // Select the clicked category (no toggle - always have one selected)
    onCategoryChange(categoryId)
  }

  return (
    <header className="h-auto border-b border-border bg-background sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 py-3 space-y-3">
        {/* Top row: Back button + Search bar */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 shrink-0"
            onClick={() => router.push(`/trips/${tripId}/planning`)}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Volver</span>
          </Button>

          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={`Buscar lugares en ${destination}...`}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Bottom row: Category chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {SEARCH_CATEGORY_CHIPS.map((chip) => (
            <button
              key={chip.id}
              onClick={() => handleCategoryClick(chip.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                "border hover:shadow-sm",
                selectedCategory === chip.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border hover:bg-muted"
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
