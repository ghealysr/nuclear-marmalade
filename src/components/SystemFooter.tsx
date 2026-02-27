import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { IntakeTerminal } from './IntakeTerminal'

/* ── Shared Data ── */
const SOCIALS = [
  { label: 'X', href: 'https://x.com' },
  { label: 'LinkedIn', href: 'https://linkedin.com' },
  { label: 'Instagram', href: 'https://instagram.com' },
]

/* ── Live UTC Clock ── */
function fmtTime() {
  const d = new Date()
  return (
    d.toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' }) + ' UTC'
  )
}
function useSystemClock() {
  const [time, setTime] = useState(() => fmtTime())
  useEffect(() => {
    const id = setInterval(() => setTime(fmtTime()), 1000)
    return () => clearInterval(id)
  }, [])
  return time
}

/* ── SystemFooter ── */
export function SystemFooter() {
  const sectionRef = useRef<HTMLElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const clock = useSystemClock()
  const [terminalOpen, setTerminalOpen] = useState(false)

  // GSAP scroll-triggered entrance
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const tl = gsap.timeline()
          tl.fromTo(
            headingRef.current,
            { opacity: 0, y: 40, filter: 'blur(6px)' },
            {
              opacity: 1,
              y: 0,
              filter: 'blur(0px)',
              duration: 0.7,
              ease: 'power4.out',
            },
          )
          tl.fromTo(
            ctaRef.current,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' },
            '-=0.3',
          )
          observer.disconnect()
        }
      },
      { threshold: 0.2 },
    )

    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <footer
        ref={sectionRef}
        id="contact"
        className="sys-footer relative px-6 py-24 md:px-12 lg:px-24"
      >
        {/* Grain overlay */}
        <div className="sys-footer-grain" />

        {/* ── CTA Block ── */}
        <div className="relative z-10 flex flex-col items-center text-center mb-16">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#fbbf24] mb-6">
            06 / Secure Channel
          </p>

          <h2
            ref={headingRef}
            className="font-display font-bold leading-none tracking-tighter text-[#FDFCF0] mb-4"
            style={{
              fontSize: 'clamp(2.5rem, 8vw, 5.5rem)',
              lineHeight: 0.95,
              textShadow:
                '1px 0 0 rgba(255,50,50,0.15), -1px 0 0 rgba(50,100,255,0.15)',
            }}
          >
            Initiate Secure
            <br />
            Channel
          </h2>

          <p className="max-w-md text-sm leading-relaxed text-zinc-400 mb-10">
            Ready to deploy sovereign intelligence? Open a direct line.
            Encrypted. Confidential. No spam. Ever.
          </p>

          <p className="font-mono text-xs uppercase tracking-widest text-zinc-400 mb-6">
            15-Minute Sync. We map your workflows and identify exact automation targets.
          </p>

          {/* ── Routing Buttons ── */}
          <div ref={ctaRef} className="sys-footer-cta-grid">
            <button
              onClick={() => setTerminalOpen(true)}
              className="sys-footer-cta-btn group"
            >
              <span className="sys-footer-cta-dot" />
              <span className="sys-footer-cta-label">
                ESTABLISH_CONNECTION
              </span>
              <span className="sys-footer-cta-arrow group-hover:translate-x-1">
                →
              </span>
            </button>
          </div>

          <p className="mt-6 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            ENCRYPTION: AES-256 // PROTOCOL: SECURE // RESPONSE: &lt;24H
          </p>
        </div>

        {/* ── Divider ── */}
        <div className="sys-footer-divider" />

        {/* ── Bottom Bar (mirrors NavMenu) ── */}
        <div className="sys-footer-bottom relative z-10">
          {/* Left: socials */}
          <div className="nav-social-links">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="nav-social-link"
              >
                {s.label}
              </a>
            ))}
          </div>

          {/* Right: system status + clock */}
          <div className="nav-system-status">
            <span className="nav-status-dot" />
            <span className="nav-status-text">STATUS: ATOMIC</span>
            <span className="nav-status-divider">|</span>
            <span className="nav-status-text">{clock}</span>
          </div>
        </div>

        {/* Copyright */}
        <div className="relative z-10 text-center mt-8">
          <p className="font-mono text-[9px] uppercase tracking-widest text-zinc-400">
            &copy; 2026 Nuclear Marmalade. All systems operational.
          </p>
        </div>
      </footer>

      {/* ── IntakeTerminal Modal ── */}
      <IntakeTerminal
        isOpen={terminalOpen}
        onClose={() => setTerminalOpen(false)}
      />
    </>
  )
}

export default SystemFooter
