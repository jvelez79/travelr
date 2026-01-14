'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useAIPrompt } from '@/hooks/useAIPrompts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Save, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function EditPromptPage() {
  const params = useParams()
  const key = params.key as string
  const { user, isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()
  const { prompt, loading, saving, error, updatePrompt } = useAIPrompt(key)

  // Local state for editing
  const [systemPrompt, setSystemPrompt] = useState('')
  const [userPrompt, setUserPrompt] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [hasChanges, setHasChanges] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Sync local state with fetched prompt
  useEffect(() => {
    if (prompt) {
      setSystemPrompt(prompt.system_prompt)
      setUserPrompt(prompt.user_prompt)
      setIsActive(prompt.is_active)
      setHasChanges(false)
    }
  }, [prompt])

  // Track changes
  useEffect(() => {
    if (prompt) {
      const changed =
        systemPrompt !== prompt.system_prompt ||
        userPrompt !== prompt.user_prompt ||
        isActive !== prompt.is_active
      setHasChanges(changed)
    }
  }, [systemPrompt, userPrompt, isActive, prompt])

  // Redirect non-admins
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/')
    }
  }, [user, isAdmin, authLoading, router])

  const handleSave = async () => {
    setSaveSuccess(false)
    const success = await updatePrompt({
      system_prompt: systemPrompt,
      user_prompt: userPrompt,
      is_active: isActive,
    })
    if (success) {
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    }
  }

  const handleReset = () => {
    if (prompt) {
      setSystemPrompt(prompt.system_prompt)
      setUserPrompt(prompt.user_prompt)
      setIsActive(prompt.is_active)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return null
  }

  if (!prompt) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center">
            <Link href="/admin/prompts">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Back to Prompts
              </Button>
            </Link>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Prompt not found: {key}
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/prompts">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                All Prompts
              </Button>
            </Link>
            <div className="h-6 w-px bg-border" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold">{prompt.name}</h1>
                <Badge variant="outline" className="text-xs">v{prompt.version}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{prompt.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {hasChanges && (
              <Button variant="outline" size="sm" onClick={handleReset} className="h-8">
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Reset
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="h-8"
            >
              {saving ? (
                <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5 mr-1.5" />
              )}
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Notifications */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
        {saveSuccess && (
          <div className="mb-6 p-4 bg-green-500/10 text-green-600 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Prompt saved successfully!
          </div>
        )}

        <div className="space-y-6">
          {/* Active Toggle */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="active-toggle"
                  checked={isActive}
                  onCheckedChange={(checked) => setIsActive(checked === true)}
                />
                <div>
                  <Label htmlFor="active-toggle" className="cursor-pointer">Active</Label>
                  <p className="text-sm text-muted-foreground">
                    When inactive, the system will use the fallback hardcoded prompt
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Prompt */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">System Prompt</CardTitle>
              <CardDescription>
                Defines the AI persona, rules, and behavior constraints
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
                placeholder="Enter system prompt..."
              />
              <div className="mt-2 text-xs text-muted-foreground text-right">
                {systemPrompt.length.toLocaleString()} characters
              </div>
            </CardContent>
          </Card>

          {/* User Prompt */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">User Prompt Template</CardTitle>
              <CardDescription>
                Template sent to the AI. Use {'{placeholder}'} for variables like {'{destination}'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                className="min-h-[500px] font-mono text-sm"
                placeholder="Enter user prompt template..."
              />
              <div className="mt-2 text-xs text-muted-foreground text-right">
                {userPrompt.length.toLocaleString()} characters
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Key</div>
                  <code className="px-2 py-1 bg-muted rounded text-xs">{prompt.key}</code>
                </div>
                <div>
                  <div className="text-muted-foreground">Version</div>
                  <div>{prompt.version}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Created</div>
                  <div>{new Date(prompt.created_at).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Last Updated</div>
                  <div>{new Date(prompt.updated_at).toLocaleString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
