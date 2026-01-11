"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { GeneratedPlan } from "@/types/plan"

interface QuickActionsProps {
  plan: GeneratedPlan
  onUpdatePlan?: (plan: GeneratedPlan) => void
}

type ModalType = 'budget' | 'documents' | 'packing' | null

export function QuickActions({ plan, onUpdatePlan }: QuickActionsProps) {
  const [activeModal, setActiveModal] = useState<ModalType>(null)

  const actions = [
    {
      id: 'budget' as const,
      label: 'Presupuesto',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: 'documents' as const,
      label: 'Documentos',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: 'packing' as const,
      label: 'Equipaje',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
  ]

  return (
    <>
      {/* Compact action buttons - minimal pill style */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-1.5">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => setActiveModal(action.id)}
              className="group flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-card transition-all duration-200"
            >
              <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                {action.icon}
              </span>
              <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Budget Modal */}
      <Dialog open={activeModal === 'budget'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Presupuesto Estimado</DialogTitle>
          </DialogHeader>
          <BudgetContent plan={plan} />
        </DialogContent>
      </Dialog>

      {/* Documents Modal */}
      <Dialog open={activeModal === 'documents'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Documentos Necesarios</DialogTitle>
          </DialogHeader>
          <DocumentsContent plan={plan} onUpdatePlan={onUpdatePlan} />
        </DialogContent>
      </Dialog>

      {/* Packing Modal */}
      <Dialog open={activeModal === 'packing'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lista de Equipaje</DialogTitle>
          </DialogHeader>
          <PackingContent plan={plan} onUpdatePlan={onUpdatePlan} />
        </DialogContent>
      </Dialog>
    </>
  )
}

// Budget content component
function BudgetContent({ plan }: { plan: GeneratedPlan }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: plan.budget?.currency || 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (!plan.budget) {
    return (
      <div className="text-center text-muted-foreground py-8">
        El presupuesto se calculara proximamente basado en tu itinerario.
      </div>
    )
  }

  const items = [
    { label: "Vuelos", value: plan.budget.flights },
    { label: "Hospedaje", value: plan.budget.accommodation },
    { label: "Actividades", value: plan.budget.activities },
    { label: "Comida", value: plan.budget.food },
    { label: "Transporte", value: plan.budget.transport },
    { label: "Otros", value: plan.budget.other },
  ]

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between py-2">
          <span className="text-muted-foreground">{item.label}</span>
          <span className="font-medium">{formatCurrency(item.value)}</span>
        </div>
      ))}
      <div className="border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold">Total</span>
          <span className="text-2xl font-bold text-primary">{formatCurrency(plan.budget.total)}</span>
        </div>
        {plan.trip.travelers > 1 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
            <span>Por persona</span>
            <span>{formatCurrency(plan.budget.perPerson)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// Documents content component
function DocumentsContent({ plan, onUpdatePlan }: { plan: GeneratedPlan; onUpdatePlan?: (plan: GeneratedPlan) => void }) {
  const toggleCheck = (docId: string) => {
    if (!onUpdatePlan || !plan.documents) return
    onUpdatePlan({
      ...plan,
      documents: plan.documents.map((doc) =>
        doc.id === docId ? { ...doc, checked: !doc.checked } : doc
      ),
    })
  }

  if (plan.documentsStatus === 'loading' || plan.documentsStatus === 'idle') {
    return <div className="text-center py-8 text-muted-foreground">Cargando documentos...</div>
  }

  if (!plan.documents || plan.documents.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No hay documentos disponibles.</div>
  }

  return (
    <div className="space-y-3">
      {plan.documents.map((doc) => (
        <label key={doc.id} className="flex items-start gap-3 py-2 cursor-pointer">
          <input
            type="checkbox"
            checked={doc.checked}
            onChange={() => toggleCheck(doc.id)}
            className="mt-0.5 rounded border-border"
          />
          <div className="flex-1">
            <span className={doc.checked ? "line-through text-muted-foreground" : "text-foreground"}>
              {doc.text}
            </span>
            {doc.isRequired && (
              <span className="ml-2 text-xs text-destructive">*Requerido</span>
            )}
            {doc.notes && (
              <p className="text-xs text-muted-foreground mt-0.5">{doc.notes}</p>
            )}
          </div>
        </label>
      ))}
    </div>
  )
}

// Packing content component
function PackingContent({ plan, onUpdatePlan }: { plan: GeneratedPlan; onUpdatePlan?: (plan: GeneratedPlan) => void }) {
  const toggleCheck = (itemId: string) => {
    if (!onUpdatePlan || !plan.packing) return
    onUpdatePlan({
      ...plan,
      packing: plan.packing.map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      ),
    })
  }

  if (plan.packingStatus === 'loading' || plan.packingStatus === 'idle') {
    return <div className="text-center py-8 text-muted-foreground">Cargando lista de equipaje...</div>
  }

  if (!plan.packing || plan.packing.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No hay items de equipaje disponibles.</div>
  }

  const categories = Array.from(new Set(plan.packing.map((i) => i.category)))

  return (
    <div className="space-y-6">
      {categories.map((category) => (
        <div key={category}>
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
                <label key={item.id} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => toggleCheck(item.id)}
                    className="rounded border-border"
                  />
                  <span className={item.checked ? "line-through text-muted-foreground" : "text-foreground"}>
                    {item.text}
                  </span>
                  {item.isEssential && !item.checked && (
                    <span className="text-xs text-amber-600 font-medium">Esencial</span>
                  )}
                </label>
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}
