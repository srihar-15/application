import type { Analytics } from 'firebase/analytics'
import { logger } from './logger'

export const AnalyticsEvent = {
  // Auth
  SignUpStarted: 'sign_up_started',
  SignUpCompleted: 'sign_up_completed',
  LoginCompleted: 'login_completed',
  LogoutCompleted: 'logout_completed',
  // Browse
  BranchSelected: 'branch_selected',
  ActivityViewed: 'activity_viewed',
  // Booking funnel
  BookingStarted: 'booking_started',
  AddedToCart: 'added_to_cart',
  CheckoutStarted: 'checkout_started',
  CheckoutCompleted: 'checkout_completed',
  PaymentFailed: 'payment_failed',
  // Engagement
  SpinAndWinPlayed: 'spin_and_win_played',
  CouponApplied: 'coupon_applied',
  // Wallet
  WalletTopUp: 'wallet_top_up',
  WalletDeducted: 'wallet_deducted',
} as const

export type AnalyticsEventName = (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent]

export interface AnalyticsParams {
  [key: string]: string | number | boolean | undefined
}

let firebaseAnalytics: Analytics | null = null

async function getAnalytics(): Promise<Analytics | null> {
  if (firebaseAnalytics) return firebaseAnalytics
  if (!import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) return null
  try {
    const [{ getAnalytics: getFA }, { firebaseApp }] = await Promise.all([
      import('firebase/analytics'),
      import('./firebase'),
    ])
    firebaseAnalytics = getFA(firebaseApp)
    return firebaseAnalytics
  } catch (err) {
    logger.warn('analytics.init_failed', { reason: String(err) })
    return null
  }
}

export const analytics = {
  async track(event: AnalyticsEventName, params?: AnalyticsParams): Promise<void> {
    const fa = await getAnalytics()
    if (!fa) return
    try {
      const { logEvent } = await import('firebase/analytics')
      logEvent(fa, event, params)
    } catch (err) {
      logger.warn('analytics.track_failed', { event, reason: String(err) })
    }
  },

  async identify(userId: string, params?: AnalyticsParams): Promise<void> {
    const fa = await getAnalytics()
    if (!fa) return
    try {
      const { setUserId, setUserProperties } = await import('firebase/analytics')
      setUserId(fa, userId)
      if (params) setUserProperties(fa, params as Record<string, string>)
    } catch (err) {
      logger.warn('analytics.identify_failed', { reason: String(err) })
    }
  },
}
