import React, { useState, useEffect, useCallback } from 'react'
import { getCustomerServices, getCustomerCategories } from '../../services/api'

export const CustomerServicesView = ({ onBookService }) => {
  const [services, setServices] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sortBy, setSortBy] = useState('price')
  const [sortDir, setSortDir] = useState('asc')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchCategories = async () => {
    try {
      const res = await getCustomerCategories()
      setCategories(res.data || [])
    } catch {
      // Non-critical if categories fail
    }
  }

  const fetchServices = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = {
        search: search.trim() || undefined,
        categoryId: selectedCategory || undefined,
        sortBy,
        sortDir,
      }
      const res = await getCustomerServices(params)
      setServices(res.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve available services')
    } finally {
      setLoading(false)
    }
  }, [search, selectedCategory, sortBy, sortDir])

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    fetchServices()
  }

  const handleResetFilters = () => {
    setSearch('')
    setSelectedCategory('')
    setSortBy('price')
    setSortDir('asc')
  }

  return (
    <div className="customer-services-container">
      {/* Header */}
      <div className="admin-view-header">
        <div>
          <h2>🩺 Browse Available Services</h2>
          <p>Explore healthcare, wellness, and consulting services offered by our verified specialists.</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="table-controls-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: '1 1 250px' }}>
          <input
            type="text"
            className="search-input"
            placeholder="Search by service name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%' }}
          />
          <button type="submit" className="btn btn-secondary">
            Search
          </button>
        </form>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <select
            className="filter-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={`${sortBy}-${sortDir}`}
            onChange={(e) => {
              const [sb, sd] = e.target.value.split('-')
              setSortBy(sb)
              setSortDir(sd)
            }}
          >
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name-asc">Name: A to Z</option>
            <option value="name-desc">Name: Z to A</option>
          </select>

          {(search || selectedCategory || sortBy !== 'price' || sortDir !== 'asc') && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleResetFilters}
              title="Reset all filters"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Services Grid */}
      {loading ? (
        <div className="loading-card" style={{ padding: '3rem' }}>
          <div className="spinner"></div>
          <p>Loading available services...</p>
        </div>
      ) : services.length === 0 ? (
        <div className="dash-card empty-state-box" style={{ padding: '3rem 1rem' }}>
          <span style={{ fontSize: '3rem' }}>🔍</span>
          <h3>No Services Found</h3>
          <p>We couldn't find any active services matching your search or filter criteria.</p>
          <button className="btn btn-outline" onClick={handleResetFilters}>
            Clear Filters
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {services.map((svc) => (
            <div
              key={svc.id}
              className="dash-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '1.25rem',
                backgroundColor: '#ffffff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span className="role-badge role-badge-customer" style={{ fontSize: '0.75rem' }}>
                    {svc.categoryName || 'General'}
                  </span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f766e' }}>
                    ${svc.price ? Number(svc.price).toFixed(2) : '0.00'}
                  </span>
                </div>

                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', color: '#0f172a' }}>
                  {svc.name}
                </h3>

                <p style={{ margin: '0 0 1rem 0', color: '#64748b', fontSize: '0.9rem', lineHeight: '1.45', minHeight: '40px' }}>
                  {svc.description || 'Professional consultation and dedicated specialist service.'}
                </p>
              </div>

              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.85rem',
                    color: '#475569',
                    marginBottom: '1rem',
                    paddingTop: '0.5rem',
                    borderTop: '1px solid #f1f5f9',
                  }}
                >
                  <span>⏱️ Duration:</span>
                  <strong>{svc.durationMinutes || 30} minutes</strong>
                </div>

                <button
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => onBookService && onBookService(svc)}
                >
                  📅 Book This Service
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CustomerServicesView
