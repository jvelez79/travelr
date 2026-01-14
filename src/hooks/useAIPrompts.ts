'use client'

import { useState, useEffect, useCallback } from 'react'
import type { AIPrompt, AIPromptUpdate } from '@/types/ai-prompts'

interface UseAIPromptsReturn {
  prompts: AIPrompt[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

interface UseAIPromptReturn {
  prompt: AIPrompt | null
  loading: boolean
  saving: boolean
  error: string | null
  refetch: () => Promise<void>
  updatePrompt: (update: AIPromptUpdate) => Promise<boolean>
}

/**
 * Hook to fetch all AI prompts
 */
export function useAIPrompts(): UseAIPromptsReturn {
  const [prompts, setPrompts] = useState<AIPrompt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPrompts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/admin/prompts')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch prompts')
      }

      setPrompts(data.prompts)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPrompts()
  }, [fetchPrompts])

  return { prompts, loading, error, refetch: fetchPrompts }
}

/**
 * Hook to fetch and update a single AI prompt
 */
export function useAIPrompt(key: string): UseAIPromptReturn {
  const [prompt, setPrompt] = useState<AIPrompt | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPrompt = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/prompts/${key}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch prompt')
      }

      setPrompt(data.prompt)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [key])

  const updatePrompt = useCallback(async (update: AIPromptUpdate): Promise<boolean> => {
    try {
      setSaving(true)
      setError(null)

      const response = await fetch(`/api/admin/prompts/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update prompt')
      }

      setPrompt(data.prompt)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return false
    } finally {
      setSaving(false)
    }
  }, [key])

  useEffect(() => {
    if (key) {
      fetchPrompt()
    }
  }, [key, fetchPrompt])

  return { prompt, loading, saving, error, refetch: fetchPrompt, updatePrompt }
}
