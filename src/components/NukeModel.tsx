import { useRef, useMemo, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import type { GroupProps } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import type { ModelScreenPos } from './NukeTrailParticles'

const MODEL_PATH = '/models/astronaut_final.glb'

/** Chat state types mirrored from useNukeChat */
export type NukeChatState = 'idle' | 'thinking' | 'streaming' | 'error'

interface NukeModelProps extends GroupProps {
  /** Whether the smile mesh should be visible */
  isSmiling?: boolean
  /** Current chat state — drives animation variations */
  chatState?: NukeChatState
  /** Called when fly-in animation completes */
  onLanded?: () => void
  /**
   * Target position for section-triggered flights.
   * When this changes AFTER the initial fly-in, a new GSAP section flight
   * animates the model to the new position.
   */
  targetPosition?: [number, number, number]
  /** Shared ref for projecting model screen position to DOM particle system */
  screenPosRef?: React.RefObject<ModelScreenPos>
}

/**
 * GSAP-driven flight proxy.
 * GSAP tweens these values; useFrame reads them each frame.
 * This bridges GSAP (timing world) → R3F (render loop).
 */
interface FlightProxy {
  x: number
  y: number
  z: number
  rotZ: number   // lean rotation during flight (radians)
  scaleX: number
  scaleY: number
  opacity: number
}

/**
 * Mutable state for autonomous roaming.
 * Picked randomly every few seconds — model drifts toward these offsets.
 */
interface RoamTarget {
  x: number
  y: number
  nextChangeTime: number
}

export function NukeModel({ isSmiling = false, chatState = 'idle', onLanded, targetPosition, screenPosRef, ...props }: NukeModelProps) {
  const groupRef = useRef<THREE.Group>(null)
  const { scene } = useGLTF(MODEL_PATH)

  // Clone the scene so multiple instances don't share state
  const clonedScene = useMemo(() => scene.clone(true), [scene])

  // Smile mesh reference — toggled by isSmiling prop
  const smileMesh = useRef<THREE.Object3D | null>(null)

  // Track emissive materials for bloom pulse animation
  const emissiveMaterials = useRef<THREE.MeshStandardMaterial[]>([])

  // Flight state
  const hasLanded = useRef(false)
  const initialFlyInDone = useRef(false)
  const flightProxy = useRef<FlightProxy>({
    x: 8, y: 4, z: 0,           // Start off-screen: upper-right
    rotZ: -0.2,                   // Lean into flight direction
    scaleX: 0.9, scaleY: 1.12,  // Launch stretch
    opacity: 0,
  })

  // Mutable base position — updated after each flight completes.
  // useFrame reads this for idle bob offsets.
  const currentBase = useRef(new THREE.Vector3(0, 0, 0))

  // Track active section flight timeline for cleanup
  const sectionTlRef = useRef<gsap.core.Timeline | null>(null)

  // --- Mouse tracking ---
  // Stores normalized mouse position [-1, 1] for both axes
  const mouseNDC = useRef({ x: 0, y: 0 })
  // Smoothed mouse values (lerped in useFrame)
  const mouseLerped = useRef({ x: 0, y: 0 })

  // --- Autonomous roaming ---
  const roamTarget = useRef<RoamTarget>({ x: 0, y: 0, nextChangeTime: 0 })
  const roamCurrent = useRef({ x: 0, y: 0 })

  // Mouse tracking listener
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      // Convert to NDC [-1, 1]
      mouseNDC.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouseNDC.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('mousemove', onMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMouseMove)
  }, [])

  /**
   * Setup emissive materials for selective bloom.
   */
  useEffect(() => {
    const mats: THREE.MeshStandardMaterial[] = []
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material]
        for (const mat of materials) {
          if (mat instanceof THREE.MeshStandardMaterial) {
            if (mat.emissive && mat.emissive.getHex() !== 0x000000) {
              mat.emissiveIntensity = 2.0
              mat.toneMapped = false
              mats.push(mat)
            }
            // Glass material (visor) — restore dark, reflective look.
            if (mat.name === 'Glass') {
              mat.color = new THREE.Color('#1a1a1a')
              mat.emissive = new THREE.Color('#000000')
              mat.emissiveIntensity = 0
              mat.metalness = 0.9
              mat.roughness = 0.05
              mat.transparent = false
              mat.opacity = 1.0
              mat.toneMapped = true
              mat.envMapIntensity = 2.0
            }
          }
        }
      }
    })
    emissiveMaterials.current = mats

    // Find the smile mesh — starts hidden
    const smile = clonedScene.getObjectByName('smile')
    if (smile) {
      smile.visible = false
      smileMesh.current = smile
    }
  }, [clonedScene])

  /**
   * Toggle smile mesh visibility based on isSmiling prop.
   */
  useEffect(() => {
    if (smileMesh.current) {
      smileMesh.current.visible = isSmiling
    }
  }, [isSmiling])

  // Store the initial fly-in landing position from props.
  const posArr = props.position
  const px = Array.isArray(posArr) ? posArr[0] : posArr instanceof THREE.Vector3 ? posArr.x : 0
  const py = Array.isArray(posArr) ? posArr[1] : posArr instanceof THREE.Vector3 ? posArr.y : 0
  const pz = Array.isArray(posArr) ? posArr[2] : posArr instanceof THREE.Vector3 ? posArr.z : 0
  const initialPosition = useMemo(() => new THREE.Vector3(px, py, pz), [px, py, pz])

  /**
   * GSAP fly-in animation on mount.
   * Dramatic entrance: 1.5s delay, sweeping arc, elastic landing.
   */
  useEffect(() => {
    const proxy = flightProxy.current
    hasLanded.current = false
    initialFlyInDone.current = false

    // Reset to start position
    Object.assign(proxy, {
      x: 8, y: 4, z: 0,
      rotZ: -0.2,
      scaleX: 0.9, scaleY: 1.12,
      opacity: 0,
    })

    const tl = gsap.timeline()

    // Phase 1: Fade in (quick)
    tl.to(proxy, {
      opacity: 1,
      duration: 0.4,
      delay: 1.5, // Dramatic delay — page loads, then Nuke swoops in
      ease: 'power1.in',
    }, 0)

    // Phase 2: Arc flight — overshoot Y then settle
    // X flight
    tl.to(proxy, {
      x: initialPosition.x,
      duration: 2.0,
      delay: 1.5,
      ease: 'power3.out',
    }, 0)

    // Y flight: arc UP first, then down to target
    tl.to(proxy, {
      y: initialPosition.y + 1.0, // Overshoot above target
      duration: 1.2,
      delay: 1.5,
      ease: 'power2.out',
    }, 0)
    tl.to(proxy, {
      y: initialPosition.y,
      duration: 0.8,
      ease: 'power2.inOut',
    }, 2.7)

    tl.to(proxy, {
      z: initialPosition.z,
      duration: 2.0,
      delay: 1.5,
      ease: 'power3.out',
    }, 0)

    // Phase 3: Normalize rotation and stretch during flight
    tl.to(proxy, {
      rotZ: 0.05, // Slight opposite lean as deceleration
      scaleX: 1, scaleY: 1,
      duration: 1.4,
      delay: 1.8,
      ease: 'power2.out',
    }, 0)

    // Phase 4: Landing squash
    tl.to(proxy, {
      scaleY: 0.85, scaleX: 1.15,
      rotZ: 0,
      duration: 0.12,
      ease: 'power2.in',
    }, 3.3)

    // Phase 5: Elastic bounce back
    tl.to(proxy, {
      scaleY: 1, scaleX: 1,
      duration: 0.8,
      ease: 'elastic.out(1.2, 0.3)',
      onComplete: () => {
        hasLanded.current = true
        initialFlyInDone.current = true
        currentBase.current.copy(initialPosition)
        onLanded?.()
      },
    }, 3.42)

    return () => {
      tl.kill()
      hasLanded.current = false
    }
  }, [initialPosition, onLanded])

  /**
   * Section-triggered flight.
   * Arc trajectory with lean + squash/stretch.
   */
  const tx = targetPosition?.[0] ?? px
  const ty = targetPosition?.[1] ?? py
  const tz = targetPosition?.[2] ?? pz

  useEffect(() => {
    if (!initialFlyInDone.current) return

    const dx = tx - currentBase.current.x
    const dy = ty - currentBase.current.y
    const dz = tz - currentBase.current.z
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
    if (dist < 0.01) return

    sectionTlRef.current?.kill()

    const proxy = flightProxy.current
    proxy.x = currentBase.current.x
    proxy.y = currentBase.current.y
    proxy.z = currentBase.current.z

    hasLanded.current = false

    // Lean toward movement direction
    const leanZ = dx > 0.1 ? -0.12 : dx < -0.1 ? 0.12 : 0

    const tl = gsap.timeline()

    // Launch stretch + lean
    tl.to(proxy, {
      scaleY: 1.08, scaleX: 0.94,
      rotZ: leanZ,
      duration: 0.15,
      ease: 'power2.out',
    }, 0)

    // X position
    tl.to(proxy, {
      x: tx,
      duration: 1.2,
      ease: 'power2.inOut',
    }, 0.05)

    // Y: arc overshoot by 0.4 then settle
    const midY = (currentBase.current.y + ty) / 2 + 0.4
    tl.to(proxy, {
      y: midY,
      duration: 0.6,
      ease: 'power2.out',
    }, 0.05)
    tl.to(proxy, {
      y: ty,
      duration: 0.6,
      ease: 'power2.inOut',
    }, 0.65)

    tl.to(proxy, {
      z: tz,
      duration: 1.2,
      ease: 'power2.inOut',
    }, 0.05)

    // Normalize lean mid-flight
    tl.to(proxy, {
      rotZ: 0,
      scaleX: 1, scaleY: 1,
      duration: 0.6,
      ease: 'power2.out',
    }, 0.5)

    // Landing squash + bounce
    tl.to(proxy, {
      scaleY: 0.88, scaleX: 1.12,
      duration: 0.1,
      ease: 'power2.in',
    }, 1.1)

    tl.to(proxy, {
      scaleY: 1, scaleX: 1,
      duration: 0.6,
      ease: 'elastic.out(1.0, 0.4)',
      onComplete: () => {
        hasLanded.current = true
        currentBase.current.set(tx, ty, tz)
      },
    }, 1.2)

    sectionTlRef.current = tl

    return () => {
      tl.kill()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tx, ty, tz])

  /**
   * Per-frame animation.
   *
   * After landing — the model is ALIVE:
   * - Multi-frequency organic bob (3 sine waves)
   * - Autonomous micro-roaming (random drift every 3-6s)
   * - Mouse tracking (body rotates toward cursor)
   * - Breathing scale pulse
   * - Chat-state variations (thinking wobble, streaming nod, error shake)
   *
   * During flight: reads flightProxy values directly.
   */
  const projVec = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ clock, camera, size }) => {
    if (!groupRef.current) return
    const t = clock.elapsedTime
    const proxy = flightProxy.current

    if (hasLanded.current) {
      const base = currentBase.current

      // --- Smooth mouse tracking (lerp toward actual mouse position) ---
      const lerpSpeed = 0.03
      mouseLerped.current.x += (mouseNDC.current.x - mouseLerped.current.x) * lerpSpeed
      mouseLerped.current.y += (mouseNDC.current.y - mouseLerped.current.y) * lerpSpeed

      // --- Autonomous micro-roaming ---
      // Pick new random offset every 3-6 seconds
      if (t > roamTarget.current.nextChangeTime) {
        roamTarget.current.x = (Math.random() - 0.5) * 0.6  // ±0.3 world units
        roamTarget.current.y = (Math.random() - 0.5) * 0.4  // ±0.2 world units
        roamTarget.current.nextChangeTime = t + 3 + Math.random() * 3
      }
      // Slowly drift toward roam target
      roamCurrent.current.x += (roamTarget.current.x - roamCurrent.current.x) * 0.008
      roamCurrent.current.y += (roamTarget.current.y - roamCurrent.current.y) * 0.008

      // --- Multi-frequency organic bob ---
      // Three sine waves at different frequencies for weightless feeling
      const isThinking = chatState === 'thinking'
      const isStreaming = chatState === 'streaming'
      const isError = chatState === 'error'

      const bobMult = isThinking ? 1.8 : 1.0
      const bob1 = Math.sin(t * 0.8 * bobMult) * 0.12   // Primary slow bob
      const bob2 = Math.sin(t * 1.7 * bobMult) * 0.06   // Secondary faster ripple
      const bob3 = Math.sin(t * 0.4) * 0.08              // Ultra-slow drift
      const totalBob = bob1 + bob2 + bob3

      // Lateral sway — figure-eight-ish pattern
      const swayX = Math.sin(t * 0.6) * 0.08 + Math.sin(t * 1.1) * 0.04

      // Apply position: base + roam + bob + sway
      groupRef.current.position.x = base.x + roamCurrent.current.x + swayX
      groupRef.current.position.y = base.y + roamCurrent.current.y + totalBob
      groupRef.current.position.z = base.z

      // --- Rotation: mouse tracking + organic sway ---
      // Body rotates toward mouse cursor (Y = left/right, X = up/down tilt)
      const mouseRotY = mouseLerped.current.x * 0.4     // Turn toward cursor horizontally
      const mouseRotX = -mouseLerped.current.y * 0.15   // Slight tilt toward cursor vertically

      // Organic rotation layer
      const organicRotY = Math.sin(t * 0.35) * 0.1
      const organicRotZ = Math.sin(t * 0.25) * 0.04     // Tiny roll

      // Chat state rotation overrides
      let chatRotX = 0
      if (isStreaming) {
        chatRotX = Math.sin(t * 1.5) * 0.05  // Gentle nod
      } else if (isError) {
        chatRotX = Math.sin(t * 15) * 0.04   // Rapid shake
      } else if (isThinking) {
        chatRotX = 0.08                        // Forward lean
      }

      groupRef.current.rotation.y = mouseRotY + organicRotY
      groupRef.current.rotation.x = mouseRotX + chatRotX
      groupRef.current.rotation.z = organicRotZ

      // --- Breathing scale pulse ---
      const breathe = 1 + Math.sin(t * 1.2) * 0.012
      groupRef.current.scale.set(breathe, breathe, breathe)

    } else {
      // --- GSAP-driven flight ---
      groupRef.current.position.set(proxy.x, proxy.y, proxy.z)
      groupRef.current.rotation.z = proxy.rotZ
      groupRef.current.rotation.y = 0
      groupRef.current.rotation.x = 0
      groupRef.current.scale.set(proxy.scaleX, proxy.scaleY, 1)
    }

    // --- Project 3D position → screen coords for DOM particle trail ---
    if (screenPosRef?.current) {
      projVec.copy(groupRef.current.position)
      projVec.project(camera)
      screenPosRef.current.x = (projVec.x * 0.5 + 0.5) * size.width
      screenPosRef.current.y = (-projVec.y * 0.5 + 0.5) * size.height
      screenPosRef.current.flying = !hasLanded.current
    }

    // --- Set opacity via material traverse (group opacity not natively supported) ---
    if (proxy.opacity < 1) {
      clonedScene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material]
          for (const mat of mats) {
            if (mat instanceof THREE.Material) {
              mat.transparent = true
              mat.opacity = proxy.opacity
            }
          }
        }
      })
    }

    // --- Bloom pulse (breathing glow) ---
    const pulseIntensity = 1.5 + Math.sin(t * 2) * 0.5
    for (const mat of emissiveMaterials.current) {
      mat.emissiveIntensity = pulseIntensity
    }
  })

  return (
    <group ref={groupRef} {...props}>
      <primitive object={clonedScene} />
    </group>
  )
}

// Preload at module scope — model loads before Canvas mounts (Rule 6)
useGLTF.preload(MODEL_PATH)
