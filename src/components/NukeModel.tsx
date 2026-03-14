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
    x: 8, y: 3, z: 0,           // Start off-screen: upper-right
    rotZ: -0.15,                  // Lean into flight direction
    scaleX: 0.92, scaleY: 1.1,  // Launch stretch
    opacity: 0,
  })

  // Mutable base position — updated after each flight completes.
  // useFrame reads this for idle bob offsets.
  const currentBase = useRef(new THREE.Vector3(0, 0, 0))

  // Track active section flight timeline for cleanup
  const sectionTlRef = useRef<gsap.core.Timeline | null>(null)

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
            if (mat.name === 'Glass') {
              mat.emissive = new THREE.Color('#fbbf24')
              mat.emissiveIntensity = 1.5
              mat.toneMapped = false
              mats.push(mat)
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
   * Separate effect so it doesn't re-run the full emissive setup.
   */
  useEffect(() => {
    if (smileMesh.current) {
      smileMesh.current.visible = isSmiling
    }
  }, [isSmiling])

  // Store the initial fly-in landing position from props.
  // Depend on individual x/y/z values — NOT the array reference — so the
  // GSAP fly-in effect doesn't restart on every parent re-render.
  const posArr = props.position
  const px = Array.isArray(posArr) ? posArr[0] : posArr instanceof THREE.Vector3 ? posArr.x : 0
  const py = Array.isArray(posArr) ? posArr[1] : posArr instanceof THREE.Vector3 ? posArr.y : 0
  const pz = Array.isArray(posArr) ? posArr[2] : posArr instanceof THREE.Vector3 ? posArr.z : 0
  const initialPosition = useMemo(() => new THREE.Vector3(px, py, pz), [px, py, pz])

  /**
   * GSAP fly-in animation on mount.
   * Tweens the flightProxy ref; useFrame reads it each frame.
   */
  useEffect(() => {
    const proxy = flightProxy.current
    hasLanded.current = false
    initialFlyInDone.current = false

    // Reset to start position (handles React 18 StrictMode double-mount)
    Object.assign(proxy, {
      x: 8, y: 3, z: 0,
      rotZ: -0.15,
      scaleX: 0.92, scaleY: 1.1,
      opacity: 0,
    })

    const tl = gsap.timeline()

    // Phase 1: Main flight — position + fade in
    tl.to(proxy, {
      x: initialPosition.x,
      y: initialPosition.y,
      z: initialPosition.z,
      opacity: 1,
      duration: 1.4,
      delay: 0.3,
      ease: 'power2.out',
    }, 0)

    // Phase 2: During flight — normalize lean and stretch
    tl.to(proxy, {
      rotZ: 0,
      scaleX: 1, scaleY: 1,
      duration: 1.0,
      ease: 'power2.out',
    }, 0.5)

    // Phase 3: Landing squash
    tl.to(proxy, {
      scaleY: 0.88, scaleX: 1.12,
      duration: 0.12,
      ease: 'power2.in',
    }, 1.5)

    // Phase 4: Elastic bounce back to normal
    tl.to(proxy, {
      scaleY: 1, scaleX: 1,
      duration: 0.6,
      ease: 'elastic.out(1.2, 0.4)',
      onComplete: () => {
        hasLanded.current = true
        initialFlyInDone.current = true
        currentBase.current.copy(initialPosition)
        onLanded?.()
      },
    }, 1.62)

    return () => {
      tl.kill()
      hasLanded.current = false
    }
  }, [initialPosition, onLanded])

  /**
   * Section-triggered flight.
   * After the initial fly-in completes, when targetPosition changes,
   * animate the model from its current position to the new target.
   *
   * Shorter, snappier than the fly-in — 1.2s with smooth in/out easing.
   * Includes lean rotation toward the flight direction.
   */
  // Stabilize targetPosition reference using individual values
  const tx = targetPosition?.[0] ?? px
  const ty = targetPosition?.[1] ?? py
  const tz = targetPosition?.[2] ?? pz

  useEffect(() => {
    // Skip until initial fly-in has completed
    if (!initialFlyInDone.current) return

    // Skip if already at this position (within tolerance)
    const dx = tx - currentBase.current.x
    const dy = ty - currentBase.current.y
    const dz = tz - currentBase.current.z
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
    if (dist < 0.01) return

    // Kill any in-progress section flight
    sectionTlRef.current?.kill()

    const proxy = flightProxy.current

    // Snapshot current position (idle bob position → proxy start)
    proxy.x = currentBase.current.x
    proxy.y = currentBase.current.y
    proxy.z = currentBase.current.z

    // Exit idle, enter flight
    hasLanded.current = false

    // Compute lean direction — lean toward movement direction
    const leanZ = dx > 0.1 ? -0.1 : dx < -0.1 ? 0.1 : 0

    const tl = gsap.timeline()

    // Phase 1: Launch stretch + lean
    tl.to(proxy, {
      scaleY: 1.06, scaleX: 0.95,
      rotZ: leanZ,
      duration: 0.15,
      ease: 'power2.out',
    }, 0)

    // Phase 2: Main flight — position
    tl.to(proxy, {
      x: tx,
      y: ty,
      z: tz,
      duration: 1.2,
      ease: 'power2.inOut',
    }, 0.05)

    // Phase 3: Normalize lean mid-flight
    tl.to(proxy, {
      rotZ: 0,
      scaleX: 1, scaleY: 1,
      duration: 0.6,
      ease: 'power2.out',
    }, 0.5)

    // Phase 4: Landing squash + bounce
    tl.to(proxy, {
      scaleY: 0.9, scaleX: 1.1,
      duration: 0.1,
      ease: 'power2.in',
    }, 1.1)

    tl.to(proxy, {
      scaleY: 1, scaleX: 1,
      duration: 0.5,
      ease: 'elastic.out(1.0, 0.5)',
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
   * During flight: reads flightProxy values directly.
   * After landing: applies idle bob + sway on top of current base position.
   * Bloom pulse runs always.
   */
  // Reusable vector for screen projection (avoids per-frame allocation)
  const projVec = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ clock, camera, size }) => {
    if (!groupRef.current) return
    const t = clock.elapsedTime
    const proxy = flightProxy.current

    if (hasLanded.current) {
      // --- Idle bob (post-landing) with chat-state variations ---
      const base = currentBase.current

      // Chat state modifiers
      const isThinking = chatState === 'thinking'
      const isStreaming = chatState === 'streaming'
      const isError = chatState === 'error'

      // Bob speed: faster when thinking (anxious energy)
      const bobSpeed = isThinking ? 1.6 : 0.8
      const bobAmplitude = isThinking ? 0.2 : 0.15
      const bobY = Math.sin(t * bobSpeed) * bobAmplitude

      const swayX = Math.sin(t * 0.5) * 0.05
      groupRef.current.position.x = base.x + swayX
      groupRef.current.position.y = base.y + bobY
      groupRef.current.position.z = base.z

      // Rotation: gentle sway, with nod during streaming
      groupRef.current.rotation.y = Math.sin(t * 0.3) * 0.08

      if (isStreaming) {
        // Gentle nod during response — small x-axis oscillation
        groupRef.current.rotation.x = Math.sin(t * 1.5) * 0.04
      } else if (isError) {
        // Brief shake — rapid small x oscillations
        groupRef.current.rotation.x = Math.sin(t * 15) * 0.03
      } else if (isThinking) {
        // Subtle forward lean while thinking
        groupRef.current.rotation.x = 0.06
      } else {
        groupRef.current.rotation.x = 0
      }

      groupRef.current.rotation.z = 0
      groupRef.current.scale.set(1, 1, 1)
    } else {
      // --- GSAP-driven flight ---
      groupRef.current.position.set(proxy.x, proxy.y, proxy.z)
      groupRef.current.rotation.z = proxy.rotZ
      groupRef.current.rotation.y = 0
      groupRef.current.scale.set(proxy.scaleX, proxy.scaleY, 1)
    }

    // --- Project 3D position → screen coords for DOM particle trail ---
    if (screenPosRef?.current) {
      projVec.copy(groupRef.current.position)
      projVec.project(camera)
      // NDC [-1,1] → pixel coords
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
