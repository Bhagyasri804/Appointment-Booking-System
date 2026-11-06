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

export default apiClient
