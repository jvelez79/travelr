---
name: skill-tdd-nextjs
description: Quick MVP testing patterns for Travelr (happy path + edge cases)
topics: ["testing", "tdd", "jest", "react-testing-library", "playwright"]
---

# TDD Next.js Skill

Quick testing patterns for Travelr's MVP workflow.

## Testing Philosophy

For solo dev MVP:
- **Test what matters**: Happy path + 1 critical edge case
- **Don't over-test**: 50-60% coverage is fine for MVP
- **Fast feedback**: Tests should run in seconds
- **Practical**: Test behavior, not implementation

---

## Coverage Targets

| Category | Target | Focus |
|----------|--------|-------|
| Critical paths | 80% | Auth, data mutations, core features |
| Utils/helpers | 60% | Pure functions, calculations |
| UI components | 40% | Smoke tests, key interactions |
| **Overall** | **50-60%** | Good enough for MVP |

---

## Hook Testing

### Pattern

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { useTrips } from './useTrips'

// Mock Supabase
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({
            data: [{ id: '1', destination: 'Costa Rica' }],
            error: null,
          }),
        }),
      }),
    }),
  }),
}))

// Mock Auth
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-123', email: 'test@example.com' },
  }),
}))

describe('useTrips', () => {
  // Happy path
  it('fetches trips successfully', async () => {
    const { result } = renderHook(() => useTrips())

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.trips).toHaveLength(1)
    expect(result.current.trips[0].destination).toBe('Costa Rica')
    expect(result.current.error).toBeNull()
  })

  // Edge case: no user
  it('returns empty when not authenticated', async () => {
    // Override mock for this test
    jest.spyOn(require('@/contexts/AuthContext'), 'useAuth').mockReturnValue({
      user: null,
    })

    const { result } = renderHook(() => useTrips())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.trips).toEqual([])
  })
})
```

---

## Component Testing

### Pattern

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ComponentName } from './ComponentName'

describe('ComponentName', () => {
  const defaultProps = {
    data: { id: '1', title: 'Test Trip' },
    onAction: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  // Happy path
  it('renders correctly with data', () => {
    render(<ComponentName {...defaultProps} />)

    expect(screen.getByText('Test Trip')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /action/i })).toBeEnabled()
  })

  it('calls onAction when button clicked', async () => {
    const user = userEvent.setup()
    render(<ComponentName {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: /action/i }))

    expect(defaultProps.onAction).toHaveBeenCalledWith('1')
  })

  // Edge case
  it('handles empty state', () => {
    render(<ComponentName {...defaultProps} data={{ id: '1', title: '' }} />)

    expect(screen.getByText('No title')).toBeInTheDocument()
  })

  // Loading state
  it('shows loading state', async () => {
    render(<ComponentName {...defaultProps} />)

    await userEvent.click(screen.getByRole('button'))

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })
})
```

---

## API Route Testing

### Pattern

```typescript
import { POST } from './route'
import { NextRequest } from 'next/server'

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      getUser: () => Promise.resolve({
        data: { user: { id: 'user-123' } },
        error: null,
      }),
    },
    from: () => ({
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({
            data: { id: 'new-id', title: 'New Trip' },
            error: null,
          }),
        }),
      }),
    }),
  }),
}))

describe('POST /api/trips', () => {
  // Happy path
  it('creates trip successfully', async () => {
    const request = new NextRequest('http://localhost/api/trips', {
      method: 'POST',
      body: JSON.stringify({ destination: 'Costa Rica' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.id).toBe('new-id')
  })

  // Edge case: missing field
  it('returns 400 for missing required field', async () => {
    const request = new NextRequest('http://localhost/api/trips', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  // Edge case: unauthorized
  it('returns 401 when not authenticated', async () => {
    // Override mock
    jest.spyOn(require('@/lib/supabase/server'), 'createClient').mockResolvedValue({
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      },
    })

    const request = new NextRequest('http://localhost/api/trips', {
      method: 'POST',
      body: JSON.stringify({ destination: 'Costa Rica' }),
    })

    const response = await POST(request)

    expect(response.status).toBe(401)
  })
})
```

---

## Utility Testing

### Pattern

```typescript
import { recalculateTimeline, formatDuration } from './timelineUtils'

describe('timelineUtils', () => {
  describe('recalculateTimeline', () => {
    // Happy path
    it('calculates correct times for activities', () => {
      const timeline = [
        { id: '1', activity: 'Breakfast', duration: 60 },
        { id: '2', activity: 'Museum', duration: 120 },
      ]

      const result = recalculateTimeline(timeline, '09:00')

      expect(result[0].time).toBe('09:00')
      expect(result[1].time).toBe('10:00') // After 60 min
    })

    // Edge case
    it('handles empty timeline', () => {
      const result = recalculateTimeline([])
      expect(result).toEqual([])
    })
  })

  describe('formatDuration', () => {
    it('formats minutes correctly', () => {
      expect(formatDuration(30)).toBe('30 min')
      expect(formatDuration(60)).toBe('1 hr')
      expect(formatDuration(90)).toBe('1 hr 30 min')
    })
  })
})
```

---

## Test File Organization

```
src/
├── hooks/
│   ├── useTrips.ts
│   └── useTrips.test.ts    # Test next to file
├── components/
│   └── trips/
│       ├── TripCard.tsx
│       └── TripCard.test.tsx
├── lib/
│   ├── timelineUtils.ts
│   └── timelineUtils.test.ts
└── app/
    └── api/
        └── trips/
            ├── route.ts
            └── route.test.ts
```

---

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific file
npm test -- useTrips.test.ts

# Run in watch mode
npm test -- --watch
```

---

## When to Write Tests

### Always Test
- Auth flows
- Data mutations (create, update, delete)
- Money/payment calculations
- Security-sensitive code

### Sometimes Test
- Complex UI interactions
- Data transformations
- Edge cases found in production

### Skip Testing (for MVP)
- Simple UI rendering
- Third-party library wrappers
- Prototype/experimental code

---

## Common Mocking Patterns

### Mock Supabase

```typescript
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}))

const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ data: mockData, error: null })),
      })),
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ data: mockData, error: null })),
      })),
    })),
  })),
}
```

### Mock Auth Context

```typescript
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    session: mockSession,
    loading: false,
  }),
}))
```

### Mock Next.js Router

```typescript
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/trips',
  useSearchParams: () => new URLSearchParams(),
}))
```
