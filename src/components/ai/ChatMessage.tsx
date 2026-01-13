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
import type { ChatMessage as ChatMessageType, PlaceSearchResult, PlaceChipData } from "@/types/ai-agent"
import type { ItineraryDay } from "@/types/plan"
import { PlaceResultCard } from "@/components/ai/PlaceResultCard"
import { PlaceChip } from "@/components/ai/PlaceChip"

interface ChatMessageProps {
  message: ChatMessageType
  isLatest: boolean
  onSendMessage?: (message: string) => void
  currentDayNumber?: number
  placesMap?: Record<string, PlaceChipData>
  days?: ItineraryDay[]
}

export function ChatMessage({
  message,
  onSendMessage,
  currentDayNumber = 1,
  placesMap = {},
  days = []
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

  /**
   * Pre-process content to auto-correct place chip format
   * Uses pattern-based detection to convert [ChIJ...] to [[place:ChIJ...]]
   * This works independently of placesMap to avoid race conditions
   */
  const autoCorrectPlaceFormat = (content: string): string => {
    // Google Place IDs: typically 27-50 chars, start with ChIJ, contain alphanumeric + _ -
    // Pattern 1: [ChIJ...] (single bracket, no "place:")
    // Negative lookahead (?!\]) prevents matching [[...]]
    const singleBracketPattern = /\[(ChIJ[A-Za-z0-9_-]{20,50})\](?!\])/g

    // Pattern 2: [place:ChIJ...] (single bracket with "place:")
    const singleBracketPlacePattern = /\[place:(ChIJ[A-Za-z0-9_-]{20,50})\](?!\])/g

    let corrected = content
    corrected = corrected.replace(singleBracketPattern, '[[place:$1]]')
    corrected = corrected.replace(singleBracketPlacePattern, '[[place:$1]]')

    return corrected
  }

  /**
   * Parse message content to extract place chip references
   * Looks for [[place:PLACE_ID]] syntax and returns array of text/chip parts
   */
  const parsePlaceChips = (content: string): Array<{
    type: 'text' | 'chip'
    content: string
    placeId?: string
  }> => {
    // First auto-correct any malformed place references
    const correctedContent = autoCorrectPlaceFormat(content)

    const chipRegex = /\[\[place:([^\]]+)\]\]/g
    const parts: Array<{ type: 'text' | 'chip', content: string, placeId?: string }> = []

    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = chipRegex.exec(correctedContent)) !== null) {
      // Add text before the chip
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: correctedContent.slice(lastIndex, match.index)
        })
      }

      // Add chip
      parts.push({
        type: 'chip',
        content: '',
        placeId: match[1]
      })

      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < correctedContent.length) {
      parts.push({
        type: 'text',
        content: correctedContent.slice(lastIndex)
      })
    }

    // If no chips found, return the full content as text
    if (parts.length === 0) {
      parts.push({ type: 'text', content: correctedContent })
    }

    return parts
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
            // Render markdown for assistant messages with place chips
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {parsePlaceChips(textContent).map((part, idx) => {
                if (part.type === 'text') {
                  return (
                    <ReactMarkdown
                      key={idx}
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
                      {part.content}
                    </ReactMarkdown>
                  )
                } else if (part.type === 'chip' && part.placeId) {
                  // Render PlaceChip component
                  const placeData = placesMap[part.placeId]
                  if (placeData) {
                    return (
                      <PlaceChip
                        key={idx}
                        placeId={part.placeId}
                        placeData={placeData}
                        days={days}
                      />
                    )
                  } else {
                    // Loading placeholder - will re-render when placesMap updates
                    return (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 mx-0.5 bg-muted/50 rounded-full text-sm animate-pulse"
                        title="Cargando lugar..."
                      >
                        <span className="w-4 h-4 bg-muted-foreground/20 rounded-full shrink-0" />
                        <span className="w-24 h-3 bg-muted-foreground/20 rounded" />
                      </span>
                    )
                  }
                }
                return null
              })}
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
