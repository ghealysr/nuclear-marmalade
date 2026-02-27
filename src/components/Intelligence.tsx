import { motion } from 'framer-motion'

/* ── Deployment data ── */
interface Deployment {
  id: string
  title: string
  subtitle: string
  date: string
  excerpt: string
  status: 'DECLASSIFIED' | 'ACTIVE' | 'PENDING'
  featured: boolean
}

const deployments: Deployment[] = [
  {
    id: 'NUKAPLAKIA_CMS',
    title: 'Sovereign SaaS Architecture',
    subtitle: 'HEADLESS COGNITIVE INFRASTRUCTURE',
    date: '2026.02.24',
    excerpt:
      'Headless cognitive infrastructure built for high-velocity content deployment. Bypassing legacy systems through automated neural routing.',
    status: 'DECLASSIFIED',
    featured: true,
  },
  {
    id: 'BUZZY_ORACLE',
    title: 'Predictive Sports Analytics',
    subtitle: 'REAL-TIME VECTOR PROCESSING',
    date: '2026.02.18',
    excerpt:
      'Deploying a low-latency LLM layer to process live telemetry and synthesize probability matrices before human analysts can react.',
    status: 'ACTIVE',
    featured: false,
  },
  {
    id: 'AETERNA_44',
    title: 'Autonomous Brand Identity',
    subtitle: 'GENERATIVE DESIGN PIPELINES',
    date: '2026.01.30',
    excerpt:
      'Automating the creation of cohesive brand ecosystems across 50+ touchpoints using fine-tuned visual diffusion models.',
    status: 'DECLASSIFIED',
    featured: false,
  },
]

/* ── Reusable Notched Card ── */
function NotchedCard({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`relative bg-zinc-950/50 backdrop-blur-md border border-[#FFB800]/20 p-8 ${className}`}
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

/* ── Main Section ── */
export function Intelligence() {
  const featured = deployments.find((d) => d.featured)
  const standard = deployments.filter((d) => !d.featured)

  return (
    <section
      id="intelligence"
      className="min-h-screen bg-zinc-950 px-6 py-24 font-sans text-[#FDFCF0] selection:bg-[#FFB800] selection:text-black md:px-12 lg:px-24"
    >
      {/* SECTION HEADER */}
      <div className="mb-20">
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-[#FFB800]">
          04 / Intelligence Archive
        </p>
        <h2 className="text-5xl font-bold leading-none tracking-tighter md:text-7xl lg:text-8xl">
          Classified
          <br />
          Deployments
        </h2>
      </div>

      {/* FEATURED DEPLOYMENT */}
      {featured && (
        <div className="relative mb-16 grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Left — Typography & Info */}
          <div className="flex flex-col justify-center lg:col-span-5">
            <p className="mb-6 font-mono text-xs uppercase tracking-widest text-[#FFB800] opacity-80">
              [PROJECT_ID: {featured.id}]
            </p>
            <h3 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
              {featured.title}
            </h3>
            <p className="mb-6 font-mono text-sm uppercase tracking-widest text-[#FFB800]">
              {featured.subtitle}
            </p>
            <p className="mb-8 max-w-md text-lg leading-relaxed text-zinc-400">
              {featured.excerpt}
            </p>

            <motion.button
              whileHover={{ x: 10 }}
              className="group flex w-fit items-center border-b border-[#FFB800]/30 pb-2 font-mono text-sm uppercase tracking-widest transition-colors hover:border-[#FFB800]"
            >
              <span className="mr-3 text-[#FFB800]">ACCESS_LOG</span>
              <span className="text-zinc-400 transition-colors group-hover:text-[#FDFCF0]">
                {'//'}  DECRYPT
              </span>
            </motion.button>
          </div>

          {/* Right — Visual / Schematic */}
          <NotchedCard className="group flex min-h-[400px] cursor-pointer items-center justify-center transition-colors duration-500 hover:border-[#FFB800]/50 lg:col-span-7">
            <div className="text-center">
              <p className="mb-4 font-mono text-xs uppercase tracking-widest text-zinc-400 transition-colors group-hover:text-[#FFB800]">
                [ SYS_MAP // ARCHITECTURE_V4 ]
              </p>
              <div className="relative flex h-32 w-64 items-center justify-center border border-zinc-800">
                <div className="absolute left-4 h-2 w-2 rounded-full bg-zinc-600" />
                <div className="absolute right-4 h-2 w-2 rounded-full bg-[#FFB800]" />
                <div className="h-[1px] w-48 bg-gradient-to-r from-zinc-800 to-[#FFB800]" />
              </div>
            </div>
          </NotchedCard>
        </div>
      )}

      {/* STANDARD DEPLOYMENTS GRID */}
      <div className="grid grid-cols-1 gap-8 border-t border-zinc-900 pt-16 md:grid-cols-2">
        {standard.map((log) => (
          <NotchedCard
            key={log.id}
            className="group cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-[#FFB800]/40"
          >
            <div className="mb-12 flex items-start justify-between">
              <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">
                [ {log.date} ]
              </p>
              <span
                className={`font-mono text-[10px] uppercase tracking-widest px-2 py-1 ${
                  log.status === 'ACTIVE'
                    ? 'border border-[#FFB800]/30 text-[#FFB800]'
                    : 'bg-zinc-900 text-zinc-500'
                }`}
              >
                {log.status}
              </span>
            </div>

            <h4 className="mb-2 text-2xl font-bold tracking-tight transition-colors group-hover:text-[#FFB800]">
              {log.title}
            </h4>
            <p className="mb-6 font-mono text-xs uppercase tracking-widest text-zinc-400">
              {log.subtitle}
            </p>
            <p className="mb-8 text-sm leading-relaxed text-zinc-400">
              {log.excerpt}
            </p>

            <div className="font-mono text-xs text-[#FFB800] opacity-0 transition-opacity group-hover:opacity-100">
              <span className="mr-2">&gt;</span> READ_REPORT
            </div>
          </NotchedCard>
        ))}
      </div>
    </section>
  )
}

export default Intelligence
