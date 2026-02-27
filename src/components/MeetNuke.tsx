import { useEffect, useRef, useCallback } from 'react'

export function MeetNuke() {
  const sectionRef = useRef<HTMLElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  /* ── Cursor-tracking ambient glow ── */
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const container = containerRef.current
    const glow = glowRef.current
    if (!container || !glow) return
    const rect = container.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    glow.style.background = `radial-gradient(circle 300px at ${x}px ${y}px, rgba(251,191,36,0.12) 0%, rgba(245,158,11,0.04) 40%, transparent 100%)`
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (glowRef.current) {
      glowRef.current.style.background =
        'radial-gradient(circle 300px at 50% 50%, rgba(251,191,36,0.06) 0%, transparent 100%)'
    }
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [handleMouseMove, handleMouseLeave])

  return (
    <section
      id="nuke"
      ref={sectionRef}
      className="relative bg-black px-6 py-20 md:py-28"
    >
      {/* Subtle top divider line */}
      <div className="absolute inset-x-0 top-0 flex justify-center">
        <div className="h-[1px] w-[200px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      <div
        ref={containerRef}
        className="nuke-section relative mx-auto flex max-w-[900px] flex-col items-center gap-10 md:flex-row md:gap-16"
      >
        {/* Cursor-tracking ambient glow layer */}
        <div
          ref={glowRef}
          className="pointer-events-none absolute inset-0 transition-[background] duration-300"
          style={{
            background:
              'radial-gradient(circle 300px at 50% 50%, rgba(251,191,36,0.06) 0%, transparent 100%)',
          }}
        />

        {/* Landing zone — Nuke companion lands here when this section is visible */}
        <div
          id="nuke-landing-zone"
          className="relative w-[260px] flex-shrink-0 md:w-[320px]"
          style={{ minHeight: '320px' }}
        />

        {/* Brand story */}
        <div className="relative z-10 text-center md:text-left">
          <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.5rem)] font-semibold tracking-[-0.02em] text-white">
            Meet <span className="nuke-glow">Nuke</span>
          </h2>
          <p className="mt-4 max-w-[440px] text-[16px] leading-[1.8] text-white/40">
            The engine behind it all. Nuke is the AI platform that powers every
            agent we build — from voice systems to full business automation.
            Built by a Mets fan who believes every business deserves AI that
            actually works.
          </p>
          <div className="mt-6 flex items-center gap-3 justify-center md:justify-start">
            <img
              src="/images/marmalade.png"
              alt="Nuclear Marmalade"
              className="h-[36px] w-auto"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
