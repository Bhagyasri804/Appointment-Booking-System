import React, { useState, useEffect, useCallback } from 'react'
import { getCustomerProviders, getCustomerProviderAvailability } from '../../services/api'

export const CustomerProvidersView = ({ onBookProvider }) => {
  const [providers, setProviders] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Availability modal
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [availabilities, setAvailabilities] = useState([])
  const [availLoading, setAvailLoading] = useState(false)

  const fetchProviders = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getCustomerProviders({ search: search.trim() || undefined })
      setProviders(res.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve service providers')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    fetchProviders()
  }, [fetchProviders])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    fetchProviders()
  }

  const openAvailabilityModal = async (provider) => {
    setSelectedProvider(provider)
    setAvailLoading(true)
    try {
      const res = await getCustomerProviderAvailability(provider.id)
      setAvailabilities(res.data || [])
    } catch {
      setAvailabilities(provider.availabilities || [])
    } finally {
      setAvailLoading(false)
    }
  }

  const formatTime = (timeStr) => {
    if (!timeStr) return ''
    const [hh, mm] = timeStr.split(':')
    const hour = parseInt(hh, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const formattedHour = hour % 12 || 12
    return `${formattedHour}:${mm} ${ampm}`
  }

  return (
    <div className="customer-providers-container">
      {/* Header */}
      <div className="admin-view-header">
        <div>
          <h2>👨‍⚕️ Find Service Providers &amp; Specialists</h2>
          <p>Connect with licensed clinicians and certified consultants ready to assist you.</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="table-controls-bar" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: '1 1 300px' }}>
          <input
            type="text"
            className="search-input"
            placeholder="Search providers by doctor name, specialization, or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%' }}
          />
          <button type="submit" className="btn btn-secondary">
            Search
          </button>
        </form>
        {search && (
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setSearch('')}
          >
            Clear
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Providers Grid */}
      {loading ? (
        <div className="loading-card" style={{ padding: '3rem' }}>
          <div className="spinner"></div>
          <p>Finding available specialists...</p>
        </div>
      ) : providers.length === 0 ? (
        <div className="dash-card empty-state-box" style={{ padding: '3rem 1rem' }}>
          <span style={{ fontSize: '3rem' }}>🩺</span>
          <h3>No Providers Found</h3>
          <p>No service providers matched "{search}". Try searching by another specialty or name.</p>
          <button className="btn btn-outline" onClick={() => setSearch('')}>
            View All Providers
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {providers.map((p) => (
            <div
              key={p.id}
              className="dash-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '1.25rem',
                backgroundColor: '#ffffff',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.85rem' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #0284c7, #0ea5e9)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '1.2rem',
                    }}
                  >
                    {p.fullName ? p.fullName.charAt(0).toUpperCase() : 'P'}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a' }}>{p.fullName}</h3>
                    <span className="role-badge role-badge-provider" style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>
                      {p.specialization || 'Clinical Specialist'}
                    </span>
                  </div>
                </div>

                <p style={{ margin: '0 0 1rem 0', color: '#475569', fontSize: '0.88rem', lineHeight: '1.45', minHeight: '38px' }}>
                  {p.description || 'Experienced medical practitioner providing high quality patient-centered care.'}
                </p>

                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '0.75rem',
                    fontSize: '0.82rem',
                    marginBottom: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ color: '#64748b' }}>Email:</span>
                    <span style={{ fontWeight: 500, color: '#1e293b' }}>{p.email}</span>
                  </div>
                  {p.phoneNumber && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Phone:</span>
                      <span style={{ fontWeight: 500, color: '#1e293b' }}>{p.phoneNumber}</span>
                    </div>
                  )}
                </div>

                {/* Working Days Pill Tags */}
                <div style={{ marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>
                    📅 Working Schedule:
                  </span>
                  {p.availabilities && p.availabilities.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {p.availabilities.map((av, idx) => (
                        <span
                          key={idx}
                          style={{
                            backgroundColor: '#e0f2fe',
                            color: '#0369a1',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                          }}
                        >
                          {av.dayOfWeek.slice(0, 3)}: {formatTime(av.startTime)} - {formatTime(av.endTime)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Schedule updated dynamically</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => openAvailabilityModal(p)}
                >
                  🕒 Working Hours
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ flex: 1.2, justifyContent: 'center' }}
                  onClick={() => onBookProvider && onBookProvider(p)}
                >
                  📅 Book Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Provider Working Hours Modal */}
      {selectedProvider && (
        <div className="modal-backdrop">
          <div className="modal-box modal-md">
            <div className="modal-header">
              <h3>🕒 Working Hours Schedule &bull; {selectedProvider.fullName}</h3>
              <button className="modal-close-btn" onClick={() => setSelectedProvider(null)}>
                &times;
              </button>
            </div>

            <div style={{ padding: '1rem 0' }}>
              <p style={{ margin: '0 0 1rem 0', color: '#475569', fontSize: '0.9rem' }}>
                Standard clinic operating hours and rest intervals for <strong>{selectedProvider.fullName}</strong> (
                {selectedProvider.specialization || 'Clinical Specialist'}).
              </p>

              {availLoading ? (
                <div className="loading-card" style={{ padding: '2rem' }}>
                  <div className="spinner"></div>
                  <p>Loading schedule details...</p>
                </div>
              ) : availabilities.length === 0 ? (
                <div className="empty-state-box" style={{ padding: '2rem' }}>
                  <p>No regular weekly schedule configured for this specialist yet.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Day of Week</th>
                        <th>Operating Hours</th>
                        <th>Break Period</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {availabilities.map((av, index) => (
                        <tr key={index}>
                          <td style={{ fontWeight: 600 }}>{av.dayOfWeek}</td>
                          <td>
                            {formatTime(av.startTime)} &ndash; {formatTime(av.endTime)}
                          </td>
                          <td>
                            {av.breakStartTime && av.breakEndTime ? (
                              <span style={{ color: '#d97706' }}>
                                {formatTime(av.breakStartTime)} &ndash; {formatTime(av.breakEndTime)}
                              </span>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>None</span>
                            )}
                          </td>
                          <td>
                            <span className="badge-status badge-status-confirmed">Active</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setSelectedProvider(null)}>
                Close
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  const p = selectedProvider
                  setSelectedProvider(null)
                  if (onBookProvider) onBookProvider(p)
                }}
              >
                📅 Book Appointment With {selectedProvider.fullName.split(' ')[0]}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomerProvidersView
