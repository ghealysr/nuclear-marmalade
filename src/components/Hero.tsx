import { useEffect, useRef, useCallback } from 'react'
import { HeroBackground } from './HeroBackground'
import gsap from 'gsap'

export function Hero() {
  const tagRef = useRef<HTMLDivElement>(null)
  const headlineRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLAnchorElement>(null)

  // Magnetic CTA — button pulls toward cursor on proximity
  // Compute from rest position (subtract current GSAP transform) to avoid feedback loop
  const handleMagnet = useCallback((e: MouseEvent) => {
    const btn = ctaRef.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    const currentX = (gsap.getProperty(btn, 'x') as number) || 0
    const currentY = (gsap.getProperty(btn, 'y') as number) || 0
    // Rest center = visual center minus current transform offset
    const restCx = rect.left + rect.width / 2 - currentX
    const restCy = rect.top + rect.height / 2 - currentY
    const dx = e.clientX - restCx
    const dy = e.clientY - restCy
    const dist = Math.sqrt(dx * dx + dy * dy)
    const threshold = 150
    if (dist < threshold) {
      const pull = (1 - dist / threshold) * 0.4
      gsap.to(btn, { x: dx * pull, y: dy * pull, duration: 0.4, ease: 'power3.out', overwrite: 'auto' })
    } else {
      gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.3)', overwrite: 'auto' })
    }
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', handleMagnet)
    return () => window.removeEventListener('mousemove', handleMagnet)
  }, [handleMagnet])

  useEffect(() => {
    const words = headlineRef.current?.querySelectorAll('.hero-word')
    const tl = gsap.timeline({ delay: 0.35 })

    // Terminal tag — subtle slide in
    tl.fromTo(tagRef.current,
      { opacity: 0, x: -12 },
      { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out' },
    )

    // Flash-to-Focus: words start overexposed + blurry, snap into sharp contrast
    if (words?.length) {
      tl.fromTo(words,
        { opacity: 0, y: 40, filter: 'blur(12px) brightness(2.5)' },
        { opacity: 1, y: 0, filter: 'blur(0px) brightness(1)', duration: 0.65, stagger: 0.06, ease: 'power4.out' },
        '-=0.1',
      )
    }

    // CTA snaps in
    tl.fromTo(ctaRef.current,
      { opacity: 0, y: 16, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'power3.out' },
      '-=0.2',
    )

    // Footnote last
    tl.fromTo(subtitleRef.current,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
      '-=0.15',
    )

    return () => { tl.kill(); tl.progress(1) }
  }, [])

  return (
    <section id="hero" className="relative h-screen w-full overflow-hidden">
      <HeroBackground />

      {/* Editorial layout — offset up from dead center, left-aligned text */}
      <div className="relative z-10 flex h-full flex-col justify-center px-6 sm:px-12 lg:px-[8%] pb-[60px] pt-[80px]">
        <div className="hero-text-anchor max-w-[960px]">
          {/* Live status indicator */}
          <div ref={tagRef} className="mb-7">
            <span className="hero-tag">
              <span className="hero-tag-dot" />
              Deploying AI Agents
            </span>
          </div>

          {/* Headline — dramatic weight contrast */}
          <h1 ref={headlineRef} className="hero-headline">
            <span className="hero-word hero-word-thin">AI</span>{' '}
            <span className="hero-word hero-word-thin">Agents</span>{' '}
            <span className="hero-word hero-word-thin">That</span>
            <br />
            <span className="hero-word hero-accent">Run</span>{' '}
            <span className="hero-word hero-word-bold">Your</span>{' '}
            <span className="hero-word hero-accent">Business</span>
          </h1>

          {/* CTA — fashion-tech: no fill, shimmer border */}
          <a
            ref={ctaRef}
            href="#book"
            className="hero-cta-shimmer group mt-9 inline-flex items-center gap-3"
          >
            <span className="hero-cta-label">Book a Call</span>
            <svg
              className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>

          {/* Footnote — no box, shadow-only legibility */}
          <p ref={subtitleRef} className="hero-footnote">
            Custom AI agents that answer phones, close deals,
            handle support, and never call in sick.
            <br />
            Built by Nuclear Marmalade. Powered by{' '}
            <span>Nuke</span>.
          </p>
        </div>
      </div>
    </section>
  )
}
