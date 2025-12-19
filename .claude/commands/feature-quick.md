---
name: feature-quick
description: Ship a Travelr feature from idea to production (solo dev workflow)
---

# Travelr Feature Quick Command

Ship a feature from idea to production using the solo dev workflow.

## Usage

```
/feature-quick [feature idea description]
```

**Examples:**
```
/feature-quick Add ability to share trips with friends via link
/feature-quick Add dark mode toggle to the app
/feature-quick Show weather forecast for each day in the itinerary
/feature-quick Allow users to add notes to activities
```

---

## Workflow Phases

```
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 1: VALIDATE                                              │
│  business-advisor-agent → GO / MAYBE / NO-GO                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓ (if GO)
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 2: ANALYZE                                               │
│  feature-architect-agent → Technical Specification              │
└─────────────────────────────────────────────────────────────────┘
                              ↓ (if READY)
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 3: BUILD                                                 │
│  full-stack-builder-agent → Feature Implementation              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 4: REVIEW                                                │
│  code-reviewer-agent → OK / FIXES / REWORK                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓ (if OK)
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 5: SHIP                                                  │
│  Merge → Deploy → Monitor                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

### PHASE 1: VALIDATE (15 min)

**Goal**: Decide if this feature is worth building.

**Agent**: `business-advisor-agent`

**What happens:**
1. Agent analyzes the feature idea:
   - Pain point severity (1-5)
   - User adoption potential (%)
   - Effort estimate (hours)
   - Complexity and risk assessment
2. Agent outputs: **GO / MAYBE / NO-GO** recommendation

**Your action:**
- If **GO**: Proceed to Phase 2
- If **MAYBE**: Review suggestions, descope if needed, re-validate
- If **NO-GO**: Discard idea or save for later

---

### PHASE 2: ANALYZE (30-60 min)

**Goal**: Define exactly what to build with full technical specification.

**Agent**: `feature-architect-agent`

**What happens:**
1. Agent investigates the codebase:
   - Finds similar patterns (how do similar features work?)
   - Identifies all dependencies (APIs, database, components)
   - Maps affected files and areas
   - Checks if AI prompts need updates
2. Agent analyzes:
   - Data sources (where does data come from? Is it real or fabricated?)
   - Data flow (source → storage → API → hook → component)
   - Missing pieces (endpoints without UI, UI without data, etc.)
3. Agent outputs:
   - Complete technical specification
   - Files to create/modify
   - External dependencies needed
   - Decisions that need user input
   - Implementation order
   - Status: **READY / NEEDS DECISIONS / BLOCKED**

**Your action:**
- If **READY**: Proceed to Phase 3
- If **NEEDS DECISIONS**: Answer the questions, re-analyze if needed
- If **BLOCKED**: Resolve blockers first

**Why this phase matters:**
This phase prevents building features that are:
- Incomplete (UI without data, data without source)
- Wrong (assumptions instead of investigation)
- Missing critical pieces (no search UI, no API integration)

---

### PHASE 3: BUILD (2-4 hours)

**Goal**: Implement the feature.

**Agent**: `full-stack-builder-agent`

**What happens:**
1. Agent receives the technical specification from Phase 2
2. Agent implements in order:
   - Database migration (if needed)
   - API routes (if needed)
   - Hooks
   - Components
   - Basic tests
3. Agent outputs: Feature branch with all code

**Your action:**
- Monitor progress
- Answer any clarification questions
- Review code as it's written

---

### PHASE 4: REVIEW (10 min)

**Goal**: Quick sanity check before shipping.

**Agent**: `code-reviewer-agent`

**What happens:**
1. Agent checks:
   - Code runs without errors
   - Tests pass
   - Follows existing patterns
   - No obvious bugs or security issues
   - Specification was fully implemented
2. Agent outputs: **OK TO MERGE / MINOR FIXES / NEEDS REWORK**

**Your action:**
- If **OK**: Proceed to Phase 5
- If **MINOR FIXES**: Apply fixes, re-review
- If **NEEDS REWORK**: Back to Phase 3 with feedback

---

### PHASE 5: SHIP

**Goal**: Get the feature to users.

**What happens:**
1. Merge to main branch
2. Vercel auto-deploys
3. Verify in production

**Your action:**
- Merge the PR
- Test the feature in production
- Monitor for errors (first 24 hours)

---

## Quick Reference

| Phase | Agent | Time | Output |
|-------|-------|------|--------|
| Validate | business-advisor-agent | 15 min | GO/MAYBE/NO-GO |
| Analyze | feature-architect-agent | 30-60 min | Technical Specification |
| Build | full-stack-builder-agent | 2-4 hours | Feature branch with code |
| Review | code-reviewer-agent | 10 min | OK/FIXES/REWORK |
| Ship | - | 5 min | Feature in production |

**Total: 4-7 hours** for a typical MVP feature.

---

## Agent Decision Matrix

```
¿Qué agente uso?

  ¿Validar idea?           → business-advisor-agent
  ¿Analizar/especificar?   → feature-architect-agent
  ¿Implementar?            → full-stack-builder-agent
  ¿Arreglar bug?           → debugger-agent
  ¿Generar código UI?      → ui-pattern-generator-agent
  ¿Revisar código?         → code-reviewer-agent
  ¿Revisar visual?         → design-system-reviewer-agent
  ¿Evaluar UX/flujo?       → usability-analyst-agent
