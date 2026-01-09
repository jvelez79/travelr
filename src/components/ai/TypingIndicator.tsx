/**
 * TypingIndicator Component
 *
 * Animated indicator showing that the AI is "typing" a response
 */

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" />
      </div>
    </div>
  )
}
