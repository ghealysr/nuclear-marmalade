import { useEffect, useRef, useState, useCallback } from 'react'
// Rive ready for when character is broken into separate layers
// import { useRive, useStateMachineInput } from '@rive-app/react-canvas'
/* framer-motion available for future use; SVG pulses use pure CSS for reliability */

/* ═══════════════════════════════════════════════════════════
   INTELLIGENCE ARCHIVE — Technical Dossier / Horizontal Stack
   Real projects. Neural architecture maps. Command-center UX.
   ═══════════════════════════════════════════════════════════ */

/* ── Project Data Cores ───────────────────────────────────── */
const CASE_STUDIES = [
  {
    id: 'NUKAPLAKIA_CMS',
    idx: '01',
    title: 'Sovereign SaaS Architecture',
    subtitle: 'Headless Cognitive Infrastructure',
    desc: 'HEADLESS COGNITIVE INFRASTRUCTURE BUILT FOR HIGH-VELOCITY CONTENT DEPLOYMENT. REPLACED 3 MANUAL ROUTING BOTTLENECKS. 82% REDUCTION IN CONTENT DEPLOYMENT LATENCY. ZERO DOWNTIME.',
    readouts: ['CONTENT_VELOCITY: 12X', 'DOWNTIME: 0.00%', 'ARCHITECTURE: HEADLESS'],
    // Neural map config — unique per project
    mapNodes: [
      { id: 'input', x: 50, y: 100, r: 4, label: 'CMS_INPUT', labelY: 120 },
      { id: 'router', x: 150, y: 100, r: 6, label: 'AI_ROUTER', labelY: 125, primary: true },
      { id: 'db', x: 300, y: 50, r: 4, label: 'SAAS_DB', labelY: 35 },
      { id: 'output', x: 300, y: 150, r: 4, label: 'CDN_OUTPUT', labelY: 170 },
    ],
    mapPaths: [
      'M 50 100 L 150 100 L 200 50 L 300 50',
      'M 150 100 L 200 150 L 300 150',
    ],
  },
  {
    id: 'BUZZY_BUTTON_ORACLE',
    idx: '02',
    title: 'Predictive Intelligence',
    subtitle: 'Autonomous Sports Analytics',
    desc: 'DEPLOYING A LOW-LATENCY LLM LAYER TO PROCESS LIVE TELEMETRY. PROCESSING 10K+ LIVE DATA POINTS PER SECOND. INFERENCE LATENCY REDUCED TO 12MS. 40% INCREASE IN PREDICTIVE ACCURACY.',
    readouts: ['PREDICTION_ACC: 94.2%', 'LATENCY: 0.03MS', 'MODE: AUTONOMOUS'],
    mapNodes: [
      { id: 'feed', x: 200, y: 25, r: 4, label: 'DATA_FEED', labelY: 15 },
      { id: 'odds', x: 50, y: 100, r: 4, label: 'LIVE_ODDS', labelY: 85 },
      { id: 'core', x: 200, y: 100, r: 8, label: 'ORACLE_CORE', labelY: 125, primary: true },
      { id: 'history', x: 350, y: 100, r: 4, label: 'HISTORY_DB', labelY: 85 },
      { id: 'predict', x: 120, y: 175, r: 4, label: 'PREDICTION', labelY: 192 },
      { id: 'alert', x: 280, y: 175, r: 4, label: 'ALERT_SYS', labelY: 192 },
    ],
    mapPaths: [
      'M 200 25 L 200 100',
      'M 50 100 L 200 100',
      'M 350 100 L 200 100',
      'M 200 100 L 120 175',
      'M 200 100 L 280 175',
      'M 50 100 Q 50 175 120 175',
    ],
  },
  {
    id: 'SMB_AUTONOMY_MATRIX',
    idx: '03',
    title: 'Local Operations Upgrade',
    subtitle: 'Enterprise Neural Workflows',
    desc: 'DEPLOYING ENTERPRISE-GRADE NEURAL WORKFLOWS FOR LOCAL SERVICE BUSINESSES. REDUCING HUMAN ADMINISTRATIVE LATENCY TO ABSOLUTE ZERO.',
    readouts: ['ADMIN_LATENCY: 0MS', 'AUTOMATION: 97%', 'STATUS: SOVEREIGN'],
    mapNodes: [
      { id: 'client', x: 120, y: 25, r: 4, label: 'CLIENT_IN', labelY: 15 },
      { id: 'phone', x: 280, y: 25, r: 4, label: 'PHONE_AI', labelY: 15 },
      { id: 'hub', x: 200, y: 80, r: 8, label: 'NEURAL_HUB', labelY: 70, primary: true },
      { id: 'crm', x: 80, y: 145, r: 4, label: 'CRM_SYNC', labelY: 165 },
      { id: 'schedule', x: 200, y: 145, r: 4, label: 'SCHEDULER', labelY: 165 },
      { id: 'billing', x: 320, y: 145, r: 4, label: 'BILLING', labelY: 165 },
      { id: 'loop', x: 380, y: 80, r: 3, label: 'FEEDBACK', labelY: 70 },
    ],
    mapPaths: [
      'M 120 25 L 160 52 L 200 80',
      'M 280 25 L 240 52 L 200 80',
      'M 200 80 L 140 112 L 80 145',
      'M 200 80 L 185 112 L 200 145',
      'M 200 80 L 260 112 L 320 145',
      'M 320 145 Q 380 145 380 80',
      'M 380 80 Q 380 25 280 25',
    ],
  },
]

