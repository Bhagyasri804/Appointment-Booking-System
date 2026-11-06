import React, { useState, useEffect, useCallback } from 'react'
import { getProviderCalendarDay } from '../../services/api'

export const ProviderCalendarView = () => {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [daySchedule, setDaySchedule] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [slotFilter, setSlotFilter] = useState('ALL')
  const [activeAppointment, setActiveAppointment] = useState(null)

  const fetchDaySchedule = useCallback(async (date) => {
    setLoading(true)
    setError('')
    try {
      const res = await getProviderCalendarDay(date)
      setDaySchedule(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load schedule for this date')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDaySchedule(selectedDate)
  }, [selectedDate, fetchDaySchedule])

  const handlePrevDay = () => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() - 1)
    setSelectedDate(d.toISOString().split('T')[0])
  }

  const handleNextDay = () => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + 1)
    setSelectedDate(d.toISOString().split('T')[0])
  }

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0])
  }

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return ''
    const [year, month, day] = dateStr.split('-')
    const d = new Date(year, month - 1, day)
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const slots = daySchedule?.slots || []
  const filteredSlots = slots.filter((s) => {
    if (slotFilter === 'ALL') return true
    return s.status === slotFilter
  })

  const bookedCount = slots.filter((s) => s.status === 'BOOKED').length
  const availableCount = slots.filter((s) => s.status === 'AVAILABLE').length
  const breakCount = slots.filter((s) => s.status === 'BREAK').length

  return (
    <div className="provider-calendar-container">
      <div className="admin-view-header">
        <div>
          <h2>📅 Appointment Calendar &amp; Slot Schedule</h2>
          <p>Inspect working intervals, open availability windows, and confirmed client consultations.</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Date Navigation & Controls Bar */}
      <div className="calendar-toolbar-card">
        <div className="date-nav-controls">
          <button className="btn btn-outline" onClick={handlePrevDay} title="Previous Day">
            &larr; Prev
          </button>
          <button className="btn btn-outline" onClick={handleToday}>
            Today
          </button>
          <button className="btn btn-outline" onClick={handleNextDay} title="Next Day">
            Next &rarr;
          </button>
          <input
            type="date"
            className="calendar-date-input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <div className="date-headline">
          <span className="date-headline-text">{formatDisplayDate(selectedDate)}</span>
          <span className={`badge ${daySchedule?.hasWorkingHours ? 'badge-success' : 'badge-neutral'}`}>
            {daySchedule?.hasWorkingHours ? 'Working Hours Active' : 'No Working Hours Configured'}
          </span>
        </div>

        {/* Slot Filters */}
        <div className="slot-filter-chips">
          <button
            className={`chip-btn ${slotFilter === 'ALL' ? 'chip-active' : ''}`}
            onClick={() => setSlotFilter('ALL')}
          >
            All Slots ({slots.length})
          </button>
          <button
            className={`chip-btn chip-booked ${slotFilter === 'BOOKED' ? 'chip-active' : ''}`}
            onClick={() => setSlotFilter('BOOKED')}
          >
            Booked ({bookedCount})
          </button>
          <button
            className={`chip-btn chip-available ${slotFilter === 'AVAILABLE' ? 'chip-active' : ''}`}
            onClick={() => setSlotFilter('AVAILABLE')}
          >
            Available ({availableCount})
          </button>
          <button
            className={`chip-btn chip-break ${slotFilter === 'BREAK' ? 'chip-active' : ''}`}
            onClick={() => setSlotFilter('BREAK')}
          >
            Break ({breakCount})
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="admin-loading-container">
          <div className="spinner"></div>
          <p>Loading schedule for {formatDisplayDate(selectedDate)}...</p>
        </div>
      ) : !daySchedule?.hasWorkingHours ? (
        <div className="admin-empty-state">
          <div className="empty-icon">🏖️</div>
          <h3>No working hours configured for {daySchedule?.dayOfWeek || 'this day'}</h3>
          <p>
            You have not configured consultation hours for this day of the week.
            Head to the <strong>Working Hours</strong> tab to enable slots.
          </p>
        </div>
      ) : (
        <div className="calendar-slots-grid">
          {filteredSlots.length === 0 ? (
            <div className="admin-empty-state" style={{ gridColumn: '1 / -1' }}>
              <div className="empty-icon">🔍</div>
              <p>No time slots match the "{slotFilter}" filter for this day.</p>
            </div>
          ) : (
            filteredSlots.map((slot, idx) => {
              const startStr = slot.startTime ? slot.startTime.substring(0, 5) : ''
              const endStr = slot.endTime ? slot.endTime.substring(0, 5) : ''

              let slotClass = 'slot-card-available'
              let statusLabel = 'Available for Booking'
              let statusBadge = <span className="badge badge-success">AVAILABLE</span>

              if (slot.status === 'BOOKED') {
                slotClass = 'slot-card-booked'
                statusLabel = 'Booked Consultation'
                statusBadge = <span className="badge badge-primary">BOOKED</span>
              } else if (slot.status === 'BREAK') {
                slotClass = 'slot-card-break'
                statusLabel = 'Scheduled Break'
                statusBadge = <span className="badge badge-amber">BREAK</span>
              }

              return (
                <div
                  key={idx}
                  className={`slot-card ${slotClass}`}
                  onClick={() => {
                    if (slot.appointmentId) {
                      const match = (daySchedule?.appointments || []).find((a) => a.id === slot.appointmentId)
                      if (match) setActiveAppointment(match)
                    }
                  }}
                  style={{ cursor: slot.appointmentId ? 'pointer' : 'default' }}
                >
                  <div className="slot-card-top">
                    <span className="slot-card-time">
                      🕒 {startStr} - {endStr}
                    </span>
                    {statusBadge}
                  </div>

                  <div className="slot-card-body">
                    {slot.status === 'BOOKED' ? (
                      <>
                        <h4 className="slot-appt-title">{slot.appointmentTitle || slot.serviceName}</h4>
                        <div className="slot-appt-client">
                          👤 <strong>{slot.customerName}</strong>
                        </div>
                        {slot.customerEmail && <div className="slot-appt-email">{slot.customerEmail}</div>}
                        <div className="slot-click-hint">Click to inspect appointment &rarr;</div>
                      </>
                    ) : slot.status === 'BREAK' ? (
                      <div className="slot-break-text">
                        <span>☕ Recess &amp; Break Window</span>
                        <p className="text-muted text-xs">No bookings allowed during this period.</p>
                      </div>
                    ) : (
                      <div className="slot-available-text">
                        <span>✨ Open Slot</span>
                        <p className="text-muted text-xs">Ready for prospective patient booking.</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Appointment Details Modal */}
      {activeAppointment && (
        <div className="modal-backdrop">
          <div className="modal-box modal-md">
            <div className="modal-header">
              <h3>🔍 Booking Consultation #{activeAppointment.id}</h3>
              <button className="modal-close-btn" onClick={() => setActiveAppointment(null)}>
                &times;
              </button>
            </div>
            <div className="modal-body detail-grid-modal">
              <div className="detail-item-box">
                <span className="modal-detail-label">Client Name</span>
                <span className="modal-detail-val">{activeAppointment.customerName}</span>
              </div>
              <div className="detail-item-box">
                <span className="modal-detail-label">Client Email</span>
                <span className="modal-detail-val">{activeAppointment.customerEmail}</span>
              </div>
              <div className="detail-item-box">
                <span className="modal-detail-label">Service</span>
                <span className="modal-detail-val">{activeAppointment.serviceName || activeAppointment.title}</span>
              </div>
              <div className="detail-item-box">
                <span className="modal-detail-label">Consultation Fee</span>
                <span className="modal-detail-val">
                  {activeAppointment.servicePrice ? `$${activeAppointment.servicePrice}` : 'Free'}
                </span>
              </div>
              <div className="detail-item-box">
                <span className="modal-detail-label">Scheduled Time</span>
                <span className="modal-detail-val">
                  {new Date(activeAppointment.appointmentTime).toLocaleString()}
                </span>
              </div>
              <div className="detail-item-box">
                <span className="modal-detail-label">Status</span>
                <span className="badge badge-primary">{activeAppointment.status}</span>
              </div>
              {activeAppointment.description && (
                <div className="detail-item-box full-span">
                  <span className="modal-detail-label">Intake Notes</span>
                  <div className="notes-box">{activeAppointment.description}</div>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={() => setActiveAppointment(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProviderCalendarView
