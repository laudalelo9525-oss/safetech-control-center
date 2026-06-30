import React from 'react'
import AppRoutes from './AppRoutes'

export default function App(){
  return (
    <div className="min-h-screen bg-neutral-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-4">Safetech Control Center</h1>
      <AppRoutes />
    </div>
  )
}
