"use client"

import { Users, Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface GuestSelectorProps {
  adults: number
  children?: number
  onGuestsChange: (adults: number, children?: number) => void
  className?: string
}

export function GuestSelector({
  adults,
  children = 0,
  onGuestsChange,
  className,
}: GuestSelectorProps) {
  const handleAdultsChange = (delta: number) => {
    const newAdults = Math.max(1, Math.min(30, adults + delta))
    onGuestsChange(newAdults, children)
  }

  const handleChildrenChange = (delta: number) => {
    const newChildren = Math.max(0, children + delta)
    onGuestsChange(adults, newChildren)
  }

  const guestText = () => {
    const parts = []
    parts.push(`${adults} ${adults === 1 ? "adulto" : "adultos"}`)
    if (children > 0) {
      parts.push(`${children} ${children === 1 ? "niño" : "niños"}`)
    }
    return parts.join(", ")
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal",
            className
          )}
        >
          <Users className="mr-2 h-4 w-4" />
          <span>{guestText()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          {/* Adults */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Adultos</p>
              <p className="text-sm text-muted-foreground">13+ años</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleAdultsChange(-1)}
                disabled={adults <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-medium">{adults}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleAdultsChange(1)}
                disabled={adults >= 30}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Children */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Niños</p>
              <p className="text-sm text-muted-foreground">0-12 años</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleChildrenChange(-1)}
                disabled={children <= 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-medium">{children}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleChildrenChange(1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
