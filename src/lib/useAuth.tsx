import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

type UserProfile = { id:string, email:string, role:string } | null

type AuthContextValue = {
  user: any
  profile: UserProfile
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider: React.FC<{children:React.ReactNode}> = ({children}) =>{
  const [user,setUser] = useState<any>(null)
  const [profile,setProfile] = useState<UserProfile>(null)
  const [loading,setLoading] = useState(true)

  async function loadProfile(userId: string){
    const res = await supabase.from('users').select('id,email,role').eq('id', userId).single()
    if(res.data) setProfile(res.data as UserProfile)
    else setProfile(null)
  }

  useEffect(()=>{
    let mounted = true

    supabase.auth.getSession().then(async (r) => {
      if(!mounted) return
      const sessionUser = r.data.session?.user ?? null
      setUser(sessionUser)
      if(sessionUser) await loadProfile(sessionUser.id)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) =>{
      setUser(session?.user ?? null)
      if(session?.user?.id){
        loadProfile(session.user.id)
      } else {
        setProfile(null)
      }
    })

    return ()=>{
      mounted = false
      listener?.subscription.unsubscribe()
    }
  },[])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return <AuthContext.Provider value={{ user, profile, loading, signOut }}>{children}</AuthContext.Provider>
}

export const useAuth = ()=>{
  const ctx = useContext(AuthContext)
  if(!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
