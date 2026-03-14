import { useState, useCallback } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { BookingCalendar } from './BookingCalendar'

/* ── Types ── */
interface IntakeTerminalProps {
  isOpen: boolean
  onClose: () => void
}

type View = 'select' | 'form' | 'calendar'
type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

const SCOPE_TIERS = ['PILOT', 'CORE_SYSTEM', 'ENTERPRISE', 'SOVEREIGN'] as const

const API_URL = import.meta.env.VITE_API_URL || 'https://api.nuclearmarmalade.com'
const API_KEY = import.meta.env.VITE_API_KEY || ''

/* ── Transition presets ── */
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
}

const viewVariants: Variants = {
  enter: (dir: number) => ({
    opacity: 0,
    x: dir > 0 ? 40 : -40,
    filter: 'blur(6px)',
  }),
  center: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir > 0 ? -40 : 40,
    filter: 'blur(6px)',
    transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
  }),
}

/* ═══════════════════════════════════════════════════════
   IntakeTerminal
   ═══════════════════════════════════════════════════════ */
export function IntakeTerminal({ isOpen, onClose }: IntakeTerminalProps) {
  const [activeView, setActiveView] = useState<View>('select')
  const [direction, setDirection] = useState(1)
  const [selectedScope, setSelectedScope] = useState<string | null>(null)

  // Form fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [description, setDescription] = useState('')

  // Submission state
  const [formStatus, setFormStatus] = useState<FormStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const goTo = useCallback((view: View) => {
    setDirection(view === 'select' ? -1 : 1)
    setActiveView(view)
  }, [])

  const resetForm = useCallback(() => {
    setName('')
    setEmail('')
    setDescription('')
    setSelectedScope(null)
    setFormStatus('idle')
    setErrorMessage('')
  }, [])

  const handleClose = useCallback(() => {
    onClose()
    // Reset to selection after close animation
    setTimeout(() => {
      setActiveView('select')
      resetForm()
    }, 400)
  }, [onClose, resetForm])

  const handleSubmit = useCallback(async () => {
    // Validate
    if (!name.trim() || !email.trim() || !description.trim()) {
      setErrorMessage('All fields are required.')
      setFormStatus('error')
      return
    }

    if (description.trim().length < 10) {
      setErrorMessage('Please provide more detail about your project.')
      setFormStatus('error')
      return
    }

    setFormStatus('submitting')
    setErrorMessage('')

    try {
      const response = await fetch(`${API_URL}/api/leads/intake`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY,
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          scope_tier: selectedScope || undefined,
          project_description: description.trim(),
          source: 'website',
          referrer_url: window.location.href,
        }),
      })

      if (response.status === 429) {
        setErrorMessage('A submission from this email was received recently.')
        setFormStatus('error')
        return
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.detail || data.error || 'Submission failed')
      }

      setFormStatus('success')
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Network error. Please try again.'
      )
      setFormStatus('error')
    }
  }, [name, email, description, selectedScope])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="itk-overlay"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.35 }}
        >
          {/* ── Header Bar ── */}
          <div className="itk-header">
            <p className="itk-header-label">
              // NUCLEAR_MARMALADE_SECURE_ROUTING
            </p>
            <button onClick={handleClose} className="itk-abort-btn group">
              [ ABORT ]{' '}
              <span className="itk-abort-x group-hover:rotate-90">×</span>
            </button>
          </div>

          {/* ── Main Content ── */}
          <div className="itk-container">
            <AnimatePresence mode="wait" custom={direction}>
              {/* ═══ VIEW 1 — THE ROUTING SELECTOR ═══ */}
              {activeView === 'select' && (
                <motion.div
                  key="select"
                  custom={direction}
                  variants={viewVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="itk-select-view"
                >
                  <h2 className="itk-title">Establish Connection</h2>
                  <p className="itk-subtitle">
                    Select how you want to engage. Secure, direct, and
                    confidential.
                  </p>

                  <div className="itk-route-grid">
                    {/* Synchronous Route — Calendar */}
                    <button
                      onClick={() => goTo('calendar')}
                      className="itk-route-card group"
                    >
                      <div className="itk-route-scanlines" />
                      <div className="itk-route-content">
                        <div>
                          <h3 className="itk-route-title">
                            Book a Call
                          </h3>
                          <p className="itk-route-tag">[ VIDEO // AUDIO ]</p>
                          <p className="itk-route-desc">
                            Schedule a direct call with our core engineering
                            team to discuss your business bottlenecks and
                            infrastructure needs.
                          </p>
                        </div>
                        <div className="itk-route-cta">
                          <span className="itk-pulse-dot" />
                          OPEN CALENDAR →
                        </div>
                      </div>
                    </button>

                    {/* Asynchronous Route — Form */}
                    <button
                      onClick={() => goTo('form')}
                      className="itk-route-card group"
                    >
                      <div className="itk-route-scanlines" />
                      <div className="itk-route-content">
                        <div>
                          <h3 className="itk-route-title">Send a Brief</h3>
                          <p className="itk-route-tag">
                            [ PROJECT DETAILS ]
                          </p>
                          <p className="itk-route-desc">
                            Prefer to write it out? Send us your project
                            parameters, requirements, or general inquiries for
                            our team to review.
                          </p>
                        </div>
                        <div className="itk-route-cta itk-route-cta--dim">
                          OPEN FORM →
                        </div>
                      </div>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ═══ VIEW 2 — DATA UPLINK (Form) ═══ */}
              {activeView === 'form' && (
                <motion.div
                  key="form"
                  custom={direction}
                  variants={viewVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
                  <button
                    onClick={() => goTo('select')}
                    className="itk-back-btn"
                  >
                    ← BACK
                  </button>

                  <div className="itk-panel">
                    <div className="itk-panel-header">
                      <h3 className="itk-panel-title">Project Details</h3>
                      <p className="itk-panel-sub">
                        All data encrypted at rest.
                      </p>
                    </div>

                    {/* Success state */}
                    {formStatus === 'success' ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="itk-success"
                      >
                        <div className="itk-success-icon">✓</div>
                        <h4 className="itk-success-title">
                          TRANSMISSION RECEIVED
                        </h4>
                        <p className="itk-success-text">
                          Your brief has been securely transmitted. Our team
                          will review and respond within 24 hours.
                        </p>
                        <button
                          onClick={handleClose}
                          className="itk-submit-btn"
                        >
                          CLOSE TERMINAL
                        </button>
                      </motion.div>
                    ) : (
                      <form
                        className="itk-form"
                        onSubmit={(e) => {
                          e.preventDefault()
                          handleSubmit()
                        }}
                      >
                        <input
                          type="text"
                          placeholder="FULL NAME"
                          className="itk-input"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          disabled={formStatus === 'submitting'}
                          required
                        />
                        <input
                          type="email"
                          placeholder="EMAIL ADDRESS"
                          className="itk-input"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={formStatus === 'submitting'}
                          required
                        />

                        {/* Scope Vector */}
                        <div className="itk-scope-block">
                          <p className="itk-scope-label">
                            Select Scope Vector:
                          </p>
                          <div className="itk-scope-grid">
                            {SCOPE_TIERS.map((tier) => (
                              <label key={tier} className="itk-scope-option">
                                <input
                                  type="radio"
                                  name="scope"
                                  value={tier}
                                  checked={selectedScope === tier}
                                  onChange={() => setSelectedScope(tier)}
                                  className="sr-only"
                                  disabled={formStatus === 'submitting'}
                                />
                                <div
                                  className={`itk-scope-tile ${
                                    selectedScope === tier
                                      ? 'itk-scope-tile--active'
                                      : ''
                                  }`}
                                >
                                  {tier}
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>

                        <textarea
                          placeholder="DESCRIBE YOUR PROJECT OR BOTTLENECK..."
                          rows={4}
                          className="itk-input itk-textarea"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          disabled={formStatus === 'submitting'}
                          required
                          minLength={10}
                        />

                        {/* Error message */}
                        {formStatus === 'error' && errorMessage && (
                          <p className="itk-error">{errorMessage}</p>
                        )}

                        <button
                          type="submit"
                          className="itk-submit-btn"
                          disabled={formStatus === 'submitting'}
                        >
                          {formStatus === 'submitting'
                            ? 'TRANSMITTING...'
                            : 'SUBMIT BRIEF'}
                        </button>
                      </form>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ═══ VIEW 3 — STRATEGIC MAPPING (Calendar) ═══ */}
              {activeView === 'calendar' && (
                <motion.div
                  key="calendar"
                  custom={direction}
                  variants={viewVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
                  <button
                    onClick={() => goTo('select')}
                    className="itk-back-btn"
                  >
                    ← BACK
                  </button>

                  <div className="itk-panel itk-panel--calendar">
                    <div className="itk-calendar-header">
                      <span className="itk-pulse-dot itk-pulse-dot--lg" />
                      <h3 className="itk-calendar-title">
                        Book a Call
                      </h3>
                      <p className="itk-calendar-sub">
                        Select a time that works for you
                      </p>
                    </div>

                    <BookingCalendar />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default IntakeTerminal
