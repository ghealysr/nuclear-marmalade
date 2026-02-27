import { useEffect, useRef, useCallback, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useRive, useStateMachineInput } from '@rive-app/react-canvas'
import { useNukeChat } from '../hooks/useNukeChat'
import { SpeechBubble } from './SpeechBubble'
import { NukeChatInput } from './NukeChatInput'

gsap.registerPlugin(ScrollTrigger)

/* ── Constants ── */
const NUKE_SIZE = 340
const PARTICLE_INTERVAL = 80 // ms between trail particles

/* Helper: page-relative top of a DOM element */
function pageTop(el: HTMLElement): number {
  return el.getBoundingClientRect().top + window.scrollY
}

/* ── Trail particle spawner (bypasses React for perf) ── */
function spawnTrailParticle(vx: number, vy: number) {
  const el = document.createElement('div')
  el.className = 'nuke-trail-particle'
  el.style.left = `${vx}px`
  el.style.top = `${vy}px`
  document.body.appendChild(el)

  gsap.to(el, {
    opacity: 0,
    scale: 0.15,
    x: (Math.random() - 0.5) * 24,
    y: -(8 + Math.random() * 12),
    duration: 0.5 + Math.random() * 0.4,
    ease: 'power1.out',
    onComplete: () => el.remove(),
  })
}

