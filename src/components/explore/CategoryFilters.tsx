"use client"

import { cn } from "@/lib/utils"
import { Landmark, UtensilsCrossed, Map, Activity } from "lucide-react"

interface CategoryConfig<T extends string = string> {
  id: T
  label: string
  googleTypes: string[]
}

interface CategoryFiltersProps<T extends string = string> {
  categories: CategoryConfig<T>[]
  selectedCategory: T
  onSelectCategory: (category: T) => void
}

// Icon mapping
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  attractions: <Landmark className="h-4 w-4" />,
  food_drink: <UtensilsCrossed className="h-4 w-4" />,
  tours: <Map className="h-4 w-4" />,
  activities: <Activity className="h-4 w-4" />,
}

export function CategoryFilters<T extends string = string>({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryFiltersProps<T>) {
  return (
    <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
      {categories.map((category) => {
        const isSelected = selectedCategory === category.id
        return (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
              isSelected
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80 text-foreground"
            )}
          >
            {CATEGORY_ICONS[category.id]}
            {category.label}
          </button>
        )
      })}
    </div>
  )
}
