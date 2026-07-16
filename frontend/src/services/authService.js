import api from './api'
import { supabase } from '../utils/supabase'

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  if (error) throw error
  return data
}

export async function handleAuthCallback() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

export async function syncUser(accessToken) {
  const res = await api.post('/auth/sync', { access_token: accessToken })
  return res.data
}

export async function getMe() {
  const res = await api.get('/auth/me')
  return res.data
}

export async function signOut() {
  await supabase.auth.signOut()
  localStorage.removeItem('access_token')
  localStorage.removeItem('user')
}
