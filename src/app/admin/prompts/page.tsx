'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useAIPrompts } from '@/hooks/useAIPrompts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, RefreshCw, Pencil, Bot, MessageSquare } from 'lucide-react'

export default function AIPromptsPage() {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()
  const { prompts, loading, error, refetch } = useAIPrompts()

  // Redirect non-admins
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/')
    }
  }, [user, isAdmin, authLoading, router])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/trips">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Dashboard
              </Button>
            </Link>
            <div className="h-6 w-px bg-border" />
            <div>
              <h1 className="text-lg font-semibold">AI Prompts</h1>
              <p className="text-xs text-muted-foreground">Manage AI prompt templates</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={refetch} disabled={loading} className="h-8">
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid gap-4">
            {[1, 2].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-5 w-48 bg-muted rounded" />
                  <div className="h-4 w-96 bg-muted rounded mt-2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : prompts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No prompts found. Run the database migration to seed default prompts.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {prompts.map((prompt) => (
              <Card key={prompt.id} className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{prompt.name}</CardTitle>
                        <Badge variant={prompt.is_active ? 'default' : 'secondary'}>
                          {prompt.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          v{prompt.version}
                        </Badge>
                      </div>
                      <CardDescription>{prompt.description}</CardDescription>
                    </div>
                    <Link href={`/admin/prompts/${prompt.key}`}>
                      <Button size="sm">
                        <Pencil className="h-3.5 w-3.5 mr-1.5" />
                        Edit
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-start gap-2">
                      <Bot className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="font-medium text-muted-foreground">System Prompt</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {prompt.system_prompt.length.toLocaleString()} characters
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="font-medium text-muted-foreground">User Prompt</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {prompt.user_prompt.length.toLocaleString()} characters
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                    Key: <code className="px-1.5 py-0.5 bg-muted rounded">{prompt.key}</code>
                    <span className="mx-2">•</span>
                    Updated: {new Date(prompt.updated_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Admin Navigation */}
        <div className="mt-8 pt-8 border-t">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Admin Tools</h3>
          <div className="flex gap-3">
            <Link href="/admin/ai-logs">
              <Button variant="outline" size="sm">
                AI Logs
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
