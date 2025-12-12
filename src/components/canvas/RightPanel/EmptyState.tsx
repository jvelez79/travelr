"use client"

import type { GeneratedPlan } from "@/types/plan"

interface EmptyStateProps {
  plan: GeneratedPlan
}

export function EmptyState({ plan }: EmptyStateProps) {
  const totalActivities = plan.itinerary.reduce(
    (sum, day) => sum + day.timeline.length,
    0
  )

  const confirmedCount = plan.itinerary.reduce(
    (sum, day) => sum + day.timeline.filter(a => a.placeData).length,
    0
  )

  return (
    <div className="p-5 space-y-6">
      {/* Header with gradient accent */}
      <div className="relative">
        <div className="absolute -top-5 -left-5 -right-5 h-24 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-b-3xl" />
        <div className="relative pt-2">
          <h3 className="text-lg font-semibold text-foreground tracking-tight">
            {plan.summary.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            {plan.summary.description}
          </p>
        </div>
      </div>

      {/* Stats - Refined Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="relative overflow-hidden bg-gradient-to-br from-muted/80 to-muted/40 rounded-xl p-4 border border-border/50">
          <div className="relative">
            <div className="text-3xl font-bold text-foreground tracking-tight">{totalActivities}</div>
            <div className="text-xs font-medium text-muted-foreground mt-0.5">Actividades</div>
          </div>
          <div className="absolute -right-2 -bottom-2 w-12 h-12 rounded-full bg-foreground/5" />
        </div>
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/15 to-primary/5 rounded-xl p-4 border border-primary/20">
          <div className="relative">
            <div className="text-3xl font-bold text-primary tracking-tight">{confirmedCount}</div>
            <div className="text-xs font-medium text-primary/70 mt-0.5">Confirmadas</div>
          </div>
          <div className="absolute -right-2 -bottom-2 w-12 h-12 rounded-full bg-primary/10" />
        </div>
      </div>

      {/* Highlights - Editorial Style */}
      {plan.summary.highlights && plan.summary.highlights.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-widest">
            Highlights
          </h4>
          <ul className="space-y-2.5">
            {plan.summary.highlights.map((highlight, i) => (
              <li key={i} className="flex items-start gap-3 text-sm group">
                <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-2 group-hover:scale-125 transition-transform" />
                <span className="text-foreground/90 leading-relaxed">{highlight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tips - Card Style */}
      {plan.tips && plan.tips.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-widest">
            Consejos
          </h4>
          <div className="space-y-2">
            {plan.tips.slice(0, 3).map((tip, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 hover:border-amber-500/20 transition-colors"
              >
                <span className="flex-shrink-0 text-base">💡</span>
                <span className="text-sm text-foreground/80 leading-relaxed">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {plan.warnings && plan.warnings.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-widest">
            Advertencias
          </h4>
          <div className="space-y-2">
            {plan.warnings.slice(0, 2).map((warning, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-xl bg-orange-500/5 border border-orange-500/10"
              >
                <span className="flex-shrink-0 text-base">⚠️</span>
                <span className="text-sm text-foreground/80 leading-relaxed">{warning}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help text - Subtle */}
      <div className="pt-4">
        <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-muted/30 border border-dashed border-border/50">
          <svg className="w-4 h-4 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
          </svg>
          <p className="text-xs text-muted-foreground/60">
            Clic en una actividad para ver detalles
          </p>
        </div>
      </div>
    </div>
  )
}
