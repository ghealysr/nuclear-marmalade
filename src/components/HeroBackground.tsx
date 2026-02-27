const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  size: 1 + (i % 3),
  left: `${(i * 8.3) % 100}%`,
  delay: `${i * 1.7}s`,
  duration: `${15 + (i % 5) * 4}s`,
}))

export function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Video layer — full-bleed, no upscale tricks */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      >
        <source src="/video/hero_portal_v2_loop.mp4" type="video/mp4" />
      </video>

      {/* Radial vignette — light center, dark edges only */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 45%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.1) 35%, rgba(0,0,0,0.4) 65%, rgba(0,0,0,0.85) 100%)',
        }}
      />

      {/* Top fade for navbar readability */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/30 to-transparent" />

      {/* Bottom fade for seamless section transition */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black to-transparent" />

      {/* Floating particles (CSS-only, deterministic positions) */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {PARTICLES.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full bg-white/20"
            style={{
              width: `${p.size}px`,
              height: `${p.size}px`,
              left: p.left,
              bottom: '-10px',
              animation: `floatParticle ${p.duration} linear ${p.delay} infinite`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
