"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { FlightBadge, getFlightsForDate } from "./overview/FlightBadge"
import type { ItineraryDay, Activity, getNoteEmoji, TransportMethod, TravelInfo, FlightReservation } from "@/types/plan"

// Build Google Maps directions URL
function buildGoogleMapsUrl(from: string, to: string, method?: TransportMethod): string {
  const travelMode = method === 'walking' ? 'walking' : method === 'transit' ? 'transit' : 'driving'
  const origin = encodeURIComponent(from)
  const destination = encodeURIComponent(to)
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=${travelMode}`
}

// Transport method icon (inline SVG)
function TransportMethodIcon({ method }: { method?: TransportMethod }) {
  if (method === 'walking') {
    return (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      </svg>
    )
  }
  // Default: driving
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 17a2 2 0 100-4 2 2 0 000 4zm8 0a2 2 0 100-4 2 2 0 000 4z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 17H3V9l2-4h14l2 4v8h-2M5 13h14" />
    </svg>
  )
}

// Transport row for timeline table
function TransportRow({ travelInfo, fromLocation, toLocation }: {
  travelInfo: TravelInfo
  fromLocation: string
  toLocation: string
}) {
  if (!travelInfo || travelInfo.method === 'none') return null

  const googleMapsUrl = buildGoogleMapsUrl(fromLocation, toLocation, travelInfo.method)

  return (
    <tr className="border-b border-border/30">
      <td colSpan={3} className="py-1.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground pl-2">
          <div className="flex items-center gap-1.5 text-muted-foreground/70">
            <TransportMethodIcon method={travelInfo.method} />
          </div>
          {travelInfo.duration && (
            <span className="font-medium">{travelInfo.duration}</span>
          )}
          {travelInfo.distance && (
            <>
              <span className="text-border">·</span>
              <span>{travelInfo.distance}</span>
            </>
          )}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Directions
          </a>
        </div>
      </td>
    </tr>
  )
}

interface DayCardProps {
  day: ItineraryDay
  flights?: FlightReservation[]
  onRegenerateDay?: (dayNumber: number, feedback: string) => void
  isRegenerating?: boolean
}

// Note category emoji mapping
const noteEmojis: Record<string, string> = {
  time: '⏰',
  transport: '🚗',
  weather: '🌧️',
  activity: '🌋',
  food: '🍽️',
  lodging: '🏠',
  budget: '💰',
  gear: '👟',
  warning: '⚠️',
  tip: '💡',
}

export function DayCard({ day, flights = [], onRegenerateDay, isRegenerating }: DayCardProps) {
  const [expanded, setExpanded] = useState(true)

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + "T12:00:00").toLocaleDateString("es", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })
  }

  // Check if we have the new enhanced format
  const hasTimeline = day.timeline && day.timeline.length > 0
  const hasImportantNotes = day.importantNotes && day.importantNotes.length > 0

  // Get flights for this day
  const dayFlights = getFlightsForDate(flights, day.date)

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <button
        type="button"
        className="w-full text-left px-6 py-5 hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
              {day.day}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">{day.title}</h3>
              {day.subtitle ? (
                <p className="text-sm text-muted-foreground">{day.subtitle}</p>
              ) : (
                <p className="text-sm text-muted-foreground capitalize">
                  {formatDate(day.date)}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {dayFlights.length > 0 && (
              <FlightBadge flights={dayFlights} />
            )}
            {hasTimeline && (
              <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                {day.timeline.length} actividades
              </span>
            )}
            <svg
              className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${
                expanded ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-6 pb-6">
          {/* Timeline Table (new format) */}
          {hasTimeline && (
            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Timeline del Día
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground w-28">Hora</th>
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Actividad</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Ubicación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {day.timeline.map((entry, index) => {
                      const nextEntry = day.timeline[index + 1]
                      const showTransport = entry.travelToNext &&
                                          entry.travelToNext.method !== 'none' &&
                                          nextEntry

                      return (
                        <React.Fragment key={entry.id}>
                          <tr className="border-b border-border/50 last:border-0">
                            <td className="py-2.5 pr-4 text-primary font-medium whitespace-nowrap">
                              {entry.time}
                            </td>
                            <td className="py-2.5 pr-4">
                              <span className="flex items-center gap-2">
                                {entry.icon && <span>{entry.icon}</span>}
                                <span className="font-medium">{entry.activity}</span>
                              </span>
                              {entry.notes && (
                                <span className="text-xs text-muted-foreground block mt-0.5">
                                  {entry.notes}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 text-muted-foreground">
                              {entry.location}
                            </td>
                          </tr>
                          {showTransport && nextEntry && (
                            <TransportRow
                              travelInfo={entry.travelToNext!}
                              fromLocation={entry.location}
                              toLocation={nextEntry.location}
                            />
                          )}
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Legacy Activities View (fallback for old format) */}
          {!hasTimeline && day.activities && day.activities.length > 0 && (
            <div className="border-t border-border pt-4 space-y-3">
              {day.activities.map((activity) => (
                <div key={activity.id} className="flex gap-4 py-2">
                  <div className="w-16 flex-shrink-0 text-right">
                    {activity.time && (
                      <span className="text-sm font-medium text-primary">{activity.time}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{activity.name}</span>
                      {activity.isOptional && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          Opcional
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{activity.description}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{activity.duration}</span>
                      {activity.cost !== undefined && activity.cost > 0 && (
                        <span>${activity.cost}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Meals */}
          {day.meals && (day.meals.breakfast || day.meals.lunch || day.meals.dinner) && (
            <div className="mt-4 pt-4 border-t border-border">
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1" />
                </svg>
                Comidas
              </h4>
              <div className="grid grid-cols-3 gap-4">
                {day.meals.breakfast && (
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Desayuno</span>
                    <p className="text-sm mt-1">
                      {typeof day.meals.breakfast === 'string'
                        ? day.meals.breakfast
                        : day.meals.breakfast.suggestion}
                    </p>
                    {typeof day.meals.breakfast === 'object' && day.meals.breakfast.priceRange && (
                      <span className="text-xs text-muted-foreground">{day.meals.breakfast.priceRange}</span>
                    )}
                  </div>
                )}
                {day.meals.lunch && (
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Almuerzo</span>
                    <p className="text-sm mt-1">
                      {typeof day.meals.lunch === 'string'
                        ? day.meals.lunch
                        : day.meals.lunch.suggestion}
                    </p>
                    {typeof day.meals.lunch === 'object' && day.meals.lunch.priceRange && (
                      <span className="text-xs text-muted-foreground">{day.meals.lunch.priceRange}</span>
                    )}
                  </div>
                )}
                {day.meals.dinner && (
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cena</span>
                    <p className="text-sm mt-1">
                      {typeof day.meals.dinner === 'string'
                        ? day.meals.dinner
                        : day.meals.dinner.suggestion}
                    </p>
                    {typeof day.meals.dinner === 'object' && day.meals.dinner.priceRange && (
                      <span className="text-xs text-muted-foreground">{day.meals.dinner.priceRange}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Important Notes (new format with categories) */}
          {hasImportantNotes && (
            <div className="mt-4 pt-4 border-t border-border">
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Notas Importantes
              </h4>
              <ul className="space-y-2">
                {day.importantNotes.map((note) => (
                  <li
                    key={note.id}
                    className={`text-sm flex items-start gap-2 ${note.isHighPriority ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
                  >
                    <span className="flex-shrink-0">{noteEmojis[note.category] || '•'}</span>
                    <span>{note.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Transport & Overnight */}
          {(day.transport || day.overnight) && (
            <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-4">
              {day.transport && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Transporte</span>
                    <p className="text-sm mt-0.5">{day.transport}</p>
                  </div>
                </div>
              )}
              {day.overnight && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Noche en</span>
                    <p className="text-sm mt-0.5">{day.overnight}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          {onRegenerateDay && (
            <div className="mt-4 pt-4 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRegenerateDay(day.day, "Quiero más tiempo libre")}
                disabled={isRegenerating}
                className="text-sm"
              >
                {isRegenerating ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Regenerando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Regenerar día
                  </span>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
