import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getAdminDashboard, getAdminUsers } from '../services/api'

export const AdminDashboard = () => {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [dashRes, usersRes] = await Promise.all([
          getAdminDashboard(),
          getAdminUsers(),
        ])
        setDashboardData(dashRes.data)
        setUsers(usersRes.data || [])
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load administrator data')
      } finally {
        setLoading(false)
      }
    }

    fetchAdminData()
  }, [])

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <span className="role-badge role-badge-admin">Admin Command Center</span>
          <h1 className="dashboard-title">System Administration</h1>
          <p className="dashboard-subtitle">Monitor users, roles, system health, and overall security</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="loading-card">
          <div className="spinner"></div>
          <p>Loading administration data...</p>
        </div>
      ) : (
        <div className="dashboard-grid">
          {/* Admin Stats Card */}
          <div className="dash-card">
            <h3 className="dash-card-title">⚙️ Admin Profile</h3>
            <div className="dash-info-list">
              <div className="dash-info-item">
                <span className="dash-info-label">Admin Name</span>
                <span className="dash-info-val">{user?.fullName}</span>
              </div>
              <div className="dash-info-item">
                <span className="dash-info-label">Admin Email</span>
                <span className="dash-info-val">{user?.email}</span>
              </div>
              <div className="dash-info-item">
                <span className="dash-info-label">Role</span>
                <span className="role-badge role-badge-admin">{user?.role}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="dash-card">
            <h3 className="dash-card-title">📊 Platform Overview</h3>
            <div className="stats-row">
              <div className="stat-box">
                <div className="stat-number">{users.length}</div>
                <div className="stat-label">Total Users</div>
              </div>
              <div className="stat-box">
                <div className="stat-number">
                  {users.filter((u) => u.role === 'CUSTOMER').length}
                </div>
                <div className="stat-label">Customers</div>
              </div>
              <div className="stat-box">
                <div className="stat-number">
                  {users.filter((u) => u.role === 'SERVICE_PROVIDER').length}
                </div>
                <div className="stat-label">Providers</div>
              </div>
            </div>
          </div>

          {/* User Management Table */}
          <div className="dash-card dash-card-full">
            <div className="table-header-row">
              <h3 className="dash-card-title">👥 Registered Users Management</h3>
              <span className="table-badge">{users.length} accounts in database</span>
            </div>

            <div className="table-responsive">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>#{u.id}</td>
                      <td>
                        <strong>{u.fullName}</strong>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
