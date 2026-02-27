import { useEffect, useRef, useCallback } from 'react'
import gsap from 'gsap'

/* ── Capability Data — Legendary Tier ────────────────────── */
const CAPABILITIES = [
  {
    idx: '01',
    title: 'Vocal Autonomy & Neural Linguistics',
    desc: 'Answers missed calls, qualifies inbound leads, and books appointments directly into your calendar. 24/7 autonomous phone handling that sounds entirely human.',
    readouts: ['MODEL_ID: NM-01', 'LATENCY: 0.04ms', 'VOCAL_FIDELITY: 99.7%'],
    microUi: '[SYS: NM-CORE // REV: 8.1 // FREQ: 44.2kHz]',
    wireframe: 'waveform',
  },
  {
    idx: '02',
    title: 'Self-Architecting Logic Engines',
    desc: 'Replaces manual data entry and sprawling ticket queues. Our systems automatically route requests, update your legacy databases, and trigger backend workflows without human intervention.',
    readouts: ['CORE_TEMP: OPTIMAL', 'NEURAL_LOAD: 88%', 'CLUSTERS: 24'],
    microUi: '[COORD: 44.02 // STACK: PROD // THREADS: 128]',
    wireframe: 'nodes',
  },
  {
    idx: '03',
    title: 'Omniscient Support Infrastructure',
    desc: 'Resolves Tier 1 and Tier 2 customer support tickets instantly. We eliminate the wait time and automatically escalate high-value edge cases to your human team with full context.',
    readouts: ['MODEL_ID: NM-03', 'RESOLUTION: <200ms', 'SATISFACTION: 98.4%'],
    microUi: '[GRID: OMNI // UPTIME: 99.99% // NODES: 2.4K]',
    wireframe: 'grid',
  },
  {
    idx: '04',
    title: 'Sovereign Intelligence Fine-Tuning',
    desc: 'Your proprietary data never leaves your servers. We build highly secure, private AI models trained strictly on your company\'s specific SOPs, policies, and voice.',
    readouts: ['STATUS: ATOMIC', 'PARAMS: 70B+', 'EPOCH: 2.4K'],
    microUi: '[NODE: SOVEREIGN // BUILD: 2.4K // DRIFT: 0.002]',
    wireframe: 'matrix',
  },
]

