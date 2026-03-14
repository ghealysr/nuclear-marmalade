import { useEffect, useRef, useCallback, useState } from 'react'
import { SpeechBubble } from './SpeechBubble'
import { NukeChatInput } from './NukeChatInput'
import type { ChatState } from '../hooks/useNukeChat'

interface NukeChatOverlayProps {
  /** Whether the chat input should be shown (toggled by model click) */
  chatOpen: boolean
  /** Close the chat input */
  onClose: () => void
  /** Whether the model has landed (fly-in complete) — triggers greeting */
  hasLanded: boolean
  /** Current section ID — used to position chat near the model */
  currentSection?: string
  /** Chat state — lifted from useNukeChat in App.tsx */
  chatState: ChatState
  /** Current response text */
  response: string
  /** Send a message */
  sendMessage: (message: string) => Promise<void>
  /** Clear the response */
  clearResponse: () => void
  /** Whether the viewport is mobile (<768px) */
  isMobile?: boolean
}

/**
 * DOM overlay for Nuke chat — positioned near the 3D model.
 * Renders speech bubble (greeting / responses) and chat input.
 * Lives outside the R3F Canvas — pure DOM with glassmorphic styling.
 *
 * Behavior:
 * - After fly-in lands: shows greeting bubble ("Hi! I'm Nuke 👋") for 4 seconds
 * - On model click: toggles chat input visibility
 * - On message send: shows thinking dots → streams response → auto-dismiss after 8s
 * - ESC closes input
 *
 * Mobile: Chat is positioned below the model (centered), with full-width input.
 */

/**
 * Desktop chat overlay positions — bubble sits to the left of the model.
 */
const CHAT_POSITIONS_DESKTOP: Record<string, { right: string; top: string }> = {
  hero:     { right: '190px', top: '15%' },    // model right side
  services: { right: '190px', top: '10%' },    // model right side, slightly higher
  nuke:     { right: '52%',   top: '20%' },    // model centered — chat to the left
}

export function NukeChatOverlay({
  chatOpen,
  onClose,
  hasLanded,
  currentSection,
  chatState,
  response,
  sendMessage,
  clearResponse,
  isMobile = false,
}: NukeChatOverlayProps) {
  const [showGreeting, setShowGreeting] = useState(false)
  const [greetingDone, setGreetingDone] = useState(false)
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // --- Greeting after fly-in lands ---
  useEffect(() => {
    if (!hasLanded) return
    // Short delay after landing before greeting appears
    const greetDelay = setTimeout(() => setShowGreeting(true), 500)
    const dismissDelay = setTimeout(() => {
      setShowGreeting(false)
      setGreetingDone(true)
    }, 4500) // 0.5s delay + 4s visible

    return () => {
      clearTimeout(greetDelay)
      clearTimeout(dismissDelay)
    }
  }, [hasLanded])

  // --- Auto-dismiss response after 8 seconds ---
  useEffect(() => {
    if (chatState === 'idle' && response) {
      dismissTimerRef.current = setTimeout(() => {
        clearResponse()
      }, 8000)
    }
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)
    }
  }, [chatState, response, clearResponse])

  // --- Send message handler ---
  const handleSend = useCallback(
    (message: string) => {
      clearResponse()
      sendMessage(message)
    },
    [sendMessage, clearResponse],
  )

  // --- Bubble visibility logic ---
  const showBubble =
    showGreeting ||
    chatState === 'thinking' ||
    chatState === 'streaming' ||
    (chatState === 'idle' && response.length > 0) ||
    chatState === 'error'

  const bubbleText = showGreeting ? "Hi! I'm Nuke 👋" : response

  // --- Mobile layout: bottom-center, full-width ---
  if (isMobile) {
    return (
      <div
        className="nuke-chat-overlay"
        style={{
          position: 'fixed',
          bottom: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 60,
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          width: 'calc(100vw - 32px)',
          maxWidth: '360px',
        }}
      >
        {/* Speech bubble */}
        <div style={{ pointerEvents: showBubble ? 'auto' : 'none' }}>
          <SpeechBubble
            text={bubbleText}
            visible={showBubble}
            isThinking={chatState === 'thinking'}
          />
        </div>

        {/* Chat input — full width on mobile */}
        <div style={{ pointerEvents: chatOpen ? 'auto' : 'none', width: '100%' }}>
          <NukeChatInput
            visible={chatOpen && greetingDone}
            onSend={handleSend}
            onClose={onClose}
          />
        </div>
      </div>
    )
  }

  // --- Desktop layout: positioned near model ---
  const chatPos = CHAT_POSITIONS_DESKTOP[currentSection ?? 'hero'] ?? CHAT_POSITIONS_DESKTOP.hero

  return (
    <div
      className="nuke-chat-overlay"
      style={{
        position: 'fixed',
        // Position to the left of the model — follows section transitions
        right: chatPos.right,
        top: chatPos.top,
        zIndex: 60,
        pointerEvents: 'none', // Container doesn't block; children opt-in
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '8px',
        maxWidth: '280px',
        // Smooth transition when model moves between sections
        transition: 'right 1.2s ease-in-out, top 1.2s ease-in-out',
      }}
    >
      {/* Speech bubble — greeting, responses, thinking dots */}
      <div style={{ pointerEvents: showBubble ? 'auto' : 'none' }}>
        <SpeechBubble
          text={bubbleText}
          visible={showBubble}
          isThinking={chatState === 'thinking'}
        />
      </div>

      {/* Chat input — shown when model is clicked */}
      <div style={{ pointerEvents: chatOpen ? 'auto' : 'none' }}>
        <NukeChatInput
          visible={chatOpen && greetingDone}
          onSend={handleSend}
          onClose={onClose}
        />
      </div>
    </div>
  )
}
