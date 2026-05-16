import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, AlertCircle, Loader2 } from 'lucide-react'
import { subscribeToActivities } from '@/services/activityService'
import { useLocation } from '@/components/Header'
import type { Activity } from '@/types'
import { cn } from '@/lib/utils'

const PLACEHOLDER_IMG = 'https://asquaregokarting.com/admin_secure/images/games/gokarting%201x1.jpg'

function ActivityCard({ activity }: { activity: Activity }) {
  const [imgError, setImgError] = useState(false)
  const price = activity.offerPrice ?? activity.basePrice

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="relative bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden active:scale-[0.98] transition-transform cursor-pointer"
    >
      {/* Image */}
      <div className="aspect-square bg-gray-800 overflow-hidden">
        <img
          src={imgError ? PLACEHOLDER_IMG : (activity.image || PLACEHOLDER_IMG)}
          alt={activity.name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      </div>

      {/* Unavailability badge */}
      {activity.temporarilyUnavailable && (
        <div className="absolute top-2 left-2 bg-red-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          Unavailable
        </div>
      )}

      {/* Offer badge */}
      {activity.offerPercent && (
        <div className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          {activity.offerPercent}% OFF
        </div>
      )}

      {/* Info */}
      <div className="p-3">
        <p className="text-white text-sm font-semibold leading-snug line-clamp-2">{activity.name}</p>
        {activity.duration && (
          <p className="text-gray-500 text-xs mt-0.5">{activity.duration} min</p>
        )}
        <div className="flex items-center justify-between mt-2">
          <div>
            <span className="text-blue-400 font-bold text-base">₹{price}</span>
            {activity.actualPrice && activity.actualPrice > price && (
              <span className="text-gray-600 text-xs line-through ml-1.5">₹{activity.actualPrice}</span>
            )}
          </div>
          <button className="bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-500 active:scale-95 transition-all">
            Book
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default function Activities() {
  const [locationId] = useLocation()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [category, setCategory] = useState('all')

  useEffect(() => {
    setLoading(true)
    setError(null)

    const unsub = subscribeToActivities(
      locationId,
      (data) => {
        setActivities(data)
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      },
    )

    return unsub
  }, [locationId])

  // Derive unique categories from live data
  const categories = ['all', ...Array.from(new Set(activities.map((a) => a.category ?? 'other').filter(Boolean)))]

  const filtered = category === 'all'
    ? activities
    : activities.filter((a) => (a.category ?? 'other') === category)

  return (
    <div className="px-4 py-4">
      {/* Live indicator */}
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-green-400 text-xs font-medium">Live availability</span>
        {activities.length > 0 && (
          <span className="text-gray-600 text-xs ml-auto">{activities.length} activities</span>
        )}
      </div>

      {/* Category filter */}
      {categories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                'flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all',
                category === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700',
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* States */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-gray-500 text-sm">Loading activities…</p>
        </div>
      )}

      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <Zap className="w-10 h-10 text-gray-700" />
          <p className="text-gray-500 text-sm">No activities available at this location</p>
        </div>
      )}

      {/* Grid */}
      {!loading && !error && (
        <motion.div layout className="grid grid-cols-2 gap-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}
