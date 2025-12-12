import { spawn, ChildProcess } from 'child_process'
import type { AIProvider, AICompletionOptions, AICompletionResponse } from '../types'

const DEFAULT_TIMEOUT = 30000 // 30 seconds

/**
 * Claude CLI Provider
 * Uses the Claude Code CLI for AI completions (leverages Max subscription)
 * Only works server-side in development
 */
export class ClaudeCLIProvider implements AIProvider {
  name = 'claude-cli' as const

  async complete(options: AICompletionOptions): Promise<AICompletionResponse> {
    const { messages, systemPrompt, timeout = DEFAULT_TIMEOUT } = options

    // Build the user prompt from messages
    let prompt = ''
    for (const msg of messages) {
      if (msg.role === 'user') {
        prompt += msg.content + '\n'
      } else if (msg.role === 'assistant') {
        prompt += `[Previous assistant response: ${msg.content}]\n`
      }
    }

    return new Promise((resolve, reject) => {
      const args = ['-p', prompt.trim()]

      if (systemPrompt) {
        args.push('--system-prompt', systemPrompt)
      }

      let proc: ChildProcess
      let timeoutId: NodeJS.Timeout | null = null
      let isResolved = false

      const cleanup = () => {
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
      }

      const handleResolve = (response: AICompletionResponse) => {
        if (isResolved) return
        isResolved = true
        cleanup()
        resolve(response)
      }

      const handleReject = (error: Error) => {
        if (isResolved) return
        isResolved = true
        cleanup()
        // Kill the process if still running
        if (proc && !proc.killed) {
          proc.kill('SIGTERM')
        }
        reject(error)
      }

      // Set up timeout
      timeoutId = setTimeout(() => {
        handleReject(new Error(`Claude CLI timed out after ${timeout}ms`))
      }, timeout)

      try {
        proc = spawn('claude', args, {
          stdio: ['pipe', 'pipe', 'pipe'],
          env: { ...process.env },
        })
      } catch (error) {
        handleReject(new Error(`Failed to spawn Claude CLI: ${error instanceof Error ? error.message : 'Unknown error'}`))
        return
      }

      let stdout = ''
      let stderr = ''

      proc.stdout?.on('data', (data) => {
        stdout += data.toString()
      })

      proc.stderr?.on('data', (data) => {
        stderr += data.toString()
      })

      proc.on('close', (code) => {
        if (code !== 0) {
          console.error('Claude CLI stderr:', stderr)
          handleReject(new Error(`Claude CLI exited with code ${code}: ${stderr}`))
          return
        }

        handleResolve({
          content: stdout.trim(),
        })
      })

      proc.on('error', (error) => {
        console.error('Claude CLI spawn error:', error)
        handleReject(new Error(`Failed to spawn Claude CLI: ${error.message}`))
      })
    })
  }
}