```

---

## Tips for Best Results

### Good Feature Descriptions
```
# Good - specific and clear
/feature-quick Add a "copy link" button to share trip publicly via URL

# Bad - vague
/feature-quick Add sharing feature
```

### When to Use This Command
- New features (small to medium scope)
- Feature enhancements
- New UI components
- New API endpoints

### When NOT to Use This Command
- Bug fixes (use debugger-agent directly)
- Refactoring (too risky for quick workflow)
- Infrastructure changes (needs careful planning)
- Large features (break into smaller pieces first)

---

## Troubleshooting

### "Feature is too complex"
- Break it into smaller features
- Do Phase 1 validation for each piece
- Ship incrementally

### "Unclear requirements"
- Stop at Phase 2 (Analyze)
- Let feature-architect-agent identify what's unclear
- Answer decision questions before building

### "Analysis finds missing dependencies"
- This is the system working correctly!
- Address dependencies before building
- May need to descope or phase the feature

### "Build phase takes too long"
- Feature scope was too large
- Phase 2 analysis may have missed complexity
- Descope and re-plan

### "Review finds major issues"
- Back to Build phase with feedback
- Check if specification was followed
- May need re-analysis if spec was wrong

---

## Why ANALYZE Phase is Critical

Without proper analysis (Phase 2), features fail because:

| Problem | Example | Result |
|---------|---------|--------|
| **No data source** | AI "invents" flight data | Useless feature - fake data |
| **Missing API** | UI but no endpoint | Feature doesn't work |
| **No UI entry point** | Backend without frontend | Users can't access feature |
| **Wrong assumptions** | Didn't check similar patterns | Inconsistent with app |
| **Missed files** | Forgot to update prompts | AI doesn't generate new data |

The `feature-architect-agent` catches these issues BEFORE you waste hours building.

---

## Example Flow

```
User: /feature-quick Add flight search to the app

PHASE 1: VALIDATE
→ business-advisor-agent: "GO - Pain 4/5, Adoption 60%, Effort ~8h"

PHASE 2: ANALYZE
→ feature-architect-agent investigates:
   - Found: Hotels use Google Places API
   - Found: Flights need external API (Skyscanner, Duffel, etc.)
   - Found: FlightsSection exists but has no search
   - Found: AI prompts don't include flights
   - Missing: /api/flights/search endpoint
   - Missing: FlightSearch component
   - Decision needed: Which flight API to use?

→ Output: NEEDS DECISIONS
   - User picks: Skyscanner (free redirect model)

→ Output: READY with full specification

PHASE 3: BUILD
→ full-stack-builder-agent implements with specification

PHASE 4: REVIEW
→ code-reviewer-agent: "OK TO MERGE"

PHASE 5: SHIP
→ Merge, deploy, test in production
```
