import React, { useState, useEffect } from 'react'
import {
  getProviderNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../services/api'

export const ProviderNotificationsView = ({ onNotificationsUpdated, onNavigateToAppointments }) => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchNotifications = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getProviderNotifications()
      setNotifications(res.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
      if (onNotificationsUpdated) onNotificationsUpdated()
    } catch (err) {
      console.error('Failed to mark notification read', err)
    }
  }

  const handleMarkAllRead = async () => {
    setActionLoading(true)
    try {
      await markAllNotificationsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      if (onNotificationsUpdated) onNotificationsUpdated()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark all as read')
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
    <div className="provider-notifications-container">
      <div className="admin-view-header">
        <div>
          <h2>🔔 Notifications &amp; System Alerts</h2>
          <p>Real-time updates regarding new booking requests, cancellations, and clinical schedule events.</p>
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
        <div className="admin-loading-container">
          <div className="spinner"></div>
          <p>Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="admin-empty-state">
          <div className="empty-icon">🔕</div>
          <h3>No notifications</h3>
          <p>You have no recent appointment alerts or system notices.</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((n) => (
            <div key={n.id} className={`notification-item ${!n.read ? 'notif-unread' : 'notif-read'}`}>
              <div className="notif-icon-col">
                <span className="notif-type-icon">{getTypeIcon(n.type)}</span>
              </div>
              <div className="notif-content-col">
                <div className="notif-header-line">
                  <h4 className="notif-title">{n.title}</h4>
                  <span className="notif-time">{formatTime(n.createdAt)}</span>
                </div>
                <p className="notif-message">{n.message}</p>
                <div className="notif-actions-line">
                  {n.relatedAppointmentId && onNavigateToAppointments && (
                    <button
                      className="btn btn-xs btn-outline"
                      onClick={() => onNavigateToAppointments()}
                    >
                      View Appointment #{n.relatedAppointmentId}
                    </button>
                  )}
                  {!n.read && (
                    <button
                      className="btn btn-xs btn-link"
                      onClick={() => handleMarkRead(n.id)}
                    >
                      Mark as read
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

export default ProviderNotificationsView
