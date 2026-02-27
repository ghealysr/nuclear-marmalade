import { useState } from 'react'
import { motion } from 'framer-motion'

/* ── Types ── */
type SignalCategory = 'ALL' | 'BROADCAST' | 'SOP' | 'INTERCEPT'

interface Signal {
  id: string
  title: string
  excerpt: string
  category: Exclude<SignalCategory, 'ALL'>
  date: string
  thumbnail: string
  readTime: string
  tags: string[]
}

/* ── Signal Data ── */
const SIGNALS: Signal[] = [
  {
    id: 'SIG-001',
    title: 'Inside Our Sovereign SaaS Build',
    excerpt:
      'A full debrief on the headless cognitive infrastructure we deployed for Nukaplakia — from schema design to automated neural routing.',
    category: 'BROADCAST',
    date: '2026.02.24',
    thumbnail: '/images/thumb-saas.jpg',
    readTime: '12 MIN',
    tags: ['Architecture', 'CMS', 'Automation'],
  },
  {
    id: 'SIG-002',
    title: 'Prompt Engineering for Production Agents',
    excerpt:
      'Standard operating procedures for structuring multi-step agent prompts that survive real-world deployment without hallucination drift.',
    category: 'SOP',
    date: '2026.02.20',
    thumbnail: '/images/thumb-prompts.jpg',
    readTime: '8 MIN',
    tags: ['LLM', 'Agents', 'Best Practices'],
  },
  {
    id: 'SIG-003',
    title: 'Claude 4 Drops — What Changes',
    excerpt:
      'Breaking down Anthropic\'s latest release and what it means for production AI workflows. Benchmarks, API changes, migration notes.',
    category: 'INTERCEPT',
    date: '2026.02.18',
    thumbnail: '/images/thumb-claude4.jpg',
    readTime: '5 MIN',
    tags: ['Anthropic', 'LLM', 'Breaking'],
  },
  {
    id: 'SIG-004',
    title: 'Building Predictive Sports Models with LLMs',
    excerpt:
      'How we deployed a low-latency inference layer to process live telemetry and synthesize probability matrices in real time.',
    category: 'BROADCAST',
    date: '2026.02.15',
    thumbnail: '/images/thumb-sports.jpg',
    readTime: '15 MIN',
    tags: ['Analytics', 'Real-Time', 'ML'],
  },
  {
    id: 'SIG-005',
    title: 'Brand Identity Automation Pipeline',
    excerpt:
      'Our SOP for generating cohesive brand ecosystems across 50+ touchpoints using fine-tuned visual diffusion models.',
    category: 'SOP',
    date: '2026.02.10',
    thumbnail: '/images/thumb-brand.jpg',
    readTime: '10 MIN',
    tags: ['Design', 'Diffusion', 'Workflow'],
  },
  {
    id: 'SIG-006',
    title: 'OpenAI Restructures — Industry Impact',
    excerpt:
      'Signal intercept on OpenAI\'s corporate restructuring and what it signals for the competitive landscape in enterprise AI.',
    category: 'INTERCEPT',
    date: '2026.02.05',
    thumbnail: '/images/thumb-openai.jpg',
    readTime: '4 MIN',
    tags: ['Industry', 'OpenAI', 'Analysis'],
  },
]

/* ── Category Config ── */
const CATEGORIES: { key: SignalCategory; label: string }[] = [
  { key: 'ALL', label: 'ALL SIGNALS' },
  { key: 'BROADCAST', label: 'BROADCAST' },
  { key: 'SOP', label: 'SOP' },
  { key: 'INTERCEPT', label: 'INTERCEPT' },
]

const CATEGORY_COLORS: Record<Exclude<SignalCategory, 'ALL'>, string> = {
  BROADCAST: '#FFB800',
  SOP: '#7CB4E8',
  INTERCEPT: '#FF4444',
}

