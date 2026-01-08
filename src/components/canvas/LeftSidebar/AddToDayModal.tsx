"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin } from "lucide-react"
import type { GeneratedPlan } from "@/types/plan"

interface AddToDayModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectDay: (dayNumber: number) => void
  plan: GeneratedPlan
  itemName: string
}

export function AddToDayModal({
  isOpen,
  onClose,
  onSelectDay,
  plan,
  itemName,
}: AddToDayModalProps) {
  const days = plan.itinerary || []

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Add to Itinerary
          </DialogTitle>
          <DialogDescription>
            Choose which day to add "{itemName}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 mt-4 max-h-[300px] overflow-y-auto">
          {days.map((day) => (
            <button
              key={day.day}
              onClick={() => onSelectDay(day.day)}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors text-left"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold">
                {day.day}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{day.title || `Day ${day.day}`}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{plan.trip.destination}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {day.timeline.length} {day.timeline.length === 1 ? 'activity' : 'activities'}
                </p>
              </div>
            </button>
          ))}
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
