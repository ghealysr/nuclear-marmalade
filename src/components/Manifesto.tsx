import { useEffect, useRef, useCallback } from 'react'
import gsap from 'gsap'

/* ── Copy ──────────────────────────────────────────────── */
const THESIS_TEXT =
  "The business world is currently renting generic AI, uploading sensitive data to public servers, and hoping for the best. That is a massive security risk, and it doesn\u2019t solve your actual bottlenecks. We don\u2019t sell generic chatbots. We engineer Sovereign AI\u2014private, highly-secure digital workforces built specifically for your business. We take your exact workflows, your rules, and your data, and we build autonomous systems that execute flawlessly. No sick days. No human error. Just pure, scalable excellence."

const PILLARS = [
  {
    idx: '01',
    tag: '01 // ABSOLUTE OWNERSHIP',
    subtitle: 'The End of Rented Intelligence.',
    desc: 'You would never hand your confidential client files to a random stranger. Stop doing it with public AI. We build and deploy private AI models that live entirely within your own secure infrastructure. Your data never leaves your walls. You own the brain.',
  },
  {
    idx: '02',
    tag: '02 // ZERO BOTTLENECKS',
    subtitle: 'Moving at the Speed of Machine Logic.',
    desc: 'Growth usually means hiring more people to manage more manual tasks, ticket queues, and data entry. We eliminate the busywork. We deploy autonomous agents that instantly route information, process documents, and execute tasks across your company in milliseconds.',
  },
  {
    idx: '03',
    tag: '03 // FLAWLESS EXECUTION',
    subtitle: 'Systems That Manage Themselves.',
    desc: "We don\u2019t just hand you a piece of software and walk away. We engineer entire self-correcting ecosystems. From the moment a client interacts with your brand to the final back-office database entry, our architecture handles the heavy lifting, freeing your human team to focus purely on high-level strategy and relationships.",
  },
]

/* ── Pillar Card ───────────────────────────────────────── */
function PillarCard({
  idx,
  tag,
  subtitle,
  desc,
}: (typeof PILLARS)[number]) {
  const cardRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)

  // Mouse-tracking glow
  const handleMouse = useCallback((e: MouseEvent) => {
    const card = cardRef.current
    const glow = glowRef.current
    if (!card || !glow) return
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    glow.style.background = `radial-gradient(circle 220px at ${x}px ${y}px, rgba(255,184,0,0.07) 0%, transparent 100%)`
  }, [])

  const handleLeave = useCallback(() => {
    if (glowRef.current) glowRef.current.style.background = 'transparent'
  }, [])

  useEffect(() => {
    const card = cardRef.current
    if (!card) return
    card.addEventListener('mousemove', handleMouse)
    card.addEventListener('mouseleave', handleLeave)
    return () => {
      card.removeEventListener('mousemove', handleMouse)
      card.removeEventListener('mouseleave', handleLeave)
    }
  }, [handleMouse, handleLeave])

  return (
    <div ref={cardRef} className="mfst-card group">
      {/* Bracket corner frames */}
      <div className="mfst-bracket mfst-bracket-tl" />
      <div className="mfst-bracket mfst-bracket-tr" />
      <div className="mfst-bracket mfst-bracket-bl" />
      <div className="mfst-bracket mfst-bracket-br" />

      {/* Ghost index */}
      <span className="mfst-ghost-idx">{idx}</span>

      {/* Glow border */}
      <div className="mfst-border" />

      {/* Progress bar — draws on scroll entrance */}
      <div className="mfst-progress-bar" />

      {/* Mouse-tracking glow */}
      <div ref={glowRef} className="mfst-glow" />

      {/* Glass noise overlay */}
      <div className="mfst-noise" />

      {/* Per-card scanline */}
      <div className="mfst-card-scanline" />

      {/* Content */}
      <div className="mfst-content">
        <span className="mfst-pillar-tag">{tag}</span>
        <h3 className="mfst-pillar-subtitle">{subtitle}</h3>
        <p className="mfst-pillar-desc">{desc}</p>
      </div>

      {/* Bottom hover bar */}
      <div className="mfst-hover-bar" />
    </div>
  )
}

