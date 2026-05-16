import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet as WalletIcon, TrendingUp, TrendingDown, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { subscribeToWalletTransactions, type WalletTxn } from '@/services/bookingService'
import { cn } from '@/lib/utils'

const TYPE_CONFIG: Record<string, { label: string; color: string; sign: string; icon: typeof TrendingUp }> = {
  credit: { label: 'Credit', color: 'text-green-400', sign: '+', icon: TrendingUp },
  owner_credit: { label: 'Credit', color: 'text-green-400', sign: '+', icon: TrendingUp },
  tire_credit: { label: 'Tire Credit', color: 'text-blue-400', sign: '+', icon: TrendingUp },
  debit: { label: 'Debit', color: 'text-red-400', sign: '-', icon: TrendingDown },
  owner_debit: { label: 'Debit', color: 'text-red-400', sign: '-', icon: TrendingDown },
  tire_debit: { label: 'Tire Debit', color: 'text-orange-400', sign: '-', icon: TrendingDown },
}

function TxnRow({ txn }: { txn: WalletTxn }) {
  const cfg = TYPE_CONFIG[txn.type] ?? TYPE_CONFIG.credit
  const Icon = cfg.icon

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-3 py-3 border-b border-gray-800/60 last:border-0"
    >
      <div className={cn('w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0',
        cfg.color === 'text-green-400' ? 'bg-green-500/10' : cfg.color === 'text-red-400' ? 'bg-red-500/10' : 'bg-blue-500/10'
      )}>
        <Icon className={cn('w-4 h-4', cfg.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{txn.description || cfg.label}</p>
        <p className="text-gray-600 text-xs">
          {txn.timestamp.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>
      <span className={cn('text-sm font-bold flex-shrink-0', cfg.color)}>
        {cfg.sign}₹{txn.amount.toLocaleString('en-IN')}
      </span>
    </motion.div>
  )
}

export default function Wallet() {
  const { user } = useAuth()
  const [txns, setTxns] = useState<WalletTxn[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) { setLoading(false); return }

    const unsub = subscribeToWalletTransactions(
      user.id,
      (data) => { setTxns(data); setLoading(false) },
      (err) => { setError(err.message); setLoading(false) },
    )
    return unsub
  }, [user?.id])

  const balance = user?.walletBalance ?? 0

  return (
    <div className="px-4 py-4">
      {/* Balance card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 mb-6 shadow-xl shadow-blue-900/30"
      >
        <div className="flex items-center gap-2 mb-3">
          <WalletIcon className="w-5 h-5 text-blue-200" />
          <span className="text-blue-200 text-sm font-medium">Wallet Balance</span>
          <span className="ml-auto flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-blue-300 text-xs">Live</span>
          </span>
        </div>
        <p className="text-white text-4xl font-bold">
          ₹{balance.toLocaleString('en-IN')}
        </p>
        <p className="text-blue-300 text-xs mt-1">Updated in real-time</p>
      </motion.div>

      {/* Transactions */}
      <div>
        <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
          Recent Transactions
        </h2>

        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center py-10 gap-2">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && txns.length === 0 && (
          <div className="flex flex-col items-center py-14 gap-3">
            <WalletIcon className="w-12 h-12 text-gray-800" />
            <p className="text-gray-500 text-sm">No transactions yet</p>
          </div>
        )}

        {!loading && !error && txns.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl px-4">
            <AnimatePresence mode="popLayout">
              {txns.map((t) => <TxnRow key={t.id} txn={t} />)}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
