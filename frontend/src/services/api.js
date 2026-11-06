import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
})

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

export default apiClient
