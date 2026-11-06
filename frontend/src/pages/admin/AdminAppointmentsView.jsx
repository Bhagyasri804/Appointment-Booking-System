import React, { useState, useEffect, useCallback } from 'react'
import { getAdminAppointments, cancelAppointment } from '../../services/api'

export const AdminAppointmentsView = () => {
  const [appointments, setAppointments] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(0)
  const [pageSize] = useState(8)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })

  // Modal states
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [cancelModalAppointment, setCancelModalAppointment] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelError, setCancelError] = useState('')

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        page,
        size: pageSize,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sortBy: 'appointmentTime',
        sortDir: 'desc',
      }
      const response = await getAdminAppointments(params)
      setAppointments(response.data.content || [])
      setTotalElements(response.data.totalElements || 0)
      setTotalPages(response.data.totalPages || 0)
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Failed to load appointments',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, statusFilter, startDate, endDate])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(0)
    fetchAppointments()
  }

  const handleClearFilters = () => {
    setSearch('')
    setStatusFilter('')
    setStartDate('')
    setEndDate('')
    setPage(0)
  }

  // Handle Cancel Appointment Submit
  const handleConfirmCancel = async (e) => {
    e.preventDefault()
    if (!cancelReason.trim()) {
      setCancelError('Cancellation justification reason is required')
      return
    }

    setActionLoading(true)
    setCancelError('')

    try {
      await cancelAppointment(cancelModalAppointment.id, cancelReason.trim())
      setMessage({
        text: `Appointment #${cancelModalAppointment.id} has been cancelled successfully.`,
        type: 'success',
      })
      setCancelModalAppointment(null)
      setCancelReason('')
      fetchAppointments()
    } catch (err) {
      setCancelError(err.response?.data?.message || 'Failed to cancel appointment')
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED':
        return <span className="status-badge-confirmed">CONFIRMED</span>
      case 'PENDING':
        return <span className="status-badge-pending">PENDING</span>
      case 'COMPLETED':
        return <span className="status-badge-completed">COMPLETED</span>
      case 'CANCELLED':
        return <span className="status-badge-cancelled">CANCELLED</span>
      default:
        return <span className="status-badge-default">{status}</span>
    }
  }

  return (
    <div className="admin-subview-container">
      {/* Header */}
      <div className="subview-header-row">
        <div>
          <h2>📅 Appointment Management</h2>
          <p className="subview-subtitle">Review bookings, customer &amp; provider assignments, and manage cancellations</p>
        </div>
        <div className="subview-count-badge">
          <strong>{totalElements}</strong> total bookings
        </div>
      </div>

      {message.text && (
        <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}>
          <span>{message.type === 'error' ? '⚠️' : '✅'}</span>
          <span>{message.text}</span>
          <button className="alert-close-btn" onClick={() => setMessage({ text: '', type: '' })}>✕</button>
        </div>
      )}

      {/* Filter and Date Controls */}
      <div className="filter-controls-card">
        {/* Status Filter Tabs */}
        <div className="status-pills-filter">
          {['', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              className={`pill-filter-btn ${statusFilter === st ? 'active' : ''}`}
              onClick={() => {
                setStatusFilter(st)
                setPage(0)
              }}
            >
              {st === '' ? 'All Bookings' : st}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="search-form-row">
          <input
            type="text"
            className="filter-input search-input"
            placeholder="Search by title, customer, or provider..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="date-filter-group">
            <label className="date-label">From:</label>
            <input
              type="date"
              className="filter-input date-input"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                setPage(0)
              }}
            />
            <label className="date-label">To:</label>
            <input
              type="date"
              className="filter-input date-input"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value)
                setPage(0)
              }}
            />
          </div>
          <button type="submit" className="btn-filter-search">
            🔍 Filter
          </button>
          {(search || statusFilter || startDate || endDate) && (
            <button type="button" className="btn-clear-filters" onClick={handleClearFilters}>
              Reset
            </button>
          )}
        </form>
      </div>

      {/* Appointments Table */}
      <div className="dash-card">
        {loading ? (
          <div className="loading-card">
            <div className="spinner"></div>
            <p>Loading appointments list...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="empty-state-box">
            <span className="empty-icon">📅</span>
            <h3>No appointments matched</h3>
            <p>Try clearing your status or date filter to see more results.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Appointment &amp; Service</th>
                  <th>Customer</th>
                  <th>Service Provider</th>
                  <th>Schedule Date &amp; Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => (
                  <tr key={a.id}>
                    <td>#{a.id}</td>
                    <td>
                      <div><strong>{a.title}</strong></div>
                      <div className="table-desc-text">
                        {a.serviceName} ({a.durationMinutes} min &bull; ${Number(a.price).toFixed(2)})
                      </div>
                    </td>
                    <td>
                      <div><strong>{a.customerName}</strong></div>
                      <div className="table-sub-email">{a.customerEmail}</div>
                    </td>
                    <td>
                      <div><strong>{a.providerName}</strong></div>
                      <div className="table-sub-email">{a.providerEmail}</div>
                    </td>
                    <td>
                      <div className="schedule-time-box">
                        📅 {a.appointmentTime ? new Date(a.appointmentTime).toLocaleDateString() : 'N/A'}
                        <span className="time-sub">
                          ⏰ {a.appointmentTime ? new Date(a.appointmentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                    </td>
                    <td>{getStatusBadge(a.status)}</td>
                    <td>
                      <div className="table-actions-cell">
                        <button
                          className="btn-action-view"
                          onClick={() => setSelectedAppointment(a)}
                          title="View Full Booking Details"
                        >
                          👁️ View
                        </button>
                        {a.status !== 'CANCELLED' && a.status !== 'COMPLETED' && (
                          <button
                            className="btn-action-cancel"
                            onClick={() => {
                              setCancelModalAppointment(a)
                              setCancelReason('')
                              setCancelError('')
                            }}
                            title="Cancel Booking"
                          >
                            ❌ Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="pagination-bar">
            <button
              className="pagination-btn"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(p - 1, 0))}
            >
              &larr; Previous
            </button>
            <span className="pagination-info">
              Page <strong>{page + 1}</strong> of <strong>{totalPages}</strong>
            </span>
            <button
              className="pagination-btn"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
            >
              Next &rarr;
            </button>
          </div>
        )}
      </div>

      {/* Modal: View Appointment Details */}
      {selectedAppointment && (
        <div className="modal-backdrop" onClick={() => setSelectedAppointment(null)}>
          <div className="modal-card modal-card-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📅 Appointment Booking Details</h3>
              <button className="modal-close-btn" onClick={() => setSelectedAppointment(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="appointment-details-grid">
                <div className="appt-info-section">
                  <h4>Appointment Information</h4>
                  <div className="detail-row">
                    <span className="detail-label">Booking ID:</span>
                    <span className="detail-value">#{selectedAppointment.id}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Title:</span>
                    <span className="detail-value"><strong>{selectedAppointment.title}</strong></span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Scheduled Time:</span>
                    <span className="detail-value">
                      {selectedAppointment.appointmentTime
                        ? new Date(selectedAppointment.appointmentTime).toLocaleString()
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Current Status:</span>
                    <span>{getStatusBadge(selectedAppointment.status)}</span>
                  </div>
                  {selectedAppointment.description && (
                    <div className="detail-row">
                      <span className="detail-label">Notes:</span>
                      <span className="detail-value">{selectedAppointment.description}</span>
                    </div>
                  )}
                  {selectedAppointment.cancellationReason && (
                    <div className="cancellation-alert-box">
                      <strong>Cancellation Reason:</strong>
                      <p>{selectedAppointment.cancellationReason}</p>
                    </div>
                  )}
                </div>

                <div className="appt-parties-section">
                  <div className="party-card">
                    <h4>👤 Customer Details</h4>
                    <p><strong>{selectedAppointment.customerName}</strong></p>
                    <p className="sub-text">Email: {selectedAppointment.customerEmail}</p>
                    <p className="sub-text">Phone: {selectedAppointment.customerPhone || 'N/A'}</p>
                  </div>

                  <div className="party-card">
                    <h4>💼 Service Provider</h4>
                    <p><strong>{selectedAppointment.providerName}</strong></p>
                    <p className="sub-text">Email: {selectedAppointment.providerEmail}</p>
                    <p className="sub-text">Phone: {selectedAppointment.providerPhone || 'N/A'}</p>
                  </div>

                  <div className="party-card">
                    <h4>🛠️ Service Details</h4>
                    <p><strong>{selectedAppointment.serviceName}</strong></p>
                    <p className="sub-text">Category: {selectedAppointment.categoryName}</p>
                    <p className="sub-text">
                      Duration: {selectedAppointment.durationMinutes} min &bull; Price: ${Number(selectedAppointment.price).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-modal-close" onClick={() => setSelectedAppointment(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cancel Appointment with Reason */}
      {cancelModalAppointment && (
        <div className="modal-backdrop" onClick={() => setCancelModalAppointment(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>❌ Cancel Appointment Booking</h3>
              <button className="modal-close-btn" onClick={() => setCancelModalAppointment(null)}>✕</button>
            </div>
            <form onSubmit={handleConfirmCancel}>
              <div className="modal-body">
                <p>
                  You are cancelling booking <strong>#{cancelModalAppointment.id}</strong>:
                </p>
                <div className="confirm-target-box">
                  <div><strong>{cancelModalAppointment.title}</strong></div>
                  <div className="sub-text">
                    Customer: {cancelModalAppointment.customerName} &bull; Provider: {cancelModalAppointment.providerName}
                  </div>
                  <div className="sub-text">
                    Time: {cancelModalAppointment.appointmentTime ? new Date(cancelModalAppointment.appointmentTime).toLocaleString() : ''}
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label htmlFor="cancel-reason">
                    <strong>Mandatory Reason for Cancellation: *</strong>
                  </label>
                  <textarea
                    id="cancel-reason"
                    rows="3"
                    className={`form-input ${cancelError ? 'input-error' : ''}`}
                    placeholder="State why this appointment is being cancelled by administration..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                  />
                  {cancelError && <span className="field-error">{cancelError}</span>}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setCancelModalAppointment(null)}
                >
                  Keep Appointment
                </button>
                <button
                  type="submit"
                  className="btn-modal-confirm btn-danger"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminAppointmentsView
