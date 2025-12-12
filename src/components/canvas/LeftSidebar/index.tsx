"use client"

import { DayNavigation } from "./DayNavigation"
import { QuickActions } from "./QuickActions"
import type { GeneratedPlan } from "@/types/plan"

interface LeftSidebarProps {
  plan: GeneratedPlan
  onUpdatePlan?: (plan: GeneratedPlan) => void
}

export function LeftSidebar({ plan, onUpdatePlan }: LeftSidebarProps) {
  return (
    <div className="h-full flex flex-col overflow-y-auto">
      <DayNavigation plan={plan} />
      <QuickActions plan={plan} onUpdatePlan={onUpdatePlan} />
    </div>
  )
}
