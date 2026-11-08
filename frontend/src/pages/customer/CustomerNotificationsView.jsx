import React, { useState, useEffect, useCallback } from 'react'
import {
  getCustomerNotifications,
  markCustomerNotificationRead,
  markAllCustomerNotificationsRead,
} from '../../services/api'

export const CustomerNotificationsView = ({
  onNotificationsUpdated,
  onNavigateAppointments,
}) => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getCustomerNotifications()
      setNotifications(res.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const handleMarkRead = async (id) => {
    try {
      await markCustomerNotificationRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
      if (onNotificationsUpdated) onNotificationsUpdated()
    } catch {
      // Ignored
    }
  }

  const handleMarkAllRead = async () => {
    setActionLoading(true)
    try {
      await markAllCustomerNotificationsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      if (onNotificationsUpdated) onNotificationsUpdated()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark all notifications as read')
    } finally {
      setActionLoading(false)
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'APPOINTMENT_REQUEST':
        return '⏳'
      case 'APPOINTMENT_CONFIRMED':
        return '✅'
      case 'APPOINTMENT_CANCELLED':
        return '❌'
      case 'APPOINTMENT_COMPLETED':
        return '🎉'
      default:
        return '🔔'
    }
  }

  const formatTime = (iso) => {
    if (!iso) return ''
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="customer-notifications-container">
      <div className="admin-view-header">
        <div>
          <h2>🔔 Notifications &amp; Booking Alerts</h2>
          <p>Real-time updates regarding appointment requests, confirmations, cancellations, and reschedules.</p>
        </div>
        {unreadCount > 0 && (
          <button
            className="btn btn-outline"
            onClick={handleMarkAllRead}
            disabled={actionLoading}
          >
            Mark All as Read ({unreadCount})
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="loading-card" style={{ padding: '3rem' }}>
          <div className="spinner"></div>
          <p>Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="dash-card empty-state-box" style={{ padding: '3rem 1rem' }}>
          <span style={{ fontSize: '3rem' }}>🔕</span>
          <h3>No Notifications</h3>
          <p>You have no notifications or booking alerts at this time.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {notifications.map((n) => (
            <div
              key={n.id}
              className="dash-card"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                padding: '1rem 1.25rem',
                borderLeft: n.read ? '4px solid #cbd5e1' : '4px solid #0284c7',
                backgroundColor: n.read ? '#ffffff' : '#f0f9ff',
                transition: 'background-color 0.2s',
              }}
            >
              <div
                style={{
                  fontSize: '1.5rem',
                  lineHeight: 1,
                  padding: '0.5rem',
                  borderRadius: '8px',
                  backgroundColor: n.read ? '#f1f5f9' : '#e0f2fe',
                }}
              >
                {getTypeIcon(n.type)}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.98rem', color: '#0f172a', fontWeight: n.read ? 600 : 700 }}>
                    {n.title}
                  </h4>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                    {formatTime(n.createdAt)}
                  </span>
                </div>

                <p style={{ margin: '0 0 0.5rem 0', color: '#475569', fontSize: '0.88rem', lineHeight: '1.45' }}>
                  {n.message}
                </p>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {n.relatedAppointmentId && (
                    <button
                      className="btn btn-outline"
                      style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
                      onClick={() => onNavigateAppointments && onNavigateAppointments()}
                    >
                      View Appointment #{n.relatedAppointmentId}
                    </button>
                  )}
                  {!n.read && (
                    <button
                      className="btn btn-outline"
                      style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', borderColor: '#0284c7', color: '#0284c7' }}
                      onClick={() => handleMarkRead(n.id)}
                    >
                      Mark as Read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CustomerNotificationsView
