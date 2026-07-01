import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function Login(){
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [loading,setLoading] = useState(false)
  const [error,setError] = useState<string|undefined>(undefined)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) =>{
    e.preventDefault()
    setLoading(true)
    setError(undefined)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if(error){
      setError(error.message)
      setLoading(false)
      return
    }
    setLoading(false)
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-neutral-800 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Sign in</h2>
      <form onSubmit={handleLogin} className="space-y-4">
        <label className="block">
          <span className="text-sm text-neutral-300">Email</span>
          <input className="w-full mt-1 p-2 rounded bg-neutral-900" value={email} onChange={e=>setEmail(e.target.value)} />
        </label>
        <label className="block">
          <span className="text-sm text-neutral-300">Password</span>
          <input type="password" className="w-full mt-1 p-2 rounded bg-neutral-900" value={password} onChange={e=>setPassword(e.target.value)} />
        </label>
        {error && <div className="text-red-400">{error}</div>}
        <button className="w-full bg-red-600 py-2 rounded" disabled={loading}>{loading? 'Signing in...' : 'Sign in'}</button>
      </form>
    </div>
  )
}
