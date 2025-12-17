---
name: skill-ui-ux-travel-app
description: UI/UX design system and patterns for Travelr travel planning app
topics: ["ui", "ux", "design-system", "tailwind", "shadcn-ui", "accessibility", "travel"]
---

# UI/UX Skill - Travelr

Comprehensive design system knowledge for building consistent, beautiful travel app interfaces.

---

## Design Philosophy

**"Modern Travel Tech"** - Clean, contemporary design with teal branding that reflects professionalism and trust.

### Core Principles

1. **Clarity First** - Clean layouts, legible fonts, clear visual hierarchy
2. **Cool Confidence** - Professional teal tones, travel-oriented aesthetic
3. **Modern Minimalism** - Less ornamentation, content-focused
4. **Functional Colors** - Green/amber/red for activity states (always preserved)
5. **Subtle Motion** - Purposeful animations, not distracting

### External Inspiration

| App | What to Learn |
|-----|---------------|
| **Wanderlog** | Clean itinerary cards, seamless map integration, day organization |
| **TripIt** | Timeline layout, transport blocks between activities, trip overview |
| **Google Travel** | Search/explore patterns, place cards, saved items |
| **Airbnb** | Card hover effects, image treatment, booking flow |

---

## Color System

### Primary Palette (CSS Variables)

```
Light Mode:
--primary:     #0D9488  (Teal-600, logo color)
--background:  #F8FAFC  (Slate cool)
--card:        #FFFFFF
--foreground:  #0F172A  (Slate deep)
--muted:       #F1F5F9
--accent:      #CCFBF1  (Teal soft)
--border:      #E2E8F0
--destructive: #DC2626

Dark Mode:
--primary:     #2DD4BF  (Teal brighter)
--background:  #0F172A
--card:        #1E293B
--foreground:  #F8FAFC
```

### Status Colors (Never Override)

