import { Suspense, useState, useRef, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { NukeModel } from './NukeModel'
import type { NukeChatState } from './NukeModel'
import { NukeTrailParticles } from './NukeTrailParticles'
import type { ModelScreenPos } from './NukeTrailParticles'

interface NukeCanvasProps {
  /** Callback when the model (hit area) is clicked */
  onModelClick: () => void
  /** Called when the fly-in animation completes */
  onLanded?: () => void
  /** Current section target position for the model (from useNukeFlight) */
  targetPosition?: [number, number, number]
  /** Current section ID — used to position the hit area */
  currentSection?: string
  /** Whether the smile mesh should be visible */
  isSmiling?: boolean
  /** Current chat state — drives model animation variations */
  chatState?: NukeChatState
  /** Whether the chat is currently active (has bubble or input visible) */
  chatActive?: boolean
  /** Whether the viewport is mobile (<768px) */
  isMobile?: boolean
}

/**
 * Fixed-position R3F Canvas overlay.
 * Covers entire viewport, sits above DOM content.
 * Rule 1: ONE Canvas, ONE Scene. This is the single Canvas for the entire app.
 * Rule 2: Canvas MUST be transparent (alpha: true, no background).
 * Rule 3: Canvas does NOT block DOM (pointerEvents: none).
 *
 * Pointer events: Canvas has pointerEvents: none so DOM stays interactive.
 * Model clicks handled via a DOM hit-area overlay (NukeHitArea) positioned
 * over the model's screen location, rendered alongside this component.
 *
 * Mobile adaptations:
 * - Smaller model scale (0.55 vs 0.8)
 * - Centered position instead of right-side
 * - Bloom disabled (GPU savings on mobile)
 * - Lower DPR cap (1.5 vs 2)
 */
export function NukeCanvas({ onModelClick, onLanded, targetPosition, currentSection, isSmiling, chatState, chatActive, isMobile = false }: NukeCanvasProps) {
  // Memoize initial position so NukeModel's fly-in GSAP effect doesn't restart on parent re-renders.
  // Mobile: right side clear of text; Desktop: far right margin
  const modelPosition = useMemo<[number, number, number]>(
    () => isMobile ? [1.8, -0.3, 0] : [3.0, -0.2, 0],
    [isMobile],
  )

  // Model scale: Nuke is a small floating companion beside content
  // GLB model is very large natively (~20+ units), so scale must be tiny
  const modelScale = isMobile ? 0.03 : 0.045

  // DPR: cap lower on mobile for GPU savings
  const dpr: [number, number] = isMobile ? [1, 1.5] : [1, 2]

  // Shared ref: NukeModel (inside Canvas) writes projected screen coords,
  // NukeTrailParticles (DOM) reads them to spawn particles at the model's position.
  const screenPosRef = useRef<ModelScreenPos>({ x: 0, y: 0, flying: false })

  return (
    <>
      {/* DOM particle trail — below Canvas (z-index 49) */}
      <NukeTrailParticles screenPosRef={screenPosRef} />

      <Canvas
        gl={{
          alpha: true,
          antialias: !isMobile, // Disable AA on mobile for performance
          powerPreference: 'high-performance',
        }}
        camera={{ position: [0, 0, 5], fov: 50 }}
        dpr={dpr}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 50,
          background: 'transparent',
        }}
      >
        {/* Lighting — simple setup, PBR textures do the heavy lifting */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />

        {/* Model — Suspense for async GLB loading */}
        <Suspense fallback={null}>
          <NukeModel
            position={modelPosition}
            scale={modelScale}
            onLanded={onLanded}
            targetPosition={targetPosition}
            screenPosRef={screenPosRef}
            isSmiling={isSmiling}
            chatState={chatState}
          />
        </Suspense>

        {/* Selective bloom — desktop only (GPU expensive, not worth it on mobile) */}
        {!isMobile && (
          <EffectComposer>
            <Bloom
              luminanceThreshold={1}
              luminanceSmoothing={0.9}
              intensity={0.6}
              mipmapBlur
            />
          </EffectComposer>
        )}
      </Canvas>

      {/* DOM hit-area overlay — positioned over the model for click/hover */}
      <NukeHitArea
        onClick={onModelClick}
        currentSection={currentSection}
        showTooltip={!chatActive}
        isMobile={isMobile}
      />
    </>
  )
}

