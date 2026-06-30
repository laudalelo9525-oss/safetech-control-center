import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'

export default function NavBar(){
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  if(!user || !profile) return null

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <nav className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-2">
      <div className="flex items-center gap-4">
        <Link to="/dashboard" className="text-sm text-neutral-300 hover:text-white">Dashboard</Link>
        {(profile.role === 'controller' || profile.role === 'admin') && (
          <Link to="/entry" className="text-sm text-neutral-300 hover:text-white">Entry</Link>
        )}
        {profile.role === 'admin' && (
          <>
            <Link to="/admin" className="text-sm text-neutral-300 hover:text-white">Admin</Link>
            <Link to="/import" className="text-sm text-neutral-300 hover:text-white">Import</Link>
          </>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-neutral-500">{profile.email} · {profile.role}</span>
        <button onClick={handleSignOut} className="text-xs bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 rounded">
          Sign out
        </button>
      </div>
    </nav>
  )
}
