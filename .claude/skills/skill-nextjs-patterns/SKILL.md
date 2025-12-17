---
name: skill-nextjs-patterns
description: Travelr-specific Next.js 14 App Router conventions and patterns
topics: ["nextjs", "react", "typescript", "shadcn-ui", "app-router"]
---

# Next.js Patterns Skill

Travelr-specific patterns for Next.js 14 with App Router.

## Component Pattern

All interactive components follow this structure:

```typescript
'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ComponentNameProps {
  title: string
  onAction?: () => void
  className?: string
}

export function ComponentName({
  title,
  onAction,
  className,
}: ComponentNameProps) {
  const [state, setState] = useState(false)

  const handleAction = useCallback(() => {
    // Logic here
    onAction?.()
  }, [onAction])

  return (
    <div className={cn('base-styles', className)}>
      {/* JSX */}
    </div>
  )
}
```

### Rules:
- `'use client'` at top for interactive components
- Props interface named `{ComponentName}Props`
- Named exports (not default)
- Use `cn()` from `@/lib/utils` for className merging
- shadcn/ui primitives for UI elements
- lucide-react for icons

### Reference Files:
- `src/components/planning/PlanningModeSelector.tsx`
- `src/components/canvas/CanvasHeader.tsx`

---

## API Route Pattern

API routes follow Auth → Validate → Process → Response:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // 1. Authenticate
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Validate input
  const body = await request.json()
  if (!body.requiredField) {
    return NextResponse.json({ error: 'requiredField is required' }, { status: 400 })
  }

  // 3. Verify authorization (resource belongs to user)
  const { data: resource } = await supabase
    .from('table')
    .select('user_id')
    .eq('id', body.resourceId)
    .single()

  if (resource?.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 4. Process (fire-and-forget for background work)
  // For long operations, respond immediately and process in background:
  fetch(process.env.EDGE_FUNCTION_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ /* data */ }),
  }).catch(console.error) // Fire and forget

  // 5. Response
  return NextResponse.json({ success: true })
}
```

### Response Patterns:
```typescript
// Success
return NextResponse.json({ data: result }, { status: 200 })
return NextResponse.json({ success: true })

// Client errors
return NextResponse.json({ error: 'Message' }, { status: 400 })
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
return NextResponse.json({ error: 'Not found' }, { status: 404 })
return NextResponse.json({ error: 'Conflict' }, { status: 409 })

// Server errors
return NextResponse.json({ error: 'Internal error' }, { status: 500 })
```

### Reference Files:
- `src/app/api/generation/start/route.ts` - Fire-and-forget pattern
- `src/app/api/directions/route.ts` - Caching pattern

---

## Page Structure

```
src/app/
├── (routes)/
│   ├── page.tsx          # Server component (default)
│   ├── layout.tsx        # Shared layout
│   ├── loading.tsx       # Loading UI
│   └── error.tsx         # Error boundary
├── api/
│   └── endpoint/
│       └── route.ts      # API handler
```

### Server vs Client Decision Tree:

**Use Server Component (default)** when:
- Fetching data at render time
- No user interactions
- No hooks (useState, useEffect)
- SEO-critical content

**Use Client Component ('use client')** when:
- User interactions (onClick, onChange)
- Using React hooks
- Browser APIs (localStorage, window)
- Real-time updates

---

## shadcn/ui Components

Travelr uses these shadcn/ui components:

```typescript
// Common imports
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
```

### Button Variants:
```typescript
<Button variant="default">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Destructive</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
```

---

## Tailwind Conventions

```typescript
// Responsive (mobile-first)
className="w-full md:w-1/2 lg:w-1/3"

// Spacing
className="p-4 md:p-6 space-y-4"

// Flexbox
className="flex items-center justify-between gap-4"

// Grid
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"

// Colors (use CSS variables)
className="bg-background text-foreground"
className="bg-primary text-primary-foreground"
className="bg-muted text-muted-foreground"
className="border-border"

// States
className="hover:bg-accent focus:ring-2 disabled:opacity-50"
```

---

## File Naming Conventions

```
Components:    PascalCase.tsx     (e.g., TripCard.tsx)
Hooks:         camelCase.ts       (e.g., useTrips.ts)
Utils:         camelCase.ts       (e.g., transportUtils.ts)
Types:         camelCase.ts       (e.g., plan.ts)
API Routes:    route.ts           (inside folder structure)
```

---

## Import Path Aliases

Always use path aliases:

```typescript
// Good
import { Button } from '@/components/ui/button'
import { useTrips } from '@/hooks/useTrips'
import { cn } from '@/lib/utils'
import type { Trip } from '@/types/database'

// Bad
import { Button } from '../../../components/ui/button'
```
