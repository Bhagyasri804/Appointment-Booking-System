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

// Role-Protected APIs
export const getCustomerDashboard = async () => {
  const response = await apiClient.get('/api/customer/dashboard')
  return response.data
}

export const getProviderDashboard = async () => {
  const response = await apiClient.get('/api/provider/dashboard')
  return response.data
}

export const getAdminDashboard = async () => {
  const response = await apiClient.get('/api/admin/dashboard')
  return response.data
}

export const getAdminUsers = async () => {
  const response = await apiClient.get('/api/admin/users')
  return response.data
}

export default apiClient