export function NukeCompanion() {
  /* ── Refs ── */
  const posRef = useRef<HTMLDivElement>(null)
  const bobRef = useRef<HTMLDivElement>(null)
  const isLandedRef = useRef(false)
  const flyInDoneRef = useRef(false)
  const currentSectionRef = useRef<'hero' | 'services' | 'meetnuke'>('hero')
  const flyTweenRef = useRef<gsap.core.Tween | null>(null)
  const flightEffectsRef = useRef<gsap.core.Timeline | null>(null)
  const pageAnchorRef = useRef<{ x: number; y: number } | null>(null)
  const anchorTickerRef = useRef<(() => void) | null>(null)
  /* ── Rive character ── */
  const { rive, RiveComponent } = useRive({
    src: '/animations/nuke.riv',
    artboard: 'Nuke',
    stateMachines: 'NukeController',
    autoplay: true,
  })
  const isHoveredInput = useStateMachineInput(rive, 'NukeController', 'isHovered')
  const isActiveInput = useStateMachineInput(rive, 'NukeController', 'isActive')

  /* ── Chat ── */
  const { chatState, response, sendMessage, clearResponse } = useNukeChat()

  /* ── UI state ── */
  const [showTooltip, setShowTooltip] = useState(false)
  const [showInput, setShowInput] = useState(false)
  const [showBubble, setShowBubble] = useState(false)
  const [bubbleText, setBubbleText] = useState('')
  const bubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const greetingDoneRef = useRef(false)

  /* ── Helpers ── */
  const clearBubbleTimer = useCallback(() => {
    if (bubbleTimerRef.current) {
      clearTimeout(bubbleTimerRef.current)
      bubbleTimerRef.current = null
    }
  }, [])

  const dismissBubble = useCallback(() => {
    clearBubbleTimer()
    setShowBubble(false)
    setBubbleText('')
  }, [clearBubbleTimer])

  /* ══════════════════════════════════════════════════════════
     PAGE-ANCHOR SYSTEM
     Fixed overlay + scroll compensation = page-relative feel.
     Nuke gets "left behind" when user scrolls.
     ══════════════════════════════════════════════════════════ */
  const stopAnchor = useCallback(() => {
    if (anchorTickerRef.current) {
      gsap.ticker.remove(anchorTickerRef.current)
      anchorTickerRef.current = null
    }
    pageAnchorRef.current = null
  }, [])

  const startAnchor = useCallback((pos: HTMLDivElement, pageX: number, pageY: number) => {
    stopAnchor()
    pageAnchorRef.current = { x: pageX, y: pageY }
    const tick = () => {
      if (!pageAnchorRef.current) return
      gsap.set(pos, {
        x: pageAnchorRef.current.x,
        y: pageAnchorRef.current.y - window.scrollY,
      })
    }
    anchorTickerRef.current = tick
    gsap.ticker.add(tick)
  }, [stopAnchor])

  /* ── Position calculators (page-relative) ── */
  const getHeroPos = useCallback(() => {
    const vw = window.innerWidth
    const hero = document.getElementById('hero')
    if (hero) {
      return { x: vw - NUKE_SIZE - 60, y: pageTop(hero) + hero.offsetHeight * 0.55 }
    }
    return { x: vw - NUKE_SIZE - 60, y: window.innerHeight * 0.55 }
  }, [])

  const getServicesPos = useCallback(() => {
    const vw = window.innerWidth
    const services = document.getElementById('services')
    if (services) {
      return { x: vw - NUKE_SIZE - 100, y: pageTop(services) + services.offsetHeight * 0.3 }
    }
    return { x: vw - NUKE_SIZE - 100, y: 800 }
  }, [])

  const getMeetNukePos = useCallback(() => {
    const lz = document.getElementById('nuke-landing-zone')
    if (lz) {
      const rect = lz.getBoundingClientRect()
      return {
        x: rect.left + window.scrollX + rect.width / 2 - NUKE_SIZE / 2,
        y: rect.top + window.scrollY + rect.height / 2 - NUKE_SIZE / 2,
      }
    }
    return { x: 80, y: 2000 }
  }, [])

  /* ══════════════════════════════════════════════════════════
     AUTONOMOUS FLIGHT with animation effects

     Each flight:
     1. Lean (rotation) toward destination
     2. Launch stretch → cruise → normalize
     3. Particle trail throughout
     4. Landing squash + elastic bounce

     bobRef handles rotation/scale (inner layer).
     posRef handles x/y position (outer layer).
     They compose naturally via CSS transforms.
     ══════════════════════════════════════════════════════════ */
  const flyTo = useCallback((
    pos: HTMLDivElement,
    pageTargetX: number,
    pageTargetY: number,
    section: 'hero' | 'services' | 'meetnuke',
    options?: { duration?: number; delay?: number; ease?: string; onComplete?: () => void }
  ) => {
    if (currentSectionRef.current === section) return
    if (!flyInDoneRef.current) return

    stopAnchor()

    if (flyTweenRef.current) { flyTweenRef.current.kill(); flyTweenRef.current = null }
    if (flightEffectsRef.current) { flightEffectsRef.current.kill(); flightEffectsRef.current = null }

    currentSectionRef.current = section
    const bob = bobRef.current

    // Capture start in PAGE space
    const startViewX = gsap.getProperty(pos, 'x') as number
    const startViewY = gsap.getProperty(pos, 'y') as number
    const startPageX = startViewX
    const startPageY = startViewY + window.scrollY

    // Flight geometry
    const dx = pageTargetX - startPageX
    const dy = pageTargetY - startPageY
    const flightAngle = Math.atan2(dy, dx) * (180 / Math.PI)
    const leanAngle = flightAngle * 0.2  // subtle lean toward target
    const isHorizontal = Math.abs(dx) > Math.abs(dy)
    const flightDuration = options?.duration ?? 2.2

    // Particle timing
    let lastParticleTime = 0

    // ── Flight effects timeline (rotation + squash/stretch on bob) ──
    if (bob) {
      gsap.killTweensOf(bob, 'rotation,scaleX,scaleY')

      const fx = gsap.timeline()
      // Lean into flight direction
      fx.to(bob, { rotation: leanAngle, duration: 0.3, ease: 'power2.out' }, 0)
      // Launch stretch (exaggerated)
      fx.to(bob, { scaleY: 1.12, scaleX: 0.9, duration: 0.15, ease: 'power2.out' }, 0)
      // Settle to cruise stretch
      fx.to(bob, {
        scaleY: isHorizontal ? 0.97 : 1.05,
        scaleX: isHorizontal ? 1.05 : 0.97,
        duration: 0.35,
        ease: 'power1.inOut',
      }, 0.15)
      // Pre-landing: ease back to normal + straighten rotation
      fx.to(bob, {
        scaleY: 1, scaleX: 1, rotation: 0,
        duration: 0.4,
        ease: 'power1.inOut',
      }, Math.max(flightDuration - 0.5, 0.6))

      flightEffectsRef.current = fx
    }

    // ── Position proxy tween ──
    const proxy = { t: 0 }
    flyTweenRef.current = gsap.to(proxy, {
      t: 1,
      duration: flightDuration,
      delay: options?.delay ?? 0.6,
      ease: options?.ease ?? 'power2.inOut',
      onUpdate: () => {
        // Interpolate position in page space, convert to viewport
        const pageX = startPageX + dx * proxy.t
        const pageY = startPageY + dy * proxy.t
        gsap.set(pos, { x: pageX, y: pageY - window.scrollY })

        // Spawn trail particles
        const now = Date.now()
        if (now - lastParticleTime > PARTICLE_INTERVAL && proxy.t > 0.03 && proxy.t < 0.97) {
          lastParticleTime = now
          const viewX = pageX + NUKE_SIZE / 2 + (Math.random() - 0.5) * 30
          const viewY = pageY - window.scrollY + NUKE_SIZE / 2 + (Math.random() - 0.5) * 30
          spawnTrailParticle(viewX, viewY)
        }
      },
      onComplete: () => {
        flyTweenRef.current = null

        // Landing squash + elastic bounce
        if (bob) {
          gsap.killTweensOf(bob, 'rotation,scaleX,scaleY')
          gsap.set(bob, { rotation: 0 })
          gsap.to(bob, {
            scaleY: 0.88, scaleX: 1.12,
            duration: 0.12, ease: 'power2.in',
            onComplete: () => {
              gsap.to(bob, {
                scaleY: 1, scaleX: 1,
                duration: 0.5, ease: 'elastic.out(1, 0.5)',
              })
            },
          })
        }

        startAnchor(pos, pageTargetX, pageTargetY)
        options?.onComplete?.()
      },
    })
  }, [stopAnchor, startAnchor])

  /* ── Section-triggered movement ── */
  const setupSectionTriggers = useCallback((pos: HTMLDivElement) => {
    const servicesSection = document.getElementById('services') as HTMLElement
    const nukeSection = document.getElementById('nuke') as HTMLElement
    if (!servicesSection || !nukeSection) return

    ScrollTrigger.create({
      trigger: servicesSection,
      start: 'top 40%',
      end: 'bottom 40%',
      onEnter: () => {
        const { x, y } = getServicesPos()
        flyTo(pos, x, y, 'services', { delay: 1.0 })
        isLandedRef.current = false
      },
      onLeaveBack: () => {
        const { x, y } = getHeroPos()
        flyTo(pos, x, y, 'hero', { delay: 0.3 })
        isLandedRef.current = false
      },
    })

    ScrollTrigger.create({
      trigger: nukeSection,
      start: 'top 70%',
      end: 'bottom 30%',
      onEnter: () => {
        const { x, y } = getMeetNukePos()
        flyTo(pos, x, y, 'meetnuke', {
          delay: 0.8, duration: 2.5, ease: 'power3.inOut',
          onComplete: () => { isLandedRef.current = true },
        })
      },
      onLeaveBack: () => {
        const { x, y } = getServicesPos()
        flyTo(pos, x, y, 'services', { delay: 0.3 })
        isLandedRef.current = false
      },
    })
  }, [flyTo, getHeroPos, getServicesPos, getMeetNukePos])

  /* ══════════════════════════════════════════════════════════
     GSAP INIT: fly-in with animation effects
     Manual kill+reset at start handles React 18 StrictMode
     double-mount: cleanup kills mount1 tweens, mount2 resets
     position and creates fresh tweens that play normally.
     ══════════════════════════════════════════════════════════ */
  useEffect(() => {
    const pos = posRef.current
    const bob = bobRef.current
    if (!pos || !bob) return

    // ── Aggressively clear any leftover state from StrictMode mount1 ──
    gsap.killTweensOf(pos)
    gsap.killTweensOf(bob)
    flyInDoneRef.current = false

    const vw = window.innerWidth
    const { x: heroX, y: heroPageY } = getHeroPos()

    // Start off-screen right, above hero
    const startX = vw + 200
    const startY = heroPageY - 300
    gsap.set(pos, { x: startX, y: startY, opacity: 0 })
    gsap.set(bob, { y: 0 })

    // Calculate fly-in angle for rotation
    const flyInDx = heroX - startX
    const flyInDy = heroPageY - startY
    const flyInAngle = Math.atan2(flyInDy, flyInDx) * (180 / Math.PI)
    const flyInLean = flyInAngle * 0.2

    // Set initial lean for fly-in
    gsap.set(bob, { rotation: flyInLean, scaleY: 1.1, scaleX: 0.92 })

    // Particle timing for fly-in
    let lastFlyInParticle = 0
    let flyInTween: gsap.core.Tween | null = null

    // Fly-in with particle trail
    flyInTween = gsap.to(pos, {
      x: heroX,
      y: heroPageY,
      opacity: 1,
      duration: 1.2,
      ease: 'power2.out',
      onUpdate: function () {
        const opacity = gsap.getProperty(pos, 'opacity') as number
        if (opacity > 0.3) {
          const now = Date.now()
          if (now - lastFlyInParticle > PARTICLE_INTERVAL) {
            lastFlyInParticle = now
            const vx = (gsap.getProperty(pos, 'x') as number) + NUKE_SIZE / 2 + (Math.random() - 0.5) * 30
            const vy = (gsap.getProperty(pos, 'y') as number) + NUKE_SIZE / 2 + (Math.random() - 0.5) * 30
            spawnTrailParticle(vx, vy)
          }
        }
      },
      onComplete: () => {
        flyInTween = null
        flyInDoneRef.current = true
        currentSectionRef.current = 'hero'

        // Landing effects on bob
        gsap.to(bob, { rotation: 0, duration: 0.3, ease: 'power2.out' })
        gsap.to(bob, {
          scaleY: 0.88, scaleX: 1.12,
          duration: 0.12, ease: 'power2.in',
          onComplete: () => {
            gsap.to(bob, {
              scaleY: 1, scaleX: 1,
              duration: 0.5, ease: 'elastic.out(1, 0.5)',
            })
          },
        })

        // Anchor to hero page position
        startAnchor(pos, heroX, heroPageY)

        // Greeting
        setBubbleText("Hi! I'm Nuke 👋")
        setShowBubble(true)
        bubbleTimerRef.current = setTimeout(() => {
          setShowBubble(false)
          setBubbleText('')
          greetingDoneRef.current = true
        }, 4000)

        // Idle float on INNER element
        gsap.to(bob, { y: 14, duration: 2.5, ease: 'sine.inOut', yoyo: true, repeat: -1 })
        gsap.to(bob, { x: 6, duration: 3.5, ease: 'sine.inOut', yoyo: true, repeat: -1 })

        // Section-triggered autonomous movement
        setupSectionTriggers(pos)
      },
    })

    return () => {
      if (flyInTween) { flyInTween.kill(); flyInTween = null }
      gsap.killTweensOf(pos)
      gsap.killTweensOf(bob)
      flyInDoneRef.current = false
      if (flyTweenRef.current) { flyTweenRef.current.kill(); flyTweenRef.current = null }
      if (flightEffectsRef.current) { flightEffectsRef.current.kill(); flightEffectsRef.current = null }
      if (anchorTickerRef.current) { gsap.ticker.remove(anchorTickerRef.current); anchorTickerRef.current = null }
      ScrollTrigger.getAll().forEach(st => st.kill())
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Sync chat state → UI ── */
  useEffect(() => {
    switch (chatState) {
      case 'thinking':
        setBubbleText('...')
        setShowBubble(true)
        setShowInput(false)
        clearBubbleTimer()
        break
      case 'streaming':
        setBubbleText(response)
        setShowBubble(true)
        clearBubbleTimer()
        break
      case 'idle':
        if (response) {
          setBubbleText(response)
          setShowBubble(true)
          bubbleTimerRef.current = setTimeout(() => {
            setShowBubble(false)
            setBubbleText('')
          }, 8000)
        }
        break
      case 'error':
        setBubbleText(response)
        setShowBubble(true)
        bubbleTimerRef.current = setTimeout(() => {
          setShowBubble(false)
          setBubbleText('')
        }, 6000)
        break
    }
  }, [chatState, response, clearBubbleTimer])

  /* ── Scroll dismisses active bubble ── */
  useEffect(() => {
    const handleScroll = () => {
      if (showBubble && greetingDoneRef.current) dismissBubble()
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [showBubble, dismissBubble])

  /* ── Click handler ── */
  const handleNukeClick = useCallback(() => {
    if (isActiveInput) isActiveInput.fire()
    if (showInput) {
      setShowInput(false)
    } else {
      dismissBubble()
      clearResponse()
      setShowInput(true)
    }
  }, [showInput, dismissBubble, clearResponse, isActiveInput])

  const handleSend = useCallback((message: string) => sendMessage(message), [sendMessage])
  const handleCloseInput = useCallback(() => setShowInput(false), [])

  return (
    <div className="nuke-overlay">
      <div ref={posRef} className="nuke-pos">
        <div ref={bobRef} className="nuke-bob">
          <div
            className="nuke-avatar group"
            onClick={handleNukeClick}
            onMouseEnter={() => {
              setShowTooltip(true)
              if (isHoveredInput) isHoveredInput.value = true
            }}
            onMouseLeave={() => {
              setShowTooltip(false)
              if (isHoveredInput) isHoveredInput.value = false
            }}
          >
            {/* Rive mech character — assembled from 6 body parts */}
            <RiveComponent
              style={{
                width: NUKE_SIZE,
                height: Math.round(NUKE_SIZE * (512 / 768)),
              }}
            />

            {showTooltip && !showBubble && !showInput && (
              <div className="nuke-tooltip nuke-bubble-enter">
                <span className="whitespace-nowrap rounded-lg border border-white/[0.1] bg-black/70 px-3 py-1.5 text-[11px] font-medium text-white/70 backdrop-blur-lg">
                  Ask Nuke a question
                </span>
              </div>
            )}
          </div>

          {showBubble && (
            <div className="nuke-bubble-float">
              <SpeechBubble
                text={bubbleText}
                visible={showBubble}
                isThinking={chatState === 'thinking'}
              />
            </div>
          )}

          {showInput && !showBubble && (
            <div className="nuke-input-float">
              <NukeChatInput
                visible={showInput && !showBubble}
                onSend={handleSend}
                onClose={handleCloseInput}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
