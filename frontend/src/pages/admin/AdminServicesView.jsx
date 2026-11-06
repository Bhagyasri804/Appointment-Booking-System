import React, { useState, useEffect, useCallback } from 'react'
import {
  getAdminServices,
  createService,
  updateService,
  deleteService,
  toggleServiceStatus,
  getAdminCategories,
  createCategory,
} from '../../services/api'

export const AdminServicesView = () => {
  const [services, setServices] = useState([])
  const [categories, setCategories] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(0)
  const [pageSize] = useState(8)

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })

  // Modals state
  const [serviceModalOpen, setServiceModalOpen] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    categoryId: '',
    durationMinutes: 30,
    price: '',
    active: true,
  })
  const [serviceErrors, setServiceErrors] = useState({})

  // Category Modal State
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' })
  const [categoryErrors, setCategoryErrors] = useState({})

  // Delete Confirm State
  const [deleteConfirmService, setDeleteConfirmService] = useState(null)

  const fetchCategories = useCallback(async () => {
    try {
      const response = await getAdminCategories()
      setCategories(response.data || [])
    } catch {
      // Ignore initial category fetch error
    }
  }, [])

  const fetchServices = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        page,
        size: pageSize,
        search: search.trim() || undefined,
        categoryId: categoryFilter ? Number(categoryFilter) : undefined,
        active: statusFilter !== '' ? statusFilter === 'true' : undefined,
        sortBy: 'name',
        sortDir: 'asc',
      }
      const response = await getAdminServices(params)
      setServices(response.data.content || [])
      setTotalElements(response.data.totalElements || 0)
      setTotalPages(response.data.totalPages || 0)
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Failed to load services',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, categoryFilter, statusFilter])

  useEffect(() => {
    fetchCategories()
    fetchServices()
  }, [fetchCategories, fetchServices])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(0)
    fetchServices()
  }

  // Open Add Service
  const handleOpenAddService = () => {
    setEditingService(null)
    setServiceForm({
      name: '',
      description: '',
      categoryId: categories.length > 0 ? categories[0].id : '',
      durationMinutes: 30,
      price: '',
      active: true,
    })
    setServiceErrors({})
    setServiceModalOpen(true)
  }

  // Open Edit Service
  const handleOpenEditService = (service) => {
    setEditingService(service)
    setServiceForm({
      name: service.name,
      description: service.description || '',
      categoryId: service.categoryId,
      durationMinutes: service.durationMinutes,
      price: service.price,
      active: service.active,
    })
    setServiceErrors({})
    setServiceModalOpen(true)
  }

  // Validate Service
  const validateService = () => {
    const errs = {}
    if (!serviceForm.name.trim()) errs.name = 'Service name is required'
    if (!serviceForm.categoryId) errs.categoryId = 'Please select a category'
    if (!serviceForm.durationMinutes || serviceForm.durationMinutes < 5) errs.durationMinutes = 'Duration must be at least 5 minutes'
    if (!serviceForm.price || Number(serviceForm.price) < 0) errs.price = 'Valid price is required'
    setServiceErrors(errs)
    return Object.keys(errs).length === 0
  }

  // Save Service
  const handleSaveService = async (e) => {
    e.preventDefault()
    if (!validateService()) return

    setActionLoading(true)
    try {
      const payload = {
        name: serviceForm.name.trim(),
        description: serviceForm.description.trim() || null,
        categoryId: Number(serviceForm.categoryId),
        durationMinutes: Number(serviceForm.durationMinutes),
        price: Number(serviceForm.price),
        active: serviceForm.active,
      }

      if (editingService) {
        await updateService(editingService.id, payload)
        setMessage({ text: 'Service updated successfully!', type: 'success' })
      } else {
        await createService(payload)
        setMessage({ text: 'New service created successfully!', type: 'success' })
      }

      setServiceModalOpen(false)
      fetchServices()
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Failed to save service.',
        type: 'error',
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Toggle Service Active Switch
  const handleToggleActive = async (service) => {
    try {
      const nextActive = !service.active
      await toggleServiceStatus(service.id, nextActive)
      setServices((prev) =>
        prev.map((s) => (s.id === service.id ? { ...s, active: nextActive } : s))
      )
      setMessage({
        text: `Service "${service.name}" ${nextActive ? 'enabled' : 'disabled'} successfully.`,
        type: 'success',
      })
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Failed to change service status.',
        type: 'error',
      })
    }
  }

  // Delete Service
  const handleDeleteService = async () => {
    if (!deleteConfirmService) return
    setActionLoading(true)
    try {
      await deleteService(deleteConfirmService.id)
      setMessage({ text: `Service "${deleteConfirmService.name}" deleted successfully.`, type: 'success' })
      setDeleteConfirmService(null)
      fetchServices()
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Failed to delete service.',
        type: 'error',
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Create Category
  const handleSaveCategory = async (e) => {
    e.preventDefault()
    if (!categoryForm.name.trim()) {
      setCategoryErrors({ name: 'Category name is required' })
      return
    }

    setActionLoading(true)
    try {
      await createCategory({
        name: categoryForm.name.trim(),
        description: categoryForm.description.trim() || null,
        active: true,
      })
      setMessage({ text: 'Category created successfully!', type: 'success' })
      setCategoryModalOpen(false)
      setCategoryForm({ name: '', description: '' })
      fetchCategories()
    } catch (err) {
      setCategoryErrors({
        name: err.response?.data?.message || 'Failed to create category',
      })
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="admin-subview-container">
      {/* Subview Header with Action Buttons */}
      <div className="subview-header-row">
        <div>
          <h2>🛠️ Service Catalog Management</h2>
          <p className="subview-subtitle">Manage service offerings, categories, duration, and pricing</p>
        </div>
        <div className="subview-actions-right">
          <button className="btn-secondary-action" onClick={() => setCategoryModalOpen(true)}>
            📁 Add Category
          </button>
          <button className="btn-primary-action" onClick={handleOpenAddService}>
            ➕ Add Service
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}>
          <span>{message.type === 'error' ? '⚠️' : '✅'}</span>
          <span>{message.text}</span>
          <button className="alert-close-btn" onClick={() => setMessage({ text: '', type: '' })}>✕</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="filter-controls-card">
        <form onSubmit={handleSearchSubmit} className="search-form-row">
          <input
            type="text"
            className="filter-input search-input"
            placeholder="Search by service name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn-filter-search">
            🔍 Search
          </button>
        </form>

        <div className="filter-dropdowns-row">
          <select
            className="filter-select"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value)
              setPage(0)
            }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(0)
            }}
          >
            <option value="">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Services Table */}
      <div className="dash-card">
        {loading ? (
          <div className="loading-card">
            <div className="spinner"></div>
            <p>Loading services catalog...</p>
          </div>
        ) : services.length === 0 ? (
          <div className="empty-state-box">
            <span className="empty-icon">🛠️</span>
            <h3>No services found</h3>
            <p>Create a new service or adjust your category search filter.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Service ID</th>
                  <th>Service Name</th>
                  <th>Category</th>
                  <th>Duration</th>
                  <th>Price ($)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.id}>
                    <td>#{s.id}</td>
                    <td>
                      <div><strong>{s.name}</strong></div>
                      {s.description && <div className="table-desc-text">{s.description}</div>}
                    </td>
                    <td>
                      <span className="category-badge">{s.categoryName}</span>
                    </td>
                    <td>{s.durationMinutes} mins</td>
                    <td>
                      <strong className="price-tag">${Number(s.price).toFixed(2)}</strong>
                    </td>
                    <td>
                      <label className="toggle-switch-container">
                        <input
                          type="checkbox"
                          checked={s.active}
                          onChange={() => handleToggleActive(s)}
                        />
                        <span className="toggle-slider"></span>
                        <span className="toggle-label-text">
                          {s.active ? 'Active' : 'Inactive'}
                        </span>
                      </label>
                    </td>
                    <td>
                      <div className="table-actions-cell">
                        <button
                          className="btn-action-edit"
                          onClick={() => handleOpenEditService(s)}
                          title="Edit Service"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="btn-action-delete"
                          onClick={() => setDeleteConfirmService(s)}
                          title="Delete Service"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="pagination-bar">
            <button
              className="pagination-btn"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(p - 1, 0))}
            >
              &larr; Previous
            </button>
            <span className="pagination-info">
              Page <strong>{page + 1}</strong> of <strong>{totalPages}</strong>
            </span>
            <button
              className="pagination-btn"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
            >
              Next &rarr;
            </button>
          </div>
        )}
      </div>

      {/* Modal: Add/Edit Service */}
      {serviceModalOpen && (
        <div className="modal-backdrop" onClick={() => setServiceModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingService ? '✏️ Edit Service Offering' : '➕ Add New Service Offering'}</h3>
              <button className="modal-close-btn" onClick={() => setServiceModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveService}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="service-name">Service Name *</label>
                  <input
                    id="service-name"
                    type="text"
                    className={`form-input ${serviceErrors.name ? 'input-error' : ''}`}
                    placeholder="e.g. Comprehensive Dental Exam"
                    value={serviceForm.name}
                    onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  />
                  {serviceErrors.name && <span className="field-error">{serviceErrors.name}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="service-category">Category *</label>
                  <select
                    id="service-category"
                    className={`form-input ${serviceErrors.categoryId ? 'input-error' : ''}`}
                    value={serviceForm.categoryId}
                    onChange={(e) => setServiceForm({ ...serviceForm, categoryId: e.target.value })}
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {serviceErrors.categoryId && <span className="field-error">{serviceErrors.categoryId}</span>}
                </div>

                <div className="form-row-two">
                  <div className="form-group">
                    <label htmlFor="service-duration">Duration (Minutes) *</label>
                    <input
                      id="service-duration"
                      type="number"
                      min="5"
                      step="5"
                      className={`form-input ${serviceErrors.durationMinutes ? 'input-error' : ''}`}
                      placeholder="e.g. 45"
                      value={serviceForm.durationMinutes}
                      onChange={(e) => setServiceForm({ ...serviceForm, durationMinutes: e.target.value })}
                    />
                    {serviceErrors.durationMinutes && (
                      <span className="field-error">{serviceErrors.durationMinutes}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="service-price">Price ($ USD) *</label>
                    <input
                      id="service-price"
                      type="number"
                      min="0"
                      step="0.01"
                      className={`form-input ${serviceErrors.price ? 'input-error' : ''}`}
                      placeholder="e.g. 75.00"
                      value={serviceForm.price}
                      onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                    />
                    {serviceErrors.price && <span className="field-error">{serviceErrors.price}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="service-desc">Description (Optional)</label>
                  <textarea
                    id="service-desc"
                    rows="3"
                    className="form-input"
                    placeholder="Provide details about what this service entails..."
                    value={serviceForm.description}
                    onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={serviceForm.active}
                      onChange={(e) => setServiceForm({ ...serviceForm, active: e.target.checked })}
                    />
                    <span>Service is active and open for booking</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setServiceModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-confirm btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Saving...' : editingService ? 'Update Service' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Category */}
      {categoryModalOpen && (
        <div className="modal-backdrop" onClick={() => setCategoryModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📁 Add Service Category</h3>
              <button className="modal-close-btn" onClick={() => setCategoryModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveCategory}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="cat-name">Category Name *</label>
                  <input
                    id="cat-name"
                    type="text"
                    className={`form-input ${categoryErrors.name ? 'input-error' : ''}`}
                    placeholder="e.g. Dermatology"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  />
                  {categoryErrors.name && <span className="field-error">{categoryErrors.name}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="cat-desc">Description (Optional)</label>
                  <textarea
                    id="cat-desc"
                    rows="2"
                    className="form-input"
                    placeholder="Brief description of category services..."
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setCategoryModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-confirm btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete Service */}
      {deleteConfirmService && (
        <div className="modal-backdrop" onClick={() => setDeleteConfirmService(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🗑️ Confirm Delete Service</h3>
              <button className="modal-close-btn" onClick={() => setDeleteConfirmService(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete service:
              </p>
              <div className="confirm-target-box">
                <div><strong>{deleteConfirmService.name}</strong></div>
                <div className="sub-text">Category: {deleteConfirmService.categoryName} &bull; ${Number(deleteConfirmService.price).toFixed(2)}</div>
              </div>
              <p className="warning-text">
                This service offering will be removed from the catalog.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-modal-cancel" onClick={() => setDeleteConfirmService(null)}>
                Cancel
              </button>
              <button
                className="btn-modal-confirm btn-danger"
                onClick={handleDeleteService}
                disabled={actionLoading}
              >
                {actionLoading ? 'Deleting...' : 'Delete Service'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminServicesView
