'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'

interface AdminLinkProps {
  className?: string
  variant?: 'button' | 'text'
}

export function AdminLink({ className, variant = 'button' }: AdminLinkProps) {
  const { isAdmin } = useAuth()

  if (!isAdmin) {
    return null
  }

  if (variant === 'text') {
    return (
      <Link
        href="/admin/ai-logs"
        className={className || "text-sm text-muted-foreground hover:text-foreground transition-colors"}
      >
        Admin
      </Link>
    )
  }

  return (
    <Link href="/admin/ai-logs">
      <Button variant="ghost" size="sm" className={className || "text-muted-foreground hover:text-foreground"}>
        <Settings className="w-4 h-4 mr-2" />
        Admin
      </Button>
    </Link>
  )
}
