import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

/* ── Shared easing curve: fast snap, slow settle ── */
const customEase = [0.22, 1, 0.36, 1] as const

interface InteractiveNotchedCardProps {
  children: ReactNode
  onClick?: () => void
  className?: string
  notch?: number
}

/**
 * Global interactive card with consistent NM hover physics.
 *
 * Provides:
 *  - Octagonal notch clip-path (15px default)
 *  - Glassmorphic backdrop + zinc-950 background
 *  - Hover: -4px lift, amber border brightens, scanline overlay strengthens
 *  - Tap: 0.98 scale compression
 *
 * Use for any clickable card surface across the site.
 */
export function InteractiveNotchedCard({
  children,
  onClick,
  className = '',
  notch = 15,
}: InteractiveNotchedCardProps) {
  return (
    <motion.div
      onClick={onClick}
      className={`relative bg-zinc-950/50 backdrop-blur-md border border-[#FFB800]/10 p-8 cursor-pointer overflow-hidden group ${className}`}
      style={{
        clipPath: `polygon(${notch}px 0, 100% 0, 100% calc(100% - ${notch}px), calc(100% - ${notch}px) 100%, 0 100%, 0 ${notch}px)`,
      }}
      whileHover={{
        y: -4,
        borderColor: 'rgba(255, 184, 0, 0.5)',
        backgroundColor: 'rgba(24, 24, 27, 0.8)',
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3, ease: customEase }}
    >
      {/* Scanline overlay — strengthens on hover */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(255,184,0,0.03)_1px,transparent_1px)] bg-[size:100%_4px] opacity-20 group-hover:opacity-40 transition-opacity duration-300" />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}

export default InteractiveNotchedCard
