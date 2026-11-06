import React from 'react'

export const AdminOverviewView = ({ stats, reports, loading, onTabChange }) => {
  if (loading) {
    return (
      <div className="loading-card">
        <div className="spinner"></div>
        <p>Loading overview statistics and analytics...</p>
      </div>
    )
  }

  const s = stats || {
    totalUsers: 0,
    totalCustomers: 0,
    totalProviders: 0,
    totalAppointments: 0,
    pendingAppointments: 0,
    confirmedAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    totalServices: 0,
    activeServices: 0,
  }

  // Appointment Status distribution data for chart
  const statusStats = reports?.appointmentStatusStats || {
    totalAppointments: s.totalAppointments,
    pendingCount: s.pendingAppointments,
    confirmedCount: s.confirmedAppointments,
    completedCount: s.completedAppointments,
    cancelledCount: s.cancelledAppointments,
    completionRate: 0,
  }

  const monthlyTrends = reports?.monthlyStats || []
  const popularServices = reports?.servicePopularity || []

  // Max count for SVG bar chart scaling
  const maxMonthly = Math.max(...monthlyTrends.map((m) => m.totalAppointments), 1)

  return (
    <div className="admin-overview-container">
      {/* 8 Stats Metric Cards */}
      <section className="stats-metric-grid">
        <div className="metric-card metric-card-blue" onClick={() => onTabChange('users')}>
          <div className="metric-header">
            <span className="metric-title">Total Users</span>
            <span className="metric-icon">👥</span>
          </div>
          <div className="metric-value">{s.totalUsers}</div>
          <div className="metric-caption">
            <span>{s.totalCustomers} Customers</span> &bull; <span>{s.totalProviders} Providers</span>
          </div>
        </div>

        <div className="metric-card metric-card-indigo" onClick={() => onTabChange('users')}>
          <div className="metric-header">
            <span className="metric-title">Total Customers</span>
            <span className="metric-icon">👤</span>
          </div>
          <div className="metric-value">{s.totalCustomers}</div>
          <div className="metric-caption">Active clients in booking system</div>
        </div>

        <div className="metric-card metric-card-purple" onClick={() => onTabChange('users')}>
          <div className="metric-header">
            <span className="metric-title">Service Providers</span>
            <span className="metric-icon">💼</span>
          </div>
          <div className="metric-value">{s.totalProviders}</div>
          <div className="metric-caption">Verified healthcare &amp; consulting professionals</div>
        </div>

        <div className="metric-card metric-card-cyan" onClick={() => onTabChange('services')}>
          <div className="metric-header">
            <span className="metric-title">Active Services</span>
            <span className="metric-icon">🛠️</span>
          </div>
          <div className="metric-value">{s.activeServices}</div>
          <div className="metric-caption">Out of {s.totalServices} total catalog services</div>
        </div>

        <div className="metric-card metric-card-amber" onClick={() => onTabChange('appointments')}>
          <div className="metric-header">
            <span className="metric-title">Pending Bookings</span>
            <span className="metric-icon">⏳</span>
          </div>
          <div className="metric-value">{s.pendingAppointments}</div>
          <div className="metric-caption">Awaiting provider or client confirmation</div>
        </div>

        <div className="metric-card metric-card-emerald" onClick={() => onTabChange('appointments')}>
          <div className="metric-header">
            <span className="metric-title">Confirmed Bookings</span>
            <span className="metric-icon">✅</span>
          </div>
          <div className="metric-value">{s.confirmedAppointments}</div>
          <div className="metric-caption">Scheduled on service calendar</div>
        </div>

        <div className="metric-card metric-card-teal" onClick={() => onTabChange('appointments')}>
          <div className="metric-header">
            <span className="metric-title">Completed Bookings</span>
            <span className="metric-icon">🎉</span>
          </div>
          <div className="metric-value">{s.completedAppointments}</div>
          <div className="metric-caption">Successfully conducted appointments</div>
        </div>

        <div className="metric-card metric-card-rose" onClick={() => onTabChange('appointments')}>
          <div className="metric-header">
            <span className="metric-title">Cancelled Bookings</span>
            <span className="metric-icon">❌</span>
          </div>
          <div className="metric-value">{s.cancelledAppointments}</div>
          <div className="metric-caption">With logged cancellation justifications</div>
        </div>
      </section>

      {/* Visual Analytics & Charts Section */}
      <section className="charts-overview-row">
        {/* Monthly Appointment Trends SVG Bar Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>📈 Monthly Appointment Trends (Last 6 Months)</h3>
            <span className="chart-sub">Appointment volume &amp; outcome trends</span>
          </div>
          <div className="bar-chart-wrapper">
            {monthlyTrends.length === 0 ? (
              <p className="no-data-msg">No monthly trends data recorded yet.</p>
            ) : (
              <div className="svg-bar-chart">
                {monthlyTrends.map((m, idx) => {
                  const heightPercent = Math.max((m.totalAppointments / maxMonthly) * 100, 10)
                  return (
                    <div key={idx} className="bar-col">
                      <div className="bar-tooltip">
                        <strong>{m.month}</strong>
                        <div>Total: {m.totalAppointments}</div>
                        <div>Completed: {m.completedAppointments}</div>
                        <div>Cancelled: {m.cancelledAppointments}</div>
                      </div>
                      <div className="bar-stack" style={{ height: `${heightPercent}%` }}>
                        <div
                          className="bar-segment bar-completed"
                          style={{
                            height: m.totalAppointments > 0 ? `${(m.completedAppointments / m.totalAppointments) * 100}%` : '0%',
                          }}
                        ></div>
                        <div
                          className="bar-segment bar-pending"
                          style={{
                            height: m.totalAppointments > 0 ? `${((m.totalAppointments - m.completedAppointments - m.cancelledAppointments) / m.totalAppointments) * 100}%` : '100%',
                          }}
                        ></div>
                      </div>
                      <span className="bar-label">{m.month}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          <div className="chart-legend">
            <span className="legend-item"><span className="legend-dot dot-completed"></span> Completed</span>
            <span className="legend-item"><span className="legend-dot dot-pending"></span> Confirmed / Pending</span>
          </div>
        </div>

        {/* Appointment Status Distribution */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>🎯 Appointment Status Breakdown</h3>
            <span className="chart-sub">Completion rate: <strong>{statusStats.completionRate}%</strong></span>
          </div>
          <div className="status-bars-container">
            <div className="status-progress-row">
              <div className="status-progress-info">
                <span className="status-name">Confirmed</span>
                <span className="status-count">{statusStats.confirmedCount}</span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill fill-confirmed"
                  style={{ width: `${s.totalAppointments > 0 ? (statusStats.confirmedCount / s.totalAppointments) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div className="status-progress-row">
              <div className="status-progress-info">
                <span className="status-name">Pending</span>
                <span className="status-count">{statusStats.pendingCount}</span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill fill-pending"
                  style={{ width: `${s.totalAppointments > 0 ? (statusStats.pendingCount / s.totalAppointments) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div className="status-progress-row">
              <div className="status-progress-info">
                <span className="status-name">Completed</span>
                <span className="status-count">{statusStats.completedCount}</span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill fill-completed"
                  style={{ width: `${s.totalAppointments > 0 ? (statusStats.completedCount / s.totalAppointments) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div className="status-progress-row">
              <div className="status-progress-info">
                <span className="status-name">Cancelled</span>
                <span className="status-count">{statusStats.cancelledCount}</span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill fill-cancelled"
                  style={{ width: `${s.totalAppointments > 0 ? (statusStats.cancelledCount / s.totalAppointments) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Services Leaderboard */}
      <section className="dash-card">
        <div className="chart-header">
          <h3>🏆 Service Popularity &amp; Booking Volume</h3>
          <span className="chart-sub">Most requested services across providers</span>
        </div>
        <div className="table-responsive">
          <table className="users-table">
            <thead>
              <tr>
                <th>Service Offering</th>
                <th>Total Bookings</th>
                <th>Estimated Revenue</th>
              </tr>
            </thead>
            <tbody>
              {popularServices.map((p, idx) => (
                <tr key={idx}>
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
      </section>
    </div>
  )
}

export default AdminOverviewView
