import { NavLink } from 'react-router-dom'
import { Home, CalendarDays, Wallet, User } from 'lucide-react'

const NAV = [
  { to: '/activities', icon: Home, label: 'Home' },
  { to: '/bookings', icon: CalendarDays, label: 'Bookings' },
  { to: '/wallet', icon: Wallet, label: 'Wallet' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-gray-950/90 backdrop-blur-xl border-t border-gray-800">
      <div className="flex items-center justify-around px-2 py-2 safe-area-pb">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-5 py-1.5 rounded-xl transition-all ${
                isActive ? 'text-blue-400' : 'text-gray-600 hover:text-gray-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
                <span className={`text-[10px] font-medium ${isActive ? 'text-blue-400' : ''}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
