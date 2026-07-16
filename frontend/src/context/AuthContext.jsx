import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../utils/supabase'
import { syncUser, signOut as apiSignOut } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })
  const [loading, setLoading] = useState(true)

  const handleSession = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        const result = await syncUser(session.access_token)
        localStorage.setItem('access_token', result.access_token)
        localStorage.setItem('user', JSON.stringify(result.user))
        setUser(result.user)
      }
    } catch (err) {
      console.error('Auth sync error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    handleSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === 'SIGNED_IN') {
          await handleSession()
        } else if (event === 'SIGNED_OUT') {
          localStorage.removeItem('access_token')
          localStorage.removeItem('user')
          setUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [handleSession])

  const logout = async () => {
    await apiSignOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
