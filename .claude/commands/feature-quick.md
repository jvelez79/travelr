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

### PHASE 1: VALIDATE (15 min)

**Goal**: Decide if this feature is worth building.

**What happens:**
1. Invoke `business-advisor-agent` with the feature idea
2. Agent analyzes:
   - Pain point severity (1-5)
   - User adoption potential (%)
   - MVP effort estimate (hours)
   - Complexity and risk assessment
3. Agent outputs: **GO / MAYBE / NO-GO** recommendation

**Your action:**
- If **GO**: Proceed to Phase 2
- If **MAYBE**: Review suggestions, descope if needed, re-validate
- If **NO-GO**: Discard idea or save for later

---

### PHASE 2: PLAN (15-30 min)

**Goal**: Define exactly what to build.

**What happens:**
1. Based on MVP scope from Phase 1, create implementation checklist:
   - Database changes (tables, columns, RLS)
   - API routes needed
   - Hooks needed (new or modified)
   - Components needed (new or modified)
   - Tests to write

2. Output: Implementation checklist with files to create/modify

**Your action:**
- Review the plan
- Approve or adjust scope
- Note any unclear requirements

---

### PHASE 3: BUILD (2-4 hours)

**Goal**: Implement the feature.

**What happens:**
1. Invoke `full-stack-builder-agent` with:
   - Feature specification
   - MVP scope
   - Implementation checklist
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

**What happens:**
1. Invoke `code-reviewer-agent` to check:
   - Code runs without errors
   - Tests pass
   - Follows existing patterns
   - No obvious bugs or security issues
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
2. Vercel auto-deploys (if configured)
3. Verify in production

**Your action:**
- Merge the PR
- Test the feature in production
- Monitor for errors (first 24 hours)

---

## Quick Reference

| Phase | Time | Output |
|-------|------|--------|
| Validate | 15 min | GO/MAYBE/NO-GO + MVP scope |
| Plan | 15-30 min | Implementation checklist |
| Build | 2-4 hours | Feature branch with code |
| Review | 10 min | OK/FIXES/REWORK |
| Ship | 5 min | Feature in production |

**Total: 3-6 hours** for a typical MVP feature.

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
- Stop and clarify before building
- Ask specific questions
- Document assumptions

### "Build phase takes too long"
- Feature scope was too large
- Descope and re-plan
- Consider splitting into v1/v2

### "Review finds major issues"
- Back to Plan phase
- Understand what went wrong
- Adjust implementation approach
