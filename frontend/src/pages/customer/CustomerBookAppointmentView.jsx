import React, { useState, useEffect, useCallback } from 'react'
import {
  getCustomerServices,
  getCustomerProviders,
  getCustomerAvailableSlots,
  bookCustomerAppointment,
} from '../../services/api'

export const CustomerBookAppointmentView = ({
  initialService = null,
  initialProvider = null,
  onBookingSuccess,
  onNavigateAppointments,
}) => {
  // Master lists
  const [services, setServices] = useState([])
  const [providers, setProviders] = useState([])
  const [masterLoading, setMasterLoading] = useState(true)

  // Booking form state
  const [selectedServiceId, setSelectedServiceId] = useState(initialService?.id || '')
  const [selectedProviderId, setSelectedProviderId] = useState(initialProvider?.id || '')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [notes, setNotes] = useState('')

  // Slots state
  const [slots, setSlots] = useState([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotsError, setSlotsError] = useState('')

  // Submission state
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [confirmedBooking, setConfirmedBooking] = useState(null)

  // Today in YYYY-MM-DD for datepicker min
  const todayStr = new Date().toISOString().split('T')[0]

  // Initialize services and providers
  useEffect(() => {
    const initData = async () => {
      setMasterLoading(true)
      try {
        const [servicesRes, providersRes] = await Promise.all([
          getCustomerServices(),
          getCustomerProviders(),
        ])
        setServices(servicesRes.data || [])
        setProviders(providersRes.data || [])
      } catch {
        // Handled gracefully
      } finally {
        setMasterLoading(false)
      }
    }
    initData()
  }, [])

  // Sync if initial props change
  useEffect(() => {
    if (initialService?.id) setSelectedServiceId(initialService.id)
  }, [initialService])

  useEffect(() => {
    if (initialProvider?.id) setSelectedProviderId(initialProvider.id)
  }, [initialProvider])

  // Fetch slots whenever provider, service, or date changes
  const fetchSlots = useCallback(async () => {
    if (!selectedProviderId || !selectedServiceId || !selectedDate) {
      setSlots([])
      setSelectedSlot(null)
      return
    }

    setSlotsLoading(true)
    setSlotsError('')
    setSelectedSlot(null)
    try {
      const res = await getCustomerAvailableSlots(selectedProviderId, selectedServiceId, selectedDate)
      setSlots(res.data || [])
    } catch (err) {
      setSlotsError(err.response?.data?.message || 'Could not load slots for the selected date')
      setSlots([])
    } finally {
      setSlotsLoading(false)
    }
  }, [selectedProviderId, selectedServiceId, selectedDate])

  useEffect(() => {
    fetchSlots()
  }, [fetchSlots])

  // Get active selected entity models
  const selectedService = services.find((s) => s.id === Number(selectedServiceId))
  const selectedProvider = providers.find((p) => p.id === Number(selectedProviderId))

  const handleBookingSubmit = async (e) => {
    e.preventDefault()
    if (!selectedSlot || !selectedService || !selectedProvider || !selectedDate) {
      setSubmitError('Please complete all required booking steps including selecting a time slot.')
      return
    }

    setSubmitting(true)
    setSubmitError('')

    try {
      const startDateTimeStr = `${selectedDate}T${selectedSlot.startTime}:00`
      const payload = {
        serviceId: selectedService.id,
        providerId: selectedProvider.id,
        appointmentTime: startDateTimeStr,
        notes: notes.trim() || undefined,
      }

      const res = await bookCustomerAppointment(payload)
      setConfirmedBooking(res.data)
      if (onBookingSuccess) onBookingSuccess()
    } catch (err) {
      setSubmitError(
        err.response?.data?.message || 'Booking failed. Please review your selections and try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleResetBooking = () => {
    setConfirmedBooking(null)
    setSelectedSlot(null)
    setNotes('')
    setSubmitError('')
    fetchSlots()
  }

  const formatSlotTime = (timeStr) => {
    if (!timeStr) return ''
    const parts = timeStr.split(':')
    const hh = parseInt(parts[0], 10)
    const mm = parts[1]
    const ampm = hh >= 12 ? 'PM' : 'AM'
    const displayHour = hh % 12 || 12
    return `${displayHour}:${mm} ${ampm}`
  }

  const formatFullDate = (dateStr) => {
    if (!dateStr) return ''
    const [y, m, d] = dateStr.split('-')
    const dt = new Date(y, m - 1, d)
    return dt.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // --- Step 9: Booking Confirmation Screen ---
  if (confirmedBooking) {
    return (
      <div className="booking-confirmation-container" style={{ maxWidth: '720px', margin: '0 auto', padding: '1rem' }}>
        <div
          className="dash-card"
          style={{
            textAlign: 'center',
            padding: '2.5rem 2rem',
            border: '2px solid #10b981',
            borderRadius: '12px',
            backgroundColor: '#ffffff',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: '#ecfdf5',
              color: '#059669',
              fontSize: '2.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto',
            }}
          >
            ✓
          </div>

          <span className="badge-status badge-status-confirmed" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
            STATUS: {confirmedBooking.status || 'PENDING'}
          </span>

          <h2 style={{ margin: '0.5rem 0', color: '#0f172a' }}>Appointment Successfully Booked!</h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem', margin: '0 0 2rem 0' }}>
            Booking Reference: <strong>#{confirmedBooking.id}</strong>. A confirmation alert has been generated in your account.
          </p>

          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '1.5rem',
              textAlign: 'left',
              marginBottom: '2rem',
            }}
          >
            <h4 style={{ margin: '0 0 1rem 0', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
              📋 Appointment Details
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block' }}>Service</span>
                <strong style={{ color: '#0f172a' }}>{confirmedBooking.serviceName}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block' }}>Specialist / Provider</span>
                <strong style={{ color: '#0f172a' }}>{confirmedBooking.providerName}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block' }}>Date &amp; Scheduled Time</span>
                <strong style={{ color: '#0f172a' }}>
                  {new Date(confirmedBooking.appointmentTime).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block' }}>Duration</span>
                <strong style={{ color: '#0f172a' }}>{confirmedBooking.durationMinutes || 30} minutes</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block' }}>Total Consultation Fee</span>
                <strong style={{ color: '#0f766e', fontSize: '1.1rem' }}>
                  ${confirmedBooking.price ? Number(confirmedBooking.price).toFixed(2) : '0.00'}
                </strong>
              </div>
              {confirmedBooking.description && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block' }}>Patient Notes</span>
                  <span style={{ color: '#334155', fontSize: '0.9rem' }}>{confirmedBooking.description}</span>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={() => onNavigateAppointments && onNavigateAppointments()}
            >
              📋 View in My Appointments
            </button>
            <button className="btn btn-outline" onClick={handleResetBooking}>
              📅 Book Another Session
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="book-appointment-view">
      <div className="admin-view-header">
        <div>
          <h2>📅 Schedule an Appointment</h2>
          <p>Complete the guided booking workflow below to secure your consultation slot.</p>
        </div>
      </div>

      {submitError && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
          <span className="alert-icon">⚠️</span>
          <span>{submitError}</span>
        </div>
      )}

      {masterLoading ? (
        <div className="loading-card" style={{ padding: '3rem' }}>
          <div className="spinner"></div>
          <p>Loading booking options...</p>
        </div>
      ) : (
        <form onSubmit={handleBookingSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {/* Left Column: Selection Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* 1. Select Service */}
            <div className="dash-card">
              <h3 className="dash-card-title">1️⃣ Select Service <span className="text-danger">*</span></h3>
              <div className="form-group" style={{ margin: 0 }}>
                <select
                  className="form-control"
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  required
                >
                  <option value="">-- Choose a Service --</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} &bull; ${Number(s.price).toFixed(2)} ({s.durationMinutes || 30} mins)
                    </option>
                  ))}
                </select>
              </div>

              {selectedService && (
                <div
                  style={{
                    marginTop: '0.85rem',
                    padding: '0.75rem',
                    backgroundColor: '#f1f5f9',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    color: '#334155',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600 }}>{selectedService.name}</span>
                    <span style={{ fontWeight: 700, color: '#0f766e' }}>${Number(selectedService.price).toFixed(2)}</span>
                  </div>
                  <p style={{ margin: '0 0 0.25rem 0', color: '#64748b' }}>{selectedService.description}</p>
                  <span>⏱️ Duration: <strong>{selectedService.durationMinutes || 30} mins</strong></span>
                </div>
              )}
            </div>

            {/* 2. Select Provider */}
            <div className="dash-card">
              <h3 className="dash-card-title">2️⃣ Select Specialist / Provider <span className="text-danger">*</span></h3>
              <div className="form-group" style={{ margin: 0 }}>
                <select
                  className="form-control"
                  value={selectedProviderId}
                  onChange={(e) => setSelectedProviderId(e.target.value)}
                  required
                >
                  <option value="">-- Choose a Provider --</option>
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} &bull; {p.specialization || 'Clinical Specialist'}
                    </option>
                  ))}
                </select>
              </div>

              {selectedProvider && (
                <div
                  style={{
                    marginTop: '0.85rem',
                    padding: '0.75rem',
                    backgroundColor: '#f1f5f9',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    color: '#334155',
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedProvider.fullName}</div>
                  <div style={{ color: '#0284c7', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                    {selectedProvider.specialization}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                    Email: {selectedProvider.email} {selectedProvider.phoneNumber && `| Phone: ${selectedProvider.phoneNumber}`}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Choose Appointment Date */}
            <div className="dash-card">
              <h3 className="dash-card-title">3️⃣ Choose Appointment Date <span className="text-danger">*</span></h3>
              <div className="form-group" style={{ margin: 0 }}>
                <input
                  type="date"
                  className="form-control"
                  min={todayStr}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  required
                />
              </div>
              {selectedDate && (
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Selected Date: <strong>{formatFullDate(selectedDate)}</strong>
                </p>
              )}
            </div>

            {/* 6. Optional Appointment Notes */}
            <div className="dash-card">
              <h3 className="dash-card-title">6️⃣ Patient Notes / Reason for Visit</h3>
              <div className="form-group" style={{ margin: 0 }}>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Share any symptoms, previous medical history, or specific topics you would like to discuss..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={1000}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Time Slots & Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* 4 & 5. Available Time Slots */}
            <div className="dash-card">
              <h3 className="dash-card-title">4️⃣ &amp; 5️⃣ Available Time Slots <span className="text-danger">*</span></h3>

              {!selectedServiceId || !selectedProviderId || !selectedDate ? (
                <div className="empty-state-box" style={{ padding: '2rem 1rem' }}>
                  <span>📅</span>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>
                    Please select a service, a provider, and a date to calculate real-time available slots.
                  </p>
                </div>
              ) : slotsLoading ? (
                <div className="loading-card" style={{ padding: '2rem' }}>
                  <div className="spinner"></div>
                  <p>Calculating provider working hours and real-time availability...</p>
                </div>
              ) : slotsError ? (
                <div className="alert alert-error">
                  <span>{slotsError}</span>
                </div>
              ) : slots.length === 0 ? (
                <div className="empty-state-box" style={{ padding: '2rem 1rem' }}>
                  <span style={{ fontSize: '2rem' }}>🚫</span>
                  <h4>No Slots Available</h4>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                    The specialist is not operating or all slots are booked on this date. Please pick another date.
                  </p>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ width: '10px', height: '10px', backgroundColor: '#10b981', borderRadius: '2px' }}></span>
                      Available
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ width: '10px', height: '10px', backgroundColor: '#ef4444', borderRadius: '2px' }}></span>
                      Booked
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ width: '10px', height: '10px', backgroundColor: '#f59e0b', borderRadius: '2px' }}></span>
                      Break
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ width: '10px', height: '10px', backgroundColor: '#94a3b8', borderRadius: '2px' }}></span>
                      Past
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.65rem' }}>
                    {slots.map((slot, idx) => {
                      const isAvailable = slot.status === 'AVAILABLE'
                      const isSelected = selectedSlot?.startTime === slot.startTime

                      let btnStyle = {
                        padding: '0.6rem 0.5rem',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: isAvailable ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease',
                      }

                      if (isSelected) {
                        btnStyle = {
                          ...btnStyle,
                          backgroundColor: '#0284c7',
                          color: '#ffffff',
                          borderColor: '#0284c7',
                          boxShadow: '0 0 0 2px rgba(2, 132, 199, 0.3)',
                        }
                      } else if (isAvailable) {
                        btnStyle = {
                          ...btnStyle,
                          backgroundColor: '#ecfdf5',
                          color: '#065f46',
                          borderColor: '#6ee7b7',
                        }
                      } else if (slot.status === 'BOOKED') {
                        btnStyle = {
                          ...btnStyle,
                          backgroundColor: '#fef2f2',
                          color: '#991b1b',
                          borderColor: '#fca5a5',
                          opacity: 0.7,
                        }
                      } else if (slot.status === 'BREAK') {
                        btnStyle = {
                          ...btnStyle,
                          backgroundColor: '#fffbeb',
                          color: '#92400e',
                          borderColor: '#fcd34d',
                          opacity: 0.7,
                        }
                      } else {
                        btnStyle = {
                          ...btnStyle,
                          backgroundColor: '#f1f5f9',
                          color: '#94a3b8',
                          borderColor: '#e2e8f0',
                          opacity: 0.6,
                        }
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          style={btnStyle}
                          disabled={!isAvailable}
                          onClick={() => setSelectedSlot(slot)}
                        >
                          <span>{formatSlotTime(slot.startTime)}</span>
                          <span style={{ fontSize: '0.65rem', marginTop: '0.15rem', textTransform: 'capitalize' }}>
                            {isSelected ? '✓ Selected' : slot.status.toLowerCase()}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 7 & 8. Booking Summary & Confirmation */}
            <div
              className="dash-card"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
              }}
            >
              <h3 className="dash-card-title">7️⃣ Booking Summary</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Service:</span>
                  <span style={{ fontWeight: 600 }}>{selectedService?.name || 'Not selected'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Provider:</span>
                  <span style={{ fontWeight: 600 }}>{selectedProvider?.fullName || 'Not selected'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Date:</span>
                  <span style={{ fontWeight: 600 }}>{selectedDate ? formatFullDate(selectedDate) : 'Not selected'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Selected Time Slot:</span>
                  <span style={{ fontWeight: 600, color: selectedSlot ? '#0284c7' : '#94a3b8' }}>
                    {selectedSlot ? `${formatSlotTime(selectedSlot.startTime)} - ${formatSlotTime(selectedSlot.endTime)}` : 'None selected'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Duration:</span>
                  <span style={{ fontWeight: 600 }}>{selectedService?.durationMinutes || 30} minutes</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: '0.75rem',
                    borderTop: '1px dashed #cbd5e1',
                    fontSize: '1.1rem',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>Consultation Fee:</span>
                  <span style={{ fontWeight: 700, color: '#0f766e' }}>
                    ${selectedService?.price ? Number(selectedService.price).toFixed(2) : '0.00'}
                  </span>
                </div>
              </div>

              {/* 8. Confirm Button */}
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', justifyContent: 'center' }}
                disabled={submitting || !selectedSlot || !selectedService || !selectedProvider}
              >
                {submitting ? 'Confirming Booking...' : '✓ Confirm & Book Appointment'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}

export default CustomerBookAppointmentView
