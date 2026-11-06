import React, { useState, useEffect, useCallback } from 'react'
import { getAdminUsersPaged, updateUserStatus } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

export const AdminUsersView = () => {
  const { user: currentAdmin } = useAuth()

  const [users, setUsers] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(0)
  const [pageSize] = useState(8)

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })

  // Modals state
  const [selectedUser, setSelectedUser] = useState(null)
  const [toggleConfirmUser, setToggleConfirmUser] = useState(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        page,
        size: pageSize,
        search: search.trim() || undefined,
        role: roleFilter || undefined,
        enabled: statusFilter !== '' ? statusFilter === 'true' : undefined,
        sortBy: 'createdAt',
        sortDir: 'desc',
      }
      const response = await getAdminUsersPaged(params)
      setUsers(response.data.content || [])
      setTotalElements(response.data.totalElements || 0)
      setTotalPages(response.data.totalPages || 0)
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Failed to load registered users',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, roleFilter, statusFilter])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(0)
    fetchUsers()
  }

  const handleToggleStatus = async () => {
    if (!toggleConfirmUser) return

    if (toggleConfirmUser.id === currentAdmin?.id && toggleConfirmUser.enabled) {
      setMessage({
        text: 'Security Protection: Administrators cannot deactivate their own account.',
        type: 'error',
      })
      setToggleConfirmUser(null)
      return
    }

    setActionLoading(true)
    try {
      const nextStatus = !toggleConfirmUser.enabled
      await updateUserStatus(toggleConfirmUser.id, nextStatus)
      setMessage({
        text: `User ${toggleConfirmUser.fullName} has been ${nextStatus ? 'activated' : 'deactivated'} successfully.`,
        type: 'success',
      })
      setToggleConfirmUser(null)
      fetchUsers()
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Failed to update user status.',
        type: 'error',
      })
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="admin-subview-container">
      {/* Header & Controls */}
      <div className="subview-header-row">
        <div>
          <h2>👥 Registered Users Management</h2>
          <p className="subview-subtitle">Manage customer, service provider, and administrative accounts</p>
        </div>
        <div className="subview-count-badge">
          <strong>{totalElements}</strong> total accounts
        </div>
      </div>

      {message.text && (
        <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}>
          <span>{message.type === 'error' ? '⚠️' : '✅'}</span>
          <span>{message.text}</span>
          <button className="alert-close-btn" onClick={() => setMessage({ text: '', type: '' })}>✕</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="filter-controls-card">
        <form onSubmit={handleSearchSubmit} className="search-form-row">
          <input
            type="text"
            className="filter-input search-input"
            placeholder="Search by full name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn-filter-search">
            🔍 Search
          </button>
        </form>

        <div className="filter-dropdowns-row">
          <select
            className="filter-select"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value)
              setPage(0)
            }}
          >
            <option value="">All Roles</option>
            <option value="CUSTOMER">Customers</option>
            <option value="SERVICE_PROVIDER">Service Providers</option>
            <option value="ADMIN">Administrators</option>
          </select>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(0)
            }}
          >
            <option value="">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive / Disabled</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="dash-card">
        {loading ? (
          <div className="loading-card">
            <div className="spinner"></div>
            <p>Loading users directory...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state-box">
            <span className="empty-icon">👥</span>
            <h3>No users found</h3>
            <p>Try adjusting your search query or role filter.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="users-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Phone Number</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isCurrentAdmin = u.id === currentAdmin?.id
                  return (
                    <tr key={u.id}>
                      <td>#{u.id}</td>
                      <td>
                        <strong>{u.fullName}</strong>
                        {isCurrentAdmin && <span className="you-pill">You</span>}
                      </td>
                      <td>{u.email}</td>
                      <td>{u.phoneNumber || '—'}</td>
                      <td>
                        <span
                          className={`role-badge ${
                            u.role === 'ADMIN'
                              ? 'role-badge-admin'
                              : u.role === 'SERVICE_PROVIDER'
                              ? 'role-badge-provider'
                              : 'role-badge-customer'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill ${u.enabled ? 'status-pill-active' : 'status-pill-inactive'}`}>
                          {u.enabled ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions-cell">
                          <button
                            className="btn-action-view"
                            onClick={() => setSelectedUser(u)}
                            title="View User Details"
                          >
                            👁️ View
                          </button>
                          <button
                            className={`btn-action-status ${u.enabled ? 'btn-status-disable' : 'btn-status-enable'}`}
                            onClick={() => setToggleConfirmUser(u)}
                            disabled={isCurrentAdmin && u.enabled}
                            title={
                              isCurrentAdmin && u.enabled
                                ? 'Self-deactivation disabled'
                                : u.enabled
                                ? 'Deactivate account'
                                : 'Activate account'
                            }
                          >
                            {u.enabled ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
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

      {/* Modal: View User Details */}
      {selectedUser && (
        <div className="modal-backdrop" onClick={() => setSelectedUser(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>👤 User Account Profile</h3>
              <button className="modal-close-btn" onClick={() => setSelectedUser(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="user-details-grid">
                <div className="detail-row">
                  <span className="detail-label">User ID:</span>
                  <span className="detail-value">#{selectedUser.id}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Full Name:</span>
                  <span className="detail-value"><strong>{selectedUser.fullName}</strong></span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{selectedUser.email}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Phone:</span>
                  <span className="detail-value">{selectedUser.phoneNumber || 'Not provided'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Role:</span>
                  <span className={`role-badge ${
                    selectedUser.role === 'ADMIN'
                      ? 'role-badge-admin'
                      : selectedUser.role === 'SERVICE_PROVIDER'
                      ? 'role-badge-provider'
                      : 'role-badge-customer'
                  }`}>
                    {selectedUser.role}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Account Status:</span>
                  <span className={`status-pill ${selectedUser.enabled ? 'status-pill-active' : 'status-pill-inactive'}`}>
                    {selectedUser.enabled ? 'Active / Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Member Since:</span>
                  <span className="detail-value">
                    {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-modal-close" onClick={() => setSelectedUser(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Toggle User Status Confirmation */}
      {toggleConfirmUser && (
        <div className="modal-backdrop" onClick={() => setToggleConfirmUser(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚠️ Confirm Status Change</h3>
              <button className="modal-close-btn" onClick={() => setToggleConfirmUser(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to <strong>{toggleConfirmUser.enabled ? 'DEACTIVATE' : 'ACTIVATE'}</strong> the account for:
              </p>
              <div className="confirm-target-box">
                <div><strong>{toggleConfirmUser.fullName}</strong></div>
                <div className="sub-text">{toggleConfirmUser.email} &bull; {toggleConfirmUser.role}</div>
              </div>
              {toggleConfirmUser.enabled && (
                <p className="warning-text">
                  Deactivated users will not be able to log in or access their portals.
                </p>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-modal-cancel" onClick={() => setToggleConfirmUser(null)}>
                Cancel
              </button>
              <button
                className={`btn-modal-confirm ${toggleConfirmUser.enabled ? 'btn-danger' : 'btn-success'}`}
                onClick={handleToggleStatus}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : toggleConfirmUser.enabled ? 'Deactivate User' : 'Activate User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminUsersView
