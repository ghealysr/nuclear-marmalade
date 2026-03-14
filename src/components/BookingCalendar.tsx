import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/* ── Types ── */
interface TimeSlot {
  time: string      // ISO 8601
  display: string   // e.g. "10:00 AM"
}

interface DaySlots {
  date: string       // YYYY-MM-DD
  display: string    // e.g. "Mon, Mar 3"
  slots: TimeSlot[]
}

type BookingStep = 'slots' | 'details' | 'confirming' | 'confirmed' | 'error'

interface MeetingType {
  value: string
  label: string
  duration: string
}

const MEETING_TYPES: MeetingType[] = [
  { value: 'discovery', label: 'Discovery Call', duration: '30 min' },
  { value: 'technical', label: 'Technical Deep-Dive', duration: '60 min' },
  { value: 'followup',  label: 'Follow-Up',        duration: '15 min' },
]

const API_URL = import.meta.env.VITE_API_URL || 'https://api.nuclearmarmalade.com'
const API_KEY = import.meta.env.VITE_API_KEY || ''

/* ── BookingCalendar ── */
export function BookingCalendar() {
  const [step, setStep] = useState<BookingStep>('slots')
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState<DaySlots[]>([])
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [meetingType, setMeetingType] = useState('discovery')

  // Booking form
  const [bkName, setBkName] = useState('')
  const [bkEmail, setBkEmail] = useState('')
  const [bkCompany, setBkCompany] = useState('')
  const [bkNotes, setBkNotes] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Confirmation data
  const [confirmData, setConfirmData] = useState<{
    time: string
    meetingLink?: string
  } | null>(null)

  /* ── Fetch available slots ── */
  const fetchSlots = useCallback(async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const params = new URLSearchParams({
        meeting_type: meetingType,
        days: '14',
      })
      const res = await fetch(
        `${API_URL}/api/scheduling/available-slots?${params}`,
        { headers: { 'X-API-Key': API_KEY } }
      )
      if (!res.ok) throw new Error('Failed to load availability')

      const data = await res.json()
      const grouped: DaySlots[] = (data.available_dates || []).map(
        (d: { date: string; day_name: string; slots: { time: string; display_time: string }[] }) => ({
          date: d.date,
          display: formatDateLabel(d.date, d.day_name),
          slots: d.slots.map((s: { time: string; display_time: string }) => ({
            time: s.time,
            display: s.display_time,
          })),
        })
      )

      setDays(grouped)
      // Auto-select first day with slots
      if (grouped.length > 0) {
        setSelectedDay(grouped[0].date)
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Failed to load available times.'
      )
    } finally {
      setLoading(false)
    }
  }, [meetingType])

  useEffect(() => {
    fetchSlots()
  }, [fetchSlots])

  /* ── Book meeting ── */
  const handleBook = useCallback(async () => {
    if (!bkName.trim() || !bkEmail.trim()) {
      setErrorMsg('Name and email are required.')
      return
    }
    if (!selectedSlot) {
      setErrorMsg('Please select a time slot.')
      return
    }

    setStep('confirming')
    setErrorMsg('')

    try {
      const res = await fetch(`${API_URL}/api/scheduling/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY,
        },
        body: JSON.stringify({
          name: bkName.trim(),
          email: bkEmail.trim(),
          company: bkCompany.trim() || undefined,
          meeting_type: meetingType,
          scheduled_at: selectedSlot,
          notes: bkNotes.trim() || undefined,
        }),
      })

      if (res.status === 409) {
        setErrorMsg('This time slot was just taken. Please choose another.')
        setStep('slots')
        fetchSlots()
        return
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || 'Booking failed')
      }

      const booking = await res.json()
      setConfirmData({
        time: formatConfirmTime(selectedSlot),
        meetingLink: booking.meeting_link,
      })
      setStep('confirmed')
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Booking failed. Please try again.'
      )
      setStep('error')
    }
  }, [bkName, bkEmail, bkCompany, bkNotes, meetingType, selectedSlot, fetchSlots])

  /* ── Render ── */
  const activeDaySlots = days.find((d) => d.date === selectedDay)?.slots || []

  return (
    <div className="bkcal">
      <AnimatePresence mode="wait">
        {/* ═══ Step 1: Select Time ═══ */}
        {step === 'slots' && (
          <motion.div
            key="slots"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* Meeting type selector */}
            <div className="bkcal-type-row">
              {MEETING_TYPES.map((mt) => (
                <button
                  key={mt.value}
                  onClick={() => {
                    setMeetingType(mt.value)
                    setSelectedSlot(null)
                  }}
                  className={`bkcal-type-btn ${
                    meetingType === mt.value ? 'bkcal-type-btn--active' : ''
                  }`}
                >
                  <span className="bkcal-type-label">{mt.label}</span>
                  <span className="bkcal-type-dur">{mt.duration}</span>
                </button>
              ))}
            </div>

            {loading ? (
              <div className="bkcal-loading">
                <span className="bkcal-spinner" />
                <span>Scanning calendar...</span>
              </div>
            ) : days.length === 0 ? (
              <div className="bkcal-empty">
                <p>No availability in the next 14 days.</p>
                <p className="bkcal-empty-sub">
                  Send a brief instead — we'll get back to you within 24h.
                </p>
              </div>
            ) : (
              <>
                {/* Day tabs */}
                <div className="bkcal-day-tabs">
                  {days.map((d) => (
                    <button
                      key={d.date}
                      onClick={() => {
                        setSelectedDay(d.date)
                        setSelectedSlot(null)
                      }}
                      className={`bkcal-day-tab ${
                        selectedDay === d.date ? 'bkcal-day-tab--active' : ''
                      }`}
                    >
                      {d.display}
                    </button>
                  ))}
                </div>

                {/* Time slots grid */}
                <div className="bkcal-slots-grid">
                  {activeDaySlots.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => setSelectedSlot(slot.time)}
                      className={`bkcal-slot ${
                        selectedSlot === slot.time ? 'bkcal-slot--active' : ''
                      }`}
                    >
                      {slot.display}
                    </button>
                  ))}
                  {activeDaySlots.length === 0 && (
                    <p className="bkcal-no-slots">No slots on this day.</p>
                  )}
                </div>

                {/* Continue button */}
                <button
                  onClick={() => {
                    if (selectedSlot) {
                      setStep('details')
                      setErrorMsg('')
                    }
                  }}
                  disabled={!selectedSlot}
                  className="itk-submit-btn bkcal-continue"
                >
                  CONTINUE →
                </button>
              </>
            )}

            {errorMsg && <p className="itk-error bkcal-error">{errorMsg}</p>}
          </motion.div>
        )}

        {/* ═══ Step 2: Contact Details ═══ */}
        {step === 'details' && (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
          >
            <button
              onClick={() => setStep('slots')}
              className="bkcal-back-btn"
            >
              ← CHANGE TIME
            </button>

            <div className="bkcal-selected-time">
              <span className="bkcal-sel-label">SELECTED:</span>
              <span className="bkcal-sel-value">
                {formatConfirmTime(selectedSlot!)}
              </span>
            </div>

            <form
              className="bkcal-detail-form"
              onSubmit={(e) => {
                e.preventDefault()
                handleBook()
              }}
            >
              <input
                type="text"
                placeholder="YOUR NAME"
                className="itk-input"
                value={bkName}
                onChange={(e) => setBkName(e.target.value)}
                required
              />
              <input
                type="email"
                placeholder="EMAIL ADDRESS"
                className="itk-input"
                value={bkEmail}
                onChange={(e) => setBkEmail(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="COMPANY (OPTIONAL)"
                className="itk-input"
                value={bkCompany}
                onChange={(e) => setBkCompany(e.target.value)}
              />
              <textarea
                placeholder="ANYTHING WE SHOULD KNOW? (OPTIONAL)"
                rows={3}
                className="itk-input itk-textarea"
                value={bkNotes}
                onChange={(e) => setBkNotes(e.target.value)}
              />

              {errorMsg && <p className="itk-error bkcal-error">{errorMsg}</p>}

              <button type="submit" className="itk-submit-btn">
                CONFIRM BOOKING
              </button>
            </form>
          </motion.div>
        )}

        {/* ═══ Step 3: Confirming ═══ */}
        {step === 'confirming' && (
          <motion.div
            key="confirming"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bkcal-confirming"
          >
            <span className="bkcal-spinner" />
            <span>Securing your time slot...</span>
          </motion.div>
        )}

        {/* ═══ Step 4: Confirmed ═══ */}
        {step === 'confirmed' && confirmData && (
          <motion.div
            key="confirmed"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="itk-success"
          >
            <div className="itk-success-icon">✓</div>
            <h4 className="itk-success-title">SYNC ESTABLISHED</h4>
            <p className="itk-success-text">
              Your call is confirmed for{' '}
              <strong style={{ color: '#fbbf24' }}>{confirmData.time}</strong>.
              <br />A confirmation has been sent to your email.
            </p>
            {confirmData.meetingLink && (
              <a
                href={confirmData.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="bkcal-meet-link"
              >
                JOIN LINK →
              </a>
            )}
          </motion.div>
        )}

        {/* ═══ Error ═══ */}
        {step === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bkcal-error-state"
          >
            <p className="itk-error bkcal-error">{errorMsg}</p>
            <button
              onClick={() => {
                setStep('slots')
                fetchSlots()
              }}
              className="itk-submit-btn"
            >
              TRY AGAIN
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Helpers ── */
function formatDateLabel(dateStr: string, dayName: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const month = d.toLocaleDateString('en-US', { month: 'short' })
  return `${dayName.slice(0, 3)}, ${month} ${d.getDate()}`
}

function formatConfirmTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export default BookingCalendar
