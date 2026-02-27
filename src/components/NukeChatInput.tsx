import { useState, useRef, useEffect } from 'react'

interface NukeChatInputProps {
  visible: boolean
  onSend: (message: string) => void
  onClose: () => void
}

export function NukeChatInput({ visible, onSend, onClose }: NukeChatInputProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus when shown
  useEffect(() => {
    if (visible && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [visible])

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (!trimmed) return
    onSend(trimmed)
    setValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!visible) return null

  return (
    <div className="nuke-chat-input nuke-bubble-enter">
      <div className="flex items-center gap-2 rounded-2xl border border-white/[0.12] bg-black/60 px-3 py-2 backdrop-blur-xl">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me anything..."
          className="min-w-0 flex-1 bg-transparent text-[13px] text-white/90 placeholder-white/30 outline-none"
        />
        <button
          onClick={handleSubmit}
          disabled={!value.trim()}
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-amber-400 text-black transition-all duration-200 hover:bg-amber-300 hover:scale-110 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </button>
      </div>
    </div>
  )
}
