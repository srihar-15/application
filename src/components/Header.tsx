import { useState } from 'react'
import { MapPin, ChevronDown, Check, Wallet } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getLocations } from '@/lib/locations'
import type { BranchLocation } from '@/types'
import { cn } from '@/lib/utils'

const LOCATIONS: BranchLocation[] = getLocations().filter((l) => l.enabled)

const LOCATION_KEY = 'asq_location'

function getSavedLocation(): string {
  return localStorage.getItem(LOCATION_KEY) ?? LOCATIONS[0]?.branchId ?? '0'
}

// Shared location state — lifted to module level so Header and consumers share one value.
let _location = getSavedLocation()
const _listeners = new Set<() => void>()

export function useLocation(): [string, (id: string) => void] {
  const [, rerender] = useState(0)

  const setLocation = (id: string) => {
    _location = id
    localStorage.setItem(LOCATION_KEY, id)
    _listeners.forEach((fn) => fn())
  }

  // Subscribe this component to external changes
  useState(() => {
    const notify = () => rerender((n) => n + 1)
    _listeners.add(notify)
    return () => _listeners.delete(notify)
  })

  return [_location, setLocation]
}

export default function Header() {
  const { user } = useAuth()
  const [location, setLocation] = useLocation()
  const [open, setOpen] = useState(false)

  const current = LOCATIONS.find((l) => l.branchId === location) ?? LOCATIONS[0]
  const walletBalance = user?.walletBalance ?? 0
  const initials = (user?.displayName ?? 'G').charAt(0).toUpperCase()

  return (
    <header className="sticky top-0 z-30 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800/60">
      <div className="flex items-center justify-between px-4 py-3 max-w-2xl mx-auto">
        {/* Location picker */}
        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-1.5 text-sm font-medium text-white"
          >
            <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <span className="max-w-[140px] truncate">{current?.shortName ?? 'Select Branch'}</span>
            <ChevronDown className={cn('w-3.5 h-3.5 text-gray-500 transition-transform', open && 'rotate-180')} />
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="absolute top-full left-0 mt-2 w-56 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl z-50 p-1.5 overflow-hidden">
                {LOCATIONS.map((loc) => (
                  <button
                    key={loc.branchId}
                    onClick={() => { setLocation(loc.branchId); setOpen(false) }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors',
                      location === loc.branchId ? 'bg-blue-500/15 text-blue-400' : 'text-gray-300 hover:bg-gray-800',
                    )}
                  >
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 text-sm font-medium">{loc.shortName}</span>
                    {location === loc.branchId && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right: wallet + avatar */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-1.5 bg-gray-800/60 border border-gray-700 rounded-full px-3 py-1.5">
              <Wallet className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-sm font-semibold text-white">
                ₹{walletBalance.toLocaleString('en-IN')}
              </span>
            </div>
          )}
          <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-sm font-bold">
            {initials}
          </div>
        </div>
      </div>
    </header>
  )
}