/* ── Ghost Text ────────────────────────────────────────── */
const GHOST_TEXTS = [
  { text: '[SYS_NOTE: CLASSIFIED // LEVEL_5]', x: '12%', y: '15%' },
  { text: '[INTERNAL: DO_NOT_DISTRIBUTE]', x: '68%', y: '22%' },
  { text: '[REVISION: 4.2.1 // APPROVED: NM-ADMIN]', x: '25%', y: '58%' },
  { text: '[THREAD: 0x4F2A // PRIORITY: CRITICAL]', x: '75%', y: '72%' },
  { text: '[CLEARANCE: OMEGA // SECTOR: 7]', x: '8%', y: '82%' },
  { text: '[HASH: a4f2e9...c81d // VERIFIED]', x: '55%', y: '40%' },
  { text: '[MODULE: NM-CORE // STATUS: ACTIVE]', x: '40%', y: '90%' },
  { text: '[AUDIT_LOG: 2024.12.04 // PASS]', x: '82%', y: '48%' },
]

/* ── Telemetry feed lines ──────────────────────────────── */
const TELEMETRY = [
  '[DATA_STREAM: ACTIVE]',
  '[PROCESSING_CORE: 88%]',
  '[LOAD_LEVEL: 100%]',
  '[AUTH_KEY: APPROVED]',
  '[NEURAL_SYNC: COMPLETE]',
  '[HANDSHAKE: 200 OK]',
  '[WORKFLOW: DEPLOYED]',
  '[LATENCY: 0.04MS]',
  '[UPTIME: 99.99%]',
  '[QUEUE_DEPTH: 0]',
  '[DATA_STREAM: ACTIVE]',
  '[PROCESSING_CORE: 88%]',
  '[LOAD_LEVEL: 100%]',
  '[AUTH_KEY: APPROVED]',
  '[NEURAL_SYNC: COMPLETE]',
  '[HANDSHAKE: 200 OK]',
]

/* ═══════════════════════════════════════════════════════════
   NEURAL ARCHITECTURE MAP — Animated SVG Node Graph
   ═══════════════════════════════════════════════════════════ */
interface MapNode {
  id: string; x: number; y: number; r: number
  label: string; labelY: number; primary?: boolean
}

