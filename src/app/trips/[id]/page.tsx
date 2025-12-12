"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

// This page redirects to the planning flow
// In the future, it could show a summary of completed trips
export default function TripDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const tripId = params.id as string

  useEffect(() => {
    // Redirect to planning page
    router.replace(`/trips/${tripId}/planning`)
  }, [tripId, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <p className="text-muted-foreground">Redirigiendo...</p>
      </div>
    </div>
  )
}
