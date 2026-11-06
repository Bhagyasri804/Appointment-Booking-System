import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const UnauthorizedPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const getHomeOrDashboard = () => {
    if (!user) return '/login'
    if (user.role === 'ADMIN') return '/admin/dashboard'
    if (user.role === 'SERVICE_PROVIDER') return '/provider/dashboard'
    return '/customer/dashboard'
  }

  return (
    <div className="unauthorized-page-container">
      <div className="unauthorized-card">
        <div className="unauthorized-icon">🚫</div>
        <h1>403 - Access Forbidden</h1>
        <p className="unauthorized-desc">
          You do not have the required role or authorization to access this protected resource.
        </p>

        {user && (
          <div className="current-role-info">
            <span>Your current role is:</span>
            <strong className="role-badge role-badge-customer">{user.role}</strong>
          </div>
        )}

        <div className="unauthorized-actions">
          <button className="btn-back" onClick={() => navigate(getHomeOrDashboard())}>
            Go to My Dashboard
          </button>
          <Link to="/" className="link-home">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default UnauthorizedPage