/* ── Manifesto Section ─────────────────────────────────── */
export function Manifesto() {
  const sectionRef = useRef<HTMLElement>(null)
  const nebulaRef = useRef<HTMLDivElement>(null)
  const hookRef = useRef<HTMLDivElement>(null)
  const thesisRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    // ── 1. Hook headline entrance ──
    const hookEl = hookRef.current
    if (hookEl) {
      gsap.set(hookEl, { opacity: 0, y: 60, scale: 0.96, filter: 'blur(16px)' })
    }
    const hookObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          gsap.to(hookEl, {
            opacity: 1, y: 0, scale: 1, filter: 'blur(0px)',
            duration: 1.0, ease: 'power3.out',
          })
          hookObserver.disconnect()
        }
      },
      { threshold: 0.2 },
    )
    if (hookEl) hookObserver.observe(hookEl)

    // ── 2. Thesis entrance ──
    const thesisEl = thesisRef.current
    if (thesisEl) {
      gsap.set(thesisEl, { opacity: 0, y: 40, filter: 'blur(8px)' })
    }
    const thesisObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          gsap.to(thesisEl, {
            opacity: 1, y: 0, filter: 'blur(0px)',
            duration: 0.7, ease: 'power3.out',
          })
          thesisObserver.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    if (thesisEl) thesisObserver.observe(thesisEl)

    // ── 3. Pillar cards entrance ──
    const cards = section.querySelectorAll('.mfst-card')
    const cardObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            gsap.fromTo(
              entry.target,
              { opacity: 0, y: 50, scale: 0.97, filter: 'blur(12px)' },
              { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.8, ease: 'power3.out' },
            )
            entry.target.classList.add('mfst-visible')
            cardObserver.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15 },
    )
    cards.forEach(card => {
      gsap.set(card, { opacity: 0, filter: 'blur(12px)' })
      cardObserver.observe(card)
    })

    // ── 4. Nebula drift ──
    const nebula = nebulaRef.current
    const handleScroll = () => {
      const rect = section.getBoundingClientRect()
      const vh = window.innerHeight
      const progress = Math.min(1, Math.max(0, (vh - rect.top) / (rect.height + vh)))
      if (nebula) {
        const drift = (progress - 0.5) * 100
        nebula.style.transform = `translateY(${drift}px)`
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      hookObserver.disconnect()
      thesisObserver.disconnect()
      cardObserver.disconnect()
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <section ref={sectionRef} id="manifesto" className="relative overflow-hidden bg-black">
      {/* Atmospheric layers */}
      <div ref={nebulaRef} className="mfst-nebula" />
      <div className="mfst-scanline" />
      <div className="mfst-grain" />

      <div className="relative z-10 px-6 py-24 md:px-8 lg:px-12">
        {/* Section tag */}
        <div className="mb-8 text-center">
          <span className="mfst-section-tag">05 / Manifesto</span>
        </div>

        {/* Hook headline */}
        <div ref={hookRef} className="mfst-hook-block">
          <h2 className="mfst-hook-headline">
            Software used to be a tool.
            <br />
            Now, it is your most capable{' '}
            <span className="mfst-hook-accent">employee</span>.
          </h2>
        </div>

        {/* Thesis — system briefing frame */}
        <div ref={thesisRef} className="mfst-thesis-block">
          <div className="mfst-thesis-frame">
            <span className="mfst-thesis-label">
              [SYSTEM BRIEFING // CLASSIFIED]
            </span>
            <p className="mfst-thesis-text">{THESIS_TEXT}</p>
            <span className="mfst-thesis-footer">
              [END TRANSMISSION // NM-CORE v8.1]
            </span>
          </div>
        </div>

        {/* Pillar grid */}
        <div className="mfst-pillar-grid">
          {PILLARS.map(pillar => (
            <PillarCard key={pillar.idx} {...pillar} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default Manifesto
