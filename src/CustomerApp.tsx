import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { useAuth } from '@/contexts/AuthContext'

const LoginPage = lazy(() => import('@/pages/LoginPage'))
const Layout = lazy(() => import('@/components/Layout'))
const Activities = lazy(() => import('@/pages/Activities'))
const MyBookings = lazy(() => import('@/pages/MyBookings'))
const Wallet = lazy(() => import('@/pages/Wallet'))
const Profile = lazy(() => import('@/pages/Profile'))

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function CustomerApp() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public */}
        <Route
          path="/login"
          element={user ? <Navigate to="/activities" replace /> : <LoginPage />}
        />

        {/* Protected — all inside Layout shell */}
        <Route
          path="/"
          element={
            <AuthGate>
              <Layout />
            </AuthGate>
          }
        >
          <Route index element={<Navigate to="/activities" replace />} />
          <Route path="activities" element={<Activities />} />
          <Route path="bookings" element={<MyBookings />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<Navigate to={user ? '/activities' : '/login'} replace />} />
      </Routes>
    </Suspense>
  )
}
