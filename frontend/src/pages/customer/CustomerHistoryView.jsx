import React, { useState, useEffect, useCallback } from 'react'
import { getCustomerAppointmentHistory } from '../../services/api'

export const CustomerHistoryView = () => {
  const [history, setHistory] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedAppointment, setSelectedAppointment] = useState(null)

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = {
        page,
        size: 10,
        search: searchTerm.trim() || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        startDate: startDate ? `${startDate}T00:00:00` : undefined,
        endDate: endDate ? `${endDate}T23:59:59` : undefined,
      }
      const res = await getCustomerAppointmentHistory(params)
      const data = res.data
      setHistory(data.content || [])
      setTotalPages(data.totalPages || 1)
      setTotalElements(data.totalElements || 0)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve appointment history')
    } finally {
      setLoading(false)
    }
  }, [page, searchTerm, statusFilter, startDate, endDate])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(0)
    fetchHistory()
  }

  const handleResetFilters = () => {
    setSearchTerm('')
    setStatusFilter('ALL')
    setStartDate('')
    setEndDate('')
    setPage(0)
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
      case 'COMPLETED':
        return 'badge-status-completed'
      case 'CANCELLED':
        return 'badge-status-cancelled'
      case 'CONFIRMED':
        return 'badge-status-confirmed'
      case 'PENDING':
        return 'badge-status-pending'
      default:
        return 'badge-status-secondary'
    }
  }

  return (
    <div className="customer-history-container">
      <div className="admin-view-header">
        <div>
          <h2>📜 Appointment History &amp; Records Archive</h2>
          <p>Review past consultations, completed sessions, and cancelled bookings.</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Date Range Bar */}
      <div className="dash-card" style={{ marginBottom: '1.25rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>Search Record</label>
            <input
              type="text"
              className="form-control"
              placeholder="Search by service or provider..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ flex: '0 1 150px' }}>
            <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>Status</label>
            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(0)
              }}
            >
              <option value="ALL">All Past Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div style={{ flex: '0 1 150px' }}>
            <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>From Date</label>
            <input
              type="date"
              className="form-control"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                setPage(0)
              }}
            />
          </div>

          <div style={{ flex: '0 1 150px' }}>
            <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>To Date</label>
            <input
              type="date"
              className="form-control"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value)
                setPage(0)
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn btn-secondary">
              Filter
            </button>
            <button type="button" className="btn btn-outline" onClick={handleResetFilters}>
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* History Table */}
      <div className="dash-card">
        {loading ? (
          <div className="loading-card" style={{ padding: '3rem' }}>
            <div className="spinner"></div>
            <p>Loading historical records...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="empty-state-box" style={{ padding: '3rem 1rem' }}>
            <span style={{ fontSize: '2.5rem' }}>📜</span>
            <h3>No Historical Records</h3>
            <p>You have no past or archived appointments matching the selected filters.</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Ref #</th>
                    <th>Service</th>
                    <th>Specialist Provider</th>
                    <th>Scheduled Date</th>
                    <th>Fee</th>
                    <th>Outcome</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <span className="id-badge">#{item.id}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.serviceName || item.title}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.categoryName}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{item.providerName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.providerEmail}</div>
                      </td>
                      <td>{formatDateTime(item.appointmentTime)}</td>
                      <td>
                        <span style={{ fontWeight: 600, color: '#0f766e' }}>
                          ${item.price ? Number(item.price).toFixed(2) : '0.00'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge-status ${getStatusBadgeClass(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-outline"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                          onClick={() => setSelectedAppointment(item)}
                        >
                          View Log
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pagination-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Page {page + 1} of {totalPages} ({totalElements} total archived appointments)
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

      {/* Appointment History Details Modal */}
      {selectedAppointment && (
        <div className="modal-backdrop">
          <div className="modal-box modal-md">
            <div className="modal-header">
              <h3>📜 Archive Record &bull; #{selectedAppointment.id}</h3>
              <button className="modal-close-btn" onClick={() => setSelectedAppointment(null)}>
                &times;
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', padding: '1rem 0' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>Service</span>
                <strong>{selectedAppointment.serviceName || selectedAppointment.title}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>Category</span>
                <strong>{selectedAppointment.categoryName || 'General'}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>Provider</span>
                <strong>{selectedAppointment.providerName}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>Date</span>
                <strong>{formatDateTime(selectedAppointment.appointmentTime)}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>Final Fee</span>
                <strong style={{ color: '#0f766e' }}>
                  ${selectedAppointment.price ? Number(selectedAppointment.price).toFixed(2) : '0.00'}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>Recorded Status</span>
                <span className={`badge-status ${getStatusBadgeClass(selectedAppointment.status)}`}>
                  {selectedAppointment.status}
                </span>
              </div>
              {selectedAppointment.cancellationReason && (
                <div style={{ gridColumn: '1 / -1', backgroundColor: '#fef2f2', padding: '0.75rem', borderRadius: '6px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#991b1b', fontWeight: 600, display: 'block' }}>
                    Reason for Cancellation:
                  </span>
                  <span style={{ color: '#7f1d1d', fontSize: '0.88rem' }}>{selectedAppointment.cancellationReason}</span>
                </div>
              )}
              {selectedAppointment.description && (
                <div style={{ gridColumn: '1 / -1', backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '6px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600, display: 'block' }}>
                    Consultation Notes:
                  </span>
                  <span style={{ color: '#334155', fontSize: '0.88rem' }}>{selectedAppointment.description}</span>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setSelectedAppointment(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomerHistoryView
