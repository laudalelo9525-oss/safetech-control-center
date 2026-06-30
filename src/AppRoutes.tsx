import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './lib/useAuth'
import NavBar from './components/NavBar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AdminPanel from './pages/AdminPanel'
import ControllerEntry from './pages/ControllerEntry'
import CsvImport from './pages/CsvImport'
import { ProtectedRoute } from './routes/ProtectedRoute'

export default function AppRoutes(){
  return (
    <AuthProvider>
      <BrowserRouter>
        <NavBar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["viewer","controller","admin"]}><Dashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminPanel /></ProtectedRoute>} />
          <Route path="/entry" element={<ProtectedRoute allowedRoles={["controller","admin"]}><ControllerEntry /></ProtectedRoute>} />
          <Route path="/import" element={<ProtectedRoute allowedRoles={["admin"]}><CsvImport /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
