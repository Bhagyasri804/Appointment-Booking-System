import React, { useState, useEffect, useCallback } from 'react'
import {
  getProviderAppointments,
  confirmProviderAppointment,
  rejectProviderAppointment,
  completeProviderAppointment,
} from '../../services/api'

export const ProviderAppointmentsView = ({ initialStatus = 'ALL', onAppointmentAction }) => {
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
  const [rejectingAppt, setRejectingAppt] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectError, setRejectError] = useState('')

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
      const res = await getProviderAppointments(params)
      const data = res.data
      setAppointments(data.content || [])
      setTotalPages(data.totalPages || 1)
      setTotalElements(data.totalElements || 0)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve provider appointments')
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

  const handleConfirm = async (appt) => {
    setActionLoading(true)
    setError('')
    setSuccess('')
    try {
      await confirmProviderAppointment(appt.id)
      setSuccess(`Appointment #${appt.id} confirmed successfully!`)
      fetchAppointments()
      if (onAppointmentAction) onAppointmentAction()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to confirm appointment')
    } finally {
      setActionLoading(false)
    }
  }

  const handleComplete = async (appt) => {
    setActionLoading(true)
    setError('')
    setSuccess('')
    try {
      await completeProviderAppointment(appt.id)
      setSuccess(`Appointment #${appt.id} marked as completed!`)
      fetchAppointments()
      if (onAppointmentAction) onAppointmentAction()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete appointment')
    } finally {
      setActionLoading(false)
    }
  }

  const openRejectModal = (appt) => {
    setRejectingAppt(appt)
    setRejectReason('')
    setRejectError('')
  }

  const handleRejectSubmit = async (e) => {
    e.preventDefault()
    if (!rejectReason.trim()) {
      setRejectError('Please state a reason for declining this appointment')
      return
    }

    setActionLoading(true)
    setRejectError('')
    try {
      await rejectProviderAppointment(rejectingAppt.id, rejectReason.trim())
      setSuccess(`Appointment #${rejectingAppt.id} declined. Reason recorded.`)
      setRejectingAppt(null)
      fetchAppointments()
      if (onAppointmentAction) onAppointmentAction()
    } catch (err) {
      setRejectError(err.response?.data?.message || 'Failed to decline appointment')
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED':
        return <span className="badge badge-success">CONFIRMED</span>
      case 'PENDING':
        return <span className="badge badge-amber">PENDING</span>
      case 'COMPLETED':
        return <span className="badge badge-info">COMPLETED</span>
      case 'CANCELLED':
        return <span className="badge badge-danger">CANCELLED</span>
      default:
        return <span className="badge badge-neutral">{status}</span>
    }
  }

  const formatDateTime = (isoStr) => {
    if (!isoStr) return 'N/A'
    const date = new Date(isoStr)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="provider-appointments-container">
      <div className="admin-view-header">
        <div>
          <h2>📋 Patient &amp; Client Appointment Management</h2>
          <p>Review incoming requests, confirm bookings, and manage completed consultations.</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <span className="alert-icon">✅</span>
          <span>{success}</span>
        </div>
      )}

      {/* Filter Tabs & Search Controls */}
      <div className="admin-controls-card">
        <div className="status-tabs-row">
          {['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((tab) => (
            <button
              key={tab}
              className={`status-tab ${statusFilter === tab ? 'tab-active' : ''}`}
              onClick={() => handleTabChange(tab)}
            >
              {tab === 'PENDING' ? '⏳ Requests (Pending)' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="search-form-inline">
          <div className="search-input-group">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search by client name, email, or service title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-outline">
            Filter
          </button>
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
        </form>
      </div>

      {/* Appointments Data Table */}
      <div className="admin-card">
        <div className="card-header-bar">
          <span className="record-count">
            Showing <strong>{appointments.length}</strong> of <strong>{totalElements}</strong> total appointments
          </span>
        </div>

        {loading ? (
          <div className="admin-loading-container">
            <div className="spinner"></div>
            <p>Loading appointments...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="admin-empty-state">
            <div className="empty-icon">📭</div>
            <h3>No appointments found</h3>
            <p>There are no appointments matching the selected filter criteria.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Client / Patient</th>
                  <th>Service Details</th>
                  <th>Scheduled Time</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => (
                  <tr key={appt.id}>
                    <td>
                      <span className="user-id">#{appt.id}</span>
                    </td>
                    <td>
                      <div className="cell-primary">{appt.customerName || 'N/A'}</div>
                      <div className="cell-secondary">{appt.customerEmail}</div>
                      {appt.customerPhone && <div className="cell-secondary">📞 {appt.customerPhone}</div>}
                    </td>
                    <td>
                      <div className="cell-primary">{appt.serviceName || appt.title}</div>
                      {appt.servicePrice && (
                        <div className="cell-secondary">
                          ${appt.servicePrice} • {appt.serviceDurationMinutes || 30} mins
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="cell-primary">{formatDateTime(appt.appointmentTime)}</div>
                    </td>
                    <td>{getStatusBadge(appt.status)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="table-action-btns">
                        <button
                          className="btn btn-xs btn-outline"
                          title="View Details"
                          onClick={() => setSelectedAppointment(appt)}
                        >
                          Details
                        </button>

                        {appt.status?.toUpperCase() === 'PENDING' && (
                          <>
                            <button
                              className="btn btn-xs btn-success"
                              title="Accept Booking"
                              onClick={() => handleConfirm(appt)}
                              disabled={actionLoading}
                            >
                              Confirm
                            </button>
                            <button
                              className="btn btn-xs btn-outline-danger"
                              title="Decline Booking"
                              onClick={() => openRejectModal(appt)}
                              disabled={actionLoading}
                            >
                              Decline
                            </button>
                          </>
                        )}

                        {appt.status?.toUpperCase() === 'CONFIRMED' && (
                          <button
                            className="btn btn-xs btn-primary"
                            title="Mark as Completed"
                            onClick={() => handleComplete(appt)}
                            disabled={actionLoading}
                          >
                            Complete
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

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="pagination-bar">
            <button
              className="btn btn-sm btn-outline"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(p - 1, 0))}
            >
              &larr; Previous
            </button>
            <span className="page-indicator">
              Page {page + 1} of {totalPages}
            </span>
            <button
              className="btn btn-sm btn-outline"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
            >
              Next &rarr;
            </button>
          </div>
        )}
      </div>

      {/* Appointment Inspect Modal */}
      {selectedAppointment && (
        <div className="modal-backdrop">
          <div className="modal-box modal-md">
            <div className="modal-header">
              <h3>🔍 Appointment Details #{selectedAppointment.id}</h3>
              <button className="modal-close-btn" onClick={() => setSelectedAppointment(null)}>
                &times;
              </button>
            </div>
            <div className="modal-body detail-grid-modal">
              <div className="detail-item-box">
                <span className="modal-detail-label">Client Name</span>
                <span className="modal-detail-val">{selectedAppointment.customerName || 'N/A'}</span>
              </div>

              <div className="detail-item-box">
                <span className="modal-detail-label">Client Email</span>
                <span className="modal-detail-val">{selectedAppointment.customerEmail || 'N/A'}</span>
              </div>

              <div className="detail-item-box">
                <span className="modal-detail-label">Service</span>
                <span className="modal-detail-val">{selectedAppointment.serviceName || selectedAppointment.title}</span>
              </div>

              <div className="detail-item-box">
                <span className="modal-detail-label">Category</span>
                <span className="modal-detail-val">{selectedAppointment.categoryName || 'General'}</span>
              </div>

              <div className="detail-item-box">
                <span className="modal-detail-label">Scheduled Time</span>
                <span className="modal-detail-val">{formatDateTime(selectedAppointment.appointmentTime)}</span>
              </div>

              <div className="detail-item-box">
                <span className="modal-detail-label">Consultation Fee</span>
                <span className="modal-detail-val">
                  {selectedAppointment.servicePrice ? `$${selectedAppointment.servicePrice}` : 'Free'}
                </span>
              </div>

              <div className="detail-item-box">
                <span className="modal-detail-label">Current Status</span>
                <div>{getStatusBadge(selectedAppointment.status)}</div>
              </div>

              {selectedAppointment.cancellationReason && (
                <div className="detail-item-box full-span">
                  <span className="modal-detail-label">Cancellation / Rejection Reason</span>
                  <div className="reason-display-box">{selectedAppointment.cancellationReason}</div>
                </div>
              )}

              {selectedAppointment.description && (
                <div className="detail-item-box full-span">
                  <span className="modal-detail-label">Appointment Notes / Intake Description</span>
                  <div className="notes-box">{selectedAppointment.description}</div>
                </div>
              )}
            </div>

            <div className="modal-actions">
              {selectedAppointment.status?.toUpperCase() === 'PENDING' && (
                <>
                  <button
                    className="btn btn-success"
                    onClick={() => {
                      handleConfirm(selectedAppointment)
                      setSelectedAppointment(null)
                    }}
                  >
                    Confirm Booking
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => {
                      const appt = selectedAppointment
                      setSelectedAppointment(null)
                      openRejectModal(appt)
                    }}
                  >
                    Decline Request
                  </button>
                </>
              )}

              {selectedAppointment.status?.toUpperCase() === 'CONFIRMED' && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    handleComplete(selectedAppointment)
                    setSelectedAppointment(null)
                  }}
                >
                  Mark as Completed
                </button>
              )}

              <button className="btn btn-outline" onClick={() => setSelectedAppointment(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Appointment Modal */}
      {rejectingAppt && (
        <div className="modal-backdrop">
          <div className="modal-box modal-md">
            <div className="modal-header">
              <h3>❌ Decline Appointment Request</h3>
              <button className="modal-close-btn" onClick={() => setRejectingAppt(null)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleRejectSubmit} className="modal-form">
              <p>
                You are declining the appointment request for{' '}
                <strong>{rejectingAppt.customerName}</strong> on{' '}
                <strong>{formatDateTime(rejectingAppt.appointmentTime)}</strong>.
              </p>

              {rejectError && (
                <div className="alert alert-error">
                  <span className="alert-icon">⚠️</span>
                  <span>{rejectError}</span>
                </div>
              )}

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label" htmlFor="rejectReason">
                  Reason for declining <span className="text-danger">*</span>
                </label>
                <textarea
                  id="rejectReason"
                  className="form-control"
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Schedule conflict with emergency surgery; patient is requested to reschedule."
                  required
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setRejectingAppt(null)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger" disabled={actionLoading}>
                  {actionLoading ? 'Declining...' : 'Decline Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProviderAppointmentsView
