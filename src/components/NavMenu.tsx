import { useEffect, useRef, useCallback, useState } from 'react'
import gsap from 'gsap'

interface NavMenuProps {
  isOpen: boolean
  onClose: () => void
}

const NAV_LINKS = [
  { index: '01', label: '/Index', href: '#hero' },
  { index: '02', label: '/Capabilities', href: '#services' },
  { index: '03', label: '/Intelligence', href: '#archive' },
  { index: '04', label: '/Telemetry', href: '#telemetry' },
  { index: '05', label: '/Manifesto', href: '#manifesto' },
  { index: '06', label: '/Contact', href: '#contact' },
]

const SOCIALS = [
  { label: 'X', href: 'https://x.com' },
  { label: 'LinkedIn', href: 'https://linkedin.com' },
  { label: 'Instagram', href: 'https://instagram.com' },
]

/** Format live timestamp — HH:MM:SS UTC */
function useSystemClock() {
  const [time, setTime] = useState(() => fmtTime())
  useEffect(() => {
    const id = setInterval(() => setTime(fmtTime()), 1000)
    return () => clearInterval(id)
  }, [])
  return time
}
function fmtTime() {
  const d = new Date()
  return d.toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' }) + ' UTC'
}

export function NavMenu({ isOpen, onClose }: NavMenuProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const linksRef = useRef<(HTMLAnchorElement | null)[]>([])
  const socialRef = useRef<HTMLDivElement>(null)
  const statusRef = useRef<HTMLDivElement>(null)
  const grainRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const clock = useSystemClock()

  // Entrance / exit timeline
  useEffect(() => {
    const overlay = overlayRef.current
    if (!overlay) return

    if (isOpen) {
      // Prevent body scroll
      document.body.style.overflow = 'hidden'
      overlay.style.display = 'flex'

      const tl = gsap.timeline()

      // Phase 1: CRT power-on flicker
      tl.fromTo(overlay,
        { opacity: 0, clipPath: 'inset(0 0 100% 0)' },
        { opacity: 1, duration: 0.25, ease: 'steps(6)' },
      )

      // Phase 2: Shutter drops from top
      tl.to(overlay,
        { clipPath: 'inset(0 0 0% 0)', duration: 0.5, ease: 'power2.out' },
        '-=0.05',
      )

      // Phase 3: Grain fades in
      tl.fromTo(grainRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.2 },
        '-=0.3',
      )

      // Phase 4: Stagger links in
      tl.fromTo(linksRef.current.filter(Boolean),
        { opacity: 0, y: 60, filter: 'blur(8px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.55, stagger: 0.07, ease: 'power4.out' },
        '-=0.2',
      )

      // Phase 5: Social bar + status
      tl.fromTo([socialRef.current, statusRef.current],
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power3.out' },
        '-=0.3',
      )
    } else {
      document.body.style.overflow = ''
      const tl = gsap.timeline({
        onComplete: () => {
          if (overlay) {
            overlay.style.display = 'none'
            overlay.style.clipPath = ''
          }
        },
      })

      // Links scatter upward
      tl.to(linksRef.current.filter(Boolean), {
        opacity: 0, y: -30, duration: 0.25, stagger: 0.03, ease: 'power2.in',
      })
      tl.to([socialRef.current, statusRef.current], {
        opacity: 0, duration: 0.2,
      }, '-=0.15')

      // Shutter lifts back up
      tl.to(overlay, {
        clipPath: 'inset(0 0 100% 0)',
        duration: 0.4,
        ease: 'power2.in',
      }, '-=0.1')

      tl.to(overlay, { opacity: 0, duration: 0.15 })
    }
  }, [isOpen])

  // Magnetic text tracking per link
  const handleLinkMouse = useCallback((e: React.MouseEvent, idx: number) => {
    const el = linksRef.current[idx]
    if (!el) return
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = e.clientX - cx
    const dy = e.clientY - cy
    const dist = Math.sqrt(dx * dx + dy * dy)
    const threshold = 80
    if (dist < threshold) {
      const pull = (1 - dist / threshold) * 0.25
      gsap.to(el, { x: dx * pull, y: dy * pull, duration: 0.4, ease: 'power3.out', overwrite: 'auto' })
    }
  }, [])

  const handleLinkLeave = useCallback((idx: number) => {
    const el = linksRef.current[idx]
    if (!el) return
    gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)', overwrite: 'auto' })
    setHoveredIdx(null)
  }, [])

  // Navigate + close
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    onClose()
    // Delay scroll to let menu close
    setTimeout(() => {
      const target = document.querySelector(href)
      target?.scrollIntoView({ behavior: 'smooth' })
    }, 450)
  }

  return (
    <div
      ref={overlayRef}
      className="nav-overlay"
      style={{ display: 'none' }}
    >
      {/* CRT grain over everything */}
      <div ref={grainRef} className="nav-grain" />

      {/* Dynamic hover preview background */}
      <div ref={previewRef} className="nav-hover-preview">
        {NAV_LINKS.map((link, i) => (
          <div
            key={link.index}
            className="nav-preview-layer"
            style={{ opacity: hoveredIdx === i ? 1 : 0 }}
            data-idx={i}
          />
        ))}
      </div>

      {/* Main link stack */}
      <nav className="nav-link-stack">
        {NAV_LINKS.map((link, i) => (
          <a
            key={link.index}
            ref={el => { linksRef.current[i] = el }}
            href={link.href}
            className="nav-link-item group"
            onClick={e => handleClick(e, link.href)}
            onMouseMove={e => handleLinkMouse(e, i)}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => handleLinkLeave(i)}
          >
            <span className="nav-link-index">{link.index}</span>
            <span className="nav-link-label">{link.label}</span>
          </a>
        ))}
      </nav>

      {/* Bottom bar — social + system status */}
      <div className="nav-bottom-bar">
        <div ref={socialRef} className="nav-social-bar">
          <div className="nav-terminal-divider" />
          <div className="nav-social-links">
            {SOCIALS.map(s => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="nav-social-link">
                {s.label}
              </a>
            ))}
          </div>
        </div>

        <div ref={statusRef} className="nav-system-status">
          <span className="nav-status-dot" />
          <span className="nav-status-text">STATUS: ATOMIC</span>
          <span className="nav-status-divider">|</span>
          <span className="nav-status-text">{clock}</span>
        </div>
      </div>
    </div>
  )
}
