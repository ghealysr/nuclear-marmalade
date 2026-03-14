import { useEffect, useRef, useState } from 'react'

/**
 * Section waypoint — maps a DOM section to a 3D world position.
 * Positions are camera-relative (fixed Canvas at z-index 50).
 *
 * Camera: [0, 0, 5], fov 50 → visible ~[-4.14, 4.14] X, ~[-2.33, 2.33] Y at z=0.
 */
interface SectionWaypoint {
  sectionId: string
  position: [number, number, number]
}

/**
 * Desktop waypoint positions for each section.
 *
 * - hero: Right side, slightly below center (initial fly-in landing spot)
 * - services: Right side, slightly higher (accompanies user exploring services)
 * - nuke: Center, lowered (lands in the MeetNuke "landing zone")
 */
const WAYPOINTS_DESKTOP: SectionWaypoint[] = [
  { sectionId: 'hero', position: [2, -0.5, 0] },
  { sectionId: 'services', position: [2.2, 0.3, 0] },
  { sectionId: 'nuke', position: [0, -0.8, 0] },
]

/**
 * Mobile waypoint positions.
 * Model is centered horizontally and positioned lower to avoid
 * obscuring content on narrow screens.
 */
const WAYPOINTS_MOBILE: SectionWaypoint[] = [
  { sectionId: 'hero', position: [0, -1.2, 0] },
  { sectionId: 'services', position: [0, -1.0, 0] },
  { sectionId: 'nuke', position: [0, -0.8, 0] },
]

/** Default position — matches initial fly-in landing (desktop) */
const DEFAULT_POSITION_DESKTOP: [number, number, number] = [2, -0.5, 0]
const DEFAULT_POSITION_MOBILE: [number, number, number] = [0, -1.2, 0]

/**
 * Observes page sections with IntersectionObserver and returns the
 * current target position for the Nuke model based on which section
 * is most visible.
 *
 * Only activates after the initial fly-in has landed (`hasLanded` = true).
 * Uses IntersectionObserver (consistent with existing Services.tsx pattern)
 * rather than GSAP ScrollTrigger to avoid conflicts with Lenis smooth scrolling.
 *
 * @param hasLanded — true after the GSAP fly-in animation completes
 * @param isMobile — true on viewports < 768px (centered positions)
 * @returns [position, sectionId] — current target and active section name
 */
export function useNukeFlight(hasLanded: boolean, isMobile = false): {
  targetPosition: [number, number, number]
  currentSection: string
} {
  const defaultPos = isMobile ? DEFAULT_POSITION_MOBILE : DEFAULT_POSITION_DESKTOP
  const [targetPosition, setTargetPosition] = useState<[number, number, number]>(defaultPos)
  const [currentSection, setCurrentSection] = useState<string>('hero')
  const sectionRef = useRef<string>('hero')

  // When isMobile changes, update target position for current section
  useEffect(() => {
    const waypoints = isMobile ? WAYPOINTS_MOBILE : WAYPOINTS_DESKTOP
    const current = waypoints.find((w) => w.sectionId === sectionRef.current)
    if (current) {
      setTargetPosition(current.position)
    }
  }, [isMobile])

  useEffect(() => {
    // Don't observe until fly-in is complete
    if (!hasLanded) return

    const waypoints = isMobile ? WAYPOINTS_MOBILE : WAYPOINTS_DESKTOP
    const observers: IntersectionObserver[] = []

    for (const waypoint of waypoints) {
      const el = document.getElementById(waypoint.sectionId)
      if (!el) continue

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && sectionRef.current !== waypoint.sectionId) {
            sectionRef.current = waypoint.sectionId
            setCurrentSection(waypoint.sectionId)
            setTargetPosition(waypoint.position)
          }
        },
        {
          // Fire when 30% of the section is visible — balances responsiveness
          // with avoiding premature triggers during fast scrolling
          threshold: 0.3,
        },
      )

      observer.observe(el)
      observers.push(observer)
    }

    return () => {
      observers.forEach((obs) => obs.disconnect())
    }
  }, [hasLanded, isMobile])

  return { targetPosition, currentSection }
}
