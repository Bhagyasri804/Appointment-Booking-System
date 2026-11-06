import React, { useState, useEffect } from 'react'
import { getProviderProfile, updateProviderProfile } from '../../services/api'

export const ProviderProfileView = ({ onProfileUpdated }) => {
  const [profile, setProfile] = useState(null)
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    specialization: '',
    description: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editMode, setEditMode] = useState(false)

  const fetchProfile = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getProviderProfile()
      const data = res.data
      setProfile(data)
      setFormData({
        fullName: data.fullName || '',
        phoneNumber: data.phoneNumber || '',
        specialization: data.specialization || '',
        description: data.description || '',
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load provider profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    if (!formData.fullName.trim()) {
      setError('Full name is required')
      setSaving(false)
      return
    }

    try {
      const res = await updateProviderProfile(formData)
      setProfile(res.data)
      setSuccess('Profile updated successfully!')
      setEditMode(false)
      if (onProfileUpdated) {
        onProfileUpdated(res.data)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        phoneNumber: profile.phoneNumber || '',
        specialization: profile.specialization || '',
        description: profile.description || '',
      })
    }
    setEditMode(false)
    setError('')
  }

  if (loading) {
    return (
      <div className="admin-loading-container">
        <div className="spinner"></div>
        <p>Loading profile credentials...</p>
      </div>
    )
  }

  return (
    <div className="provider-profile-container">
      <div className="admin-view-header">
        <div>
          <h2>💼 Provider Profile &amp; Practice Details</h2>
          <p>Manage your public professional information, clinical specialization, and client bio.</p>
        </div>
        {!editMode && (
          <button className="btn btn-primary" onClick={() => setEditMode(true)}>
            ✏️ Edit Profile
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <span className="alert-icon">✅</span>
          <span>{success}</span>
        </div>
      )}

      <div className="provider-profile-grid">
        {/* Profile Summary Card */}
        <div className="admin-card provider-info-card">
          <div className="provider-avatar-box">
            <div className="provider-avatar-circle">
              {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : 'P'}
            </div>
            <h3 className="provider-display-name">{profile?.fullName}</h3>
            <span className="role-badge role-badge-provider">SERVICE PROVIDER</span>
            <p className="provider-display-spec">{profile?.specialization || 'General Specialist'}</p>
          </div>

          <hr className="divider" />

          <div className="provider-contact-list">
            <div className="contact-item">
              <span className="contact-icon">📧</span>
              <div>
                <span className="contact-label">Email Address</span>
                <span className="contact-val">{profile?.email}</span>
              </div>
            </div>

            <div className="contact-item">
              <span className="contact-icon">📞</span>
              <div>
                <span className="contact-label">Phone Number</span>
                <span className="contact-val">{profile?.phoneNumber || 'Not provided'}</span>
              </div>
            </div>

            <div className="contact-item">
              <span className="contact-icon">🛡️</span>
              <div>
                <span className="contact-label">Account Status</span>
                <span className="badge badge-success">
                  {profile?.enabled ? 'Active Verified Provider' : 'Suspended'}
                </span>
              </div>
            </div>

            <div className="contact-item">
              <span className="contact-icon">📅</span>
              <div>
                <span className="contact-label">Member Since</span>
                <span className="contact-val">
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Details & Form Card */}
        <div className="admin-card provider-form-card">
          <div className="card-header-bar">
            <h3>{editMode ? 'Edit Professional Details' : 'Professional Overview'}</h3>
            {editMode && <span className="badge badge-amber">Editing Mode</span>}
          </div>

          {!editMode ? (
            <div className="provider-view-details">
              <div className="detail-group">
                <label className="detail-label">Full Name</label>
                <div className="detail-val">{profile?.fullName}</div>
              </div>

              <div className="detail-group">
                <label className="detail-label">Clinical / Professional Specialization</label>
                <div className="detail-val">
                  {profile?.specialization || (
                    <em className="text-muted">No specialization configured. Click "Edit Profile" to set.</em>
                  )}
                </div>
              </div>

              <div className="detail-group">
                <label className="detail-label">Direct Phone Number</label>
                <div className="detail-val">
                  {profile?.phoneNumber || <em className="text-muted">None specified</em>}
                </div>
              </div>

              <div className="detail-group">
                <label className="detail-label">Provider Biography &amp; Practice Description</label>
                <div className="detail-val bio-box">
                  {profile?.description || (
                    <em className="text-muted">
                      Introduce yourself to prospective clients by providing an overview of your clinical background,
                      certifications, and experience.
                    </em>
                  )}
                </div>
              </div>

              <div className="detail-group" style={{ marginTop: '1.5rem' }}>
                <button className="btn btn-outline" onClick={() => setEditMode(true)}>
                  Modify Profile Details
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="provider-edit-form">
              <div className="form-group">
                <label className="form-label" htmlFor="fullName">
                  Full Name <span className="text-danger">*</span>
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  className="form-control"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  maxLength={120}
                  placeholder="e.g. Dr. Robert Provider"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="specialization">
                  Clinical / Professional Specialization
                </label>
                <input
                  id="specialization"
                  name="specialization"
                  type="text"
                  className="form-control"
                  value={formData.specialization}
                  onChange={handleChange}
                  maxLength={100}
                  placeholder="e.g. Cardiology & Preventive Care"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="phoneNumber">
                  Direct Phone Number
                </label>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="text"
                  className="form-control"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  maxLength={30}
                  placeholder="e.g. (555) 123-4567"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="description">
                  Provider Biography &amp; Practice Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  className="form-control"
                  value={formData.description}
                  onChange={handleChange}
                  maxLength={1000}
                  placeholder="Describe your qualifications, clinical specialties, and patient consultation approach..."
                />
                <span className="char-count">{formData.description.length}/1000 characters</span>
              </div>

              <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={handleCancel} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProviderProfileView
