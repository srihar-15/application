import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Phone, Mail, Crown, LogOut, Loader2, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  bronze: { label: 'Bronze', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  silver: { label: 'Silver', color: 'text-gray-300', bg: 'bg-gray-500/10' },
  gold: { label: 'Gold', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  platinum: { label: 'Platinum', color: 'text-blue-300', bg: 'bg-blue-500/10' },
}

export default function Profile() {
  const { user, logout, updateUserProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user?.displayName ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [saving, setSaving] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  if (!user) return null

  const tier = TIER_CONFIG[user.tier?.toLowerCase() ?? 'bronze'] ?? TIER_CONFIG.bronze
  const initials = user.displayName.charAt(0).toUpperCase()

  async function handleSave() {
    setSaving(true)
    try {
      await updateUserProfile({ displayName: name, email })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    setLoggingOut(true)
    await logout()
  }

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Avatar + name */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center pt-4 pb-2"
      >
        <div className="w-20 h-20 rounded-full bg-blue-600/20 border-2 border-blue-500/30 flex items-center justify-center text-blue-400 text-3xl font-bold mb-3">
          {initials}
        </div>
        <h1 className="text-white text-xl font-bold">{user.displayName}</h1>
        {user.phone && (
          <p className="text-gray-500 text-sm mt-0.5">{user.phone}</p>
        )}
        {/* Tier badge */}
        <div className={cn('flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full', tier.bg)}>
          <Crown className={cn('w-3.5 h-3.5', tier.color)} />
          <span className={cn('text-xs font-semibold', tier.color)}>{tier.label} Member</span>
        </div>
        {user.isVerified && (
          <div className="flex items-center gap-1 mt-2 text-green-400 text-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified</span>
          </div>
        )}
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
          <p className="text-white text-2xl font-bold">{user.tires ?? 0}</p>
          <p className="text-gray-500 text-xs mt-0.5">Total Tires</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
          <p className="text-white text-2xl font-bold">₹{(user.walletBalance ?? 0).toLocaleString('en-IN')}</p>
          <p className="text-gray-500 text-xs mt-0.5">Wallet Balance</p>
        </div>
      </div>

      {/* Info / edit */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-white text-sm font-semibold">Account Details</h2>
          {!editing && (
            <button onClick={() => setEditing(true)} className="text-blue-400 text-xs font-medium">
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="text-gray-500 text-xs mb-1 block">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-gray-500 text-xs mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-gray-600" />
              <span className="text-white text-sm">{user.displayName}</span>
            </div>
            {user.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-600" />
                <span className="text-white text-sm">{user.phone}</span>
              </div>
            )}
            {user.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-600" />
                <span className="text-white text-sm">{user.email}</span>
              </div>
            )}
            {user.referralCode && (
              <div className="flex items-center justify-between mt-1 pt-2 border-t border-gray-800">
                <span className="text-gray-500 text-xs">Referral Code</span>
                <span className="text-blue-400 text-sm font-mono font-semibold">{user.referralCode}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/5 transition-colors disabled:opacity-50"
      >
        {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
        {loggingOut ? 'Signing out…' : 'Sign Out'}
      </button>
    </div>
  )
}