/* ── Capability Card ─────────────────────────────────────── */
function CapCard({
  idx,
  title,
  desc,
  readouts,
  microUi,
  wireframe,
}: (typeof CAPABILITIES)[number]) {
  const cardRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  // Mouse-tracking light + differential parallax (title faster than body)
  const handleMouse = useCallback((e: MouseEvent) => {
    const card = cardRef.current
    const glow = glowRef.current
    if (!card || !glow) return
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const px = x / rect.width - 0.5
    const py = y / rect.height - 0.5
    glow.style.background = `radial-gradient(circle 220px at ${x}px ${y}px, rgba(255,184,0,0.07) 0%, transparent 100%)`
    // Differential parallax — title moves faster, body follows slower
    if (titleRef.current) {
      gsap.to(titleRef.current, { x: px * -10, y: py * -8, duration: 0.35, ease: 'power2.out', overwrite: 'auto' })
    }
    if (bodyRef.current) {
      gsap.to(bodyRef.current, { x: px * -4, y: py * -3, duration: 0.5, ease: 'power2.out', overwrite: 'auto' })
    }
  }, [])

  const handleLeave = useCallback(() => {
    if (glowRef.current) glowRef.current.style.background = 'transparent'
    if (titleRef.current) {
      gsap.to(titleRef.current, { x: 0, y: 0, duration: 0.6, ease: 'power3.out', overwrite: 'auto' })
    }
    if (bodyRef.current) {
      gsap.to(bodyRef.current, { x: 0, y: 0, duration: 0.7, ease: 'power3.out', overwrite: 'auto' })
    }
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
    <div ref={cardRef} className="cap-card group" data-wireframe={wireframe}>
      {/* Bracket corner frames */}
      <div className="cap-bracket cap-bracket-tl" />
      <div className="cap-bracket cap-bracket-tr" />
      <div className="cap-bracket cap-bracket-bl" />
      <div className="cap-bracket cap-bracket-br" />

      {/* Ghost index — massive, behind everything */}
      <span className="cap-ghost-idx">{idx}</span>

      {/* Glow border */}
      <div className="cap-border" />

      {/* Progress bar — draws on scroll entrance */}
      <div className="cap-progress-bar" />

      {/* Wireframe reveal on hover */}
      <div className={`cap-wireframe cap-wireframe-${wireframe}`} />

      {/* Mouse-tracking light */}
      <div ref={glowRef} className="cap-glow" />

      {/* Glass noise overlay */}
      <div className="cap-noise" />

      {/* Per-card scanline */}
      <div className="cap-card-scanline" />

      {/* Content — differential parallax layers */}
      <div className="cap-content">
        {/* Title layer — moves faster (foreground) */}
        <div ref={titleRef} className="cap-parallax-title">
          <div className="cap-readouts">
            {readouts.map((r, i) => (
              <span key={i} className="cap-readout">{r}</span>
            ))}
          </div>
          <span className="cap-idx">{idx}</span>
          <h3 className="cap-title">{title}</h3>
          <span className="cap-micro-ui">{microUi}</span>
        </div>

        {/* Body layer — moves slower (background depth) */}
        <div ref={bodyRef} className="cap-parallax-body">
          <p className="cap-desc">{desc}</p>
        </div>
      </div>

      {/* Bottom hover bar — expands on interaction */}
      <div className="cap-hover-bar" />
    </div>
  )
}

/* ── Synthesis — Capabilities Closing Section ──────────── */
function Synthesis() {
  const synthRef = useRef<HTMLDivElement>(null)
  const torchRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLAnchorElement>(null)
  const ctaLabelRef = useRef<HTMLSpanElement>(null)

  // Torch-light — mouse-following radial glow
  const handleTorch = useCallback((e: MouseEvent) => {
    const el = synthRef.current
    const torch = torchRef.current
    if (!el || !torch) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    torch.style.background = `radial-gradient(circle 450px at ${x}px ${y}px, rgba(255,184,0,0.05) 0%, transparent 100%)`
  }, [])

  // Magnetic CTA — shell + delayed label follow
  const handleCtaMouse = useCallback((e: MouseEvent) => {
    const btn = ctaRef.current
    const label = ctaLabelRef.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = e.clientX - cx
    const dy = e.clientY - cy
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 120) {
      const pull = (1 - dist / 120) * 0.25
      gsap.to(btn, { x: dx * pull, y: dy * pull, duration: 0.35, ease: 'power3.out', overwrite: 'auto' })
      if (label) gsap.to(label, { x: dx * pull * 0.5, y: dy * pull * 0.5, duration: 0.55, ease: 'power3.out', overwrite: 'auto' })
    }
  }, [])

  const handleCtaLeave = useCallback(() => {
    if (ctaRef.current) gsap.to(ctaRef.current, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)', overwrite: 'auto' })
    if (ctaLabelRef.current) gsap.to(ctaLabelRef.current, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.4)', overwrite: 'auto' })
  }, [])

  useEffect(() => {
    const el = synthRef.current
    const btn = ctaRef.current
    if (!el) return

    el.addEventListener('mousemove', handleTorch)

    const ctaZone = btn?.parentElement
    if (ctaZone) ctaZone.addEventListener('mousemove', handleCtaMouse)
    if (btn) btn.addEventListener('mouseleave', handleCtaLeave)

    // Scroll entrance — bloom + headline reveal
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('synth-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.2 },
    )
    observer.observe(el)

    return () => {
      el.removeEventListener('mousemove', handleTorch)
      if (ctaZone) ctaZone.removeEventListener('mousemove', handleCtaMouse)
      if (btn) btn.removeEventListener('mouseleave', handleCtaLeave)
      observer.disconnect()
    }
  }, [handleTorch, handleCtaMouse, handleCtaLeave])

  return (
    <div ref={synthRef} className="synth-section">
      {/* Torch-light — mouse-following atmospheric glow */}
      <div ref={torchRef} className="synth-torch" />

      {/* Anchor bloom — line expands into light column on scroll */}
      <div className="synth-bloom" />

      {/* Film grain — consistent texture */}
      <div className="synth-grain" />

      {/* Intensified scan-line — system fully loaded */}
      <div className="synth-scanline" />

      {/* Module checksum corners */}
      <span className="synth-check synth-check-tl">[CORE_01: ONLINE]</span>
      <span className="synth-check synth-check-tr">[NEURAL_PULSE: OPTIMAL]</span>
      <span className="synth-check synth-check-bl">[INTEGRATION_SYNC: 100%]</span>
      <span className="synth-check synth-check-br">[SYS_STATUS: ATOMIC]</span>

      {/* Content */}
      <div className="synth-content">
        <h2 className="synth-headline">
          Autonomy<br />by Design<span className="synth-headline-dot">.</span>
        </h2>
        <p className="synth-sub">
          Human-scale operations are a legacy constraint.<br />
          Nuclear Marmalade is the upgrade. Initiate the Handshake.
        </p>

        {/* Tactical Command CTA */}
        <div className="synth-cta-zone">
          <a ref={ctaRef} href="#book" className="synth-cta group">
            <span className="synth-cta-border" />
            <span ref={ctaLabelRef} className="synth-cta-inner">
              <span className="synth-cta-status">
                <span className="synth-cta-dot" />
                Status: Atomic
              </span>
              <span className="synth-cta-text">
                Initiate Deployment
                <svg className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </span>
          </a>
        </div>
      </div>
    </div>
  )
}

