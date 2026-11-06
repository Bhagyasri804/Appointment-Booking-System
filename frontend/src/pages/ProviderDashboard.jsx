import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  getProviderOverview,
  getProviderProfile,
  getProviderUnreadCount,
} from '../services/api'
import ProviderOverviewView from './provider/ProviderOverviewView'
import ProviderProfileView from './provider/ProviderProfileView'
import ProviderAvailabilityView from './provider/ProviderAvailabilityView'
import ProviderAppointmentsView from './provider/ProviderAppointmentsView'
import ProviderCalendarView from './provider/ProviderCalendarView'
import ProviderNotificationsView from './provider/ProviderNotificationsView'

export const ProviderDashboard = () => {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [initialAppointmentStatus, setInitialAppointmentStatus] = useState('ALL')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [overview, setOverview] = useState(null)
  const [profile, setProfile] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [overviewRes, profileRes, unreadRes] = await Promise.all([
        getProviderOverview().catch(() => ({ data: null })),
        getProviderProfile().catch(() => ({ data: null })),
        getProviderUnreadCount().catch(() => ({ data: 0 })),
      ])
      setOverview(overviewRes.data)
      setProfile(profileRes.data)
      setUnreadCount(unreadRes.data || 0)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load provider telemetry')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const handleTabSwitch = (tab, subFilter = null) => {
    if (tab === 'appointments' && subFilter) {
      setInitialAppointmentStatus(subFilter)
    }
    setActiveTab(tab)
    setSidebarOpen(false)
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <ProviderOverviewView
            overview={overview}
            profile={profile || user}
            unreadCount={unreadCount}
            loading={loading}
            error={error}
            onTabChange={handleTabSwitch}
          />
        )
      case 'appointments':
        return (
          <ProviderAppointmentsView
            initialStatus={initialAppointmentStatus}
            onAppointmentAction={fetchDashboardData}
          />
        )
      case 'calendar':
        return <ProviderCalendarView />
      case 'availability':
        return <ProviderAvailabilityView />
      case 'profile':
        return (
          <ProviderProfileView
            onProfileUpdated={(updated) => {
              setProfile(updated)
              fetchDashboardData()
            }}
          />
        )
      case 'notifications':
        return (
          <ProviderNotificationsView
            onNotificationsUpdated={fetchDashboardData}
            onNavigateToAppointments={() => handleTabSwitch('appointments')}
          />
        )
      default:
        return (
          <ProviderOverviewView
            overview={overview}
            profile={profile || user}
            unreadCount={unreadCount}
            loading={loading}
            error={error}
            onTabChange={handleTabSwitch}
          />
        )
    }
  }

  return (
    <div className="admin-shell-layout">
      {/* Sidebar Navigation */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand-box">
          <div className="sidebar-logo-icon" style={{ background: 'linear-gradient(135deg, #0284c7, #0ea5e9)' }}>
            MD
          </div>
          <div>
            <div className="sidebar-title">Provider Console</div>
            <div className="sidebar-subtitle">Clinical Schedule</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`sidebar-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => handleTabSwitch('overview')}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-label">Practice Overview</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === 'appointments' ? 'active' : ''}`}
            onClick={() => handleTabSwitch('appointments')}
          >
            <span className="nav-icon">📋</span>
            <span className="nav-label">Appointments &amp; Requests</span>
            {overview?.pendingAppointments > 0 && (
              <span className="sidebar-pill-badge">{overview.pendingAppointments}</span>
            )}
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => handleTabSwitch('calendar')}
          >
            <span className="nav-icon">📅</span>
            <span className="nav-label">Appointment Calendar</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === 'availability' ? 'active' : ''}`}
            onClick={() => handleTabSwitch('availability')}
          >
            <span className="nav-icon">⏰</span>
            <span className="nav-label">Working Hours</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => handleTabSwitch('profile')}
          >
            <span className="nav-icon">💼</span>
            <span className="nav-label">Provider Profile</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => handleTabSwitch('notifications')}
          >
            <span className="nav-icon">🔔</span>
            <span className="nav-label">Notifications</span>
            {unreadCount > 0 && <span className="sidebar-pill-badge pill-amber">{unreadCount}</span>}
          </button>
        </nav>

        {/* Sidebar Footer User Info */}
        <div className="sidebar-footer">
          <div className="sidebar-user-avatar" style={{ background: '#0284c7' }}>
            {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : 'P'}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{profile?.fullName || user?.fullName || 'Provider'}</div>
            <div className="sidebar-user-role">
              {profile?.specialization || 'SERVICE_PROVIDER'}
            </div>
          </div>
          <button className="sidebar-logout-btn" onClick={logout} title="Sign Out">
            🚪
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="admin-main-wrapper">
        {/* Top Navbar */}
        <header className="admin-topbar">
          <div className="topbar-left">
            <button
              className="sidebar-mobile-toggle"
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-label="Toggle Navigation"
            >
              ☰
            </button>
            <span className="topbar-breadcrumb">
              Provider Portal &rsaquo;{' '}
              <strong>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</strong>
            </span>
          </div>

          <div className="topbar-right">
            <button
              className="topbar-action-btn"
              onClick={() => handleTabSwitch('notifications')}
              title="Notifications"
            >
              🔔
              {unreadCount > 0 && <span className="topbar-badge">{unreadCount}</span>}
            </button>

            <button
              className="topbar-action-btn"
              onClick={fetchDashboardData}
              title="Refresh Telemetry"
            >
              🔄
            </button>

            <div className="topbar-user-badge">
              <span className="role-badge role-badge-provider">SERVICE PROVIDER</span>
              <span className="topbar-user-name">{profile?.fullName || user?.fullName}</span>
            </div>
          </div>
        </header>

        {/* View Content */}
        <main className="admin-content-view">{renderActiveView()}</main>
      </div>

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  )
}

export default ProviderDashboard
