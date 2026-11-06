import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import CustomerDashboard from './pages/CustomerDashboard'
import ProviderDashboard from './pages/ProviderDashboard'
import AdminDashboard from './pages/AdminDashboard'
import UnauthorizedPage from './pages/UnauthorizedPage'
import './App.css'

function AppContent() {
  const [backendHealthy, setBackendHealthy] = useState(true)

  return (
    <div className="app-container">
      <Navbar backendHealthy={backendHealthy} />
      <main className="main-content">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home onHealthUpdate={setBackendHealthy} />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Protected Customer Routes */}
          <Route
            path="/customer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected Provider Routes */}
          <Route
            path="/provider/dashboard"
            element={
              <ProtectedRoute allowedRoles={['SERVICE_PROVIDER']}>
                <ProviderDashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="app-footer">
        Appointment Booking System &copy; {new Date().getFullYear()} &bull; Feature 2: Authentication &amp; RBAC Active
      </footer>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
