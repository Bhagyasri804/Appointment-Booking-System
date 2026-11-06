import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getCustomerDashboard } from '../services/api'

export const CustomerDashboard = () => {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await getCustomerDashboard()
        setDashboardData(response.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch customer dashboard data')
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
          <span className="role-badge role-badge-customer">Customer Portal</span>
          <h1 className="dashboard-title">Welcome, {user?.fullName}!</h1>
          <p className="dashboard-subtitle">Manage your appointments, bookings, and profile details</p>
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
          <p>Loading customer portal...</p>
        </div>
      ) : (
        <div className="dashboard-grid">
          {/* User Info Card */}
          <div className="dash-card">
            <h3 className="dash-card-title">👤 Account Profile</h3>
            <div className="dash-info-list">
              <div className="dash-info-item">
                <span className="dash-info-label">Full Name</span>
                <span className="dash-info-val">{user?.fullName}</span>
              </div>
              <div className="dash-info-item">
                <span className="dash-info-label">Email</span>
                <span className="dash-info-val">{user?.email}</span>
              </div>
              <div className="dash-info-item">
                <span className="dash-info-label">Account Role</span>
                <span className="role-badge role-badge-customer">{user?.role}</span>
              </div>
              <div className="dash-info-item">
                <span className="dash-info-label">User ID</span>
                <span className="dash-info-val">#{user?.id}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="dash-card">
            <h3 className="dash-card-title">⚡ Customer Actions</h3>
            <div className="action-buttons-group">
              <button className="btn-action-primary" onClick={() => alert('Appointment booking module will be enabled in Feature 3.')}>
                📅 Book New Appointment
              </button>
              <button className="btn-action-secondary" onClick={() => alert('Appointments history will be enabled in Feature 3.')}>
                📋 View My Appointments
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
                <code>GET /api/customer/dashboard</code>
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

export default CustomerDashboard
