"use client"

import { List, Map, Building2 } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export type ViewMode = "timeline" | "map" | "reservations"

interface ViewModeToggleProps {
  value: ViewMode
  onChange: (value: ViewMode) => void
}

export function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as ViewMode)}>
      <TabsList>
        <TabsTrigger value="timeline" className="gap-1.5">
          <List className="size-4" />
          <span className="hidden sm:inline">Timeline</span>
        </TabsTrigger>
        <TabsTrigger value="map" className="gap-1.5">
          <Map className="size-4" />
          <span className="hidden sm:inline">Mapa</span>
        </TabsTrigger>
        <TabsTrigger value="reservations" className="gap-1.5">
          <Building2 className="size-4" />
          <span className="hidden sm:inline">Reservaciones</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
