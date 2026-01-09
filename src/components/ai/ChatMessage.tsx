/**
 * ChatMessage Component
 *
 * Renders an individual chat message (user or assistant)
 * with appropriate styling, avatar, and markdown support.
 * Also detects and renders PlaceResultCards for Google Places search results.
 */

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { ChatMessage as ChatMessageType, PlaceSearchResult } from "@/types/ai-agent"
import { PlaceResultCard } from "@/components/ai/PlaceResultCard"

interface ChatMessageProps {
  message: ChatMessageType
  isLatest: boolean
  onSendMessage?: (message: string) => void
  currentDayNumber?: number
}

export function ChatMessage({
  message,
  onSendMessage,
  currentDayNumber = 1
}: ChatMessageProps) {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'

  // Track which places have been added
  const [addedPlaces, setAddedPlaces] = useState<Set<string>>(new Set())

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('es', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  /**
   * Parse message content to extract place search results
   * Looks for ```places code blocks containing JSON
   */
  const parsePlaces = (content: string): {
    places: PlaceSearchResult[] | null
    textContent: string
  } => {
    const placesRegex = /```places\n([\s\S]*?)\n```/
    const match = content.match(placesRegex)

    if (!match) {
      return { places: null, textContent: content }
    }

    try {
      const places = JSON.parse(match[1]) as PlaceSearchResult[]
      // Remove the places block from the text content
      const textContent = content.replace(placesRegex, '').trim()
      return { places, textContent }
    } catch (error) {
      console.error('[ChatMessage] Failed to parse places JSON:', error)
      return { places: null, textContent: content }
    }
  }

  /**
   * Handle adding a place to the itinerary
   */
  const handleAddPlace = (place: PlaceSearchResult) => {
    // Mark as added
    setAddedPlaces(prev => new Set(prev).add(place.id))

    // Send message to AI to add the place
    const message = `Agregar "${place.name}" al día ${currentDayNumber}`
    onSendMessage?.(message)
  }

  // Parse places from message content (for assistant messages only)
  const { places, textContent } = isAssistant
    ? parsePlaces(message.content)
    : { places: null, textContent: message.content }

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
        {/* Message bubble */}
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
                {textContent}
              </ReactMarkdown>
            </div>
          ) : (
            // Plain text for user messages
            <p className="whitespace-pre-wrap break-words leading-relaxed">
              {message.content}
            </p>
          )}
        </div>

        {/* Place result cards (only for assistant messages with places) */}
        {places && places.length > 0 && (
          <div className="mt-3 space-y-2">
            {places.map((place) => (
              <PlaceResultCard
                key={place.id}
                place={place}
                onAdd={() => handleAddPlace(place)}
                dayNumber={currentDayNumber}
                isAdded={addedPlaces.has(place.id)}
              />
            ))}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-xs text-muted-foreground px-2">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  )
}
