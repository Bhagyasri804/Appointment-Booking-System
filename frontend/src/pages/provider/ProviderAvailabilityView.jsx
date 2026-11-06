import React, { useState, useEffect } from 'react'
import {
  getProviderAvailabilities,
  createProviderAvailability,
  updateProviderAvailability,
  deleteProviderAvailability,
} from '../../services/api'

const DAYS_OF_WEEK = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
]

export const ProviderAvailabilityView = () => {
  const [availabilities, setAvailabilities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSlot, setEditingSlot] = useState(null)
  const [deleteConfirmSlot, setDeleteConfirmSlot] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const [formData, setFormData] = useState({
    dayOfWeek: 'MONDAY',
    startTime: '09:00',
    endTime: '17:00',
    hasBreak: true,
    breakStartTime: '13:00',
    breakEndTime: '14:00',
    active: true,
  })

  const fetchAvailabilities = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getProviderAvailabilities()
      setAvailabilities(res.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load availability schedules')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAvailabilities()
  }, [])

  const handleOpenAddModal = (defaultDay = 'MONDAY') => {
    setEditingSlot(null)
    setFormData({
      dayOfWeek: defaultDay,
      startTime: '09:00',
      endTime: '17:00',
      hasBreak: true,
      breakStartTime: '13:00',
      breakEndTime: '14:00',
      active: true,
    })
    setFormError('')
    setModalOpen(true)
  }

  const handleOpenEditModal = (slot) => {
    setEditingSlot(slot)
    const hasBreak = Boolean(slot.breakStartTime && slot.breakEndTime)
    setFormData({
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime ? slot.startTime.substring(0, 5) : '09:00',
      endTime: slot.endTime ? slot.endTime.substring(0, 5) : '17:00',
      hasBreak: hasBreak,
      breakStartTime: slot.breakStartTime ? slot.breakStartTime.substring(0, 5) : '13:00',
      breakEndTime: slot.breakEndTime ? slot.breakEndTime.substring(0, 5) : '14:00',
      active: slot.active !== undefined ? slot.active : true,
    })
    setFormError('')
    setModalOpen(true)
  }

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const validateForm = () => {
    if (!formData.startTime || !formData.endTime) {
      return 'Start time and end time are required'
    }
    if (formData.startTime >= formData.endTime) {
      return 'End time must be later than start time'
    }
    if (formData.hasBreak) {
      if (!formData.breakStartTime || !formData.breakEndTime) {
        return 'Both break start and break end time must be specified'
      }
      if (formData.breakStartTime >= formData.breakEndTime) {
        return 'Break end time must be later than break start time'
      }
      if (formData.breakStartTime < formData.startTime || formData.breakEndTime > formData.endTime) {
        return `Break must fall within working hours (${formData.startTime} - ${formData.endTime})`
      }
    }
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    const clientErr = validateForm()
    if (clientErr) {
      setFormError(clientErr)
      return
    }

    const payload = {
      dayOfWeek: formData.dayOfWeek,
      startTime: formData.startTime,
      endTime: formData.endTime,
      breakStartTime: formData.hasBreak ? formData.breakStartTime : null,
      breakEndTime: formData.hasBreak ? formData.breakEndTime : null,
      active: formData.active,
    }

    setActionLoading(true)
    try {
      if (editingSlot) {
        await updateProviderAvailability(editingSlot.id, payload)
        setSuccess(`Updated schedule for ${formData.dayOfWeek} successfully!`)
      } else {
        await createProviderAvailability(payload)
        setSuccess(`Added new working hours for ${formData.dayOfWeek}!`)
      }
      setModalOpen(false)
      fetchAvailabilities()
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save availability schedule')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirmSlot) return
    setActionLoading(true)
    setError('')
    try {
      await deleteProviderAvailability(deleteConfirmSlot.id)
      setSuccess(`Removed schedule slot for ${deleteConfirmSlot.dayOfWeek}!`)
      setDeleteConfirmSlot(null)
      fetchAvailabilities()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete slot')
    } finally {
      setActionLoading(false)
    }
  }

  // Group slots by Day of Week
  const slotsByDay = DAYS_OF_WEEK.reduce((acc, day) => {
    acc[day] = availabilities.filter((a) => a.dayOfWeek === day)
    return acc
  }, {})

  return (
    <div className="provider-availability-container">
      <div className="admin-view-header">
        <div>
          <h2>⏰ Working Hours &amp; Availability Schedule</h2>
          <p>Configure your weekly consultation hours, scheduled break intervals, and active clinic days.</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenAddModal('MONDAY')}>
          ➕ Add Working Slot
        </button>
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

      {loading ? (
        <div className="admin-loading-container">
          <div className="spinner"></div>
          <p>Loading weekly schedule...</p>
        </div>
      ) : (
        <div className="provider-schedule-board">
          {DAYS_OF_WEEK.map((day) => {
            const daySlots = slotsByDay[day] || []
            const isConfigured = daySlots.length > 0

            return (
              <div key={day} className={`schedule-day-card ${isConfigured ? 'day-active' : 'day-off'}`}>
                <div className="day-card-header">
                  <div className="day-title-box">
                    <span className="day-name">{day}</span>
                    <span className={`badge ${isConfigured ? 'badge-success' : 'badge-neutral'}`}>
                      {isConfigured ? `${daySlots.length} Slot${daySlots.length > 1 ? 's' : ''}` : 'Off Day'}
                    </span>
                  </div>
                  <button
                    className="btn btn-xs btn-outline"
                    title={`Add slot for ${day}`}
                    onClick={() => handleOpenAddModal(day)}
                  >
                    + Add
                  </button>
                </div>

                <div className="day-slots-list">
                  {daySlots.length === 0 ? (
                    <div className="empty-day-state">
                      <span>No working hours set</span>
                    </div>
                  ) : (
                    daySlots.map((slot) => (
                      <div key={slot.id} className={`slot-item ${!slot.active ? 'slot-disabled' : ''}`}>
                        <div className="slot-hours">
                          <span className="slot-time">
                            🕒 {slot.startTime?.substring(0, 5)} - {slot.endTime?.substring(0, 5)}
                          </span>
                          {!slot.active && <span className="badge badge-warning">Inactive</span>}
                        </div>

                        {slot.breakStartTime && slot.breakEndTime && (
                          <div className="slot-break">
                            ☕ Break: {slot.breakStartTime.substring(0, 5)} - {slot.breakEndTime.substring(0, 5)}
                          </div>
                        )}

                        <div className="slot-actions">
                          <button
                            className="btn btn-xs btn-outline"
                            onClick={() => handleOpenEditModal(slot)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-xs btn-outline-danger"
                            onClick={() => setDeleteConfirmSlot(slot)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add / Edit Slot Modal */}
      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal-box modal-md">
            <div className="modal-header">
              <h3>{editingSlot ? '✏️ Edit Working Slot' : '➕ Add Working Hours Slot'}</h3>
              <button className="modal-close-btn" onClick={() => setModalOpen(false)}>
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              {formError && (
                <div className="alert alert-error">
                  <span className="alert-icon">⚠️</span>
                  <span>{formError}</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="dayOfWeek">
                  Day of the Week <span className="text-danger">*</span>
                </label>
                <select
                  id="dayOfWeek"
                  name="dayOfWeek"
                  className="form-control"
                  value={formData.dayOfWeek}
                  onChange={handleFormChange}
                  required
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="startTime">
                    Start Working Time <span className="text-danger">*</span>
                  </label>
                  <input
                    id="startTime"
                    name="startTime"
                    type="time"
                    className="form-control"
                    value={formData.startTime}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="endTime">
                    End Working Time <span className="text-danger">*</span>
                  </label>
                  <input
                    id="endTime"
                    name="endTime"
                    type="time"
                    className="form-control"
                    value={formData.endTime}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group checkbox-group" style={{ margin: '1rem 0 0.5rem 0' }}>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="hasBreak"
                    checked={formData.hasBreak}
                    onChange={handleFormChange}
                  />
                  <span>Schedule daily lunch / recess break during this slot</span>
                </label>
              </div>

              {formData.hasBreak && (
                <div className="form-row-2 break-time-box">
                  <div className="form-group">
                    <label className="form-label" htmlFor="breakStartTime">
                      Break Starts At
                    </label>
                    <input
                      id="breakStartTime"
                      name="breakStartTime"
                      type="time"
                      className="form-control"
                      value={formData.breakStartTime}
                      onChange={handleFormChange}
                      required={formData.hasBreak}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="breakEndTime">
                      Break Ends At
                    </label>
                    <input
                      id="breakEndTime"
                      name="breakEndTime"
                      type="time"
                      className="form-control"
                      value={formData.breakEndTime}
                      onChange={handleFormChange}
                      required={formData.hasBreak}
                    />
                  </div>
                </div>
              )}

              <div className="form-group checkbox-group" style={{ marginTop: '0.75rem' }}>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="active"
                    checked={formData.active}
                    onChange={handleFormChange}
                  />
                  <span>Slot is currently Active for client bookings</span>
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setModalOpen(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Saving Slot...' : editingSlot ? 'Update Slot' : 'Add Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmSlot && (
        <div className="modal-backdrop">
          <div className="modal-box modal-sm">
            <div className="modal-header">
              <h3>🗑️ Remove Availability Slot</h3>
              <button className="modal-close-btn" onClick={() => setDeleteConfirmSlot(null)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to remove the working slot on{' '}
                <strong>{deleteConfirmSlot.dayOfWeek}</strong> ({deleteConfirmSlot.startTime?.substring(0, 5)} -{' '}
                {deleteConfirmSlot.endTime?.substring(0, 5)})?
              </p>
              <p className="text-muted text-sm" style={{ marginTop: '0.5rem' }}>
                Existing confirmed appointments on this day will remain preserved.
              </p>
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-outline"
                onClick={() => setDeleteConfirmSlot(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={actionLoading}
              >
                {actionLoading ? 'Removing...' : 'Yes, Remove Slot'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProviderAvailabilityView
