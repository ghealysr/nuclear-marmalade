export function CtaStrip() {
  return (
    <section className="relative bg-white px-6 py-16 text-center md:py-20">
      <p className="font-display text-[clamp(1.2rem,3vw,1.8rem)] font-semibold tracking-[-0.01em] text-black/80">
        Customer Projects Always Accepted
      </p>
      <a
        href="#book"
        className="group relative mt-8 inline-flex items-center gap-2.5 overflow-hidden rounded-full border border-black/10 bg-black/[0.05] px-9 py-4 text-[15px] font-semibold text-black/80 backdrop-blur-sm transition-all duration-300 hover:scale-[1.04] hover:border-black/20 hover:bg-black/[0.08] active:scale-[0.98]"
      >
        <span className="relative z-10">Book a Call</span>
        <svg
          className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </a>
    </section>
  )
}
