"use client"

import { useState } from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DateRangePickerProps {
  checkIn: string // YYYY-MM-DD format
  checkOut: string // YYYY-MM-DD format
  onDatesChange: (checkIn: string, checkOut: string) => void
  className?: string
}

export function DateRangePicker({
  checkIn,
  checkOut,
  onDatesChange,
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectingCheckOut, setSelectingCheckOut] = useState(false)

  // Parse dates with validation
  const parseDate = (dateStr: string): Date => {
    if (!dateStr) return new Date()
    const date = new Date(dateStr)
    return isNaN(date.getTime()) ? new Date() : date
  }

  const checkInDate = parseDate(checkIn)
  const checkOutDate = parseDate(checkOut)

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return

    const dateStr = format(date, "yyyy-MM-dd")

    if (!selectingCheckOut) {
      // Selecting check-in date
      onDatesChange(dateStr, checkOut)
      setSelectingCheckOut(true)
    } else {
      // Selecting check-out date
      if (date > checkInDate) {
        onDatesChange(checkIn, dateStr)
        setIsOpen(false)
        setSelectingCheckOut(false)
      }
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Seleccionar"
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return "Seleccionar"
    return format(date, "dd MMM", { locale: es })
  }

  const nights = Math.ceil(
    (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span>
            {formatDate(checkIn)} - {formatDate(checkOut)}
          </span>
          <span className="ml-2 text-muted-foreground">
            • {nights} {nights === 1 ? "noche" : "noches"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 border-b">
          <p className="text-sm font-medium">
            {selectingCheckOut ? "Selecciona fecha de salida" : "Selecciona fecha de entrada"}
          </p>
        </div>
        <Calendar
          mode="single"
          selected={selectingCheckOut ? checkOutDate : checkInDate}
          onSelect={handleDateSelect}
          disabled={(date) => {
            if (selectingCheckOut) {
              return date <= checkInDate
            }
            return date < new Date(new Date().setHours(0, 0, 0, 0))
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
