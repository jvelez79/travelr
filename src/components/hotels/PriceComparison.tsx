"use client"

import { ExternalLink, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { BookingLink } from "@/lib/hotels/types"

interface PriceComparisonProps {
  bookingLinks: BookingLink[]
  currency?: string
}

export function PriceComparison({
  bookingLinks,
  currency = "USD",
}: PriceComparisonProps) {
  if (bookingLinks.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <p>No hay comparación de precios disponible</p>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Find the best price
  const sortedLinks = [...bookingLinks].sort((a, b) => a.price - b.price)
  const bestPrice = sortedLinks[0].price

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold">Comparar precios</h4>
        <Badge variant="secondary" className="text-xs">
          {bookingLinks.length} {bookingLinks.length === 1 ? "opción" : "opciones"}
        </Badge>
      </div>

      <div className="space-y-2">
        {sortedLinks.map((link, index) => {
          const isBestPrice = link.price === bestPrice
          const savingsPercent =
            index > 0
              ? Math.round(
                  ((link.price - bestPrice) / link.price) * 100
                )
              : 0

          return (
            <div
              key={`${link.provider}-${index}`}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                isBestPrice
                  ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                  : "border-border bg-card"
              } hover:shadow-sm transition-all`}
            >
              <div className="flex items-center gap-3 flex-1">
                {/* Provider Logo or Name */}
                <div className="w-12 h-12 rounded flex items-center justify-center bg-white border">
                  {link.logo ? (
                    <img
                      src={link.logo}
                      alt={link.provider}
                      className="max-w-full max-h-full object-contain p-1"
                    />
                  ) : (
                    <span className="text-xs font-semibold text-center px-1">
                      {link.provider.slice(0, 8)}
                    </span>
                  )}
                </div>

                {/* Provider Info */}
                <div className="flex-1">
                  <p className="font-medium">{link.provider}</p>
                  {link.deal && (
                    <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mt-0.5">
                      <TrendingDown className="w-3 h-3" />
                      {link.deal}
                    </div>
                  )}
                </div>

                {/* Price */}
                <div className="text-right">
                  <p className="text-lg font-bold">
                    {formatCurrency(link.price)}
                  </p>
                  <p className="text-xs text-muted-foreground">por noche</p>
                </div>

                {/* Best Price Badge */}
                {isBestPrice && (
                  <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                    Mejor precio
                  </Badge>
                )}

                {/* Savings Badge */}
                {savingsPercent > 0 && (
                  <Badge variant="outline" className="text-muted-foreground">
                    +{savingsPercent}%
                  </Badge>
                )}
              </div>

              {/* Book Button */}
              <Button
                variant={isBestPrice ? "default" : "outline"}
                size="sm"
                asChild
                className="ml-3"
              >
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5"
                >
                  Ver oferta
                  <ExternalLink className="w-3 h-3" />
                </a>
              </Button>
            </div>
          )
        })}
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground text-center mt-4 pt-4 border-t">
        Los precios son aproximados y pueden variar. Verifica en el sitio del proveedor.
      </p>
    </div>
  )
}
