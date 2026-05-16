import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

const LoginPage = lazy(() => import('@/pages/LoginPage'))

// Pages will be added here one by one as we build them.
// Every page must be lazy-loaded with React.lazy().

export default function CustomerApp() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  )
}
