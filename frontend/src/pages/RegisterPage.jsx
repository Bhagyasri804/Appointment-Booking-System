import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const RegisterPage = () => {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    role: 'CUSTOMER', // Default CUSTOMER
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const validate = () => {
    const errs = {}

    if (!formData.fullName.trim()) {
      errs.fullName = 'Full name is required'
    } else if (formData.fullName.trim().length < 2) {
      errs.fullName = 'Full name must be at least 2 characters'
    }

    if (!formData.email.trim()) {
      errs.email = 'Email address is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Please enter a valid email address'
    }

    if (!formData.password) {
      errs.password = 'Password is required'
    } else if (formData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters'
    }

    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match'
    }

    if (formData.role !== 'CUSTOMER' && formData.role !== 'SERVICE_PROVIDER') {
      errs.role = 'Please choose a valid role'
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

  const handleRoleSelect = (selectedRole) => {
    setFormData((prev) => ({ ...prev, role: selectedRole }))
    if (errors.role) setErrors((prev) => ({ ...prev, role: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setApiError('')

    try {
      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phoneNumber: formData.phoneNumber.trim() || null,
        role: formData.role,
      }

      const user = await register(payload)
      if (user.role === 'SERVICE_PROVIDER') {
        navigate('/provider/dashboard', { replace: true })
      } else {
        navigate('/customer/dashboard', { replace: true })
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Registration failed. Please check your details.'
      setApiError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page-container">
      <div className="auth-card auth-card-register">
        <div className="auth-card-header">
          <div className="auth-badge-icon">✨</div>
          <h2>Create Your Account</h2>
          <p>Join the Appointment Booking System platform</p>
        </div>

        {apiError && (
          <div className="alert alert-error" role="alert">
            <span className="alert-icon">⚠️</span>
            <span>{apiError}</span>
          </div>
        )}

        {/* Role Selection Tabs */}
        <div className="role-selection-group">
          <label className="form-label-role">Select Account Type:</label>
          <div className="role-pill-selector">
            <button
              type="button"
              className={`role-choice-pill ${formData.role === 'CUSTOMER' ? 'active' : ''}`}
              onClick={() => handleRoleSelect('CUSTOMER')}
            >
              <span className="role-choice-icon">👤</span>
              <div className="role-choice-info">
                <strong>Customer</strong>
                <small>Book and manage appointments</small>
              </div>
            </button>

            <button
              type="button"
              className={`role-choice-pill ${formData.role === 'SERVICE_PROVIDER' ? 'active' : ''}`}
              onClick={() => handleRoleSelect('SERVICE_PROVIDER')}
            >
              <span className="role-choice-icon">💼</span>
              <div className="role-choice-info">
                <strong>Service Provider</strong>
                <small>Offer services &amp; manage schedule</small>
              </div>
            </button>
          </div>
          {errors.role && <span className="field-error">{errors.role}</span>}
        </div>

        <form onSubmit={handleSubmit} noValidate className="auth-form">
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              type="text"
              name="fullName"
              className={`form-input ${errors.fullName ? 'input-error' : ''}`}
              placeholder="e.g. Jane Smith"
              value={formData.fullName}
              onChange={handleChange}
              autoComplete="name"
            />
            {errors.fullName && <span className="field-error">{errors.fullName}</span>}
          </div>

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
            <label htmlFor="phoneNumber">Phone Number (Optional)</label>
            <input
              id="phoneNumber"
              type="tel"
              name="phoneNumber"
              className="form-input"
              placeholder="e.g. +1 555-0123"
              value={formData.phoneNumber}
              onChange={handleChange}
              autoComplete="tel"
            />
          </div>

          <div className="form-row-two">
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className={`form-input ${errors.password ? 'input-error' : ''}`}
                  placeholder="Min. 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
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

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-input-wrapper">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  className={`form-input ${errors.confirmPassword ? 'input-error' : ''}`}
                  placeholder="Repeat password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="btn-toggle-password"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? '👁️' : '🔒'}
                </button>
              </div>
              {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
            </div>
          </div>

          <button
            type="submit"
            className="btn-submit-auth"
            disabled={submitting}
          >
            {submitting ? 'Creating account...' : `Sign Up as ${formData.role === 'SERVICE_PROVIDER' ? 'Provider' : 'Customer'}`}
          </button>
        </form>

        <div className="auth-card-footer">
          Already have an account? <Link to="/login">Sign in here</Link>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
