import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'

export function ProtectedRoute({ allowedRoles, children }:{ allowedRoles: string[], children: React.ReactNode }){
  const { user, profile, loading } = useAuth()

  if(loading) return <div className="p-6 text-neutral-400">Loading…</div>
  if(!user) return <Navigate to="/login" replace />
  if(!profile) return <div className="p-6 text-neutral-400">Loading profile…</div>
  if(!allowedRoles.includes(profile.role)) return <div className="p-6 text-yellow-300">You do not have access to this page.</div>

  return <>{children}</>
}
