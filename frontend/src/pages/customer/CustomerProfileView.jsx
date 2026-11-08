import React, { useState, useEffect } from 'react'
import { getCustomerProfile, updateCustomerProfile } from '../../services/api'

export const CustomerProfileView = ({ onProfileUpdated }) => {
  const [profile, setProfile] = useState(null)
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [description, setDescription] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await getCustomerProfile()
        const p = res.data
        setProfile(p)
        setFullName(p.fullName || '')
        setPhoneNumber(p.phoneNumber || '')
        setDescription(p.description || '')
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to retrieve customer profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!fullName.trim()) {
      setError('Full name is required.')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const payload = {
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        description: description.trim() || undefined,
      }
      const res = await updateCustomerProfile(payload)
      setProfile(res.data)
      setSuccess('Profile information updated successfully!')
      if (onProfileUpdated) onProfileUpdated(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const formatJoinDate = (iso) => {
    if (!iso) return 'N/A'
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="customer-profile-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="admin-view-header">
        <div>
          <h2>👤 My Customer Profile</h2>
          <p>Manage your account identity, contact information, and personal preferences.</p>
        </div>
      </div>

      {success && (
        <div className="alert alert-success" style={{ marginBottom: '1.25rem' }}>
          <span className="alert-icon">✅</span>
          <span>{success}</span>
          <button
            className="alert-close-btn"
            onClick={() => setSuccess('')}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            &times;
          </button>
        </div>
      )}

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
          <span className="alert-icon">⚠️</span>
          <span>{error}</span>
          <button
            className="alert-close-btn"
            onClick={() => setError('')}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            &times;
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading-card" style={{ padding: '3rem' }}>
          <div className="spinner"></div>
          <p>Loading profile information...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Profile Overview Card */}
          <div
            className="dash-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem',
              padding: '1.5rem',
              backgroundColor: '#ffffff',
            }}
          >
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.8rem',
                flexShrink: 0,
              }}
            >
              {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : 'C'}
            </div>

            <div>
              <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#0f172a' }}>{profile?.fullName}</h3>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.35rem' }}>
                <span className="role-badge role-badge-customer">CUSTOMER</span>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Account ID: #{profile?.id}</span>
              </div>
              <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                Member since {formatJoinDate(profile?.createdAt)}
              </p>
            </div>
          </div>

          {/* Edit Profile Form */}
          <div className="dash-card">
            <h3 className="dash-card-title">✏️ Edit Personal Information</h3>

            <form onSubmit={handleSubmit} className="modal-form">
              {/* Email (Read-Only) */}
              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  Registered Email Address <span style={{ fontSize: '0.75rem', color: '#64748b' }}>(Read-Only)</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="email"
                    type="email"
                    className="form-control"
                    value={profile?.email || ''}
                    disabled
                    style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#64748b' }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '0.9rem',
                    }}
                    title="Email is locked for account security"
                  >
                    🔒
                  </span>
                </div>
                <small style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
                  Registered email cannot be modified directly for security and audit purposes.
                </small>
              </div>

              {/* Full Name */}
              <div className="form-group">
                <label className="form-label" htmlFor="fullName">
                  Full Name <span className="text-danger">*</span>
                </label>
                <input
                  id="fullName"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Alice Smith"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  maxLength={120}
                />
              </div>

              {/* Phone Number */}
              <div className="form-group">
                <label className="form-label" htmlFor="phoneNumber">
                  Contact Phone Number
                </label>
                <input
                  id="phoneNumber"
                  type="tel"
                  className="form-control"
                  placeholder="e.g. +1 (555) 234-5678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  maxLength={30}
                />
              </div>

              {/* Description / Notes */}
              <div className="form-group">
                <label className="form-label" htmlFor="description">
                  Personal Preferences / Profile Description
                </label>
                <textarea
                  id="description"
                  className="form-control"
                  rows={4}
                  placeholder="Tell us about yourself, allergies, or preferred consultation methods (e.g. Virtual vs In-person)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={1000}
                />
                <small style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
                  {1000 - description.length} characters remaining
                </small>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                  style={{ minWidth: '140px', justifyContent: 'center' }}
                >
                  {saving ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomerProfileView
