---
name: skill-supabase-patterns
description: Supabase integration patterns for Travelr (Auth, Database, RLS)
topics: ["supabase", "database", "auth", "postgresql", "rls"]
---

# Supabase Patterns Skill

Travelr uses Supabase for authentication, database, and storage.

**IMPORTANT**: Always use Context7 MCP for latest Supabase documentation before implementing.

---

## Client Setup

### Browser Client (Client Components)
```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Server Client (API Routes, Server Components)
```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch { /* Server component context */ }
        },
      },
    }
  )
}
```

### Admin Client (Bypass RLS)
```typescript
// src/lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

---

## Query Patterns

### Select
```typescript
// Single row
const { data, error } = await supabase
  .from('trips')
  .select('*')
  .eq('id', tripId)
  .single()

// Multiple rows with filters
const { data, error } = await supabase
  .from('trips')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })

// With related data
const { data, error } = await supabase
  .from('trips')
  .select(`
    *,
    generation_states (status, progress)
  `)
  .eq('id', tripId)
  .single()
```

### Insert
```typescript
const { data, error } = await supabase
  .from('trips')
  .insert({
    user_id: user.id,
    destination: 'Costa Rica',
    start_date: '2024-12-07',
    end_date: '2024-12-13',
  })
  .select()
  .single()
```

### Update
```typescript
const { data, error } = await supabase
  .from('trips')
  .update({
    destination: 'Updated Destination',
    updated_at: new Date().toISOString(),
  })
  .eq('id', tripId)
  .eq('user_id', user.id) // Always include user check
  .select()
  .single()
```

### Upsert
```typescript
const { error } = await supabase
  .from('generation_states')
  .upsert(
    {
      trip_id: tripId,
      status: 'generating',
      progress: 0,
    },
    { onConflict: 'trip_id' }
  )
```

### Delete
```typescript
const { error } = await supabase
  .from('trips')
  .delete()
  .eq('id', tripId)
  .eq('user_id', user.id) // Always include user check
```

---

## Error Handling Pattern

```typescript
try {
  const { data, error: fetchError } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single()

  if (fetchError) {
    // Handle specific error codes
    if (fetchError.code === 'PGRST116') {
      // "no rows returned" - expected in some cases
      return null
    }
    throw fetchError
  }

  return data
} catch (err) {
  setError(err instanceof Error ? err : new Error('Unknown error'))
  return null
} finally {
  setLoading(false)
}
```

### Common Error Codes:
- `PGRST116` - No rows returned (single() with no match)
- `23505` - Unique constraint violation
- `23503` - Foreign key violation
- `42501` - RLS policy violation

---

## Auth Pattern

### Using AuthContext
```typescript
'use client'

import { useAuth } from '@/contexts/AuthContext'

export function MyComponent() {
  const { user, session, loading, isAdmin, signOut } = useAuth()

  if (loading) return <Loading />
  if (!user) return <Redirect to="/login" />

  // User is authenticated
  return <div>Welcome, {user.email}</div>
}
```

### AuthContext provides:
```typescript
interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<{ error: AuthError | null }>
}
```

### Reference: `src/contexts/AuthContext.tsx`

---

## Hook Pattern with Supabase

```typescript
'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import type { Trip } from '@/types/database'

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuth()
  const supabase = createClient()

  const fetchTrips = useCallback(async () => {
    if (!user) {
      setTrips([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setTrips(data || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch trips'))
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    fetchTrips()
  }, [fetchTrips])

  return { trips, loading, error, refetch: fetchTrips }
}
```

### Reference: `src/hooks/useTrips.ts`

---

## Migration Pattern

### Creating a Migration
```bash
# Create new migration
npx supabase migration new feature_name

# Apply migrations locally
npx supabase db push

# Generate types after migration
npx supabase gen types typescript --linked > src/types/database.ts
```

### Migration File Structure
```sql
-- supabase/migrations/YYYYMMDDHHMMSS_feature_name.sql

-- Create table
CREATE TABLE IF NOT EXISTS new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index
CREATE INDEX idx_new_table_user_id ON new_table(user_id);

-- Enable RLS
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own data"
  ON new_table FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data"
  ON new_table FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data"
  ON new_table FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own data"
  ON new_table FOR DELETE
  USING (auth.uid() = user_id);
```

---

## RLS Policy Pattern

### Standard User-Owned Resource
```sql
-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Select: User can read their own rows
CREATE POLICY "select_own" ON table_name
  FOR SELECT USING (auth.uid() = user_id);

-- Insert: User can only insert with their user_id
CREATE POLICY "insert_own" ON table_name
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update: User can only update their own rows
CREATE POLICY "update_own" ON table_name
  FOR UPDATE USING (auth.uid() = user_id);

-- Delete: User can only delete their own rows
CREATE POLICY "delete_own" ON table_name
  FOR DELETE USING (auth.uid() = user_id);
```

---

## Caching Pattern

For external API results, cache in Supabase:

```typescript
// Generate deterministic cache key
const cacheKey = `${origin_lat}_${origin_lng}_${dest_lat}_${dest_lng}_${mode}`

// Check cache first
const { data: cached } = await supabase
  .from('directions_cache')
  .select('travel_info')
  .eq('cache_key', cacheKey)
  .gt('expires_at', new Date().toISOString())
  .single()

if (cached?.travel_info) {
  return cached.travel_info
}

// Fetch from external API
const result = await fetchFromExternalAPI()

// Fire-and-forget cache write
supabase
  .from('directions_cache')
  .upsert({
    cache_key: cacheKey,
    travel_info: result,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
  })
  .then(() => {})
  .catch(console.error)

return result
```

### Reference: `src/app/api/directions/route.ts`
