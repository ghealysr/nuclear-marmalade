import { useState, useEffect, useRef } from 'react'
import { NavMenu } from './NavMenu'
import gsap from 'gsap'

const SECTION_IDS = ['hero', 'services', 'archive', 'telemetry', 'manifesto', 'contact']

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [sectionIdx, setSectionIdx] = useState('01')
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Track which section is in view → update index counter
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = SECTION_IDS.indexOf(entry.target.id)
            if (idx !== -1) setSectionIdx(String(idx + 1).padStart(2, '0'))
          }
        }
      },
      { threshold: 0.3 },
    )
    SECTION_IDS.forEach(id => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  // Morphing animation for trigger icon
  useEffect(() => {
    const btn = triggerRef.current
    if (!btn) return
    const bars = btn.querySelectorAll('.nav-trigger-bar')
    if (menuOpen) {
      gsap.to(bars[0], { rotation: 45, y: 6, duration: 0.35, ease: 'power3.inOut' })
      gsap.to(bars[1], { opacity: 0, scaleX: 0, duration: 0.2, ease: 'power2.in' })
      gsap.to(bars[2], { rotation: -45, y: -6, duration: 0.35, ease: 'power3.inOut' })
    } else {
      gsap.to(bars[0], { rotation: 0, y: 0, duration: 0.35, ease: 'power3.inOut' })
      gsap.to(bars[1], { opacity: 1, scaleX: 1, duration: 0.3, ease: 'power3.out', delay: 0.1 })
      gsap.to(bars[2], { rotation: 0, y: 0, duration: 0.35, ease: 'power3.inOut' })
    }
  }, [menuOpen])

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-6 sm:px-10 pt-5 pb-4 backdrop-blur-sm bg-black/20">
        {/* Logo with section index */}
        <a href="/" className="group flex items-end gap-3 leading-none">
          <div className="flex flex-col">
            <span
              className="font-display text-[11px] font-medium uppercase tracking-[0.25em]"
              style={{ color: '#7CB4E8' }}
            >
              Nuclear
            </span>
            <span
              className="font-display text-[26px] font-bold uppercase tracking-[-0.02em] leading-[0.85]"
              style={{
                color: '#ffb800',
                textShadow: '0 0 20px rgba(255,184,0,0.3)',
              }}
            >
              Marmalade
            </span>
          </div>
          {/* Section index counter */}
          <span className="nav-section-index">{sectionIdx}</span>
        </a>

        {/* Right side — status + trigger */}
        <div className="flex items-center gap-5">
          <div className="nav-live-tag">
            <span className="nav-live-dot" />
            <span className="nav-live-text">Live</span>
          </div>

          <button
            ref={triggerRef}
            className="nav-trigger"
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            <span className="nav-trigger-bar" />
            <span className="nav-trigger-bar" />
            <span className="nav-trigger-bar" />
          </button>
        </div>
      </header>

      <NavMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  )
}
