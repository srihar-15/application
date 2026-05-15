import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import './index.css'

const CustomerApp = lazy(() => import('./CustomerApp'))
const PipelineApp = lazy(() => import('./PipelineApp'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 1,
    },
  },
})

function isPipelineApp(): boolean {
  const hostname = window.location.hostname
  const params = new URLSearchParams(window.location.search)
  return hostname.startsWith('pipeline.') || params.get('app') === 'pipeline'
}

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element not found')

createRoot(rootEl).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ErrorBoundary>
          <Suspense fallback={<LoadingScreen />}>
            {isPipelineApp() ? <PipelineApp /> : <CustomerApp />}
          </Suspense>
        </ErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
