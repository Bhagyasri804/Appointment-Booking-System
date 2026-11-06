import React, { useState, useEffect, useCallback } from 'react'
import { checkBackendHealth } from './services/api'
import './App.css'

function App() {
  const [healthData, setHealthData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastChecked, setLastChecked] = useState(null)

  const fetchHealth = useCallback(async () => {
    setLoading(true)
    const result = await checkBackendHealth()
    setHealthData(result)
    setLastChecked(new Date().toLocaleTimeString())
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchHealth()
  }, [fetchHealth])

  const isConnected = healthData?.success && healthData?.data?.status === 'UP'
  const dbConnected = healthData?.data?.database?.status === 'CONNECTED'

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <header className="app-header">
        <div className="logo-area">
          <div className="logo-icon">AB</div>
          <span className="logo-text">Appointment Booking System</span>
        </div>
        <div>
          {loading ? (
            <span className="badge badge-loading">
              <span className="pulse-dot"></span> Checking backend...
            </span>
          ) : isConnected ? (
            <span className="badge badge-connected">
              <span className="pulse-dot"></span> Backend Connected
            </span>
          ) : (
            <span className="badge badge-disconnected">
              <span className="pulse-dot"></span> Backend Offline
            </span>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Hero Section */}
        <section className="hero-section">
          <h1 className="hero-title">Welcome to Appointment Booking System</h1>
          <p className="hero-subtitle">
            A full-stack modern appointment management solution powered by Java Spring Boot, React.js, and MySQL.
          </p>
        </section>

        {/* Backend & Database Connection Status Card */}
        <section className="status-card">
          <div className="status-header">
            <h2>System Health &amp; Diagnostics</h2>
            <button
              className="refresh-button"
              onClick={fetchHealth}
              disabled={loading}
            >
              {loading ? 'Checking...' : 'Refresh Status'}
            </button>
          </div>

          <div className="status-grid">
            <div className="status-item">
              <div className="status-label">Backend API Status</div>
              <div className="status-value">
                {loading
                  ? 'Verifying...'
                  : isConnected
                  ? `${healthData.data.status} (200 OK)`
                  : 'Offline / Unreachable'}
              </div>
            </div>

            <div className="status-item">
              <div className="status-label">Service Name</div>
              <div className="status-value">
                {healthData?.data?.service || 'appointment-booking-backend'}
              </div>
            </div>

            <div className="status-item">
              <div className="status-label">MySQL Database Status</div>
              <div className="status-value">
                {loading
                  ? 'Checking...'
                  : isConnected
                  ? (dbConnected ? 'CONNECTED (appointment_db)' : 'DISCONNECTED')
                  : 'Waiting for backend'}
              </div>
            </div>

            <div className="status-item">
              <div className="status-label">Last Checked</div>
              <div className="status-value">
                {lastChecked || 'Never'}
              </div>
            </div>
          </div>
        </section>

        {/* Platform Overview Features */}
        <section className="features-section">
          <h3>Upcoming Capabilities</h3>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📅</div>
              <h4 className="feature-title">Smart Scheduling</h4>
              <p className="feature-desc">
                Seamlessly browse available slots and schedule appointments with automated conflict avoidance.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h4 className="feature-title">Real-Time Availability</h4>
              <p className="feature-desc">
                Instant synchronization across time zones ensuring provider and client schedules align perfectly.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔔</div>
              <h4 className="feature-title">Automated Reminders</h4>
              <p className="feature-desc">
                Email and SMS notifications to minimize missed appointments and keep bookings on track.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        Appointment Booking System &copy; {new Date().getFullYear()} &bull; Initial Project Setup Verified
      </footer>
    </div>
  )
}

export default App
