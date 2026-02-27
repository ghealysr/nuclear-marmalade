import { useEffect, useRef } from 'react'
import {
  motion,
  useScroll,
  useVelocity,
  useSpring,
  useMotionValue,
  useReducedMotion,
} from 'framer-motion'

/* ── Constants ── */
const NUKE_SPRITE_SRC = '/images/nuke-active.png'

/* Sprite sheet layout: 4 columns × 2 rows = 8 frames
   Frame 0 = upright hover (idle)
   Frame 7 = full-speed dive */
const COLS = 4

/* Map frame index → CSS background-position percentage */
function frameToBgPos(frame: number): string {
  const col = frame % COLS
  const row = Math.floor(frame / COLS)
  const xPct = col === 0 ? '0%' : col === 1 ? '33.33%' : col === 2 ? '66.67%' : '100%'
  const yPct = row === 0 ? '0%' : '100%'
  return `${xPct} ${yPct}`
}

/* Map absolute scroll velocity → frame index (0-7) */
function velocityToFrame(velocity: number): number {
  const v = Math.abs(velocity)
  if (v < 200) return 0  // idle hover
  if (v < 500) return 1  // slight lean
  if (v < 800) return 2  // tilting
  if (v < 1200) return 3 // active flight
  if (v < 1500) return 4 // fast
  if (v < 1800) return 5 // faster
  if (v < 2200) return 6 // diving
  return 7                // full dive
}

/* ── Brand Colors ── */
const AMBER_GLOW_LOW = 'drop-shadow(0px 10px 15px rgba(251, 191, 36, 0.3))'
const AMBER_GLOW_HIGH = 'drop-shadow(0px 20px 25px rgba(251, 191, 36, 0.6))'
const AMBER_GLOW_HOVER = 'drop-shadow(0px 0px 40px rgba(251, 191, 36, 0.9))'

/* ── Props ── */
interface RoamingNukeProps {
  onOpenChat?: () => void
}

export function RoamingNuke({ onOpenChat }: RoamingNukeProps) {
  const prefersReducedMotion = useReducedMotion()

  /* ── Scroll-velocity → sprite frame ── */
  const { scrollY } = useScroll()
  const scrollVelocity = useVelocity(scrollY)
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400,
  })

  /* ── Sprite frame ref (direct DOM update, zero re-renders) ── */
  const spriteRef = useRef<HTMLDivElement>(null)
  const lastFrameRef = useRef(0)

  useEffect(() => {
    const unsubscribe = smoothVelocity.on('change', (v) => {
      const frame = velocityToFrame(v)
      if (frame !== lastFrameRef.current && spriteRef.current) {
        spriteRef.current.style.backgroundPosition = frameToBgPos(frame)
        lastFrameRef.current = frame
      }
    })
    return unsubscribe
  }, [smoothVelocity])

  /* ── Mouse parallax (MotionValues, NOT React state → zero re-renders) ── */
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const smoothMouseX = useSpring(mouseX, {
    damping: 20,
    stiffness: 150,
    mass: 0.5,
  })
  const smoothMouseY = useSpring(mouseY, {
    damping: 20,
    stiffness: 150,
    mass: 0.5,
  })

  /* ── Mouse tracking listener ── */
  useEffect(() => {
    if (prefersReducedMotion) return

    const handleMouseMove = (e: MouseEvent) => {
      // Map viewport position to ±30px drift for parallax illusion
      const xOffset = (e.clientX / window.innerWidth - 0.5) * 60
      const yOffset = (e.clientY / window.innerHeight - 0.5) * 60
      mouseX.set(xOffset)
      mouseY.set(yOffset)
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY, prefersReducedMotion])

  /* ── Click handler ── */
  const handleClick = () => {
    onOpenChat?.()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  /* ── Reduced motion: static fallback ── */
  if (prefersReducedMotion) {
    return (
      <div
        className="fixed bottom-8 left-8 z-[100] cursor-pointer md:bottom-12 md:left-12"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Open chat with Nuke"
      >
        <div
          className="h-auto w-32 aspect-[3/4] md:w-48"
          style={{
            backgroundImage: `url(${NUKE_SPRITE_SRC})`,
            backgroundSize: '400% 200%',
            backgroundPosition: '0% 0%',
            backgroundRepeat: 'no-repeat',
            filter: AMBER_GLOW_LOW,
          }}
        />
      </div>
    )
  }

  return (
    <motion.div
      className="fixed bottom-8 left-8 z-[100] cursor-pointer md:bottom-12 md:left-12"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label="Open chat with Nuke"
      // Outer layer: mouse parallax offset
      style={{
        x: smoothMouseX,
        y: smoothMouseY,
      }}
    >
      {/* Middle layer: idle anti-gravity bob */}
      <motion.div
        animate={{ y: [-12, 12, -12] }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Inner layer: sprite sheet frame + glow */}
        <motion.div
          ref={spriteRef}
          className="w-32 aspect-[3/4] md:w-48"
          style={{
            backgroundImage: `url(${NUKE_SPRITE_SRC})`,
            backgroundSize: '400% 200%',
            backgroundPosition: '0% 0%',
            backgroundRepeat: 'no-repeat',
          }}
          // Pulsing amber glow
          animate={{
            filter: [AMBER_GLOW_LOW, AMBER_GLOW_HIGH, AMBER_GLOW_LOW],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          // Interactive feedback
          whileHover={{
            scale: 1.05,
            filter: AMBER_GLOW_HOVER,
          }}
          whileTap={{ scale: 0.95 }}
        />
      </motion.div>
    </motion.div>
  )
}