| Status | Color | Use Case |
|--------|-------|----------|
| Confirmed | Green (#22C55E) | Booked activities, verified places |
| Pending | Amber (#F59E0B) | AI suggestions, unconfirmed items |
| Conflict | Red (#DC2626) | Time overlaps, errors |
| Empty | Gray (muted) | Available slots, no data |

### Color Usage Patterns

```typescript
// Selected item
className="border-primary bg-primary/5 ring-1 ring-primary/20"

// Linked to Google Places
className="border-l-2 border-l-green-500"

// AI suggestion badge
className="bg-amber-100 text-amber-700"

// Error state
className="border-destructive bg-destructive/10"

// Muted background
className="bg-muted/30"
```

---

## Typography

### Font Stack

- **Primary**: Inter (sans-serif) - all UI elements
- **Weight Scale**: 400 (body), 500 (labels), 600 (headers)

### Type Scale

```typescript
// Headers
<h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight">
<h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
<h3 className="text-xl sm:text-2xl font-semibold">
<h4 className="text-lg font-semibold">

// Body text
<p className="text-base">                                // Normal
<p className="text-lg text-muted-foreground leading-relaxed">  // Description
<p className="text-sm text-muted-foreground">           // Secondary
<span className="text-xs text-muted-foreground">        // Labels

// Section label (above titles)
<span className="text-sm font-medium text-primary uppercase tracking-wider">
```

---

## Spacing System

Base unit: 4px (Tailwind standard)

| Use | Pattern | Value |
|-----|---------|-------|
| Card padding | `p-6` | 24px |
| Section gap | `py-24` | 96px |
| Element gap | `gap-4` | 16px |
| Content max-width | `max-w-6xl` | 1152px |
| Form max-width | `max-w-xl` | 576px |

### Container Pattern

```typescript
// Page wrapper
<div className="max-w-6xl mx-auto px-6">

// Form centered
<div className="max-w-xl mx-auto px-6">

// Reading content
<div className="max-w-2xl mx-auto">
```

---

## Component Patterns

### Buttons

```typescript
// Primary (teal)
<Button className="bg-primary hover:bg-primary/90 text-primary-foreground">

// Primary with shadow (CTA)
<Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">

// Outline
<Button variant="outline" className="border-border hover:bg-muted">

// Ghost
<Button variant="ghost">

// Sizes
<Button size="lg" className="h-12 px-8 text-base">  // Large
<Button size="sm" className="h-8 px-3">              // Small
<Button size="icon" className="h-9 w-9">             // Icon only
```

### Cards

```typescript
// Basic card
<div className="bg-card rounded-xl border border-border p-6">

// Card with hover lift
<div className="bg-card rounded-xl border border-border p-6 card-hover hover:border-primary/30">

// Selectable card
<button className={cn(
  "w-full text-left p-5 rounded-xl border-2 transition-all",
  selected
    ? "border-primary bg-primary/5"
    : "border-border bg-card hover:border-primary/30"
)}>
```

### Badges

```typescript
// Primary badge
<span className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">

// Status badge with indicator
<span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium badge-primary">
  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
  Active
</span>

// Small tag
<span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
```

### Inputs

```typescript
<Input className="h-12 text-base bg-card border-border focus:border-primary" />

// With label
<div className="space-y-2">
  <Label className="text-base font-medium">Label</Label>
  <Input className="h-12 text-base bg-card border-border" />
</div>
```

---

## Canvas-Specific Patterns

### 3-Column Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                    Header (fixed, h-14)                          │
├───────────────┬─────────────────────────┬───────────────────────┤
│   Sidebar     │      Central Panel      │     Right Panel       │
│   w-[250px]   │      (flex-1)           │     w-[320px]         │
│               │                         │                       │
│   - Overview  │      - Day sections     │   - Empty state       │
│   - Nav       │      - Activity blocks  │   - Activity details  │
│   - Controls  │      - Drop zones       │   - Search results    │
│               │      - Drag & drop      │   - AI suggestions    │
└───────────────┴─────────────────────────┴───────────────────────┘
```

### Activity Block States

```typescript
// Default
className="p-3 rounded-lg border border-border bg-card"

// Selected
className="p-3 rounded-lg border border-primary bg-primary/5 ring-1 ring-primary/20"

// Hover
className="hover:border-primary/50 hover:bg-muted/30"

// Linked (Google Places)
className="border-l-2 border-l-green-500"

// Conflict
className="border-destructive bg-destructive/10 border-2"

// Dragging
className="opacity-50 shadow-xl"
```

### Day Section Header

```typescript
<div className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm p-4 rounded-t-xl border border-border">
  <div className="flex items-center justify-between">
    <div>
      <h3 className="font-semibold">Day 1 - Monday, Jan 15</h3>
      <p className="text-sm text-muted-foreground">Arrival and exploration</p>
    </div>
    <Button variant="outline" size="sm">Optimize</Button>
  </div>
</div>
```

### Empty Time Block

```typescript
<button className={cn(
  "w-full p-4 rounded-lg border-2 border-dashed transition-all text-left",
  isHovered
    ? "border-primary bg-primary/5"
    : "border-border bg-muted/20 hover:border-primary/50"
)}>
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
      <Plus className="w-4 h-4 text-muted-foreground" />
    </div>
    <div>
      <p className="text-sm font-medium">15:00 - 19:00</p>
      <p className="text-xs text-muted-foreground">Add activity</p>
    </div>
  </div>
</button>
```

### Drag & Drop

```typescript
// Active drop zone
className="border-2 border-dashed border-primary bg-primary/5 rounded-lg"

// Conflict drop zone
className="border-2 border-dashed border-destructive bg-destructive/5 rounded-lg"

// Drag handle
<div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
  <GripVertical className="w-4 h-4" />
</div>
```

---

## Travel UX Patterns

### User Flow

```
Explore → Select Place → Add to Day → Organize Timeline → Review Trip
```

### Day Structure Guidelines

| Time | Typical Use | Activities/Day |
|------|-------------|----------------|
| 8:00-12:00 | Morning activities | 1-2 |
| 12:00-14:00 | Lunch break | 1 |
| 14:00-18:00 | Afternoon activities | 1-2 |
| 18:00-21:00 | Evening/dinner | 1-2 |

### Activity Duration Defaults

| Type | Duration |
|------|----------|
| Quick attraction | 30-60 min |
| Main attraction | 2-3 hours |
| Restaurant | 1-1.5 hours |
| Museum | 2-4 hours |
| Nature/outdoors | 3-4 hours |

### Accommodation Block

```typescript
// Status colors
const statusConfig = {
  suggested: { bg: "bg-blue-100", icon: Sparkles },
  pending: { bg: "bg-amber-100", icon: Clock },
  confirmed: { bg: "bg-green-100", icon: CheckCircle },
  cancelled: { bg: "bg-gray-100", icon: null },
}

// Border style
const borderStyle = status === 'suggested'
  ? "border-dashed"
  : "border-solid"
```

---

## Interaction States

### Hover Patterns

```typescript
// Subtle border change
className="hover:border-primary/50"

// Background tint
className="hover:bg-muted/30"

// Shadow lift
className="hover:shadow-md"

// Combined (card-hover class)
className="card-hover"  // translateY(-2px) + shadow
```

### Selection Pattern

```typescript
// Base → Hover → Selected
"border-border"              // Base
"hover:border-primary/50"    // Hover
"border-primary bg-primary/5 ring-1 ring-primary/20"  // Selected
```

### Action Buttons (appear on hover)

```typescript
<div className="group/activity relative">
  {/* Content */}

  {/* Actions - appear on hover */}
  <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover/activity:opacity-100 transition-opacity">
    <Button variant="ghost" size="icon" className="h-8 w-8">
      <Pencil className="w-4 h-4" />
    </Button>
    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
      <Trash className="w-4 h-4" />
    </Button>
  </div>
</div>
```

---

## Accessibility Guidelines

### Tap Targets

- Minimum: 44x44px for touch
- Buttons: `h-9` (36px) minimum, prefer `h-10` or `h-12`
- Icons: Add padding to reach 44px total area

### Color Contrast

- WCAG AA minimum (4.5:1 for normal text)
- Primary teal (#0D9488) passes on white backgrounds
- Use `text-muted-foreground` for secondary text (3:1 ratio)

### Focus States

```typescript
// Already handled by shadcn/ui:
className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
```

### Aria Labels

```typescript
// Icon-only buttons need labels
<Button variant="ghost" size="icon" aria-label="Delete activity">
  <Trash className="w-4 h-4" />
</Button>

// Status indicators
<span role="status" aria-live="polite" className="sr-only">
  Activity confirmed
</span>
```

### Keyboard Navigation

- All interactive elements focusable with Tab
- Drag & drop: Support arrow keys as alternative
- Modals: Trap focus, close on Escape

---

## Animation System

### Keyframes (from globals.css)

```css
.animate-fade-up     /* translateY(20px) → 0, opacity 0 → 1 */
.animate-fade-in     /* opacity 0 → 1 */
.animate-scale-in    /* scale(0.95) → 1 */
.animate-subtle-bounce /* translateY 0 → -4px → 0 */
.animate-shimmer    /* background-position shift (teal) */
```

### Stagger Animation

```typescript
<div className="animate-fade-up">First</div>
<div className="animate-fade-up delay-100">Second</div>
<div className="animate-fade-up delay-200">Third</div>
<div className="animate-fade-up delay-300">Fourth</div>
// Available: delay-100 through delay-700
```

### Transitions

```typescript
// Color only
className="transition-colors"

// Multiple properties
className="transition-all duration-200"

// Card lift
className="card-hover"  // Built-in transform + shadow
```

---

## What NOT to Do

### Avoid These

| Bad | Good | Reason |
|-----|------|--------|
| Purple gradients | Solid teal or teal gradients | Off-brand |
| Emojis as icons | Heroicons/lucide-react SVGs | Inconsistent |
| Glassmorphism everywhere | backdrop-blur only on nav | Distracting |
| Heavy shadows | shadow-sm or shadow-lg with subtle colors | Overwhelming |
| rounded-3xl | rounded-xl max | Inconsistent corners |
| Many animations at once | 1-2 per view | Distracting |
| Off-brand colors | Stick to teal/cyan palette | Inconsistent |

### Code Examples

```typescript
// BAD - Purple gradient
<div className="bg-gradient-to-r from-violet-500 to-purple-600">

// GOOD - Teal solid or subtle gradient
<div className="bg-primary">
<div className="bg-gradient-to-r from-primary to-[#4ECDC4]">

// BAD - Emoji icon
<div className="text-3xl">✈️</div>

// GOOD - SVG icon
<Plane className="w-6 h-6" />

// BAD - Heavy glassmorphism
<div className="glass backdrop-blur-xl bg-white/10">

// GOOD - Subtle blur only for overlays
<nav className="bg-background/80 backdrop-blur-sm">
```

---

## Icon System

### Icon Sizing

| Context | Size | Class |
|---------|------|-------|
| Small (content) | 16px | `w-4 h-4` |
| Normal (UI) | 20px | `w-5 h-5` |
| Large (headers) | 24px | `w-6 h-6` |

### Icon Box Pattern

```typescript
// Feature icon (large)
<div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
  <MapPin className="w-6 h-6" />
</div>

// Small icon box
<div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
  <Clock className="w-4 h-4" />
</div>
```

### Common Icons (lucide-react)

| Use | Icon |
|-----|------|
| Activities | MapPin, Camera, Utensils, Coffee |
| Transport | Car, Bus, Train, Plane, PersonStanding |
| Actions | Plus, Pencil, Trash, Grip, Check |
| Status | CheckCircle, Clock, AlertCircle, Sparkles |
| Navigation | ChevronLeft, ChevronRight, Menu, X |

---

## Reference Files

Study these for implementation patterns:

- `docs/07-design-system.md` - Full design system documentation
- `src/app/globals.css` - Custom utilities and animations
- `src/components/ui/button.tsx` - Button variants
- `src/components/ui/card.tsx` - Card structure
- `src/components/planning/editor/ActivityListItem.tsx` - Selection states
- `src/components/explore/PlaceCard.tsx` - Card with image/hover
- `src/components/canvas/CanvasLayout.tsx` - 3-column layout

---

## Quick Checklist

Before shipping UI:

- [ ] Uses teal palette (#0D9488 / #2DD4BF)?
- [ ] Inter font throughout?
- [ ] Icons are SVGs (not emojis)?
- [ ] Spacing follows 4px system?
- [ ] Cards use rounded-xl + border-border?
- [ ] Hover states are subtle?
- [ ] Has loading/empty/error states?
- [ ] Mobile responsive (test at 375px)?
- [ ] Tap targets 44px minimum?
- [ ] Focus states visible?
