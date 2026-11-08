import React from 'react'

export const CustomerOverviewView = ({
  stats,
  profile,
  unreadCount = 0,
  loading = false,
  error = '',
  onTabChange,
}) => {
  const formatDateTime = (iso) => {
    if (!iso) return 'N/A'
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadgeClass = (status) => {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED':
        return 'badge-status-confirmed'
      case 'PENDING':
        return 'badge-status-pending'
      case 'COMPLETED':
        return 'badge-status-completed'
      case 'CANCELLED':
        return 'badge-status-cancelled'
      default:
        return 'badge-status-secondary'
    }
  }

  return (
    <div className="overview-container">
      {/* Welcome Banner */}
      <div className="provider-banner-card">
        <div className="banner-content">
          <div className="banner-tag">CUSTOMER PORTAL &bull; APPOINTMENTS</div>
          <h1 className="banner-title">
            Welcome back, {profile?.fullName || 'Valued Customer'}!
          </h1>
          <p className="banner-subtitle">
            Explore verified specialists, check availability in real-time, and seamlessly schedule your consultations.
          </p>
          <div className="banner-actions">
            <button
              className="btn btn-primary"
              onClick={() => onTabChange('book')}
            >
              📅 Book New Appointment
            </button>
            <button
              className="btn btn-outline-white"
              onClick={() => onTabChange('services')}
            >
              🔍 Browse Services
            </button>
            <button
              className="btn btn-outline-white"
              onClick={() => onTabChange('appointments')}
            >
              📋 My Appointments
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="stats-metric-grid">
        <div
          className="metric-card metric-card-blue clickable"
          onClick={() => onTabChange('appointments', 'ALL')}
        >
          <div className="metric-icon">📊</div>
          <div className="metric-data">
            <span className="metric-val">{loading ? '...' : stats?.totalAppointments ?? 0}</span>
            <span className="metric-label">Total Appointments</span>
          </div>
        </div>

        <div
          className="metric-card metric-card-indigo clickable"
          onClick={() => onTabChange('appointments', 'UPCOMING')}
        >
          <div className="metric-icon">⏰</div>
          <div className="metric-data">
            <span className="metric-val">{loading ? '...' : stats?.upcomingAppointments ?? 0}</span>
            <span className="metric-label">Upcoming Sessions</span>
          </div>
        </div>

        <div
          className="metric-card metric-card-amber clickable"
          onClick={() => onTabChange('appointments', 'PENDING')}
        >
          <div className="metric-icon">⏳</div>
          <div className="metric-data">
            <span className="metric-val">{loading ? '...' : stats?.pendingAppointments ?? 0}</span>
            <span className="metric-label">Pending Approval</span>
          </div>
        </div>

        <div
          className="metric-card metric-card-emerald clickable"
          onClick={() => onTabChange('appointments', 'CONFIRMED')}
        >
          <div className="metric-icon">✅</div>
          <div className="metric-data">
            <span className="metric-val">{loading ? '...' : stats?.confirmedAppointments ?? 0}</span>
            <span className="metric-label">Confirmed Bookings</span>
          </div>
        </div>

        <div
          className="metric-card metric-card-purple clickable"
          onClick={() => onTabChange('history', 'COMPLETED')}
        >
          <div className="metric-icon">🎉</div>
          <div className="metric-data">
            <span className="metric-val">{loading ? '...' : stats?.completedAppointments ?? 0}</span>
            <span className="metric-label">Completed Sessions</span>
          </div>
        </div>

        <div
          className="metric-card metric-card-rose clickable"
          onClick={() => onTabChange('history', 'CANCELLED')}
        >
          <div className="metric-icon">❌</div>
          <div className="metric-data">
            <span className="metric-val">{loading ? '...' : stats?.cancelledAppointments ?? 0}</span>
            <span className="metric-label">Cancelled Records</span>
          </div>
        </div>
      </div>

      {/* Quick Action Hub */}
      <div className="dash-card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="dash-card-title">⚡ Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '0.75rem' }}>
          <div
            className="action-tile clickable"
            onClick={() => onTabChange('book')}
            style={{
              padding: '1.25rem',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>📅</div>
            <h4 style={{ margin: '0 0 0.25rem 0', color: '#1e293b' }}>Book Appointment</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
              Choose service, specialist, and schedule a convenient time slot.
            </p>
          </div>

          <div
            className="action-tile clickable"
            onClick={() => onTabChange('services')}
            style={{
              padding: '1.25rem',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>🩺</div>
            <h4 style={{ margin: '0 0 0.25rem 0', color: '#1e293b' }}>Browse Services</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
              Filter by category, compare prices, and explore service details.
            </p>
          </div>

          <div
            className="action-tile clickable"
            onClick={() => onTabChange('providers')}
            style={{
              padding: '1.25rem',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>👨‍⚕️</div>
            <h4 style={{ margin: '0 0 0.25rem 0', color: '#1e293b' }}>Find Providers</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
              Search certified specialists and review working hours.
            </p>
          </div>

          <div
            className="action-tile clickable"
            onClick={() => onTabChange('notifications')}
            style={{
              padding: '1.25rem',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>🔔</div>
            <h4 style={{ margin: '0 0 0.25rem 0', color: '#1e293b' }}>
              Notifications {unreadCount > 0 && <span className="sidebar-pill-badge pill-amber">{unreadCount}</span>}
            </h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
              Check booking confirmations and scheduling updates.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="dash-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 className="dash-card-title" style={{ margin: 0 }}>📋 Recent Booking Activity</h3>
          <button
            className="btn btn-outline"
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
            onClick={() => onTabChange('appointments')}
          >
            View All &rarr;
          </button>
        </div>

        {loading ? (
          <div className="loading-card" style={{ padding: '2rem' }}>
            <div className="spinner"></div>
            <p>Loading recent activity...</p>
          </div>
        ) : !stats?.recentAppointments || stats.recentAppointments.length === 0 ? (
          <div className="empty-state-box" style={{ padding: '2.5rem 1rem' }}>
            <span style={{ fontSize: '2.5rem' }}>📅</span>
            <h4>No Recent Appointments Found</h4>
            <p>You haven't scheduled any appointments yet. Click below to book your first session.</p>
            <button
              className="btn btn-primary"
              style={{ marginTop: '0.75rem' }}
              onClick={() => onTabChange('book')}
            >
              Book an Appointment
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Service</th>
                  <th>Provider</th>
                  <th>Appointment Time</th>
                  <th>Fee</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentAppointments.map((appt) => (
                  <tr key={appt.id}>
                    <td>
                      <span className="id-badge">#{appt.id}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{appt.serviceName || appt.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{appt.categoryName}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{appt.providerName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{appt.providerEmail}</div>
                    </td>
                    <td>{formatDateTime(appt.appointmentTime)}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#0f766e' }}>
                        ${appt.price ? Number(appt.price).toFixed(2) : '0.00'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge-status ${getStatusBadgeClass(appt.status)}`}>
                        {appt.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem' }}
                        onClick={() => onTabChange('appointments')}
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default CustomerOverviewView
