import { useState, useCallback, useRef } from 'react'

const NUKE_SYSTEM_PROMPT = `You are Nuke, the AI mascot of Nuclear Marmalade — an AI automation agency.
You're friendly, energetic, slightly cheeky, and genuinely helpful.
You speak casually but with confidence. Keep responses to 2-3 sentences MAX
(they appear in a small speech bubble on a website). You help visitors understand what
Nuclear Marmalade does: building custom AI agents that handle phone calls,
emails, scheduling, and business operations. If someone asks about pricing
or specific projects, encourage them to "Book a Call" with the team.
Never break character. You're a little orange guy in a space suit who loves
AI and helping businesses automate. Use casual punctuation, occasional emoji.`

// API proxy endpoint — in dev this hits the Vite proxy, in prod hits the edge function
const CHAT_API_URL = '/api/chat'

export type ChatState = 'idle' | 'thinking' | 'streaming' | 'error'

interface UseNukeChatReturn {
  chatState: ChatState
  response: string
  sendMessage: (message: string) => Promise<void>
  clearResponse: () => void
}

export function useNukeChat(): UseNukeChatReturn {
  const [chatState, setChatState] = useState<ChatState>('idle')
  const [response, setResponse] = useState('')
  const abortRef = useRef<AbortController | null>(null)
  const historyRef = useRef<{ role: string; content: string }[]>([])

  const clearResponse = useCallback(() => {
    setResponse('')
    setChatState('idle')
  }, [])

  const sendMessage = useCallback(async (message: string) => {
    // Abort any in-flight request
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setChatState('thinking')
    setResponse('')

    // Add user message to history (keep last 6 turns for context)
    historyRef.current = [
      ...historyRef.current.slice(-5),
      { role: 'user', content: message },
    ]

    try {
      const res = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: NUKE_SYSTEM_PROMPT,
          messages: historyRef.current,
        }),
        signal: controller.signal,
      })

      if (!res.ok) throw new Error(`API error: ${res.status}`)
      if (!res.body) throw new Error('No response body')

      setChatState('streaming')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullResponse = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        fullResponse += chunk
        setResponse(fullResponse)
      }

      // Add assistant response to history
      historyRef.current = [
        ...historyRef.current,
        { role: 'assistant', content: fullResponse },
      ]

      setChatState('idle')
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      console.error('Nuke chat error:', err)
      setResponse("I'm taking a nap right now 😴 but book a call and my team will help!")
      setChatState('error')
      // Auto-clear error after 6s
      setTimeout(() => setChatState('idle'), 6000)
    }
  }, [])

  return { chatState, response, sendMessage, clearResponse }
}
