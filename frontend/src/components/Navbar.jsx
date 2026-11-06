import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const Navbar = ({ backendHealthy }) => {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const getDashboardPath = () => {
    if (!user) return '/'
    switch (user.role) {
      case 'ADMIN':
        return '/admin/dashboard'
      case 'SERVICE_PROVIDER':
        return '/provider/dashboard'
      case 'CUSTOMER':
        return '/customer/dashboard'
      default:
        return '/'
    }
  }

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'role-badge-admin'
      case 'SERVICE_PROVIDER':
        return 'role-badge-provider'
      case 'CUSTOMER':
        return 'role-badge-customer'
      default:
        return ''
    }
  }

  return (
    <header className="app-header">
      <div className="header-left">
        <Link to="/" className="logo-area">
          <div className="logo-icon">AB</div>
          <span className="logo-text">Appointment Booking</span>
        </Link>

        {/* Backend health pulse indicator */}
        <span
          className={`health-pill ${backendHealthy ? 'health-pill-up' : 'health-pill-down'}`}
          title={backendHealthy ? 'Backend API Connected' : 'Backend API Offline'}
        >
          <span className="pulse-dot"></span>
          {backendHealthy ? 'API Online' : 'API Offline'}
        </span>
      </div>

      <nav className="header-nav">
        <Link to="/" className="nav-link">Home</Link>

        {isAuthenticated ? (
          <>
            <Link to={getDashboardPath()} className="nav-link nav-link-active">
              Dashboard
            </Link>
            <div className="user-profile-badge">
              <span className="user-name">{user.fullName}</span>
              <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                {user.role}
              </span>
            </div>
            <button onClick={handleLogout} className="btn-logout">
              Log Out
            </button>
          </>
        ) : (
          <div className="auth-nav-buttons">
            <Link to="/login" className="btn-nav-login">
              Log In
            </Link>
            <Link to="/register" className="btn-nav-register">
              Sign Up
            </Link>
          </div>
        )}
      </nav>
    </header>
  )
}

export default Navbar
