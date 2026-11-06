import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { checkBackendHealth } from '../services/api'

export const Home = ({ onHealthUpdate }) => {
  const { user, isAuthenticated } = useAuth()
  const [healthData, setHealthData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastChecked, setLastChecked] = useState(null)

  const fetchHealth = useCallback(async () => {
    setLoading(true)
    const result = await checkBackendHealth()
    setHealthData(result)
    setLastChecked(new Date().toLocaleTimeString())
    setLoading(false)
    if (onHealthUpdate) {
      onHealthUpdate(result?.success && result?.data?.status === 'UP')
    }
  }, [onHealthUpdate])

  useEffect(() => {
    fetchHealth()
  }, [fetchHealth])

  const isConnected = healthData?.success && healthData?.data?.status === 'UP'
  const dbConnected = healthData?.data?.database?.status === 'CONNECTED'

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <h1 className="hero-title">Appointment Booking System</h1>
        <p className="hero-subtitle">
          Secure, enterprise-grade appointment management with Role-Based Access Control, JWT authentication, and real-time scheduling.
        </p>

        <div className="hero-cta-buttons">
          {isAuthenticated ? (
            <Link
              to={
                user?.role === 'ADMIN'
                  ? '/admin/dashboard'
                  : user?.role === 'SERVICE_PROVIDER'
                  ? '/provider/dashboard'
                  : '/customer/dashboard'
              }
              className="btn-hero-primary"
            >
              Open Your Dashboard ({user?.role}) &rarr;
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn-hero-primary">
                Get Started &rarr;
              </Link>
              <Link to="/login" className="btn-hero-secondary">
                Sign In
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Backend & Database Connection Diagnostics Card */}
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
            <div className="status-label">Security &amp; Auth</div>
            <div className="status-value">
              JWT &amp; RBAC Active
            </div>
          </div>
        </div>
      </section>

      {/* Roles & Features Overview */}
      <section className="features-section">
        <h3>Role-Based Access Architecture</h3>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">👤</div>
            <h4 className="feature-title">Customer Role</h4>
            <p className="feature-desc">
              Customers can register publicly, authenticate securely with JWT, browse services, and manage their personal bookings.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">💼</div>
            <h4 className="feature-title">Service Provider Role</h4>
            <p className="feature-desc">
              Service Providers can register publicly, manage service catalogs, configure working availability, and review appointments.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🛡️</div>
            <h4 className="feature-title">Admin Role</h4>
            <p className="feature-desc">
              Privileged role initialized automatically upon startup. Governs user accounts, audits logs, and system health.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
