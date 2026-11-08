import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  getCustomerDashboard,
  getCustomerProfile,
  getCustomerUnreadCount,
} from '../services/api'
import CustomerOverviewView from './customer/CustomerOverviewView'
import CustomerServicesView from './customer/CustomerServicesView'
import CustomerProvidersView from './customer/CustomerProvidersView'
import CustomerBookAppointmentView from './customer/CustomerBookAppointmentView'
import CustomerAppointmentsView from './customer/CustomerAppointmentsView'
import CustomerHistoryView from './customer/CustomerHistoryView'
import CustomerNotificationsView from './customer/CustomerNotificationsView'
import CustomerProfileView from './customer/CustomerProfileView'

export const CustomerDashboard = () => {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [initialAppointmentStatus, setInitialAppointmentStatus] = useState('ALL')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Booking pre-selection state
  const [preSelectedService, setPreSelectedService] = useState(null)
  const [preSelectedProvider, setPreSelectedProvider] = useState(null)

  // Telemetry state
  const [dashboardStats, setDashboardStats] = useState(null)
  const [profile, setProfile] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [dashRes, profileRes, unreadRes] = await Promise.all([
        getCustomerDashboard().catch(() => ({ data: null })),
        getCustomerProfile().catch(() => ({ data: null })),
        getCustomerUnreadCount().catch(() => ({ data: 0 })),
      ])
      setDashboardStats(dashRes.data)
      setProfile(profileRes.data)
      setUnreadCount(unreadRes.data || 0)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load customer telemetry')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const handleTabSwitch = (tab, payload = null) => {
    if (tab === 'appointments' && typeof payload === 'string') {
      setInitialAppointmentStatus(payload)
    }
    setActiveTab(tab)
    setSidebarOpen(false)
  }

  const handleBookService = (service) => {
    setPreSelectedService(service)
    setActiveTab('book')
    setSidebarOpen(false)
  }

  const handleBookProvider = (provider) => {
    setPreSelectedProvider(provider)
    setActiveTab('book')
    setSidebarOpen(false)
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <CustomerOverviewView
            stats={dashboardStats}
            profile={profile || user}
            unreadCount={unreadCount}
            loading={loading}
            error={error}
            onTabChange={handleTabSwitch}
          />
        )
      case 'services':
        return <CustomerServicesView onBookService={handleBookService} />
      case 'providers':
        return <CustomerProvidersView onBookProvider={handleBookProvider} />
      case 'book':
        return (
          <CustomerBookAppointmentView
            initialService={preSelectedService}
            initialProvider={preSelectedProvider}
            onBookingSuccess={() => {
              fetchDashboardData()
              setPreSelectedService(null)
              setPreSelectedProvider(null)
            }}
            onNavigateAppointments={() => handleTabSwitch('appointments')}
          />
        )
      case 'appointments':
        return (
          <CustomerAppointmentsView
            initialStatus={initialAppointmentStatus}
            onAppointmentAction={fetchDashboardData}
            onBookNew={() => handleTabSwitch('book')}
          />
        )
      case 'history':
        return <CustomerHistoryView />
      case 'notifications':
        return (
          <CustomerNotificationsView
            onNotificationsUpdated={fetchDashboardData}
            onNavigateAppointments={() => handleTabSwitch('appointments')}
          />
        )
      case 'profile':
        return (
          <CustomerProfileView
            onProfileUpdated={(updated) => {
              setProfile(updated)
              fetchDashboardData()
            }}
          />
        )
      default:
        return (
          <CustomerOverviewView
            stats={dashboardStats}
            profile={profile || user}
            unreadCount={unreadCount}
            loading={loading}
            error={error}
            onTabChange={handleTabSwitch}
          />
        )
    }
  }

  const getTabLabel = (tabKey) => {
    switch (tabKey) {
      case 'overview':
        return 'Overview'
      case 'services':
        return 'Browse Services'
      case 'providers':
        return 'Find Providers'
      case 'book':
        return 'Book Appointment'
      case 'appointments':
        return 'My Appointments'
      case 'history':
        return 'Appointment History'
      case 'notifications':
        return 'Notifications'
      case 'profile':
        return 'My Profile'
      default:
        return 'Dashboard'
    }
  }

  return (
    <div className="admin-shell-layout">
      {/* Sidebar Navigation */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand-box">
          <div className="sidebar-logo-icon" style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
            CP
          </div>
          <div>
            <div className="sidebar-title">Customer Portal</div>
            <div className="sidebar-subtitle">Appointment Booking</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`sidebar-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => handleTabSwitch('overview')}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-label">Overview</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === 'services' ? 'active' : ''}`}
            onClick={() => handleTabSwitch('services')}
          >
            <span className="nav-icon">🩺</span>
            <span className="nav-label">Browse Services</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === 'providers' ? 'active' : ''}`}
            onClick={() => handleTabSwitch('providers')}
          >
            <span className="nav-icon">👨‍⚕️</span>
            <span className="nav-label">Find Providers</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === 'book' ? 'active' : ''}`}
            onClick={() => handleTabSwitch('book')}
          >
            <span className="nav-icon">📅</span>
            <span className="nav-label">Book Appointment</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === 'appointments' ? 'active' : ''}`}
            onClick={() => handleTabSwitch('appointments')}
          >
            <span className="nav-icon">📋</span>
            <span className="nav-label">My Appointments</span>
            {dashboardStats?.upcomingAppointments > 0 && (
              <span className="sidebar-pill-badge">{dashboardStats.upcomingAppointments}</span>
            )}
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => handleTabSwitch('history')}
          >
            <span className="nav-icon">📜</span>
            <span className="nav-label">Appointment History</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => handleTabSwitch('notifications')}
          >
            <span className="nav-icon">🔔</span>
            <span className="nav-label">Notifications</span>
            {unreadCount > 0 && <span className="sidebar-pill-badge pill-amber">{unreadCount}</span>}
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => handleTabSwitch('profile')}
          >
            <span className="nav-icon">👤</span>
            <span className="nav-label">My Profile</span>
          </button>
        </nav>

        {/* Sidebar Footer Customer Info */}
        <div className="sidebar-footer">
          <div className="sidebar-user-avatar" style={{ background: '#2563eb' }}>
            {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : 'C'}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{profile?.fullName || user?.fullName || 'Customer'}</div>
            <div className="sidebar-user-role">Customer Account</div>
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
              Customer Portal &rsaquo; <strong>{getTabLabel(activeTab)}</strong>
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
              title="Refresh Dashboard"
            >
              🔄
            </button>

            <div className="topbar-user-badge">
              <span className="role-badge role-badge-customer">CUSTOMER</span>
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

export default CustomerDashboard
