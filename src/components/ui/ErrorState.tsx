import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-6 text-center', className)}>
      <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
      <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
      {message && <p className="text-sm text-dark-300 max-w-xs mb-5">{message}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white text-sm rounded-lg transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  )
}
