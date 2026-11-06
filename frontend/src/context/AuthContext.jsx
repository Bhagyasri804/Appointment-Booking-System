import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { loginUser, registerUser, logoutUser, getCurrentUser } from '../services/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user')
      return savedUser ? JSON.parse(savedUser) : null
    } catch {
      return null
    }
  })
  const [token, setToken] = useState(() => localStorage.getItem('token') || null)
  const [loading, setLoading] = useState(true)

  // Hydrate user info on startup if token is stored
  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('token')
      if (savedToken) {
        try {
          const profile = await getCurrentUser()
          setUser(profile)
          localStorage.setItem('user', JSON.stringify(profile))
        } catch {
          // Token is expired or invalid
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setUser(null)
          setToken(null)
        }
      }
      setLoading(false)
    }

    initializeAuth()
  }, [])

  const login = useCallback(async (credentials) => {
    const authData = await loginUser(credentials)
    setToken(authData.token)
    localStorage.setItem('token', authData.token)

    const userInfo = {
      id: authData.id,
      fullName: authData.fullName,
      email: authData.email,
      role: authData.role,
    }
    setUser(userInfo)
    localStorage.setItem('user', JSON.stringify(userInfo))
    return userInfo
  }, [])

  const register = useCallback(async (userData) => {
    const authData = await registerUser(userData)
    setToken(authData.token)
    localStorage.setItem('token', authData.token)

    const userInfo = {
      id: authData.id,
      fullName: authData.fullName,
      email: authData.email,
      role: authData.role,
    }
    setUser(userInfo)
    localStorage.setItem('user', JSON.stringify(userInfo))
    return userInfo
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutUser()
    } finally {
      setUser(null)
      setToken(null)
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }, [])

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    role: user?.role || null,
    loading,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
