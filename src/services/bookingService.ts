import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  type Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Booking } from '@/types'
import { logger } from '@/lib/logger'

function normalizeBooking(id: string, data: Record<string, unknown>): Booking {
  const toDate = (v: unknown): Date => {
    if (v && typeof v === 'object' && 'toDate' in v) return (v as Timestamp).toDate()
    if (v) return new Date(v as string | number)
    return new Date()
  }
  return { ...data, id, createdAt: toDate(data.createdAt), sessionDate: toDate(data.sessionDate) } as Booking
}

export function subscribeToUserBookings(
  userId: string,
  onData: (bookings: Booking[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(
    collection(db, 'bookings'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50),
  )

  const unsub = onSnapshot(
    q,
    (snap) => {
      const bookings = snap.docs.map((d) =>
        normalizeBooking(d.id, d.data() as Record<string, unknown>),
      )
      onData(bookings)
    },
    (err) => {
      logger.error('bookingService.subscribe_failed', err)
      onError?.(err)
    },
  )

  return unsub
}

export function subscribeToWalletTransactions(
  userId: string,
  onData: (txns: WalletTxn[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(
    collection(db, 'users', userId, 'wallet', 'transactions', 'list'),
    orderBy('timestamp', 'desc'),
    limit(30),
  )

  const unsub = onSnapshot(
    q,
    (snap) => {
      const txns = snap.docs.map((d) => {
        const data = d.data() as Record<string, unknown>
        const ts = data.timestamp as Timestamp | undefined
        return {
          id: d.id,
          type: data.type as WalletTxn['type'],
          amount: (data.amount as number) ?? 0,
          description: (data.description as string) ?? '',
          timestamp: ts?.toDate?.() ?? new Date(),
        }
      })
      onData(txns)
    },
    (err) => {
      logger.error('bookingService.wallet_txn_subscribe_failed', err)
      onError?.(err)
    },
  )

  return unsub
}

export interface WalletTxn {
  id: string
  type: 'credit' | 'debit' | 'owner_credit' | 'owner_debit'
  amount: number
  description: string
  timestamp: Date
}
