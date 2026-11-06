import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const LoginPage = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const validate = () => {
    const errs = {}
    if (!formData.email.trim()) {
      errs.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Please enter a valid email address'
    }

    if (!formData.password) {
      errs.password = 'Password is required'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
    if (apiError) setApiError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setApiError('')

    try {
      const user = await login(formData)
      // Redirect to the originally intended route if present, or role dashboard
      const from = location.state?.from?.pathname
      if (from && from !== '/login') {
        navigate(from, { replace: true })
      } else {
        if (user.role === 'ADMIN') navigate('/admin/dashboard', { replace: true })
        else if (user.role === 'SERVICE_PROVIDER') navigate('/provider/dashboard', { replace: true })
        else navigate('/customer/dashboard', { replace: true })
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email or password. Please try again.'
      setApiError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const fillQuickCredentials = (email, password) => {
    setFormData({ email, password })
    setErrors({})
    setApiError('')
  }

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-card-header">
          <div className="auth-badge-icon">🔐</div>
          <h2>Welcome Back</h2>
          <p>Sign in to your Appointment Booking account</p>
        </div>

        {apiError && (
          <div className="alert alert-error" role="alert">
            <span className="alert-icon">⚠️</span>
            <span>{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              name="email"
              className={`form-input ${errors.email ? 'input-error' : ''}`}
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                className={`form-input ${errors.password ? 'input-error' : ''}`}
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="btn-toggle-password"
                onClick={() => setShowPassword((prev) => !prev)}
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label="Toggle password visibility"
              >
                {showPassword ? '👁️' : '🔒'}
              </button>
            </div>
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <button
            type="submit"
            className="btn-submit-auth"
            disabled={submitting}
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Demo Quick Fill Pills */}
        <div className="demo-credentials-box">
          <span className="demo-title">Quick Demo Login:</span>
          <div className="demo-buttons">
            <button
              type="button"
              className="btn-demo-chip"
              onClick={() => fillQuickCredentials('admin@appointment.com', 'Admin@123')}
            >
              Default Admin
            </button>
          </div>
        </div>

        <div className="auth-card-footer">
          Don't have an account? <Link to="/register">Create an account</Link>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
