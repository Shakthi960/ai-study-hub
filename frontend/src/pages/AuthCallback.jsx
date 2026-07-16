import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/common/LoadingSpinner'

export default function AuthCallback() {
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    const timer = setTimeout(() => {
      if (user) {
        navigate('/', { replace: true })
      } else {
        navigate('/login', { replace: true })
      }
    }, 2000)
    return () => clearTimeout(timer)
  }, [user, navigate])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-gray-600 dark:text-gray-400">Completing sign in...</p>
    </div>
  )
}