function NeuralArchitectureMap({
  nodes,
  paths,
  delay = 0,
}: {
  nodes: MapNode[]
  paths: string[]
  delay?: number
}) {
  return (
    <div className="arc-neural-map">
      {/* Micro-UI Header */}
      <div className="arc-map-header">
        [ SYS_MAP // ARCHITECTURE_V4 ]
      </div>

      {/* Background Grid */}
      <div className="arc-map-grid" />

      <svg
        className="arc-map-svg"
        viewBox="0 0 400 200"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="nm-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Base Architecture Lines (dark) */}
        {paths.map((d, i) => (
          <path key={`base-${i}`} d={d} fill="none" stroke="#3f3f46" strokeWidth="1" />
        ))}

        {/* Animated Data Pulses — CSS stroke-dashoffset animation */}
        {paths.map((d, i) => (
          <path
            key={`pulse-${i}`}
            d={d}
            fill="none"
            stroke="#FFB800"
            strokeWidth="2"
            filter="url(#nm-glow)"
            className="arc-map-pulse"
            style={{ animationDelay: `${delay + i * 0.8}s` }}
          />
        ))}

        {/* Data Nodes — with pulse ring on data arrival */}
        {nodes.map((node, ni) => (
          <g key={node.id}>
            {/* Outer pulse ring — expands and fades when data arrives */}
            <circle
              cx={node.x}
              cy={node.y}
              r={node.primary ? 12 : 8}
              fill="none"
              stroke="#FFB800"
              strokeWidth="1"
              className="arc-map-node-ring"
              style={{ animationDelay: `${delay + ni * 0.6 + 1.2}s` }}
            />
            {/* Core node */}
            <circle
              cx={node.x}
              cy={node.y}
              r={node.r}
              fill={node.primary ? '#FFB800' : '#FDFCF0'}
              filter={node.primary ? 'url(#nm-glow)' : undefined}
              className="arc-map-node-core"
              style={{ animationDelay: `${delay + ni * 0.6 + 1.2}s` }}
            />
            <text
              x={node.x}
              y={node.labelY}
              fontSize="8"
              fill={node.primary ? '#FDFCF0' : '#A1A1AA'}
              fontFamily="monospace"
              textAnchor="middle"
            >
              {node.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   SCANNING FRAME — Blurred "screenshot" with scan overlay
   ═══════════════════════════════════════════════════════════ */
const OUTPUT_LINES = [
  'exec neural_init --mode=sovereign',
  'loading model weights... 847MB',
  '> compiling inference graph ████░░ 72%',
  'node_0x3f: tensor_alloc [2048, 4096]',
  'WARN: batch_norm epsilon < 1e-5',
  'scheduler.step() -> lr=0.00024',
  'gradient_checkpointing: enabled',
  '> tokenizer.encode(input) -> [1, 512]',
  'attention_mask: causal, heads=32',
  'KV cache: 2.4GB allocated',
  'inference latency: 12.3ms/token',
  'throughput: 81.3 tok/s',
  '> output_buffer.flush()',
  'POST /api/v1/predict -> 200 OK',
  'metrics.emit(p99=14.1ms)',
  'memory_pool: 6.2GB / 8.0GB used',
  'gc_sweep: freed 847 objects',
  '> heartbeat ALIVE seq=88402',
  'replication_lag: 0.02ms',
  'shard[0..7]: ALL_HEALTHY',
  'embedding_dim=1536 cosine_sim=0.94',
  'COMMIT txn_4f82a -> SUCCESS',
]

function ScanningFrame({ projectId }: { projectId: string }) {
  return (
    <div className="arc-scan-frame">
      <div className="arc-scan-border" />
      <div className="arc-scan-content">
        <div className="arc-scan-header">
          <span className="arc-scan-label">LIVE OUTPUT</span>
          <span className="arc-scan-id">[{projectId}]</span>
        </div>
        <div className="arc-output-feed">
          <div className="arc-output-feed-track">
            {[...OUTPUT_LINES, ...OUTPUT_LINES].map((line, i) => (
              <span key={i} className="arc-output-line">{line}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   NUCLEAR LOCK-ON TARGETING BUTTON
   Dots fly to corners → lines draw sequentially → HUD lock
   ═══════════════════════════════════════════════════════════ */
function TargetingButton() {
  return (
    <div className="lock-wrapper">
      {/* Corner targeting dots */}
      <div className="lock-dot lock-dot-tl" />
      <div className="lock-dot lock-dot-tr" />
      <div className="lock-dot lock-dot-br" />
      <div className="lock-dot lock-dot-bl" />

      {/* Bounding box lines — draw sequentially */}
      <div className="lock-line lock-line-top" />
      <div className="lock-line lock-line-right" />
      <div className="lock-line lock-line-bottom" />
      <div className="lock-line lock-line-left" />

      {/* The button core */}
      <button className="lock-btn">
        <span className="lock-text">INITIATE_SYSTEM_REVIEW</span>
        <svg className="lock-arrow" viewBox="0 0 24 24" width="18" height="18">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   MAIN SECTION — Intelligence Archive
   ═══════════════════════════════════════════════════════════ */
export default function CaseStudies() {
  const sectionRef = useRef<HTMLElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const flareRef = useRef<HTMLDivElement>(null)
  const telemetryFeedRef = useRef<HTMLDivElement>(null)
  const [activeChapter, setActiveChapter] = useState(0)
  const [chapterProgress, setChapterProgress] = useState(0)
  const prevChapterRef = useRef(0)
  const scrollVelocityRef = useRef(0)
  const lastScrollRef = useRef(0)

  // Scroll handler — drives horizontal track + chapter state
  const handleScroll = useCallback(() => {
    const section = sectionRef.current
    const track = trackRef.current
    const sticky = stickyRef.current
    if (!section || !sticky) return

    const viewportHeight = window.innerHeight

    const wrapper = sticky.parentElement
    if (!wrapper) return
    const wrapperRect = wrapper.getBoundingClientRect()
    const wrapperScroll = -wrapperRect.top
    const totalWrapperScroll = wrapper.offsetHeight - viewportHeight
    if (totalWrapperScroll <= 0) return

    const progress = Math.min(1, Math.max(0, wrapperScroll / totalWrapperScroll))

    // ── Scroll velocity — drives telemetry speed ──
    const velocity = Math.abs(progress - lastScrollRef.current)
    scrollVelocityRef.current = velocity
    lastScrollRef.current = progress

    // Accelerate telemetry feed based on scroll speed
    if (telemetryFeedRef.current) {
      const baseSpeed = 15 // seconds
      const boost = 1 + velocity * 200 // faster when scrolling
      const speed = Math.max(2, baseSpeed / boost)
      telemetryFeedRef.current.style.animationDuration = `${speed}s`
    }

    // ── Stepped scroll — 70% hold, 30% smoothstep transition ──
    const holdPct = 0.7
    const transPct = 1 - holdPct
    const segSize = 1 / 3
    const seg = Math.min(2, Math.floor(progress / segSize))
    const segProg = (progress - seg * segSize) / segSize

    let panelOffset: number
    if (seg >= 2) {
      panelOffset = 2
    } else if (segProg < holdPct) {
      panelOffset = seg
    } else {
      const t = (segProg - holdPct) / transPct
      const eased = t * t * (3 - 2 * t)
      panelOffset = seg + eased
    }

    // Drive horizontal track
    if (track) {
      track.style.transform = `translateX(-${panelOffset * 100}vw)`
    }

    const chapter = seg
    setChapterProgress(Math.min(1, Math.max(0, segProg)))

    if (chapter !== prevChapterRef.current) {
      prevChapterRef.current = chapter
      setActiveChapter(chapter)
    }
  }, [])

  // Mouse-tracking lens flare
  const handleMouse = useCallback((e: MouseEvent) => {
    const flare = flareRef.current
    const section = sectionRef.current
    if (!flare || !section) return
    const rect = section.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY - rect.top
    flare.style.background = `radial-gradient(circle 400px at ${x}px ${y}px, rgba(255,184,0,0.05) 0%, transparent 100%)`
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    const section = sectionRef.current
    if (section) {
      section.addEventListener('mousemove', handleMouse)
    }

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (section) section.removeEventListener('mousemove', handleMouse)
    }
  }, [handleScroll, handleMouse])

  const currentStudy = CASE_STUDIES[activeChapter]

  return (
    <section ref={sectionRef} id="archive" className="arc-section">
      {/* Atmospheric layers */}
      <div className="arc-anchor-line" />
      <div className="arc-grain" />
      <div className="arc-scanline" />

      {/* Ghost text */}
      {GHOST_TEXTS.map((g, i) => (
        <span key={i} className="arc-ghost" style={{ left: g.x, top: g.y }}>
          {g.text}
        </span>
      ))}

      {/* Section header */}
      <div className="arc-header">
        <span className="arc-section-tag">03 / Intelligence Archive</span>
        <h2 className="arc-section-title">
          Classified<br />Deployments
        </h2>
      </div>

      {/* Sticky scroll wrapper — 400vh creates scroll distance */}
      <div className="arc-sticky-wrapper">
        <div ref={stickyRef} className="arc-sticky-frame">
          {/* Lens flare — mouse tracking */}
          <div ref={flareRef} className="arc-lens-flare" />

          {/* Overflow container — clips the 300vw track */}
          <div className="arc-track-overflow">
            <div ref={trackRef} className="arc-hscroll-track">
              {CASE_STUDIES.map((study) => (
                <div key={study.id} className="arc-chapter-panel">
                  {/* ═══ NOTCHED CARD CONTAINER ═══ */}
                  <div className="arc-dossier-card">
                    {/* ═══ TECHNICAL DOSSIER LAYOUT ═══ */}
                    <div className="arc-dossier">
                      {/* LEFT COLUMN — The Spec */}
                      <div className="arc-spec-col">
                        <span className="arc-project-id">[PROJECT_ID: {study.id}]</span>
                        <span className="arc-chapter-idx">{study.idx}</span>
                        <h3 className="arc-chapter-title">{study.title}</h3>
                        <span className="arc-chapter-subtitle">{study.subtitle}</span>
                        <p className="arc-chapter-desc">{study.desc}</p>
                        <TargetingButton />
                      </div>

                      {/* RIGHT COLUMN — The System */}
                      <div className="arc-system-col">
                        <NeuralArchitectureMap
                          nodes={study.mapNodes}
                          paths={study.mapPaths}
                          delay={0}
                        />
                        <ScanningFrame projectId={study.id} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Forensic telemetry sidebar — fixed right, scroll-velocity-linked */}
          <div className="arc-telemetry">
            <div className="arc-telemetry-border" />
            <div className="arc-telemetry-inner">
              <span className="arc-telemetry-label">FORENSIC READOUT</span>
              <div className="arc-telemetry-divider" />
              {currentStudy.readouts.map((r, i) => (
                <div key={`${activeChapter}-${i}`} className="arc-telemetry-line">
                  <span className="arc-telemetry-text">{r}</span>
                </div>
              ))}
              <div className="arc-telemetry-divider" />
              <div className="arc-telemetry-feed">
                <div ref={telemetryFeedRef} className="arc-telemetry-feed-track">
                  {TELEMETRY.map((t, i) => (
                    <span key={i} className="arc-telemetry-feed-line">{t}</span>
                  ))}
                </div>
              </div>
              <div className="arc-telemetry-divider" />
              <span className="arc-telemetry-text">
                SCAN: {Math.round(chapterProgress * 100)}%
              </span>
              <div className="arc-telemetry-bar">
                <div
                  className="arc-telemetry-bar-fill"
                  style={{ width: `${chapterProgress * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Chapter indicators */}
          <div className="arc-indicators">
            {CASE_STUDIES.map((_, i) => (
              <div
                key={i}
                className={`arc-indicator ${activeChapter === i ? 'arc-indicator-active' : ''}`}
              />
            ))}
          </div>

          {/* Ghost chapter number */}
          <span className="arc-ghost-idx">{currentStudy.idx}</span>

        </div>
      </div>
    </section>
  )
}
