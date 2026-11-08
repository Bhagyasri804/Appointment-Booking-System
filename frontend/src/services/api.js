import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to automatically attach JWT Bearer token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to catch unauthorized errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRequest = error.config?.url?.includes('/api/auth/login') || error.config?.url?.includes('/api/auth/register')
    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    return Promise.reject(error)
  }
)

// Health API
export const checkBackendHealth = async () => {
  try {
    const response = await apiClient.get('/api/health')
    return {
      success: true,
      data: response.data,
      status: response.status,
    }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Unable to connect to backend',
      status: error.response?.status || null,
    }
  }
}

// Authentication APIs
export const registerUser = async (userData) => {
  const response = await apiClient.post('/api/auth/register', userData)
  return response.data
}

export const loginUser = async (credentials) => {
  const response = await apiClient.post('/api/auth/login', credentials)
  return response.data
}

export const logoutUser = async () => {
  try {
    const response = await apiClient.post('/api/auth/logout')
    return response.data
  } catch {
    return { success: true, message: 'Logged out locally' }
  } finally {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
}

export const getCurrentUser = async () => {
  const response = await apiClient.get('/api/auth/me')
  return response.data
}

// Role-Protected Portals
export const getCustomerDashboard = async () => {
  const response = await apiClient.get('/api/customer/dashboard')
  return response.data
}

export const getProviderDashboard = async () => {
  const response = await apiClient.get('/api/provider/dashboard')
  return response.data
}

// Admin Dashboard & Overview APIs
export const getAdminStats = async () => {
  const response = await apiClient.get('/api/admin/dashboard/stats')
  return response.data
}

export const getAdminReports = async () => {
  const response = await apiClient.get('/api/admin/reports')
  return response.data
}

// Admin User Management APIs
export const getAdminUsersPaged = async (params = {}) => {
  const response = await apiClient.get('/api/admin/users', { params })
  return response.data
}

export const getAdminUserById = async (id) => {
  const response = await apiClient.get(`/api/admin/users/${id}`)
  return response.data
}

export const updateUserStatus = async (id, enabled) => {
  const response = await apiClient.put(`/api/admin/users/${id}/status`, { enabled })
  return response.data
}

// Admin Service Management APIs
export const getAdminServices = async (params = {}) => {
  const response = await apiClient.get('/api/admin/services', { params })
  return response.data
}

export const getAdminServiceById = async (id) => {
  const response = await apiClient.get(`/api/admin/services/${id}`)
  return response.data
}

export const createService = async (serviceData) => {
  const response = await apiClient.post('/api/admin/services', serviceData)
  return response.data
}

export const updateService = async (id, serviceData) => {
  const response = await apiClient.put(`/api/admin/services/${id}`, serviceData)
  return response.data
}

export const deleteService = async (id) => {
  const response = await apiClient.delete(`/api/admin/services/${id}`)
  return response.data
}

export const toggleServiceStatus = async (id, active) => {
  const response = await apiClient.put(`/api/admin/services/${id}/status`, null, {
    params: { active },
  })
  return response.data
}

// Admin Service Categories APIs
export const getAdminCategories = async () => {
  const response = await apiClient.get('/api/admin/categories')
  return response.data
}

export const createCategory = async (categoryData) => {
  const response = await apiClient.post('/api/admin/categories', categoryData)
  return response.data
}

// Admin Appointment Management APIs
export const getAdminAppointments = async (params = {}) => {
  const response = await apiClient.get('/api/admin/appointments', { params })
  return response.data
}

export const getAdminAppointmentById = async (id) => {
  const response = await apiClient.get(`/api/admin/appointments/${id}`)
  return response.data
}

export const cancelAppointment = async (id, reason) => {
  const response = await apiClient.put(`/api/admin/appointments/${id}/cancel`, { reason })
  return response.data
}

// ==========================================
// Service Provider Dashboard APIs
// ==========================================

// 1. Overview & Statistics
export const getProviderOverview = async () => {
  const response = await apiClient.get('/api/provider/overview')
  return response.data
}

// 2. Profile Management
export const getProviderProfile = async () => {
  const response = await apiClient.get('/api/provider/profile')
  return response.data
}

export const updateProviderProfile = async (profileData) => {
  const response = await apiClient.put('/api/provider/profile', profileData)
  return response.data
}

// 3. Availability Management
export const getProviderAvailabilities = async () => {
  const response = await apiClient.get('/api/provider/availability')
  return response.data
}

export const createProviderAvailability = async (availabilityData) => {
  const response = await apiClient.post('/api/provider/availability', availabilityData)
  return response.data
}

export const updateProviderAvailability = async (id, availabilityData) => {
  const response = await apiClient.put(`/api/provider/availability/${id}`, availabilityData)
  return response.data
}

export const deleteProviderAvailability = async (id) => {
  const response = await apiClient.delete(`/api/provider/availability/${id}`)
  return response.data
}

// 4. Appointment Management
export const getProviderAppointments = async (params = {}) => {
  const response = await apiClient.get('/api/provider/appointments', { params })
  return response.data
}

export const getProviderAppointmentById = async (id) => {
  const response = await apiClient.get(`/api/provider/appointments/${id}`)
  return response.data
}

export const confirmProviderAppointment = async (id) => {
  const response = await apiClient.put(`/api/provider/appointments/${id}/confirm`)
  return response.data
}

export const rejectProviderAppointment = async (id, reason) => {
  const response = await apiClient.put(`/api/provider/appointments/${id}/reject`, { reason })
  return response.data
}

export const completeProviderAppointment = async (id) => {
  const response = await apiClient.put(`/api/provider/appointments/${id}/complete`)
  return response.data
}

// 5. Calendar & Time Slots
export const getProviderCalendarDay = async (date) => {
  const response = await apiClient.get('/api/provider/calendar/day', { params: { date } })
  return response.data
}

export const getProviderCalendarAppointments = async (params = {}) => {
  const response = await apiClient.get('/api/provider/calendar/appointments', { params })
  return response.data
}

// 6. Notifications
export const getProviderNotifications = async () => {
  const response = await apiClient.get('/api/provider/notifications')
  return response.data
}

export const getProviderUnreadCount = async () => {
  const response = await apiClient.get('/api/provider/notifications/unread-count')
  return response.data
}

export const markNotificationRead = async (id) => {
  const response = await apiClient.put(`/api/provider/notifications/${id}/read`)
  return response.data
}

export const markAllNotificationsRead = async () => {
  const response = await apiClient.put('/api/provider/notifications/read-all')
  return response.data
}

// ==========================================
// Customer Dashboard APIs
// ==========================================

// 1. Services & Categories
export const getCustomerServices = async (params = {}) => {
  const response = await apiClient.get('/api/customer/services', { params })
  return response.data
}

export const getCustomerServiceById = async (id) => {
  const response = await apiClient.get(`/api/customer/services/${id}`)
  return response.data
}

export const getCustomerCategories = async () => {
  const response = await apiClient.get('/api/customer/categories')
  return response.data
}

// 2. Providers & Availability
export const getCustomerProviders = async (params = {}) => {
  const response = await apiClient.get('/api/customer/providers', { params })
  return response.data
}

export const getCustomerProviderById = async (id) => {
  const response = await apiClient.get(`/api/customer/providers/${id}`)
  return response.data
}

export const getCustomerProviderAvailability = async (id) => {
  const response = await apiClient.get(`/api/customer/providers/${id}/availability`)
  return response.data
}

export const getCustomerAvailableSlots = async (providerId, serviceId, date) => {
  const response = await apiClient.get('/api/customer/available-slots', {
    params: { providerId, serviceId, date },
  })
  return response.data
}

// 3. Appointment Booking & Management
export const bookCustomerAppointment = async (bookingData) => {
  const response = await apiClient.post('/api/customer/appointments', bookingData)
  return response.data
}

export const getCustomerAppointments = async (params = {}) => {
  const response = await apiClient.get('/api/customer/appointments', { params })
  return response.data
}

export const getCustomerAppointmentById = async (id) => {
  const response = await apiClient.get(`/api/customer/appointments/${id}`)
  return response.data
}

export const cancelCustomerAppointment = async (id, reason) => {
  const response = await apiClient.put(`/api/customer/appointments/${id}/cancel`, { reason })
  return response.data
}

export const rescheduleCustomerAppointment = async (id, rescheduleData) => {
  const response = await apiClient.put(`/api/customer/appointments/${id}/reschedule`, rescheduleData)
  return response.data
}

export const getCustomerAppointmentHistory = async (params = {}) => {
  const response = await apiClient.get('/api/customer/history', { params })
  return response.data
}

// 4. Profile Management
export const getCustomerProfile = async () => {
  const response = await apiClient.get('/api/customer/profile')
  return response.data
}

export const updateCustomerProfile = async (profileData) => {
  const response = await apiClient.put('/api/customer/profile', profileData)
  return response.data
}

// 5. Notifications
export const getCustomerNotifications = async () => {
  const response = await apiClient.get('/api/customer/notifications')
  return response.data
}

export const getCustomerUnreadCount = async () => {
  const response = await apiClient.get('/api/customer/notifications/unread-count')
  return response.data
}

export const markCustomerNotificationRead = async (id) => {
  const response = await apiClient.put(`/api/customer/notifications/${id}/read`)
  return response.data
}

export const markAllCustomerNotificationsRead = async () => {
  const response = await apiClient.put('/api/customer/notifications/read-all')
  return response.data
}

export default apiClient
