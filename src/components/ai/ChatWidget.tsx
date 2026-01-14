/**
 * ChatWidget Component
 *
 * Floating chat widget that opens a Sheet with the AI Travel Agent chat.
 * Allows users to interact with the AI to modify their itinerary through
 * natural language.
 */

"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { ChatMessage } from "./ChatMessage"
import { TypingIndicator } from "./TypingIndicator"
import { useChatConversation } from "@/hooks/useChatConversation"
import { usePlan } from "@/hooks/usePlan"
import { cn } from "@/lib/utils"
import type { GeneratedPlan } from "@/types/plan"

interface ChatWidgetProps {
  tripId: string
}

export function ChatWidget({ tripId }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const {
    messages,
    loading,
    isStreaming,
    error,
    sendMessage,
    canContinue,
    continueConversation,
    placesMap,
  } = useChatConversation({ tripId })

  // Get itinerary days for place chips
  const { planData } = usePlan(tripId)
  const days = (planData as unknown as GeneratedPlan)?.itinerary || []

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  // Focus textarea when sheet opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      // Small delay to ensure sheet animation completes
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  const handleSend = async () => {
    if (!inputValue.trim() || isStreaming) return

    const messageToSend = inputValue.trim()
    setInputValue('') // Clear input immediately

    await sendMessage(messageToSend)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter, new line on Shift+Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Floating button - bottom right corner */}
      <Button
        size="icon-lg"
        className={cn(
          "fixed bottom-6 right-6 z-50 shadow-lg",
          "h-14 w-14 rounded-full",
          "bg-primary hover:bg-primary/90 text-primary-foreground",
          "transition-all duration-200",
          isOpen && "scale-0"
        )}
        onClick={() => setIsOpen(true)}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
        <span className="sr-only">Abrir chat con AI</span>
      </Button>

      {/* Chat Sheet */}
      <Sheet
        open={isOpen}
        onOpenChange={(open) => {
          // Prevent closing while streaming to avoid aborting the request
          if (!open && isStreaming) return
          setIsOpen(open)
        }}
      >
        <SheetContent
          side="right"
          className="w-full sm:max-w-md p-0 flex flex-col"
        >
          <SheetTitle className="sr-only">Chat con AI Travel Agent</SheetTitle>

          {/* Header */}
          <div className="border-b border-slate-700/50 bg-slate-900/50 px-5 py-3.5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center ring-1 ring-emerald-500/30">
                <svg
                  className="w-4.5 h-4.5 text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-sm text-slate-100">Asistente de Viaje</h2>
                <p className="text-xs text-slate-400">
                  {isStreaming ? (
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      Respondiendo...
                    </span>
                  ) : (
                    "Ayudándote a planear tu itinerario"
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin text-2xl mb-2">⏳</div>
                  <p className="text-sm text-muted-foreground">Cargando mensajes...</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h3 className="font-medium mb-2">Empieza una conversación</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Puedo ayudarte a agregar, mover o eliminar actividades de tu itinerario.
                </p>

                {/* Example prompts */}
                <div className="mt-6 space-y-2 w-full max-w-xs">
                  <p className="text-xs text-muted-foreground font-medium mb-3">
                    Ejemplos:
                  </p>
                  {[
                    "Agrega un restaurante para la cena del día 2",
                    "Mueve la visita al museo al día 3",
                    "Sugiere actividades para el día 1"
                  ].map((example, i) => (
                    <button
                      key={i}
                      className="w-full text-left px-3 py-2 text-xs rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                      onClick={() => setInputValue(example)}
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-4">
                {messages.map((message, index) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    isLatest={index === messages.length - 1}
                    onSendMessage={sendMessage}
                    currentDayNumber={1}
                    placesMap={placesMap}
                    days={days}
                  />
                ))}

                {/* Typing indicator */}
                {isStreaming && (
                  <div className="flex gap-3 px-4 py-3">
                    <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-1">
                      <span className="text-xs font-medium text-secondary-foreground">AI</span>
                    </div>
                    <div className="bg-muted rounded-2xl">
                      <TypingIndicator />
                    </div>
                  </div>
                )}

                {/* Continue button - shown when step limit was reached */}
                {canContinue && !isStreaming && (
                  <div className="mx-4 mb-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={continueConversation}
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 5l7 7-7 7M5 5l7 7-7 7"
                        />
                      </svg>
                      Continuar donde me quedé
                    </Button>
                  </div>
                )}

                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="mx-4 mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{error.message}</p>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="border-t border-slate-700/50 bg-slate-900/30 px-4 py-3 shrink-0">
            <div className="flex gap-2 items-end">
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu mensaje..."
                disabled={isStreaming}
                className="resize-none min-h-[42px] max-h-32 bg-slate-800/50 border-slate-700/50 focus:border-emerald-500/50 focus:ring-emerald-500/20 placeholder:text-slate-500"
                rows={1}
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!inputValue.trim() || isStreaming}
                className="shrink-0 h-[42px] w-[42px] bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500"
              >
                <svg
                  className="w-4.5 h-4.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
                <span className="sr-only">Enviar mensaje</span>
              </Button>
            </div>

            <p className="text-[11px] text-slate-500 mt-2 px-1">
              Presiona Enter para enviar, Shift+Enter para nueva línea
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