/* ── Notched Card (shared style) ── */
function NotchedCard({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`relative bg-zinc-950/50 backdrop-blur-md border border-[#FFB800]/20 ${className}`}
      style={{
        clipPath:
          'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)',
      }}
    >
      {/* Scanline overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100%_4px] opacity-20" />
      {children}
    </div>
  )
}

/* ── Thumbnail Placeholder (until real images exist) ── */
function ThumbnailPlaceholder({ category }: { category: Exclude<SignalCategory, 'ALL'> }) {
  const color = CATEGORY_COLORS[category]
  return (
    <div className="flex h-full w-full items-center justify-center bg-zinc-900">
      <div className="text-center">
        <div
          className="mx-auto mb-3 h-8 w-8 rounded-sm border opacity-40"
          style={{ borderColor: color }}
        />
        <span
          className="font-mono text-[10px] uppercase tracking-widest opacity-30"
          style={{ color }}
        >
          {category}
        </span>
      </div>
    </div>
  )
}

/* ── Signal Card ── */
function SignalCard({ signal, index }: { signal: Signal; index: number }) {
  const catColor = CATEGORY_COLORS[signal.category]

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: [0.25, 0.1, 0, 1] }}
    >
      <NotchedCard className="group cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-[#FFB800]/40">
        {/* Thumbnail — 16:9 */}
        <div className="relative aspect-video w-full overflow-hidden">
          <div className="h-full w-full transition-all duration-500 grayscale group-hover:grayscale-0 group-hover:scale-105">
            <ThumbnailPlaceholder category={signal.category} />
          </div>
          {/* Category badge */}
          <div
            className="absolute top-3 left-3 px-2 py-1 font-mono text-[10px] uppercase tracking-widest backdrop-blur-sm"
            style={{
              color: catColor,
              border: `1px solid ${catColor}40`,
              backgroundColor: 'rgba(0,0,0,0.6)',
            }}
          >
            {signal.category}
          </div>
          {/* Read time */}
          <div className="absolute bottom-3 right-3 font-mono text-[10px] uppercase tracking-widest text-zinc-400 backdrop-blur-sm bg-black/50 px-2 py-1">
            {signal.readTime}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">
              [{signal.date}]
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-700">
              {signal.id}
            </span>
          </div>

          <h3 className="mb-3 text-lg font-bold tracking-tight text-[#FDFCF0] transition-colors group-hover:text-[#FFB800]">
            {signal.title}
          </h3>

          <p className="mb-5 text-sm leading-relaxed text-zinc-400">
            {signal.excerpt}
          </p>

          {/* Tags */}
          <div className="mb-4 flex flex-wrap gap-2">
            {signal.tags.map((tag) => (
              <span
                key={tag}
                className="font-mono text-[10px] uppercase tracking-widest text-zinc-600 bg-zinc-900/80 px-2 py-0.5"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Hover CTA */}
          <div className="font-mono text-xs text-[#FFB800] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <span className="mr-2">&gt;</span> READ_SIGNAL
          </div>
        </div>
      </NotchedCard>
    </motion.article>
  )
}

/* ── Newsletter CTA Card ── */
function NewsletterCard() {
  return (
    <NotchedCard className="flex flex-col items-center justify-center p-10 text-center transition-all duration-300 hover:border-[#FFB800]/40">
      <div className="mb-6">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-[#FFB800]/30">
          <span className="font-mono text-lg text-[#FFB800]">&gt;_</span>
        </div>
        <h3 className="mb-2 text-xl font-bold tracking-tight text-[#FDFCF0]">
          The Daily Intercept
        </h3>
        <p className="mb-1 font-mono text-xs uppercase tracking-widest text-[#FFB800]">
          ENCRYPTED BRIEFING // WEEKLY CADENCE
        </p>
        <p className="max-w-xs text-sm leading-relaxed text-zinc-400">
          Raw signal intelligence on AI developments, automation tactics, and deployment
          strategies. No fluff. No spam. Just signal.
        </p>
      </div>

      <div className="flex w-full max-w-sm gap-2">
        <input
          type="email"
          placeholder="operative@domain.com"
          className="flex-1 bg-zinc-900/80 border border-zinc-800 px-4 py-2.5 font-mono text-xs text-[#FDFCF0] placeholder:text-zinc-700 outline-none transition-colors focus:border-[#FFB800]/50"
        />
        <button className="bg-[#FFB800] px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-widest text-black transition-all hover:bg-[#FFB800]/90 hover:shadow-[0_0_20px_rgba(255,184,0,0.3)]">
          Subscribe
        </button>
      </div>

      <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-zinc-700">
        CLEARANCE_LEVEL: PUBLIC // UNSUBSCRIBE_ANYTIME
      </p>
    </NotchedCard>
  )
}

/* ── Main Section ── */
export function TelemetryFeed() {
  const [activeCategory, setActiveCategory] = useState<SignalCategory>('ALL')

  const filtered =
    activeCategory === 'ALL'
      ? SIGNALS
      : SIGNALS.filter((s) => s.category === activeCategory)

  return (
    <section
      id="telemetry"
      className="min-h-screen bg-zinc-950 px-6 py-24 font-sans text-[#FDFCF0] selection:bg-[#FFB800] selection:text-black md:px-12 lg:px-24"
    >
      {/* SECTION HEADER */}
      <div className="mb-16">
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-[#FFB800]">
          04 / Telemetry Feed
        </p>
        <h2 className="mb-6 text-5xl font-bold leading-none tracking-tighter md:text-7xl lg:text-8xl">
          Signal
          <br />
          Intelligence
        </h2>
        <p className="max-w-lg text-lg leading-relaxed text-zinc-400">
          Operational broadcasts, standard operating procedures, and intercepted intelligence
          from the frontier of AI automation.
        </p>
      </div>

      {/* CATEGORY FILTER */}
      <div className="mb-12 flex flex-wrap items-center gap-3 border-b border-zinc-900 pb-6">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.key
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`font-mono text-[11px] uppercase tracking-widest px-4 py-2 transition-all duration-200 ${
                isActive
                  ? 'bg-[#FFB800] text-black'
                  : 'border border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
              }`}
            >
              {cat.label}
            </button>
          )
        })}

        <span className="ml-auto font-mono text-[10px] uppercase tracking-widest text-zinc-500">
          {filtered.length} SIGNAL{filtered.length !== 1 ? 'S' : ''} DETECTED
        </span>
      </div>

      {/* SIGNAL GRID — key forces re-mount animation on filter change */}
      <div
        key={activeCategory}
        className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
      >
        {filtered.map((signal, i) => (
          <SignalCard key={signal.id} signal={signal} index={i} />
        ))}

        {/* Newsletter CTA — always last in grid */}
        <NewsletterCard />
      </div>
    </section>
  )
}

export default TelemetryFeed
