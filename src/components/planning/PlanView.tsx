"use client"

import { useEffect, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { ItineraryEditor } from "./editor"
import { ExploreTab } from "./ExploreTab"
import { OverviewTab } from "./overview"
import type { GeneratedPlan, DocumentItem, PackingItem, TimelineEntry } from "@/types/plan"
import type { DayGenerationState, DayGenerationStatus } from "@/hooks/useDayGeneration"

interface PlanViewProps {
  plan: GeneratedPlan
  onUpdatePlan?: (plan: GeneratedPlan) => void
  // Streaming props
  dayGenerationStates?: Record<number, DayGenerationState>
  getDayStatus?: (dayNumber: number) => DayGenerationStatus
  getDayTimeline?: (dayNumber: number) => TimelineEntry[]
}

// Skeleton component for document/packing lists
function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 py-2">
          <Skeleton className="w-4 h-4 rounded mt-0.5" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function PlanView({ plan, onUpdatePlan, dayGenerationStates, getDayStatus, getDayTimeline }: PlanViewProps) {
  // Background generation for documents
  const fetchDocuments = useCallback(async () => {
    if (!onUpdatePlan || plan.documentsStatus !== 'idle') return

    onUpdatePlan({ ...plan, documentsStatus: 'loading' })

    try {
      const startTime = Date.now()
      const response = await fetch('/api/ai/generate-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trip: plan.trip }),
      })

      if (!response.ok) throw new Error('Failed to fetch documents')

      const data = await response.json()
      const documents: DocumentItem[] = (data.documents || []).map((doc: Partial<DocumentItem>, idx: number) => ({
        ...doc,
        id: doc.id || `doc-${idx + 1}`,
        checked: false,
      }))

      console.log(`[UI] Documents loaded in ${Date.now() - startTime}ms`)
      onUpdatePlan({
        ...plan,
        documents,
        documentsStatus: 'success',
      })
    } catch (error) {
      console.error('[UI] Documents fetch error:', error)
      onUpdatePlan({
        ...plan,
        documentsStatus: 'error',
        documentsError: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }, [plan, onUpdatePlan])

  // Background generation for packing
  const fetchPacking = useCallback(async () => {
    if (!onUpdatePlan || plan.packingStatus !== 'idle') return

    onUpdatePlan({ ...plan, packingStatus: 'loading' })

    try {
      const startTime = Date.now()
      // Extract main activities from itinerary for context
      const activities = plan.itinerary.flatMap(day =>
        day.summary?.mainActivities || []
      )

      const response = await fetch('/api/ai/generate-packing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trip: plan.trip, activities }),
      })

      if (!response.ok) throw new Error('Failed to fetch packing list')

      const data = await response.json()
      const packing: PackingItem[] = (data.packing || []).map((item: Partial<PackingItem>, idx: number) => ({
        ...item,
        id: item.id || `pack-${idx + 1}`,
        checked: false,
      }))

      console.log(`[UI] Packing loaded in ${Date.now() - startTime}ms`)
      onUpdatePlan({
        ...plan,
        packing,
        packingStatus: 'success',
      })
    } catch (error) {
      console.error('[UI] Packing fetch error:', error)
      onUpdatePlan({
        ...plan,
        packingStatus: 'error',
        packingError: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }, [plan, onUpdatePlan])

  // Background generation for tips
  const fetchTips = useCallback(async () => {
    if (!onUpdatePlan || plan.tipsStatus !== 'idle') return

    onUpdatePlan({ ...plan, tipsStatus: 'loading' })

    try {
      const startTime = Date.now()
      const itinerarySummary = plan.itinerary
        .map(day => `${day.title}: ${day.summary?.mainActivities?.join(', ') || ''}`)
        .join('. ')

      const response = await fetch('/api/ai/generate-tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: plan.trip.destination,
          itinerarySummary,
        }),
      })

      if (!response.ok) throw new Error('Failed to fetch tips')

      const data = await response.json()

      console.log(`[UI] Tips loaded in ${Date.now() - startTime}ms`)
      onUpdatePlan({
        ...plan,
        tips: data.tips || [],
        tipsStatus: 'success',
      })
    } catch (error) {
      console.error('[UI] Tips fetch error:', error)
      onUpdatePlan({
        ...plan,
        tipsStatus: 'error',
        tipsError: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }, [plan, onUpdatePlan])

  // Background generation for warnings
  const fetchWarnings = useCallback(async () => {
    if (!onUpdatePlan || plan.warningsStatus !== 'idle') return

    onUpdatePlan({ ...plan, warningsStatus: 'loading' })

    try {
      const startTime = Date.now()
      const response = await fetch('/api/ai/generate-warnings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: plan.trip.destination,
          startDate: plan.trip.startDate,
          endDate: plan.trip.endDate,
        }),
      })

      if (!response.ok) throw new Error('Failed to fetch warnings')

      const data = await response.json()

      console.log(`[UI] Warnings loaded in ${Date.now() - startTime}ms`)
      onUpdatePlan({
        ...plan,
        warnings: data.warnings || [],
        warningsStatus: 'success',
      })
    } catch (error) {
      console.error('[UI] Warnings fetch error:', error)
      onUpdatePlan({
        ...plan,
        warningsStatus: 'error',
        warningsError: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }, [plan, onUpdatePlan])

  // Trigger background fetches on mount
  useEffect(() => {
    // Start all 4 background requests in parallel
    fetchDocuments()
    fetchPacking()
    fetchTips()
    fetchWarnings()
    // Only run once on mount - dependencies intentionally omitted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const toggleDocumentCheck = (docId: string) => {
    if (!onUpdatePlan || !plan.documents) return
    const updatedPlan = {
      ...plan,
      documents: plan.documents.map((doc) =>
        doc.id === docId ? { ...doc, checked: !doc.checked } : doc
      ),
    }
    onUpdatePlan(updatedPlan)
  }

  const togglePackingCheck = (itemId: string) => {
    if (!onUpdatePlan || !plan.packing) return
    const updatedPlan = {
      ...plan,
      packing: plan.packing.map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      ),
    }
    onUpdatePlan(updatedPlan)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: plan.budget?.currency || 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
          {plan.summary.title}
        </h1>

        {/* Stats */}
        <div className="flex items-center justify-center gap-8 mt-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
            </div>
            <span className="text-foreground font-medium">{plan.trip.destination}</span>
          </div>
          <div className="w-px h-6 bg-border" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-foreground font-medium">{plan.summary.totalDays} días</span>
          </div>
          <div className="w-px h-6 bg-border" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="text-foreground font-medium">{plan.trip.travelers} viajero{plan.trip.travelers > 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full grid grid-cols-7 h-12 bg-muted/30 p-1 rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
            Resumen
          </TabsTrigger>
          <TabsTrigger value="itinerary" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
            Itinerario
          </TabsTrigger>
          <TabsTrigger value="explore" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
            Explorar
          </TabsTrigger>
          <TabsTrigger value="accommodation" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
            Hospedaje
          </TabsTrigger>
          <TabsTrigger value="budget" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
            Presupuesto
          </TabsTrigger>
          <TabsTrigger value="documents" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
            Documentos
          </TabsTrigger>
          <TabsTrigger value="packing" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
            Equipaje
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          {onUpdatePlan ? (
            <OverviewTab plan={plan} onUpdatePlan={onUpdatePlan} />
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No se puede ver el resumen
            </div>
          )}
        </TabsContent>

        {/* Itinerary Tab */}
        <TabsContent value="itinerary" className="mt-6">
          {onUpdatePlan ? (
            <ItineraryEditor
              plan={plan}
              onUpdatePlan={onUpdatePlan}
              dayGenerationStates={dayGenerationStates}
              getDayStatus={getDayStatus}
              getDayTimeline={getDayTimeline}
            />
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No se puede editar el itinerario
            </div>
          )}
        </TabsContent>

        {/* Explore Tab */}
        <TabsContent value="explore" className="mt-6">
          {onUpdatePlan ? (
            <ExploreTab plan={plan} onUpdatePlan={onUpdatePlan} />
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No se puede explorar lugares
            </div>
          )}
        </TabsContent>

        {/* Accommodation Tab */}
        <TabsContent value="accommodation" className="mt-6">
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-card rounded-xl border border-border p-6 text-center">
              <p className="text-sm text-muted-foreground mb-1">Tipo de hospedaje seleccionado</p>
              <p className="font-semibold capitalize text-lg">{plan.accommodation.type}</p>
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-1">Total estimado</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(plan.accommodation.totalCost)}</p>
              </div>
            </div>

            {/* Suggestions */}
            {plan.accommodation.suggestions.map((acc) => (
              <div key={acc.id} className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{acc.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {acc.area} • {acc.nights} noches • {formatCurrency(acc.pricePerNight)}/noche
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold text-primary">
                        {formatCurrency(acc.pricePerNight * acc.nights)}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{acc.why}</p>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      <span className="text-muted-foreground">Check-in:</span>
                      <span>{acc.checkIn}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span className="text-muted-foreground">Check-out:</span>
                      <span>{acc.checkOut}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Budget Tab */}
        <TabsContent value="budget" className="mt-6">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold">Presupuesto Estimado</h3>
              <p className="text-sm text-muted-foreground">
                Desglose de costos para {plan.trip.travelers} viajero{plan.trip.travelers > 1 ? "s" : ""}
              </p>
            </div>
            {plan.budget ? (
              <div className="p-6 space-y-4">
                {[
                  { label: "Vuelos", value: plan.budget.flights, icon: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8" },
                  { label: "Hospedaje", value: plan.budget.accommodation, icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
                  { label: "Actividades", value: plan.budget.activities, icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" },
                  { label: "Comida", value: plan.budget.food, icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" },
                  { label: "Transporte", value: plan.budget.transport, icon: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" },
                  { label: "Otros", value: plan.budget.other, icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                        </svg>
                      </div>
                      <span>{item.label}</span>
                    </div>
                    <span className="font-medium">{formatCurrency(item.value)}</span>
                  </div>
                ))}

                <div className="border-t border-border pt-4 mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-2xl font-bold text-primary">{formatCurrency(plan.budget.total)}</span>
                  </div>
                  {plan.trip.travelers > 1 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Por persona</span>
                      <span>{formatCurrency(plan.budget.perPerson)}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                <p>El presupuesto se calculará proximamente basado en tu itinerario.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-6">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold">Documentos Necesarios</h3>
              <p className="text-sm text-muted-foreground">
                Checklist de documentos para tu viaje a {plan.trip.destination}
              </p>
            </div>
            <div className="p-6">
              {(plan.documentsStatus === 'idle' || plan.documentsStatus === 'loading') && (
                <ListSkeleton count={6} />
              )}
              {plan.documentsStatus === 'error' && (
                <div className="text-center text-muted-foreground py-4">
                  <p className="text-destructive">Error al cargar documentos</p>
                  <p className="text-sm mt-1">{plan.documentsError}</p>
                </div>
              )}
              {plan.documentsStatus === 'success' && plan.documents && (
                <div className="space-y-3">
                  {plan.documents.map((doc) => (
                    <div key={doc.id} className="flex items-start gap-3 py-2">
                      <Checkbox
                        id={doc.id}
                        checked={doc.checked}
                        onCheckedChange={() => toggleDocumentCheck(doc.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor={doc.id}
                          className={`cursor-pointer font-medium ${doc.checked ? "line-through text-muted-foreground" : ""}`}
                        >
                          {doc.text}
                          {doc.isRequired && (
                            <span className="ml-2 text-xs text-destructive font-normal">*Requerido</span>
                          )}
                        </Label>
                        {doc.notes && (
                          <p className="text-xs text-muted-foreground mt-0.5">{doc.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Packing Tab */}
        <TabsContent value="packing" className="mt-6">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Lista de Equipaje</h3>
                  {plan.packingStatus === 'success' && plan.packing ? (
                    <p className="text-sm text-muted-foreground">
                      {plan.packing.filter((i) => i.checked).length} de {plan.packing.length} items empacados
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Cargando lista...</p>
                  )}
                </div>
                {plan.packingStatus === 'success' && plan.packing && plan.packing.length > 0 && (
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${(plan.packing.filter((i) => i.checked).length / plan.packing.length) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="p-6">
              {(plan.packingStatus === 'idle' || plan.packingStatus === 'loading') && (
                <ListSkeleton count={8} />
              )}
              {plan.packingStatus === 'error' && (
                <div className="text-center text-muted-foreground py-4">
                  <p className="text-destructive">Error al cargar lista de equipaje</p>
                  <p className="text-sm mt-1">{plan.packingError}</p>
                </div>
              )}
              {plan.packingStatus === 'success' && plan.packing && (
                <>
                  {Array.from(new Set(plan.packing.map((i) => i.category))).map((category) => (
                    <div key={category} className="mb-6 last:mb-0">
                      <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary text-xs">
                          {plan.packing!.filter((i) => i.category === category && i.checked).length}
                        </div>
                        {category}
                      </h4>
                      <div className="space-y-2 pl-8">
                        {plan.packing!
                          .filter((i) => i.category === category)
                          .map((item) => (
                            <div key={item.id} className="flex items-center gap-3">
                              <Checkbox
                                id={item.id}
                                checked={item.checked}
                                onCheckedChange={() => togglePackingCheck(item.id)}
                              />
                              <Label
                                htmlFor={item.id}
                                className={`cursor-pointer flex-1 ${
                                  item.checked ? "line-through text-muted-foreground" : ""
                                }`}
                              >
                                {item.text}
                                {item.isEssential && !item.checked && (
                                  <span className="ml-2 text-xs text-amber-600 font-medium">Esencial</span>
                                )}
                              </Label>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
