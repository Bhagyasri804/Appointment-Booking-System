import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getProviderDashboard } from '../services/api'

export const ProviderDashboard = () => {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await getProviderDashboard()
        setDashboardData(response.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch provider dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <span className="role-badge role-badge-provider">Service Provider Portal</span>
          <h1 className="dashboard-title">Welcome, {user?.fullName}!</h1>
          <p className="dashboard-subtitle">Manage your schedule, availability, and client bookings</p>
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
          <p>Loading provider portal...</p>
        </div>
      ) : (
        <div className="dashboard-grid">
          {/* Provider Profile Info */}
          <div className="dash-card">
            <h3 className="dash-card-title">💼 Provider Profile</h3>
            <div className="dash-info-list">
              <div className="dash-info-item">
                <span className="dash-info-label">Provider Name</span>
                <span className="dash-info-val">{user?.fullName}</span>
              </div>
              <div className="dash-info-item">
                <span className="dash-info-label">Professional Email</span>
                <span className="dash-info-val">{user?.email}</span>
              </div>
              <div className="dash-info-item">
                <span className="dash-info-label">Role</span>
                <span className="role-badge role-badge-provider">{user?.role}</span>
              </div>
              <div className="dash-info-item">
                <span className="dash-info-label">Provider ID</span>
                <span className="dash-info-val">#{user?.id}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="dash-card">
            <h3 className="dash-card-title">⚡ Provider Operations</h3>
            <div className="action-buttons-group">
              <button className="btn-action-primary" onClick={() => alert('Slot management will be enabled in Feature 3.')}>
                🕒 Set Working Hours
              </button>
              <button className="btn-action-secondary" onClick={() => alert('Client schedule will be enabled in Feature 3.')}>
                👥 View Client Requests
              </button>
            </div>
          </div>

          {/* Role Access Verification Card */}
          <div className="dash-card dash-card-full">
            <h3 className="dash-card-title">🛡️ Role-Based Access Verification</h3>
            <div className="api-verify-box">
              <p className="api-verify-text">
                <strong>Protected API Status:</strong> {dashboardData ? 'Verified (200 OK)' : 'Pending'}
              </p>
              <p className="api-verify-endpoint">
                <code>GET /api/provider/dashboard</code>
              </p>
              <p className="api-verify-message">
                Backend message: <em>"{dashboardData?.message}"</em>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProviderDashboard
