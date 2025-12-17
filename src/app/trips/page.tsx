"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/Logo"
import { AdminLink } from "@/components/AdminLink"
import { useTrips, useDeleteTrip } from "@/hooks/useTrips"
import type { Trip, TripStatus } from "@/types/database"

function formatDate(dateString: string): string {
  if (!dateString) return ""
  const date = new Date(dateString)
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  })
}

function formatDateRange(startDate: string, endDate: string): string {
  if (!startDate && !endDate) return "Fechas por definir"
  if (!endDate) return `Desde ${formatDate(startDate)}`
  return `${formatDate(startDate)} - ${formatDate(endDate)}`
}

function calculateDays(startDate: string, endDate: string): number | null {
  if (!startDate || !endDate) return null
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  return diffDays
}

function getStatusBadge(status: string | null) {
  switch (status) {
    case "completed":
      return {
        label: "Completado",
        className: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
      }
    case "planning":
      return {
        label: "En planificación",
        className: "bg-primary/10 text-primary border-primary/20",
      }
    default:
      return {
        label: "Borrador",
        className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
      }
  }
}

function TripCard({ trip, onDelete, isDeleting }: { trip: Trip; onDelete: (id: string) => void; isDeleting: boolean }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const days = calculateDays(trip.start_date, trip.end_date)
  const status = getStatusBadge(trip.status)

  return (
    <div className="group relative bg-card rounded-xl border border-border hover:border-primary/30 transition-all duration-200 overflow-hidden card-hover">
      {/* Header with destination initial */}
      <div className="h-24 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl font-bold text-primary/20">
            {trip.destination.charAt(0).toUpperCase()}
          </span>
        </div>
        {/* Status badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${status.className}`}>
            {status.label}
          </span>
        </div>
        {/* Delete button */}
        <button
          onClick={(e) => {
            e.preventDefault()
            setShowDeleteConfirm(true)
          }}
          className="absolute top-3 left-3 w-8 h-8 rounded-lg bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-all opacity-0 group-hover:opacity-100"
          title="Eliminar viaje"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-semibold text-lg text-foreground mb-1 truncate">
          {trip.destination}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Desde {trip.origin}
        </p>

        {/* Trip info */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{formatDateRange(trip.start_date, trip.end_date)}</span>
          </div>
          {days && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{days} {days === 1 ? "día" : "días"}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>{trip.travelers ?? 1} {(trip.travelers ?? 1) === 1 ? "viajero" : "viajeros"}</span>
          </div>
        </div>

        {/* CTA */}
        <Link href={`/trips/${trip.id}/planning`} className="block">
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            Continuar planificando
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Button>
        </Link>
      </div>

      {/* Delete confirmation overlay */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-10">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <p className="text-sm text-center text-foreground font-medium mb-1">
            Eliminar viaje a {trip.destination}?
          </p>
          <p className="text-xs text-center text-muted-foreground mb-4">
            Esta acción no se puede deshacer
          </p>
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="flex-1"
              onClick={() => onDelete(trip.id)}
              disabled={isDeleting}
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-16 px-6">
      <div className="max-w-md mx-auto">
        {/* Icon */}
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* Text */}
        <h2 className="text-2xl font-semibold text-foreground mb-3">
          Aún no tienes viajes
        </h2>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Comienza a planificar tu próxima aventura. Con AI y Google Places,
          tendrás tu itinerario listo en minutos.
        </p>

        {/* CTA */}
        <Link href="/trips/new">
          <Button size="lg" className="h-12 px-8 text-base bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30">
            Crear mi primer viaje
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </Button>
        </Link>

        {/* Features reminder */}
        <div className="mt-12 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-xs text-muted-foreground">En minutos</p>
          </div>
          <div>
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-xs text-muted-foreground">Google Places</p>
          </div>
          <div>
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <p className="text-xs text-muted-foreground">3 AI Agents</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TripsPage() {
  const { trips, loading: isLoading, error, refetch } = useTrips()
  const { deleteTrip, loading: isDeleting } = useDeleteTrip()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDeleteTrip = async (tripId: string) => {
    setDeletingId(tripId)
    const success = await deleteTrip(tripId)
    if (success) {
      refetch()
    }
    setDeletingId(null)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo href="/" size="md" />

          <div className="flex items-center gap-3">
            <AdminLink />
            <Link href="/trips/new">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nuevo Viaje
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-2">
            Mis Viajes
          </h1>
          <p className="text-muted-foreground text-lg">
            {trips.length > 0
              ? `${trips.length} ${trips.length === 1 ? "viaje" : "viajes"} en tu lista`
              : "Gestiona y continúa planificando tus aventuras"
            }
          </p>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4 animate-pulse">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-muted-foreground">Cargando viajes...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-muted-foreground mb-4">Error al cargar los viajes</p>
              <Button variant="outline" onClick={() => refetch()}>
                Reintentar
              </Button>
            </div>
          </div>
        ) : trips.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map(trip => (
              <TripCard
                key={trip.id}
                trip={trip}
                onDelete={handleDeleteTrip}
                isDeleting={deletingId === trip.id}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-border/50 mt-auto">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Logo href="/" size="sm" />
            <p className="text-sm text-muted-foreground">
              Planifica viajes de forma inteligente
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
