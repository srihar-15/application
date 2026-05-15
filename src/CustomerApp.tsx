import { Routes, Route, Navigate } from 'react-router-dom'

// Pages will be added here one by one as we build them.
// Each page will be lazy-loaded with React.lazy().

export default function CustomerApp() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="min-h-screen flex items-center justify-center bg-dark-900">
            <div className="text-center">
              <h1 className="text-3xl font-display font-bold text-white mb-2">
                A Square GoKarting
              </h1>
              <p className="text-dark-300 text-sm">Customer app — coming soon</p>
            </div>
          </div>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
