import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarDays, Loader2, AlertCircle, CheckCircle2, Clock, XCircle, MapPin } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { subscribeToUserBookings } from '@/services/bookingService'
import type { Booking } from '@/types'
import { cn } from '@/lib/utils'
import { getLocations } from '@/lib/locations'

const LOCATION_MAP = Object.fromEntries(getLocations().map((l: { branchId: string; shortName: string }) => [l.branchId, l.shortName]))

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  confirmed: { label: 'Confirmed', color: 'text-green-400', icon: CheckCircle2 },
  completed: { label: 'Completed', color: 'text-gray-400', icon: CheckCircle2 },
  pending: { label: 'Pending', color: 'text-yellow-400', icon: Clock },
  cancelled: { label: 'Cancelled', color: 'text-red-400', icon: XCircle },
  'no-show': { label: 'No Show', color: 'text-red-400', icon: XCircle },
}

function BookingCard({ booking }: { booking: Booking }) {
  const statusCfg = STATUS_CONFIG[booking.bookingStatus] ?? STATUS_CONFIG.pending
  const StatusIcon = statusCfg.icon
  const locationName = LOCATION_MAP[booking.locationId] ?? booking.locationId
  const date = booking.sessionDate instanceof Date ? booking.sessionDate : new Date(booking.sessionDate)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-white font-semibold text-sm">
            {booking.items?.[0]?.activity?.name ?? 'Booking'}
            {(booking.items?.length ?? 0) > 1 && (
              <span className="text-gray-500 font-normal text-xs ml-1">
                +{booking.items.length - 1} more
              </span>
            )}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-gray-500" />
            <span className="text-gray-500 text-xs">{locationName}</span>
          </div>
        </div>
        <span className={cn('flex items-center gap-1 text-xs font-semibold shrink-0', statusCfg.color)}>
          <StatusIcon className="w-3.5 h-3.5" />
          {statusCfg.label}
        </span>
      </div>

      {/* Date & amount */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-gray-400">
          <CalendarDays className="w-3.5 h-3.5" />
          <span>
            {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
        <span className="text-white font-bold">₹{booking.finalAmount?.toLocaleString('en-IN')}</span>
      </div>

      {/* Payment status */}
      {booking.paymentStatus && (
        <div
          className={cn(
            'text-[10px] font-semibold px-2 py-0.5 rounded-full w-fit',
            booking.paymentStatus === 'completed'
              ? 'bg-green-500/10 text-green-400'
              : booking.paymentStatus === 'pending'
                ? 'bg-yellow-500/10 text-yellow-400'
                : 'bg-red-500/10 text-red-400',
          )}
        >
          {booking.paymentStatus.toUpperCase()}
        </div>
      )}
    </motion.div>
  )
}

export default function MyBookings() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')

  useEffect(() => {
    if (!user) { setLoading(false); return }

    setLoading(true)
    const unsub = subscribeToUserBookings(
      user.id,
      (data) => { setBookings(data); setLoading(false) },
      (err) => { setError(err.message); setLoading(false) },
    )
    return unsub
  }, [user?.id])

  const now = new Date()
  const upcoming = bookings.filter((b) => {
    const d = b.sessionDate instanceof Date ? b.sessionDate : new Date(b.sessionDate)
    return d >= now && b.bookingStatus !== 'cancelled'
  })
  const past = bookings.filter((b) => {
    const d = b.sessionDate instanceof Date ? b.sessionDate : new Date(b.sessionDate)
    return d < now || b.bookingStatus === 'cancelled' || b.bookingStatus === 'completed'
  })
  const list = tab === 'upcoming' ? upcoming : past

  return (
    <div className="px-4 py-4">
      {/* Tabs */}
      <div className="flex bg-gray-900 rounded-xl p-1 mb-5">
        {(['upcoming', 'past'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all',
              tab === t ? 'bg-blue-600 text-white' : 'text-gray-500',
            )}
          >
            {t}
            {t === 'upcoming' && upcoming.length > 0 && (
              <span className="ml-1.5 bg-blue-500/30 text-blue-300 text-[10px] px-1.5 py-0.5 rounded-full">
                {upcoming.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Live indicator */}
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-green-400 text-xs font-medium">Live updates</span>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
          <p className="text-gray-500 text-sm">Loading bookings…</p>
        </div>
      )}

      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <AlertCircle className="w-9 h-9 text-red-400" />
          <p className="text-red-400 text-sm text-center">{error}</p>
        </div>
      )}

      {!loading && !error && list.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <CalendarDays className="w-12 h-12 text-gray-800" />
          <p className="text-gray-500 text-sm">
            {tab === 'upcoming' ? 'No upcoming bookings' : 'No past bookings'}
          </p>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {list.map((b) => <BookingCard key={b.id} booking={b} />)}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