/**
 * Approximate screen positions for each section.
 * Maps 3D world positions to CSS positioning on the viewport.
 *
 * Camera: [0, 0, 5], fov 50 → visible range at z=0:
 *   halfHeight = 5 * tan(25°) ≈ 2.33 → Y range [-2.33, 2.33]
 *   halfWidth depends on aspect ratio (~4.14 at 16:9)
 *
 * Mapping: (worldX / halfWidth + 1) / 2 → fraction from left
 */
const HIT_AREA_POSITIONS_DESKTOP: Record<string, { right: string; top: string }> = {
  hero:     { right: '4%',  top: '30%' },    // model at [3.0, -0.2, 0]
  services: { right: '4%',  top: '20%' },    // model at [3.0, 0.5, 0]
  nuke:     { right: '44%', top: '38%' },    // model at [0, -0.3, 0] — centered
}

/**
 * Mobile hit area positions — model is always centered.
 * Uses left+transform centering instead of right positioning.
 */
const HIT_AREA_POSITIONS_MOBILE: Record<string, { left: string; top: string }> = {
  hero:     { left: '75%', top: '32%' },     // model at [1.8, -0.3, 0]
  services: { left: '75%', top: '28%' },     // model at [1.8, -0.1, 0]
  nuke:     { left: '50%', top: '38%' },     // model at [0, -0.3, 0]
}

/**
 * Invisible DOM overlay positioned where the 3D model appears on screen.
 * Handles click and hover since the Canvas has pointerEvents: none.
 * Position updates with CSS transition when model flies to a new section.
 */
function NukeHitArea({
  onClick,
  currentSection,
  showTooltip = false,
  isMobile = false,
}: {
  onClick: () => void
  currentSection?: string
  showTooltip?: boolean
  isMobile?: boolean
}) {
  const [hovered, setHovered] = useState(false)

  // Hit area dimensions — generous for easy clicking
  const hitWidth = isMobile ? '100px' : '140px'
  const hitHeight = isMobile ? '180px' : '260px'

  if (isMobile) {
    const pos = HIT_AREA_POSITIONS_MOBILE[currentSection ?? 'hero'] ?? HIT_AREA_POSITIONS_MOBILE.hero
    return (
      <div
        onClick={onClick}
        style={{
          position: 'fixed',
          left: pos.left,
          top: pos.top,
          transform: 'translateX(-50%)',
          width: hitWidth,
          height: hitHeight,
          zIndex: 51,
          pointerEvents: 'auto',
          cursor: 'pointer',
          transition: 'left 1.2s ease-in-out, top 1.2s ease-in-out',
        }}
        aria-label="Talk to Nuke"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onClick()
        }}
      />
    )
  }

  // Desktop hit area
  const pos = HIT_AREA_POSITIONS_DESKTOP[currentSection ?? 'hero'] ?? HIT_AREA_POSITIONS_DESKTOP.hero

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => {
        setHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onMouseLeave={() => {
        setHovered(false)
        document.body.style.cursor = 'auto'
      }}
      style={{
        position: 'fixed',
        right: pos.right,
        top: pos.top,
        width: hitWidth,
        height: hitHeight,
        zIndex: 51,
        pointerEvents: 'auto',
        cursor: hovered ? 'pointer' : 'auto',
        // Smooth transition when model moves between sections
        transition: 'right 1.2s ease-in-out, top 1.2s ease-in-out',
        // Debug: uncomment to visualize hit area
        // background: 'rgba(251, 191, 36, 0.15)',
        // border: '1px solid rgba(251, 191, 36, 0.3)',
      }}
      aria-label="Talk to Nuke"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick()
      }}
    >
      {/* Hover tooltip — shown when hovering and no chat is active (desktop only) */}
      {hovered && showTooltip && (
        <div
          style={{
            position: 'absolute',
            bottom: '-10px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            borderRadius: '8px',
            padding: '6px 12px',
            color: '#fbbf24',
            fontSize: '12px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          Ask Nuke a question
        </div>
      )}
    </div>
  )
}
