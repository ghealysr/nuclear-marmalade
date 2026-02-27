import { useState, useCallback, useEffect, useRef } from 'react'
import type { ChatState } from './useNukeChat'

export type NukeAnimState =
  | 'flying-in'
  | 'greeting'
  | 'idle'
  | 'thinking'
  | 'responding'
  | 'landing'
  | 'landed'

interface UseNukeStateReturn {
  animState: NukeAnimState
  isNearMeetNuke: boolean
  showTooltip: boolean
  showInput: boolean
  showBubble: boolean
  bubbleText: string
  setShowTooltip: (v: boolean) => void
  setShowInput: (v: boolean) => void
  handleChatStateChange: (chatState: ChatState, response: string) => void
  dismissBubble: () => void
  meetNukeRef: React.RefObject<HTMLDivElement | null>
}

export function useNukeState(): UseNukeStateReturn {
  const [animState, setAnimState] = useState<NukeAnimState>('flying-in')
  const [isNearMeetNuke, setIsNearMeetNuke] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [showInput, setShowInput] = useState(false)
  const [showBubble, setShowBubble] = useState(false)
  const [bubbleText, setBubbleText] = useState('')
  const meetNukeRef = useRef<HTMLDivElement | null>(null)
  const bubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const greetingDoneRef = useRef(false)

  // Clear any existing bubble timer
  const clearBubbleTimer = useCallback(() => {
    if (bubbleTimerRef.current) {
      clearTimeout(bubbleTimerRef.current)
      bubbleTimerRef.current = null
    }
  }, [])

  // Dismiss the bubble
  const dismissBubble = useCallback(() => {
    clearBubbleTimer()
    setShowBubble(false)
    setBubbleText('')
  }, [clearBubbleTimer])

  // Fly-in → greeting → idle sequence
  useEffect(() => {
    // Fly-in takes 1s, then greeting
    const flyInTimer = setTimeout(() => {
      setAnimState('greeting')
      setBubbleText("Hi! I'm Nuke 👋")
      setShowBubble(true)

      // Greeting bubble auto-dismisses after 4s
      bubbleTimerRef.current = setTimeout(() => {
        setAnimState('idle')
        setShowBubble(false)
        setBubbleText('')
        greetingDoneRef.current = true
      }, 4000)
    }, 1000)

    return () => {
      clearTimeout(flyInTimer)
      clearBubbleTimer()
    }
  }, [clearBubbleTimer])

  // Scroll dismisses active bubble
  useEffect(() => {
    const handleScroll = () => {
      if (showBubble && greetingDoneRef.current) {
        dismissBubble()
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [showBubble, dismissBubble])

  // IntersectionObserver for Meet Nuke section
  useEffect(() => {
    const meetNukeEl = document.getElementById('meet-nuke')
    if (!meetNukeEl) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting && entry.intersectionRatio > 0.4
        setIsNearMeetNuke(visible)
        if (visible && animState !== 'thinking' && animState !== 'responding') {
          setAnimState('landing')
          // After landing animation completes
          setTimeout(() => setAnimState('landed'), 600)
        } else if (!visible && (animState === 'landing' || animState === 'landed')) {
          setAnimState('idle')
        }
      },
      { threshold: [0, 0.4, 0.8] }
    )

    observer.observe(meetNukeEl)
    return () => observer.disconnect()
  }, [animState])

  // Sync chat state → animation state
  const handleChatStateChange = useCallback(
    (chatState: ChatState, response: string) => {
      switch (chatState) {
        case 'thinking':
          setAnimState('thinking')
          setBubbleText('...')
          setShowBubble(true)
          setShowInput(false)
          clearBubbleTimer()
          break
        case 'streaming':
          setAnimState('responding')
          setBubbleText(response)
          setShowBubble(true)
          clearBubbleTimer()
          break
        case 'idle':
          if (response) {
            setBubbleText(response)
            setShowBubble(true)
            // Auto-dismiss after 8s
            bubbleTimerRef.current = setTimeout(() => {
              setShowBubble(false)
              setBubbleText('')
              setAnimState('idle')
            }, 8000)
          }
          if (animState === 'responding' || animState === 'thinking') {
            setAnimState('idle')
          }
          break
        case 'error':
          setBubbleText(response)
          setShowBubble(true)
          setAnimState('idle')
          bubbleTimerRef.current = setTimeout(() => {
            setShowBubble(false)
            setBubbleText('')
          }, 6000)
          break
      }
    },
    [animState, clearBubbleTimer]
  )

  return {
    animState,
    isNearMeetNuke,
    showTooltip,
    showInput,
    showBubble,
    bubbleText,
    setShowTooltip,
    setShowInput,
    handleChatStateChange,
    dismissBubble,
    meetNukeRef,
  }
}
