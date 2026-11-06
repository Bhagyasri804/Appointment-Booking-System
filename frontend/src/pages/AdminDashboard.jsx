import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { getAdminStats, getAdminReports } from '../services/api'
import AdminOverviewView from './admin/AdminOverviewView'
import AdminUsersView from './admin/AdminUsersView'
import AdminServicesView from './admin/AdminServicesView'
import AdminAppointmentsView from './admin/AdminAppointmentsView'
import AdminReportsView from './admin/AdminReportsView'

export const AdminDashboard = () => {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [stats, setStats] = useState(null)
  const [reports, setReports] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchOverviewData = useCallback(async () => {
    setLoading(true)
    try {
      const [statsRes, reportsRes] = await Promise.all([
        getAdminStats(),
        getAdminReports(),
      ])
      setStats(statsRes.data)
      setReports(reportsRes.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load administrator telemetry')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOverviewData()
  }, [fetchOverviewData])

  const renderActiveView = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <AdminOverviewView
            stats={stats}
            reports={reports}
            loading={loading}
            onTabChange={(tab) => setActiveTab(tab)}
          />
        )
      case 'users':
        return <AdminUsersView />
      case 'services':
        return <AdminServicesView />
      case 'appointments':
        return <AdminAppointmentsView />
      case 'reports':
        return <AdminReportsView />
      default:
        return (
          <AdminOverviewView
            stats={stats}
            reports={reports}
            loading={loading}
            onTabChange={(tab) => setActiveTab(tab)}
          />
        )
    }
  }

  return (
    <div className="admin-shell-layout">
      {/* Sidebar Navigation */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand-box">
          <div className="sidebar-logo-icon">AB</div>
          <div>
            <div className="sidebar-title">Appointment Admin</div>
            <div className="sidebar-subtitle">Command Console</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`sidebar-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('overview')
              setSidebarOpen(false)
            }}
          >
            <span className="sidebar-icon">📊</span>
            <span>Dashboard Overview</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('users')
              setSidebarOpen(false)
            }}
          >
            <span className="sidebar-icon">👥</span>
            <span>User Management</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === 'services' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('services')
              setSidebarOpen(false)
            }}
          >
            <span className="sidebar-icon">🛠️</span>
            <span>Service Catalog</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === 'appointments' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('appointments')
              setSidebarOpen(false)
            }}
          >
            <span className="sidebar-icon">📅</span>
            <span>Appointments</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('reports')
              setSidebarOpen(false)
            }}
          >
            <span className="sidebar-icon">📈</span>
            <span>Reports &amp; Analytics</span>
          </button>
        </nav>

        {/* Sidebar Footer User Info */}
        <div className="sidebar-footer">
          <div className="sidebar-admin-info">
            <span className="admin-avatar">👑</span>
            <div className="admin-text">
              <div className="admin-name">{user?.fullName || 'Administrator'}</div>
              <div className="admin-email">{user?.email}</div>
            </div>
          </div>
          <button className="sidebar-logout-btn" onClick={logout} title="Log Out">
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main Admin Content Area */}
      <div className="admin-main-wrap">
        {/* Top Navbar */}
        <header className="admin-topbar">
          <div className="topbar-left">
            <button
              className="btn-mobile-sidebar-toggle"
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-label="Toggle Navigation Sidebar"
            >
              ☰
            </button>
            <div className="topbar-breadcrumbs">
              <span>Admin Console</span>
              <span className="bc-sep">&rsaquo;</span>
              <strong className="bc-current">
                {activeTab === 'overview' && 'Dashboard Overview'}
                {activeTab === 'users' && 'User Management'}
                {activeTab === 'services' && 'Service Catalog Management'}
                {activeTab === 'appointments' && 'Appointment Management'}
                {activeTab === 'reports' && 'Reports & Analytics'}
              </strong>
            </div>
          </div>

          <div className="topbar-right">
            <span className="role-badge role-badge-admin">ADMINISTRATOR</span>
            <button
              className="btn-refresh-stats"
              onClick={fetchOverviewData}
              title="Refresh Telemetry"
              disabled={loading}
            >
              🔄 Refresh
            </button>
          </div>
        </header>

        {error && (
          <div className="alert alert-error" style={{ margin: '1rem 1.5rem 0' }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Dynamic Subview */}
        <main className="admin-content-canvas">
          {renderActiveView()}
        </main>
      </div>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="sidebar-mobile-backdrop" onClick={() => setSidebarOpen(false)}></div>
      )}
    </div>
  )
}

export default AdminDashboard
