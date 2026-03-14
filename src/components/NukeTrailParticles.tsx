import { useRef, useEffect, useCallback } from 'react'
import gsap from 'gsap'

/**
 * Shared ref shape — NukeModel writes, NukeTrailParticles reads.
 * Updated every frame from inside the R3F render loop.
 */
export interface ModelScreenPos {
  x: number
  y: number
  flying: boolean
}

interface NukeTrailParticlesProps {
  /** Ref written by NukeModel with projected screen coords + flight state */
  screenPosRef: React.RefObject<ModelScreenPos>
}

/** Particle visual config */
const PARTICLE_INTERVAL = 80       // ms between spawns during flight
const PARTICLE_LIFETIME = 800      // ms — how long each particle lives
const PARTICLE_SIZE_MIN = 4        // px
const PARTICLE_SIZE_MAX = 8        // px
const PARTICLE_DRIFT = 30          // px — max random spread from flight path
const PARTICLE_COLOR = '#fbbf24'   // amber brand color
const MAX_PARTICLES = 40           // cap to prevent DOM bloat

/**
 * DOM-based particle trail for the Nuke model during flight.
 * Reads the model's projected screen position from a shared ref
 * and spawns small amber circles that fade and drift.
 *
 * Architecture:
 * - Fixed-position container at z-index 49 (below Canvas at 50)
 * - requestAnimationFrame polling loop reads screenPosRef
 * - Spawns <div> particles at model position during active flight
 * - GSAP animates each particle: opacity + scale → 0, random drift
 * - DOM element removed on animation complete
 */
export function NukeTrailParticles({ screenPosRef }: NukeTrailParticlesProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const particleCount = useRef(0)
  const lastSpawnTime = useRef(0)
  const rafId = useRef<number>(0)

  const spawnParticle = useCallback((x: number, y: number) => {
    const container = containerRef.current
    if (!container || particleCount.current >= MAX_PARTICLES) return

    const size = PARTICLE_SIZE_MIN + Math.random() * (PARTICLE_SIZE_MAX - PARTICLE_SIZE_MIN)
    const driftX = (Math.random() - 0.5) * PARTICLE_DRIFT * 2
    const driftY = (Math.random() - 0.5) * PARTICLE_DRIFT * 2

    const el = document.createElement('div')
    el.style.cssText = `
      position: absolute;
      left: ${x - size / 2}px;
      top: ${y - size / 2}px;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: ${PARTICLE_COLOR};
      opacity: 0.8;
      pointer-events: none;
      will-change: transform, opacity;
      box-shadow: 0 0 ${size}px ${PARTICLE_COLOR}40;
    `
    container.appendChild(el)
    particleCount.current++

    gsap.to(el, {
      x: driftX,
      y: driftY,
      opacity: 0,
      scale: 0.15,
      duration: PARTICLE_LIFETIME / 1000,
      ease: 'power2.out',
      onComplete: () => {
        el.remove()
        particleCount.current--
      },
    })
  }, [])

  useEffect(() => {
    const loop = () => {
      const now = performance.now()
      const pos = screenPosRef.current

      if (pos && pos.flying && now - lastSpawnTime.current >= PARTICLE_INTERVAL) {
        spawnParticle(pos.x, pos.y)
        lastSpawnTime.current = now
      }

      rafId.current = requestAnimationFrame(loop)
    }

    rafId.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafId.current)
      // Clean up any remaining particles
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
      particleCount.current = 0
    }
  }, [screenPosRef, spawnParticle])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 49, // Below Canvas (50), above page content
        overflow: 'hidden',
      }}
    />
  )
}
