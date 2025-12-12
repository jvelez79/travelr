"use client"

import { Plane, Building2, Car, UtensilsCrossed, Paperclip, MoreHorizontal } from "lucide-react"

interface ReservationCounts {
  flights: number
  lodging: number
  rentalCars: number
  restaurants: number
  attachments: number
  other: number
}

interface ReservationsHeaderProps {
  counts: ReservationCounts
  totalBudget: number
  currency: string
  onIconClick?: (section: string) => void
}

export function ReservationsHeader({ counts, totalBudget, currency, onIconClick }: ReservationsHeaderProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const items = [
    { key: "flights", icon: Plane, count: counts.flights, label: "Vuelos" },
    { key: "lodging", icon: Building2, count: counts.lodging, label: "Hospedaje" },
    { key: "rentalCars", icon: Car, count: counts.rentalCars, label: "Auto" },
    { key: "restaurants", icon: UtensilsCrossed, count: counts.restaurants, label: "Restaurante" },
    { key: "attachments", icon: Paperclip, count: counts.attachments, label: "Adjuntos" },
    { key: "other", icon: MoreHorizontal, count: counts.other, label: "Otros" },
  ]

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {items.map((item) => (
            <button
              key={item.key}
              onClick={() => onIconClick?.(item.key)}
              className="relative flex flex-col items-center gap-1 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors"
              title={item.label}
            >
              <div className="relative">
                <item.icon className="w-5 h-5 text-muted-foreground" />
                {item.count > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 bg-primary text-primary-foreground text-[10px] font-medium rounded-full flex items-center justify-center">
                    {item.count}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground hidden sm:block">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 pl-4 border-l border-border">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Presupuesto</p>
            <p className="text-lg font-semibold text-primary">{formatCurrency(totalBudget)}</p>
          </div>
          <button
            onClick={() => onIconClick?.("budget")}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Ver detalles
          </button>
        </div>
      </div>
    </div>
  )
}
