/**
 * ChatMessage Component
 *
 * Renders an individual chat message (user or assistant)
 * with appropriate styling, avatar, and markdown support
 */

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { ChatMessage as ChatMessageType } from "@/types/ai-agent"

interface ChatMessageProps {
  message: ChatMessageType
  isLatest: boolean
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('es', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-3",
        isUser && "flex-row-reverse"
      )}
    >
      {/* Avatar */}
      <Avatar size="sm" className="shrink-0 mt-1">
        <AvatarFallback className={cn(
          isUser && "bg-primary text-primary-foreground",
          isAssistant && "bg-secondary text-secondary-foreground"
        )}>
          {isUser ? "TU" : "AI"}
        </AvatarFallback>
      </Avatar>

      {/* Message content */}
      <div className={cn(
        "flex flex-col gap-1 max-w-[85%]",
        isUser && "items-end"
      )}>
        <div className={cn(
          "rounded-2xl px-4 py-2.5 text-sm",
          isUser && "bg-primary text-primary-foreground",
          isAssistant && "bg-muted text-foreground"
        )}>
          {isAssistant ? (
            // Render markdown for assistant messages
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                // Custom components for better styling
                p: ({ children }) => (
                  <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="mb-2 last:mb-0 ml-4 list-disc">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="mb-2 last:mb-0 ml-4 list-decimal">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="mb-1">{children}</li>
                ),
                code: ({ inline, children, ...props }: any) =>
                  inline ? (
                    <code className="px-1.5 py-0.5 rounded bg-muted/50 text-foreground font-mono text-xs">
                      {children}
                    </code>
                  ) : (
                    <code className="block px-3 py-2 rounded bg-muted/50 text-foreground font-mono text-xs overflow-x-auto" {...props}>
                      {children}
                    </code>
                  ),
                a: ({ children, href }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:no-underline"
                  >
                    {children}
                  </a>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold">{children}</strong>
                ),
                em: ({ children }) => (
                  <em className="italic">{children}</em>
                ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          ) : (
            // Plain text for user messages
            <p className="whitespace-pre-wrap break-words leading-relaxed">
              {message.content}
            </p>
          )}
        </div>

        {/* Timestamp */}
        <span className="text-xs text-muted-foreground px-2">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  )
}
