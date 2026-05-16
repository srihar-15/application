import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  type ReactNode,
} from 'react'
import {
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from 'firebase/auth'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { storage } from '@/lib/storage'
import { logger } from '@/lib/logger'
import { getErrorMessage, getErrorCode, normalizePhone } from '@/lib/utils'
import { userService } from '@/services/userService'
import type { User } from '@/types'

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  sendOTP: (phoneNumber: string, recaptchaContainerId?: string) => Promise<void>
  verifyOTP: (otp: string) => Promise<void>
  logout: () => Promise<void>
  updateUserProfile: (data: Partial<User>) => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  const [pendingPhone, setPendingPhone] = useState<string | null>(null)
  const [verifier, setVerifier] = useState<RecaptchaVerifier | null>(null)

  // On Firebase auth state change, load user from storage or sync from Firestore.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const stored = await storage.get('user')
          if (stored) {
            setUser(JSON.parse(stored) as User)
          } else if (firebaseUser.phoneNumber) {
            await syncUser(firebaseUser.phoneNumber)
          }
        } catch (err) {
          logger.error('auth.state_load_failed', err)
          if (firebaseUser.phoneNumber) {
            await syncUser(firebaseUser.phoneNumber).catch((e) =>
              logger.error('auth.sync_fallback_failed', e),
            )
          }
        }
      } else {
        await storage.remove('user').catch(() => {})
        setUser(null)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  // Resolve the canonical user doc and populate local state.
  async function syncUser(phoneNumber: string) {
    const cleanPhone = normalizePhone(phoneNumber)
    const { canonicalId } = await userService.resolveOrCreateUserDoc({
      firebaseUid: auth.currentUser?.uid ?? null,
      phone: phoneNumber,
      displayName: auth.currentUser?.displayName ?? undefined,
      email: auth.currentUser?.email ?? undefined,
    })

    const snap = await getDoc(doc(db, 'users', canonicalId))
    if (!snap.exists()) {
      // Doc creation raced — seed minimal state, real-time sub fills it in.
      const minimal: User = {
        id: canonicalId,
        displayName: 'Guest',
        phone: cleanPhone,
        tires: 0,
        walletBalance: 0,
        tier: 'bronze',
        referralCode: 'USER' + canonicalId.slice(-6).toUpperCase(),
        createdAt: new Date(),
        updatedAt: new Date(),
        isVerified: false,
      }
      setUser(minimal)
      return
    }

    const data = snap.data() as Record<string, unknown>

    if (data['blacklisted'] === true) {
      await auth.signOut()
      await storage.remove('user')
      setUser(null)
      setError('Your account has been suspended. Contact support.')
      setLoading(false)
      return
    }

    const userObj: User = {
      id: canonicalId,
      phone: (data['phone'] as string | undefined) ?? cleanPhone,
      email: (data['email'] as string | undefined) ?? '',
      displayName:
        (data['displayName'] as string | undefined) ??
        (data['name'] as string | undefined) ??
        'Guest',
      tires: (data['tires'] as number | undefined) ?? 0,
      walletBalance: (data['walletBalance'] as number | undefined) ?? 0,
      tier: ((data['tier'] as string | undefined) ?? 'bronze').toLowerCase(),
      referralCode:
        (data['referralCode'] as string | undefined) ??
        'USER' + canonicalId.slice(-6).toUpperCase(),
      referredBy: (data['referredBy'] as string | undefined) ?? '',
      isVerified: (data['isVerified'] as boolean | undefined) ?? false,
      locked: (data['locked'] as boolean | undefined) ?? false,
      createdAt: (data['createdAt'] as { toDate?: () => Date } | undefined)?.toDate?.() ?? new Date(),
      updatedAt: (data['updatedAt'] as { toDate?: () => Date } | undefined)?.toDate?.() ?? new Date(),
    }

    setUser(userObj)
    storage.set('user', JSON.stringify(userObj)).catch((e) =>
      logger.error('auth.storage_set_failed', e),
    )
  }

  // Persist user to storage whenever it changes (after initial load).
  useEffect(() => {
    if (loading) return
    if (user) {
      storage.set('user', JSON.stringify(user)).catch((e) =>
        logger.error('auth.storage_persist_failed', e),
      )
    } else {
      storage.remove('user').catch((e) => logger.error('auth.storage_remove_failed', e))
    }
  }, [user, loading])

  // Real-time Firestore subscriptions — wallet balance + profile fields.
  // Keyed off user.id only so wallet snapshot changes don't cause resubscribes.
  const userId = user?.id
  useEffect(() => {
    if (!userId) return

    const unsubWallet = onSnapshot(
      doc(db, 'users', userId, 'wallet', 'data'),
      (snap) => {
        if (!snap.exists()) return
        const balance = (snap.data() as { balance?: number }).balance
        if (balance === undefined) return
        setUser((prev) => {
          if (!prev || prev.walletBalance === balance) return prev
          return { ...prev, walletBalance: balance }
        })
      },
      (err) => logger.error('auth.wallet_sync_failed', err),
    )

    const unsubProfile = onSnapshot(
      doc(db, 'users', userId),
      (snap) => {
        if (!snap.exists()) return
        const data = snap.data() as Record<string, unknown>

        if (data['blacklisted'] === true) {
          void auth.signOut()
          storage.remove('user').catch(() => {})
          setUser(null)
          setError('Your account has been suspended. Contact support.')
          return
        }

        setUser((prev) => {
          if (!prev) return null
          const updates: Partial<User> = {}
          if (data['referralCode'] && data['referralCode'] !== prev.referralCode)
            updates.referralCode = data['referralCode'] as string
          if (data['referredBy'] && data['referredBy'] !== prev.referredBy)
            updates.referredBy = data['referredBy'] as string
          if (data['locked'] !== undefined && data['locked'] !== prev.locked)
            updates.locked = data['locked'] as boolean
          if (Object.keys(updates).length === 0) return prev
          return { ...prev, ...updates }
        })
      },
      (err) => logger.error('auth.profile_sync_failed', err),
    )

    return () => {
      unsubWallet()
      unsubProfile()
    }
  }, [userId])

  const sendOTP = async (
    phoneNumber: string,
    recaptchaContainerId = 'recaptcha-container',
  ) => {
    setError(null)
    try {
      if (!phoneNumber.startsWith('+')) {
        throw new Error('Phone number must include country code (e.g. +91XXXXXXXXXX)')
      }

      setPendingPhone(phoneNumber)

      if (verifier) {
        try { verifier.clear() } catch { /* ignore */ }
      }

      const container = document.getElementById(recaptchaContainerId)
      if (!container) {
        throw new Error(`ReCAPTCHA container '#${recaptchaContainerId}' not found`)
      }

      const newVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
        size: 'invisible',
        callback: () => { logger.debug('auth.recaptcha_solved') },
        'expired-callback': () => {
          logger.warn('auth.recaptcha_expired')
          setError('Verification expired. Please try again.')
        },
      })

      setVerifier(newVerifier)
      const result = await signInWithPhoneNumber(auth, phoneNumber, newVerifier)
      setConfirmationResult(result)
      logger.info('auth.otp_sent', { phone: '[redacted]' })
    } catch (err) {
      logger.error('auth.send_otp_failed', err)
      if (getErrorCode(err) === 'auth/argument-error') {
        setError('Authentication config error. Please refresh and try again.')
      } else {
        setError(getErrorMessage(err, 'Failed to send OTP'))
      }
      throw err
    }
  }

  const verifyOTP = async (otp: string) => {
    setLoading(true)
    setError(null)
    try {
      if (!confirmationResult) throw new Error('Please request an OTP first')

      const result = await confirmationResult.confirm(otp)
      const phone = result.user?.phoneNumber ?? pendingPhone ?? ''

      if (phone) await syncUser(phone)

      setUser((prev) => (prev ? { ...prev, isVerified: true } : prev))

      if (phone) {
        const { canonicalId } = await userService.resolveOrCreateUserDoc({
          firebaseUid: auth.currentUser?.uid ?? null,
          phone,
        })
        await userService.mergeUserDoc(canonicalId, { isVerified: true })
      }

      setPendingPhone(null)
      setConfirmationResult(null)
    } catch (err) {
      logger.error('auth.verify_otp_failed', err)
      setError('Invalid OTP. Please try again.')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try { await auth.signOut() } catch (e) { logger.error('auth.signout_failed', e) }
    await storage.remove('user')
    setUser(null)
    window.location.href = '/'
  }

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const name = updates.displayName ?? user.displayName
      const email = updates.email ?? user.email ?? ''

      await userService.mergeUserDoc(user.id, { displayName: name, name, email })
      setUser({ ...user, displayName: name, email, updatedAt: new Date() })
    } catch (err) {
      logger.error('auth.profile_update_failed', err)
      setError(getErrorMessage(err, 'Failed to update profile'))
      throw err
    } finally {
      setLoading(false)
    }
  }

  const clearError = useCallback(() => setError(null), [])

  const value = useMemo<AuthContextType>(
    () => ({ user, loading, error, sendOTP, verifyOTP, logout, updateUserProfile, clearError }),
    // Action fns are stable closures — dominant re-render triggers are user/loading/error.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, loading, error, clearError],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
