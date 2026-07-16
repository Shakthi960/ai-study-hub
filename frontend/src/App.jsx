import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/common/Navbar'
import LoadingSpinner from './components/common/LoadingSpinner'
import ErrorBoundary from './components/common/ErrorBoundary'
import LoginPage from './pages/LoginPage'
import AuthCallback from './pages/AuthCallback'
import HomePage from './pages/HomePage'
import ChapterPage from './pages/ChapterPage'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner fullScreen />
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { loading } = useAuth()

  if (loading) return <LoadingSpinner fullScreen />

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 dark:bg-[#1b2021] overflow-x-hidden">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Navbar />
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/chapter/:chapterId" element={<ChapterPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </ErrorBoundary>
  )
}