/* ── Capabilities Section ────────────────────────────────── */
export function Services() {
  const sectionRef = useRef<HTMLElement>(null)
  const nebulaRef = useRef<HTMLDivElement>(null)

  // GSAP scroll-triggered entrance + scroll progress + nebula drift
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const cards = section.querySelectorAll('.cap-card')
    const anchorLine = section.querySelector('.cap-anchor-progress') as HTMLElement
    const nebula = nebulaRef.current

    // Blur-to-focus card entrance
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            gsap.fromTo(
              entry.target,
              { opacity: 0, y: 50, scale: 0.97, filter: 'blur(12px)' },
              { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.8, ease: 'power3.out' },
            )
            entry.target.classList.add('cap-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15 },
    )

    cards.forEach(card => {
      gsap.set(card, { opacity: 0, filter: 'blur(12px)' })
      observer.observe(card)
    })

    // Anchor line pulse on card hover
    const anchorPulse = section.querySelector('.cap-anchor-line') as HTMLElement
    cards.forEach(card => {
      card.addEventListener('mouseenter', () => anchorPulse?.classList.add('cap-anchor-pulse'))
      card.addEventListener('mouseleave', () => anchorPulse?.classList.remove('cap-anchor-pulse'))
    })

    // Scroll progress + nebula drift — anchor line grows, nebula shifts
    const handleScroll = () => {
      const rect = section.getBoundingClientRect()
      const vh = window.innerHeight
      const progress = Math.min(1, Math.max(0, (vh - rect.top) / (rect.height + vh)))
      if (anchorLine) {
        anchorLine.style.height = `${progress * 100}%`
        anchorLine.style.opacity = `${0.15 + progress * 0.4}`
      }
      // Nebula drift — shifts vertically with scroll
      if (nebula) {
        const drift = (progress - 0.5) * 120
        nebula.style.transform = `translateY(${drift}px)`
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', handleScroll)
      cards.forEach(card => {
        card.removeEventListener('mouseenter', () => {})
        card.removeEventListener('mouseleave', () => {})
      })
    }
  }, [])

  return (
    <section ref={sectionRef} id="services" className="relative overflow-hidden bg-black">
      {/* Ambient Nebula — slow amber cloud that drifts with scroll */}
      <div ref={nebulaRef} className="cap-nebula" />

      {/* Vertical anchor line — continuing from hero */}
      <div className="cap-anchor-line" />

      {/* Scroll progress — tracks through section */}
      <div className="cap-anchor-progress" />

      {/* Scan-line — drifts across the entire section */}
      <div className="cap-scanline" />

      {/* Global cinematic grain — film texture across entire section */}
      <div className="cap-grain" />

      <div className="relative z-10 px-6 pb-28 pt-24 md:px-8 lg:px-12">
        {/* Section header */}
        <div className="mb-16 max-w-[600px] md:mb-20">
          <span className="cap-section-tag">02 / Capabilities</span>
          <h2 className="cap-section-title">
            Proprietary Cognitive<br />Infrastructure
          </h2>
          <p className="cap-section-sub">
            We don't sell tools. We build autonomous systems that think, learn, and execute at machine speed.
          </p>
        </div>

        {/* Bento grid — asymmetrical 2×2, staggered columns */}
        <div className="cap-grid mx-auto max-w-[1080px]">
          {CAPABILITIES.map(cap => (
            <CapCard key={cap.idx} {...cap} />
          ))}
        </div>

        {/* Floor Reflection — faint blurred mirror of grid */}
        <div className="cap-floor-reflection mx-auto max-w-[1080px]" />

        {/* Synthesis — The Grand Reveal */}
        <Synthesis />
      </div>

      {/* Live Log Ticker — system data stream */}
      <div className="cap-ticker">
        <div className="cap-ticker-track">
          <span>[NM-CORE] HANDSHAKE_INIT: 200 OK</span>
          <span>[VOCAL-01] NEURAL_SYNC: COMPLETE</span>
          <span>[LOGIC-02] WORKFLOW_DEPLOYED: 4 NODES</span>
          <span>[SUPPORT-03] QUEUE_DEPTH: 0</span>
          <span>[SOVEREIGN-04] FINE_TUNE_EPOCH: 2.4K</span>
          <span>[SYS] LATENCY: 0.04ms // UPTIME: 99.99%</span>
          <span>[NM-CORE] HANDSHAKE_INIT: 200 OK</span>
          <span>[VOCAL-01] NEURAL_SYNC: COMPLETE</span>
          <span>[LOGIC-02] WORKFLOW_DEPLOYED: 4 NODES</span>
          <span>[SUPPORT-03] QUEUE_DEPTH: 0</span>
          <span>[SOVEREIGN-04] FINE_TUNE_EPOCH: 2.4K</span>
          <span>[SYS] LATENCY: 0.04ms // UPTIME: 99.99%</span>
        </div>
      </div>
    </section>
  )
}
