import React, { useState, useEffect } from 'react'
import { getAdminReports } from '../../services/api'

export const AdminReportsView = () => {
  const [reports, setReports] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await getAdminReports()
        setReports(response.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to generate system reports')
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [])

  if (loading) {
    return (
      <div className="loading-card">
        <div className="spinner"></div>
        <p>Compiling system analytics and business reports...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <span>⚠️</span>
        <span>{error}</span>
      </div>
    )
  }

  const userStats = reports?.userStats || {}
  const statusStats = reports?.appointmentStatusStats || {}
  const monthlyStats = reports?.monthlyStats || []
  const popularity = reports?.servicePopularity || []

  return (
    <div className="admin-subview-container">
      <div className="subview-header-row">
        <div>
          <h2>📈 Reports &amp; Business Intelligence</h2>
          <p className="subview-subtitle">Detailed audit records, registration volume, completion velocity, and service earnings</p>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="reports-kpi-grid">
        <div className="report-card">
          <div className="report-kpi-title">User Demographics</div>
          <div className="report-kpi-main">{userStats.totalUsers || 0} Total</div>
          <div className="report-breakdown-list">
            <div className="report-breakdown-row">
              <span>Customers:</span>
              <strong>{userStats.totalCustomers || 0}</strong>
            </div>
            <div className="report-breakdown-row">
              <span>Service Providers:</span>
              <strong>{userStats.totalProviders || 0}</strong>
            </div>
            <div className="report-breakdown-row">
              <span>Administrators:</span>
              <strong>{userStats.totalAdmins || 0}</strong>
            </div>
            <div className="report-breakdown-row">
              <span>Active Accounts:</span>
              <strong className="text-success">{userStats.activeUsers || 0}</strong>
            </div>
          </div>
        </div>

        <div className="report-card">
          <div className="report-kpi-title">Booking Fulfillment</div>
          <div className="report-kpi-main">{statusStats.completionRate || 0}% Rate</div>
          <div className="report-breakdown-list">
            <div className="report-breakdown-row">
              <span>Total Bookings:</span>
              <strong>{statusStats.totalAppointments || 0}</strong>
            </div>
            <div className="report-breakdown-row">
              <span>Completed:</span>
              <strong className="text-success">{statusStats.completedCount || 0}</strong>
            </div>
            <div className="report-breakdown-row">
              <span>Confirmed:</span>
              <strong className="text-primary">{statusStats.confirmedCount || 0}</strong>
            </div>
            <div className="report-breakdown-row">
              <span>Cancelled:</span>
              <strong className="text-danger">{statusStats.cancelledCount || 0}</strong>
            </div>
          </div>
        </div>

        <div className="report-card">
          <div className="report-kpi-title">Catalog Penetration</div>
          <div className="report-kpi-main">{popularity.length} Services</div>
          <div className="report-breakdown-list">
            <div className="report-breakdown-row">
              <span>Total Catalogued:</span>
              <strong>{popularity.length}</strong>
            </div>
            <div className="report-breakdown-row">
              <span>Top Performer:</span>
              <strong>{popularity[0]?.serviceName || 'N/A'}</strong>
            </div>
            <div className="report-breakdown-row">
              <span>Top Bookings:</span>
              <strong>{popularity[0]?.bookingCount || 0}</strong>
            </div>
            <div className="report-breakdown-row">
              <span>Top Grossing:</span>
              <strong className="text-success">${Number(popularity[0]?.revenue || 0).toFixed(2)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Statistics Table */}
      <div className="dash-card">
        <h3 className="dash-card-title">📅 Monthly Activity Log (Last 6 Months)</h3>
        <div className="table-responsive">
          <table className="users-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Total Volume</th>
                <th>Completed</th>
                <th>Cancelled</th>
                <th>Success Ratio</th>
              </tr>
            </thead>
            <tbody>
              {monthlyStats.map((m, idx) => {
                const ratio = m.totalAppointments > 0
                  ? Math.round((m.completedAppointments / m.totalAppointments) * 100)
                  : 0
                return (
                  <tr key={idx}>
                    <td><strong>{m.month}</strong></td>
                    <td>{m.totalAppointments} bookings</td>
                    <td><span className="badge-stat-completed">{m.completedAppointments} completed</span></td>
                    <td><span className="badge-stat-cancelled">{m.cancelledAppointments} cancelled</span></td>
                    <td>
                      <div className="progress-mini-wrapper">
                        <div className="progress-mini-track">
                          <div
                            className="progress-mini-fill"
                            style={{ width: `${ratio}%` }}
                          ></div>
                        </div>
                        <span className="ratio-text">{ratio}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Service Popularity Table */}
      <div className="dash-card">
        <h3 className="dash-card-title">⭐ Service Popularity &amp; Financial Contribution</h3>
        <div className="table-responsive">
          <table className="users-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Service Offering</th>
                <th>Total Bookings</th>
                <th>Cumulative Revenue</th>
              </tr>
            </thead>
            <tbody>
              {popularity.map((p, idx) => (
                <tr key={idx}>
                  <td>
                    <span className="rank-badge">#{idx + 1}</span>
                  </td>
                  <td><strong>{p.serviceName}</strong></td>
                  <td>
                    <span className="badge-booking-count">{p.bookingCount} bookings</span>
                  </td>
                  <td>
                    <strong className="revenue-text">${Number(p.revenue || 0).toFixed(2)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdminReportsView
