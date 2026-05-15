import { Routes, Route, Navigate } from 'react-router-dom'

// Pipeline admin pages will be added here one by one as we build them.

export default function PipelineApp() {
  return (
    <Routes>
      <Route
        path="*"
        element={
          <div className="min-h-screen flex items-center justify-center bg-dark-900">
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-white mb-2">Pipeline Admin</h1>
              <p className="text-dark-300 text-sm">Admin app — coming soon</p>
            </div>
          </div>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
