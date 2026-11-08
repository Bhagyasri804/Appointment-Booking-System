import React, { useState, useEffect, useCallback } from 'react'
import {
  getCustomerAppointments,
  cancelCustomerAppointment,
  rescheduleCustomerAppointment,
  getCustomerAvailableSlots,
} from '../../services/api'

export const CustomerAppointmentsView = ({
  initialStatus = 'ALL',
  onAppointmentAction,
  onBookNew,
}) => {
  const [appointments, setAppointments] = useState([])
  const [statusFilter, setStatusFilter] = useState(initialStatus)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)

  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Modals
  const [selectedAppointment, setSelectedAppointment] = useState(null)

  // Cancel Modal
  const [cancellingAppt, setCancellingAppt] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelError, setCancelError] = useState('')

  // Reschedule Modal
  const [reschedulingAppt, setReschedulingAppt] = useState(null)
  const [newDate, setNewDate] = useState('')
  const [rescheduleSlots, setRescheduleSlots] = useState([])
  const [rescheduleSlotLoading, setRescheduleSlotLoading] = useState(false)
  const [selectedRescheduleSlot, setSelectedRescheduleSlot] = useState(null)
  const [rescheduleReason, setRescheduleReason] = useState('')
  const [rescheduleError, setRescheduleError] = useState('')

  const todayStr = new Date().toISOString().split('T')[0]

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = {
        page,
        size: 8,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        search: searchTerm.trim() || undefined,
      }
      const res = await getCustomerAppointments(params)
      const data = res.data
      setAppointments(data.content || [])
      setTotalPages(data.totalPages || 1)
      setTotalElements(data.totalElements || 0)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve appointments')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, searchTerm])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  const handleTabChange = (newStatus) => {
    setStatusFilter(newStatus)
    setPage(0)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(0)
    fetchAppointments()
  }

  // --- Cancellation Handler ---
  const openCancelModal = (appt) => {
    setCancellingAppt(appt)
    setCancelReason('')
    setCancelError('')
  }

  const handleCancelSubmit = async (e) => {
    e.preventDefault()
    if (!cancelReason.trim()) {
      setCancelError('Please specify a cancellation reason.')
      return
    }

    setActionLoading(true)
    setCancelError('')
    try {
      await cancelCustomerAppointment(cancellingAppt.id, cancelReason.trim())
      setSuccess(`Appointment #${cancellingAppt.id} cancelled successfully.`)
      setCancellingAppt(null)
      fetchAppointments()
      if (onAppointmentAction) onAppointmentAction()
    } catch (err) {
      setCancelError(err.response?.data?.message || 'Failed to cancel appointment')
    } finally {
      setActionLoading(false)
    }
  }

  // --- Reschedule Handlers ---
  const openRescheduleModal = (appt) => {
    setReschedulingAppt(appt)
    setNewDate('')
    setRescheduleSlots([])
    setSelectedRescheduleSlot(null)
    setRescheduleReason('')
    setRescheduleError('')
  }

  const handleRescheduleDateChange = async (dateVal) => {
    setNewDate(dateVal)
    setSelectedRescheduleSlot(null)
    if (!dateVal || !reschedulingAppt) {
      setRescheduleSlots([])
      return
    }

    setRescheduleSlotLoading(true)
    setRescheduleError('')
    try {
      const res = await getCustomerAvailableSlots(
        reschedulingAppt.providerId,
        reschedulingAppt.serviceId,
        dateVal
      )
      setRescheduleSlots(res.data || [])
    } catch (err) {
      setRescheduleError(err.response?.data?.message || 'Failed to load time slots for this date')
      setRescheduleSlots([])
    } finally {
      setRescheduleSlotLoading(false)
    }
  }

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedRescheduleSlot || !newDate) {
      setRescheduleError('Please choose a new date and an available time slot.')
      return
    }

    setActionLoading(true)
    setRescheduleError('')
    try {
      const startDateTimeStr = `${newDate}T${selectedRescheduleSlot.startTime}:00`
      await rescheduleCustomerAppointment(reschedulingAppt.id, {
        newAppointmentTime: startDateTimeStr,
        reason: rescheduleReason.trim() || undefined,
      })
      setSuccess(`Appointment #${reschedulingAppt.id} rescheduled successfully to ${newDate} at ${selectedRescheduleSlot.startTime}.`)
      setReschedulingAppt(null)
      fetchAppointments()
      if (onAppointmentAction) onAppointmentAction()
    } catch (err) {
      setRescheduleError(err.response?.data?.message || 'Failed to reschedule appointment')
    } finally {
      setActionLoading(false)
    }
  }

  const formatDateTime = (iso) => {
    if (!iso) return 'N/A'
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadgeClass = (status) => {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED':
        return 'badge-status-confirmed'
      case 'PENDING':
        return 'badge-status-pending'
      case 'COMPLETED':
        return 'badge-status-completed'
      case 'CANCELLED':
        return 'badge-status-cancelled'
      default:
        return 'badge-status-secondary'
    }
  }

  const isEligibleForChange = (appt) => {
    if (!appt || !appt.appointmentTime) return false
    const isFuture = new Date(appt.appointmentTime) > new Date()
    const isPendingOrConfirmed =
      appt.status?.toUpperCase() === 'PENDING' || appt.status?.toUpperCase() === 'CONFIRMED'
    return isFuture && isPendingOrConfirmed
  }

  return (
    <div className="customer-appointments-container">
      {/* View Header */}
      <div className="admin-view-header">
        <div>
          <h2>📋 My Appointments &amp; Bookings</h2>
          <p>Review schedule details, manage upcoming visits, or reschedule your appointments.</p>
        </div>
        <button className="btn btn-primary" onClick={() => onBookNew && onBookNew()}>
          📅 Book New Appointment
        </button>
      </div>

      {/* Global Alerts */}
      {success && (
        <div className="alert alert-success">
          <span className="alert-icon">✅</span>
          <span>{success}</span>
          <button
            className="alert-close-btn"
            onClick={() => setSuccess('')}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            &times;
          </button>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          <span>{error}</span>
          <button
            className="alert-close-btn"
            onClick={() => setError('')}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="admin-tabs-bar" style={{ marginBottom: '1.25rem' }}>
        {[
          { key: 'ALL', label: 'All Records' },
          { key: 'UPCOMING', label: 'Upcoming' },
          { key: 'PENDING', label: 'Pending Approval' },
          { key: 'CONFIRMED', label: 'Confirmed' },
          { key: 'COMPLETED', label: 'Completed' },
          { key: 'CANCELLED', label: 'Cancelled' },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`admin-tab-btn ${statusFilter === tab.key ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search and Table Controls */}
      <div className="table-controls-bar" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: '1 1 300px' }}>
          <input
            type="text"
            className="search-input"
            placeholder="Search by service name, provider name, or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%' }}
          />
          <button type="submit" className="btn btn-secondary">
            Search
          </button>
        </form>
        {searchTerm && (
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              setSearchTerm('')
              setPage(0)
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Table Card */}
      <div className="dash-card">
        {loading ? (
          <div className="loading-card" style={{ padding: '3rem' }}>
            <div className="spinner"></div>
            <p>Loading appointments...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="empty-state-box" style={{ padding: '3rem 1rem' }}>
            <span style={{ fontSize: '2.5rem' }}>📅</span>
            <h3>No Appointments Found</h3>
            <p>No appointments match the "{statusFilter}" filter.</p>
            {onBookNew && (
              <button
                className="btn btn-primary"
                style={{ marginTop: '0.5rem' }}
                onClick={() => onBookNew()}
              >
                Book an Appointment
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Ref #</th>
                    <th>Service &amp; Category</th>
                    <th>Specialist Provider</th>
                    <th>Appointment Date &amp; Time</th>
                    <th>Fee</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appt) => {
                    const canModify = isEligibleForChange(appt)
                    return (
                      <tr key={appt.id}>
                        <td>
                          <span className="id-badge">#{appt.id}</span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>
                            {appt.serviceName || appt.title}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {appt.categoryName} &bull; {appt.durationMinutes || 30} mins
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 500, color: '#1e293b' }}>{appt.providerName}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{appt.providerEmail}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{formatDateTime(appt.appointmentTime)}</div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: '#0f766e' }}>
                            ${appt.price ? Number(appt.price).toFixed(2) : '0.00'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge-status ${getStatusBadgeClass(appt.status)}`}>
                            {appt.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                            <button
                              className="btn btn-outline"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                              onClick={() => setSelectedAppointment(appt)}
                              title="View Full Appointment Details"
                            >
                              Details
                            </button>
                            {canModify && (
                              <>
                                <button
                                  className="btn btn-secondary"
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                  onClick={() => openRescheduleModal(appt)}
                                  title="Reschedule Appointment"
                                >
                                  Reschedule
                                </button>
                                <button
                                  className="btn btn-danger"
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                  onClick={() => openCancelModal(appt)}
                                  title="Cancel Appointment"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pagination-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Showing page {page + 1} of {totalPages} ({totalElements} total records)
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn btn-outline"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    &larr; Previous
                  </button>
                  <button
                    className="btn btn-outline"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next &rarr;
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <div className="modal-backdrop">
          <div className="modal-box modal-md">
            <div className="modal-header">
              <h3>📋 Appointment Details &bull; #{selectedAppointment.id}</h3>
              <button className="modal-close-btn" onClick={() => setSelectedAppointment(null)}>
                &times;
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', padding: '1rem 0' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>Service Name</span>
                <strong>{selectedAppointment.serviceName || selectedAppointment.title}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>Category</span>
                <strong>{selectedAppointment.categoryName || 'General'}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>Specialist / Provider</span>
                <strong>{selectedAppointment.providerName}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>Provider Email</span>
                <span>{selectedAppointment.providerEmail}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>Scheduled Date &amp; Time</span>
                <strong>{formatDateTime(selectedAppointment.appointmentTime)}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>Duration</span>
                <span>{selectedAppointment.durationMinutes || 30} minutes</span>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>Consultation Fee</span>
                <strong style={{ color: '#0f766e' }}>
                  ${selectedAppointment.price ? Number(selectedAppointment.price).toFixed(2) : '0.00'}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>Status</span>
                <span className={`badge-status ${getStatusBadgeClass(selectedAppointment.status)}`}>
                  {selectedAppointment.status}
                </span>
              </div>
              {selectedAppointment.cancellationReason && (
                <div style={{ gridColumn: '1 / -1', backgroundColor: '#fef2f2', padding: '0.75rem', borderRadius: '6px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#991b1b', fontWeight: 600, display: 'block' }}>
                    Cancellation Reason:
                  </span>
                  <span style={{ color: '#7f1d1d', fontSize: '0.88rem' }}>{selectedAppointment.cancellationReason}</span>
                </div>
              )}
              {selectedAppointment.description && (
                <div style={{ gridColumn: '1 / -1', backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '6px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600, display: 'block' }}>
                    Notes / Description:
                  </span>
                  <span style={{ color: '#334155', fontSize: '0.88rem' }}>{selectedAppointment.description}</span>
                </div>
              )}
            </div>

            <div className="modal-actions">
              {isEligibleForChange(selectedAppointment) && (
                <>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      const appt = selectedAppointment
                      setSelectedAppointment(null)
                      openRescheduleModal(appt)
                    }}
                  >
                    Reschedule
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => {
                      const appt = selectedAppointment
                      setSelectedAppointment(null)
                      openCancelModal(appt)
                    }}
                  >
                    Cancel
                  </button>
                </>
              )}
              <button className="btn btn-outline" onClick={() => setSelectedAppointment(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancellingAppt && (
        <div className="modal-backdrop">
          <div className="modal-box modal-md">
            <div className="modal-header">
              <h3>❌ Cancel Appointment</h3>
              <button className="modal-close-btn" onClick={() => setCancellingAppt(null)}>
                &times;
              </button>
            </div>

            <form onSubmit={handleCancelSubmit} className="modal-form">
              <p>
                Are you sure you want to cancel your appointment for{' '}
                <strong>{cancellingAppt.serviceName || cancellingAppt.title}</strong> with{' '}
                <strong>{cancellingAppt.providerName}</strong> scheduled for{' '}
                <strong>{formatDateTime(cancellingAppt.appointmentTime)}</strong>?
              </p>

              {cancelError && (
                <div className="alert alert-error">
                  <span className="alert-icon">⚠️</span>
                  <span>{cancelError}</span>
                </div>
              )}

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label" htmlFor="cancelReason">
                  Reason for Cancellation <span className="text-danger">*</span>
                </label>
                <textarea
                  id="cancelReason"
                  className="form-control"
                  rows={3}
                  placeholder="e.g. Sudden travel, schedule conflict, or resolving symptoms..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  required
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setCancellingAppt(null)}
                  disabled={actionLoading}
                >
                  Keep Appointment
                </button>
                <button type="submit" className="btn btn-danger" disabled={actionLoading}>
                  {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {reschedulingAppt && (
        <div className="modal-backdrop">
          <div className="modal-box modal-lg">
            <div className="modal-header">
              <h3>📅 Reschedule Appointment &bull; #{reschedulingAppt.id}</h3>
              <button className="modal-close-btn" onClick={() => setReschedulingAppt(null)}>
                &times;
              </button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="modal-form">
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '0.85rem',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                }}
              >
                <div>Service: <strong>{reschedulingAppt.serviceName}</strong></div>
                <div>Specialist: <strong>{reschedulingAppt.providerName}</strong></div>
                <div>Current Time: <strong>{formatDateTime(reschedulingAppt.appointmentTime)}</strong></div>
              </div>

              {rescheduleError && (
                <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                  <span className="alert-icon">⚠️</span>
                  <span>{rescheduleError}</span>
                </div>
              )}

              {/* Step 1: New Date */}
              <div className="form-group">
                <label className="form-label" htmlFor="newRescheduleDate">
                  Pick New Date <span className="text-danger">*</span>
                </label>
                <input
                  id="newRescheduleDate"
                  type="date"
                  className="form-control"
                  min={todayStr}
                  value={newDate}
                  onChange={(e) => handleRescheduleDateChange(e.target.value)}
                  required
                />
              </div>

              {/* Step 2: Time Slots */}
              {newDate && (
                <div className="form-group">
                  <label className="form-label">
                    Select Available Time Slot <span className="text-danger">*</span>
                  </label>

                  {rescheduleSlotLoading ? (
                    <div className="loading-card" style={{ padding: '1.5rem' }}>
                      <div className="spinner"></div>
                      <p>Loading available slots for {newDate}...</p>
                    </div>
                  ) : rescheduleSlots.length === 0 ? (
                    <div className="empty-state-box" style={{ padding: '1.5rem' }}>
                      <p style={{ margin: 0, color: '#64748b' }}>
                        No operating hours or available slots on this date. Please choose another date.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                      {rescheduleSlots.map((slot, idx) => {
                        const isAvail = slot.status === 'AVAILABLE'
                        const isSel = selectedRescheduleSlot?.startTime === slot.startTime

                        return (
                          <button
                            key={idx}
                            type="button"
                            disabled={!isAvail}
                            onClick={() => setSelectedRescheduleSlot(slot)}
                            style={{
                              padding: '0.5rem',
                              borderRadius: '4px',
                              border: isSel ? '2px solid #0284c7' : '1px solid #cbd5e1',
                              backgroundColor: isSel
                                ? '#0284c7'
                                : isAvail
                                ? '#ecfdf5'
                                : '#f1f5f9',
                              color: isSel ? '#ffffff' : isAvail ? '#065f46' : '#94a3b8',
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              cursor: isAvail ? 'pointer' : 'not-allowed',
                            }}
                          >
                            <div>{slot.startTime}</div>
                            <div style={{ fontSize: '0.65rem' }}>{isSel ? 'Selected' : slot.status.toLowerCase()}</div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Reason */}
              <div className="form-group">
                <label className="form-label" htmlFor="rescheduleReason">
                  Reschedule Reason (Optional)
                </label>
                <textarea
                  id="rescheduleReason"
                  className="form-control"
                  rows={2}
                  placeholder="e.g. Schedule clash with meeting, doctor recommended new date..."
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  maxLength={500}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setReschedulingAppt(null)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={actionLoading || !selectedRescheduleSlot || !newDate}
                >
                  {actionLoading ? 'Updating Appointment...' : 'Confirm Reschedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomerAppointmentsView
