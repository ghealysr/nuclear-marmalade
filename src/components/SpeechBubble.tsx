import { useEffect, useState, useRef } from 'react'

interface SpeechBubbleProps {
  text: string
  visible: boolean
  isThinking?: boolean
}

/* ── Thinking Dots ─────────────────────────────── */
function ThinkingDots() {
  return (
    <span className="nuke-thinking-dots inline-flex items-center gap-[3px]">
      <span className="nuke-dot" />
      <span className="nuke-dot" />
      <span className="nuke-dot" />
    </span>
  )
}

/* ── Speech Bubble ─────────────────────────────── */
export function SpeechBubble({ text, visible, isThinking }: SpeechBubbleProps) {
  const [displayText, setDisplayText] = useState('')
  const prevTextRef = useRef('')
  const typewriterRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Typewriter effect — only type new characters as they stream in
  useEffect(() => {
    if (isThinking || !text) {
      setDisplayText('')
      prevTextRef.current = ''
      return
    }

    // If text grew (streaming), type from where we left off
    if (text.startsWith(prevTextRef.current) && text.length > prevTextRef.current.length) {
      const newChars = text.slice(prevTextRef.current.length)
      let i = 0
      const typeNext = () => {
        if (i < newChars.length) {
          prevTextRef.current += newChars[i]
          setDisplayText(prevTextRef.current)
          i++
          typewriterRef.current = setTimeout(typeNext, 25)
        }
      }
      typeNext()
    } else if (text !== prevTextRef.current) {
      // Text changed entirely (new message) — start fresh
      prevTextRef.current = ''
      setDisplayText('')
      let i = 0
      const typeNext = () => {
        if (i < text.length) {
          prevTextRef.current += text[i]
          setDisplayText(prevTextRef.current)
          i++
          typewriterRef.current = setTimeout(typeNext, 25)
        }
      }
      typeNext()
    }

    return () => {
      if (typewriterRef.current) clearTimeout(typewriterRef.current)
    }
  }, [text, isThinking])

  // Reset when hidden
  useEffect(() => {
    if (!visible) {
      setDisplayText('')
      prevTextRef.current = ''
    }
  }, [visible])

  if (!visible) return null

  return (
    <div className={`nuke-speech-bubble ${visible ? 'nuke-bubble-enter' : 'nuke-bubble-exit'}`}>
      {/* Glass panel */}
      <div className="relative rounded-2xl border border-white/[0.12] bg-black/60 px-4 py-3 backdrop-blur-xl">
        {/* Glass edge highlight */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            background:
              'linear-gradient(to bottom, rgba(255,255,255,0.08) 0%, transparent 40%)',
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            padding: '1px',
          }}
        />

        {isThinking ? (
          <ThinkingDots />
        ) : (
          <p className="text-[13px] leading-relaxed text-white/80">{displayText}</p>
        )}
      </div>

      {/* Tail pointing down-right toward Nuke */}
      <div className="nuke-bubble-tail" />
    </div>
  )
}
