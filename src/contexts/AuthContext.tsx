'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

// ============================================
// Types
// ============================================

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

// ============================================
// Context
// ============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ============================================
// Provider
// ============================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Initialize Supabase client (singleton pattern via createClient)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession()
        setSession(initialSession)
        setUser(initialSession?.user ?? null)
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession)
        setUser(currentSession?.user ?? null)
        setLoading(false)

        // Handle specific auth events if needed
        if (event === 'SIGNED_OUT') {
          // Clear any local state/cache if needed
        } else if (event === 'SIGNED_IN') {
          // Refresh data or redirect if needed
        } else if (event === 'TOKEN_REFRESHED') {
          // Session was refreshed
        }
      }
    )

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  // Sign in with email/password
  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    setLoading(false)
    return { error }
  }, [supabase.auth])

  // Sign up with email/password
  const signUp = useCallback(async (email: string, password: string) => {
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Redirect to app after email confirmation
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    setLoading(false)
    return { error }
  }, [supabase.auth])

  // Sign out
  const signOut = useCallback(async () => {
    setLoading(true)
    await supabase.auth.signOut()
    setLoading(false)
  }, [supabase.auth])

  // Sign in with Google OAuth
  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { error }
  }, [supabase.auth])

  // Check if user is admin based on email
  const isAdmin = useMemo(() => {
    if (!user?.email) return false
    const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || []
    return adminEmails.includes(user.email.toLowerCase())
  }, [user?.email])

  const value: AuthContextType = {
    user,
    session,
    loading,
    isAdmin,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// ============================================
// Hook
// ============================================

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// ============================================
// Utility Hook - Get user ID safely
// ============================================

export function useUserId(): string | null {
  const { user } = useAuth()
  return user?.id ?? null
}
