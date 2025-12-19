/**
 * Utility functions for AI response handling
 */

/**
 * Extract JSON from AI response content.
 * Handles markdown code blocks that Claude often adds around JSON.
 */
function extractJSON(content: string): string | null {
  let text = content.trim()

  // Remove markdown code blocks if present (```json or ```)
  text = text.replace(/^```(?:json)?\s*\n?/i, '')
  text = text.replace(/\n?```\s*$/i, '')
  text = text.trim()

  // Extract JSON object
  const match = text.match(/\{[\s\S]*\}/)
  return match ? match[0] : null
}

/**
 * Attempt to repair truncated JSON from AI responses
 * Handles: unclosed strings, trailing commas, unclosed brackets/braces
 */
function repairJSON(jsonStr: string): string {
  let repaired = jsonStr.trim()

  // First pass: find the last complete, balanced structure
  // This helps handle cases where truncation happens mid-element
  let lastValidEnd = -1
  let depth = 0
  let inString = false
  let escape = false

  for (let i = 0; i < repaired.length; i++) {
    const char = repaired[i]

    if (escape) {
      escape = false
      continue
    }

    if (char === '\\' && inString) {
      escape = true
      continue
    }

    if (char === '"') {
      inString = !inString
      continue
    }

    if (!inString) {
      if (char === '{' || char === '[') {
        depth++
      } else if (char === '}' || char === ']') {
        depth--
        // After closing a bracket at depth 1, we have a potentially valid end point
        if (depth >= 0) {
          lastValidEnd = i
        }
      } else if (char === ',' && depth === 1) {
        // A comma at depth 1 means we completed an array/object element
        lastValidEnd = i
      }
    }
  }

  // If we ended inside a string, try to close it and continue
  if (inString) {
    repaired += '"'
  }

  // Remove trailing incomplete content more aggressively
  // Pattern: truncated in middle of object property
  repaired = repaired.replace(/,\s*"[^"]*"?\s*:\s*("[^"]*)?$/, '')
  // Pattern: truncated in middle of array with incomplete object
  repaired = repaired.replace(/,\s*\{[^}]*$/, '')
  // Pattern: truncated string value
  repaired = repaired.replace(/:\s*"[^"]*$/, ': ""')
  // Pattern: truncated number
  repaired = repaired.replace(/:\s*-?\d+\.?\d*$/, function(match) {
    // Check if it looks complete (ends with digit)
    if (/\d$/.test(match)) return match
    return ': 0'
  })
  // Pattern: incomplete key
  repaired = repaired.replace(/,\s*"[^"]*$/, '')
  // Pattern: trailing incomplete number in array
  repaired = repaired.replace(/,\s*\d+\.?\d*$/, '')
  // Pattern: missing value after colon
  repaired = repaired.replace(/:\s*$/, ': null')
  // Pattern: incomplete boolean
  repaired = repaired.replace(/:\s*(tru|fals)e?$/, ': null')
  // Pattern: incomplete null
  repaired = repaired.replace(/:\s*nul?l?$/, ': null')

  // Remove trailing commas before closing brackets
  repaired = repaired.replace(/,(\s*[}\]])/g, '$1')
  repaired = repaired.replace(/,\s*$/, '')

  // Recount brackets to close properly
  const stack: string[] = []
  inString = false
  escape = false

  for (let i = 0; i < repaired.length; i++) {
    const char = repaired[i]

    if (escape) {
      escape = false
      continue
    }

    if (char === '\\' && inString) {
      escape = true
      continue
    }

    if (char === '"') {
      inString = !inString
      continue
    }

    if (!inString) {
      if (char === '{' || char === '[') {
        stack.push(char)
      } else if (char === '}') {
        if (stack.length > 0 && stack[stack.length - 1] === '{') {
          stack.pop()
        }
      } else if (char === ']') {
        if (stack.length > 0 && stack[stack.length - 1] === '[') {
          stack.pop()
        }
      }
    }
  }

  // Close brackets/braces in reverse order
  while (stack.length > 0) {
    const open = stack.pop()
    repaired += open === '{' ? '}' : ']'
  }

  return repaired
}

/**
 * Safely parse JSON from AI response with better error reporting and repair
 */
export function parseAIResponse<T>(content: string, context: string): T | null {
  const jsonStr = extractJSON(content)

  if (!jsonStr) {
    console.error(`[${context}] No JSON found in response`)
    console.error(`[${context}] Raw content (first 500 chars):`, content.substring(0, 500))
    return null
  }

  // First try parsing as-is
  try {
    return JSON.parse(jsonStr) as T
  } catch (firstError) {
    const parseError = firstError as Error
    console.error(`[${context}] JSON parse error:`, parseError.message)

    // Show context around the error position
    const posMatch = parseError.message.match(/position (\d+)/)
    if (posMatch) {
      const pos = parseInt(posMatch[1], 10)
      const start = Math.max(0, pos - 100)
      const end = Math.min(jsonStr.length, pos + 100)
      console.error(`[${context}] Context around error (pos ${pos}):`)
      console.error(`[${context}] ...${jsonStr.substring(start, end)}...`)
    }

    // Try to repair the JSON
    console.error(`[${context}] Attempting JSON repair...`)
    try {
      const repaired = repairJSON(jsonStr)
      const result = JSON.parse(repaired) as T
      console.log(`[${context}] JSON repair successful!`)
      return result
    } catch (repairError) {
      console.error(`[${context}] JSON repair failed:`, (repairError as Error).message)
      console.error(`[${context}] First 500 chars:`, jsonStr.substring(0, 500))
      return null
    }
  }
}
