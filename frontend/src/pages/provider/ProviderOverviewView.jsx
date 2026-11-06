import React from 'react'

export const ProviderOverviewView = ({ overview, profile, unreadCount, loading, error, onTabChange }) => {
  if (loading) {
    return (
      <div className="admin-loading-container">
        <div className="spinner"></div>
        <p>Loading provider telemetry...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <span className="alert-icon">⚠️</span>
        <span>{error}</span>
      </div>
    )
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0)
  }

  const stats = overview || {
    totalAppointments: 0,
    todayAppointments: 0,
    pendingAppointments: 0,
    confirmedAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    totalEarnings: 0,
    monthlyEarnings: 0,
    monthlyStats: [],
  }

  const maxApptCount = Math.max(...(stats.monthlyStats || []).map((m) => m.appointmentCount || 0), 5)

  return (
    <div className="provider-overview-container">
      {/* Welcome Banner */}
      <div className="provider-banner-card">
        <div className="provider-banner-text">
          <div className="provider-banner-badge">Service Provider Hub</div>
          <h2 className="provider-banner-title">Welcome back, {profile?.fullName || 'Doctor / Specialist'}!</h2>
          <p className="provider-banner-desc">
            {profile?.specialization ? `${profile.specialization} • ` : ''}
            {profile?.description || 'Manage your clinical appointments, availability schedule, and patient requests.'}
          </p>
        </div>
        <div className="provider-banner-actions">
          <button className="btn btn-primary" onClick={() => onTabChange('appointments', 'PENDING')}>
            Review Requests ({stats.pendingAppointments})
          </button>
          <button className="btn btn-outline-light" onClick={() => onTabChange('calendar')}>
            View Calendar
          </button>
        </div>
      </div>

      {/* Unread Notifications Banner */}
      {unreadCount > 0 && (
        <div className="provider-alert-pill" onClick={() => onTabChange('notifications')}>
          <span className="pill-bell">🔔</span>
          <span className="pill-text">
            You have <strong>{unreadCount} unread notification{unreadCount > 1 ? 's' : ''}</strong> requiring attention.
          </span>
          <span className="pill-link">View notifications &rarr;</span>
        </div>
      )}

      {/* 6 Key Telemetry Cards */}
      <div className="admin-stats-grid">
        <div className="stat-card stat-blue" onClick={() => onTabChange('appointments', 'ALL')}>
          <div className="stat-card-icon">📅</div>
          <div className="stat-card-body">
            <span className="stat-card-label">Total Appointments</span>
            <span className="stat-card-val">{stats.totalAppointments}</span>
          </div>
        </div>

        <div className="stat-card stat-purple" onClick={() => onTabChange('calendar')}>
          <div className="stat-card-icon">🕒</div>
          <div className="stat-card-body">
            <span className="stat-card-label">Today's Schedule</span>
            <span className="stat-card-val">{stats.todayAppointments}</span>
          </div>
        </div>

        <div className="stat-card stat-amber" onClick={() => onTabChange('appointments', 'PENDING')}>
          <div className="stat-card-icon">⏳</div>
          <div className="stat-card-body">
            <span className="stat-card-label">Pending Requests</span>
            <span className="stat-card-val">{stats.pendingAppointments}</span>
          </div>
        </div>

        <div className="stat-card stat-emerald" onClick={() => onTabChange('appointments', 'CONFIRMED')}>
          <div className="stat-card-icon">✅</div>
          <div className="stat-card-body">
            <span className="stat-card-label">Confirmed Bookings</span>
            <span className="stat-card-val">{stats.confirmedAppointments}</span>
          </div>
        </div>

        <div className="stat-card stat-teal" onClick={() => onTabChange('appointments', 'COMPLETED')}>
          <div className="stat-card-icon">🎉</div>
          <div className="stat-card-body">
            <span className="stat-card-label">Completed Sessions</span>
            <span className="stat-card-val">{stats.completedAppointments}</span>
          </div>
        </div>

        <div className="stat-card stat-green">
          <div className="stat-card-icon">💰</div>
          <div className="stat-card-body">
            <span className="stat-card-label">Total Earnings</span>
            <span className="stat-card-val">{formatCurrency(stats.totalEarnings)}</span>
            <span className="stat-card-sub">{formatCurrency(stats.monthlyEarnings)} this month</span>
          </div>
        </div>
      </div>

      {/* Grid: Monthly Performance & Quick Actions */}
      <div className="admin-reports-grid" style={{ marginTop: '1.5rem' }}>
        {/* Monthly Appointment Trends Chart */}
        <div className="admin-report-card">
          <div className="admin-report-header">
            <h3>📈 Monthly Appointment Statistics</h3>
            <span className="badge badge-info">Past 6 Months</span>
          </div>
          <div className="admin-chart-wrapper">
            <div className="bar-chart-container">
              {(stats.monthlyStats || []).map((m, idx) => {
                const heightPct = Math.round((m.appointmentCount / maxApptCount) * 100)
                return (
                  <div key={idx} className="chart-bar-col">
                    <div className="chart-bar-tooltip">
                      {m.appointmentCount} appts
                      <br />
                      {formatCurrency(m.earnings)}
                    </div>
                    <div
                      className="chart-bar-fill"
                      style={{ height: `${Math.max(heightPct, 6)}%` }}
                    ></div>
                    <span className="chart-bar-label">{m.month}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="chart-legend-row">
            <span className="legend-item"><span className="legend-dot dot-blue"></span> Volume Trend</span>
            <span className="legend-item"><span className="legend-dot dot-green"></span> Completed Revenue</span>
          </div>
        </div>

        {/* Operational Shortcuts */}
        <div className="admin-report-card">
          <div className="admin-report-header">
            <h3>⚡ Quick Operational Shortcuts</h3>
            <span className="badge badge-purple">Provider Portal</span>
          </div>
          <div className="provider-quick-list">
            <div className="quick-item" onClick={() => onTabChange('availability')}>
              <div className="quick-item-icon">⏰</div>
              <div className="quick-item-content">
                <h4>Configure Working Hours</h4>
                <p>Set active days, start/end shift times, and scheduled break intervals.</p>
              </div>
              <span className="quick-arrow">&rarr;</span>
            </div>

            <div className="quick-item" onClick={() => onTabChange('calendar')}>
              <div className="quick-item-icon">📅</div>
              <div className="quick-item-content">
                <h4>Daily Schedule &amp; Slots</h4>
                <p>Check 30-min booking intervals, break periods, and client consultations.</p>
              </div>
              <span className="quick-arrow">&rarr;</span>
            </div>

            <div className="quick-item" onClick={() => onTabChange('appointments', 'PENDING')}>
              <div className="quick-item-icon">👥</div>
              <div className="quick-item-content">
                <h4>Process Client Requests</h4>
                <p>Confirm or decline incoming client booking requests.</p>
              </div>
              <span className="quick-arrow">&rarr;</span>
            </div>

            <div className="quick-item" onClick={() => onTabChange('profile')}>
              <div className="quick-item-icon">👤</div>
              <div className="quick-item-content">
                <h4>Update Professional Profile</h4>
                <p>Edit clinical specialization, bio details, and contact numbers.</p>
              </div>
              <span className="quick-arrow">&rarr;</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProviderOverviewView
