import { useState, useEffect } from 'react'

/** Breakpoint for mobile detection — matches Tailwind `md` */
const MOBILE_BREAKPOINT = 768

/**
 * Returns true when the viewport width is below the mobile breakpoint.
 * Uses window.matchMedia for efficient, event-driven detection (no resize polling).
 * SSR-safe: defaults to false on server.
 */
export function useIsMobile(breakpoint = MOBILE_BREAKPOINT): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < breakpoint
  })

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)

    // Set initial value (handles React 18 StrictMode double-mount)
    setIsMobile(mql.matches)

    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [breakpoint])

  return isMobile
}
