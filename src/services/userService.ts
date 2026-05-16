import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  runTransaction,
  type FieldValue,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { logger } from '@/lib/logger'
import { normalizePhone } from '@/lib/utils'

export type UserDocUpdate = Record<string, unknown> & {
  updatedAt?: FieldValue
  createdAt?: FieldValue
}

export const userService = {
  async getUserDoc(userId: string): Promise<Record<string, unknown> | null> {
    if (!userId) return null
    try {
      const snap = await getDoc(doc(db, 'users', userId))
      return snap.exists() ? (snap.data() as Record<string, unknown>) : null
    } catch (err) {
      logger.error('user.read_failed', err, { userId })
      return null
    }
  },

  async mergeUserDoc(userId: string, updates: UserDocUpdate): Promise<boolean> {
    if (!userId) return false
    try {
      const payload: UserDocUpdate = {
        ...updates,
        updatedAt: updates.updatedAt ?? serverTimestamp(),
      }
      await setDoc(doc(db, 'users', userId), payload, { merge: true })
      return true
    } catch (err) {
      logger.error('user.write_failed', err, { userId })
      return false
    }
  },

  // Single source of truth for deciding which users/{id} doc a session reads.
  // phoneToUid/{cleanPhone} is the canonical index. If it exists, use that uid.
  // If not, create it pointing at the Firebase Auth uid (or clean phone fallback)
  // and create the user doc. All auth paths must go through this — direct writes
  // to users/{uid} without this are what caused multi-doc-per-phone in the old app.
  async resolveOrCreateUserDoc(params: {
    firebaseUid: string | null
    phone: string | null
    displayName?: string
    email?: string
  }): Promise<{ canonicalId: string; created: boolean }> {
    const { firebaseUid, phone, displayName, email } = params
    const cleanPhone = normalizePhone(phone)

    if (!cleanPhone) {
      if (!firebaseUid) throw new Error('resolveOrCreateUserDoc: no firebaseUid or phone')
      await this.mergeUserDoc(firebaseUid, {
        displayName: displayName ?? undefined,
        email: email ?? undefined,
        lastLoginAt: serverTimestamp(),
      })
      return { canonicalId: firebaseUid, created: false }
    }

    const indexRef = doc(db, 'phoneToUid', cleanPhone)

    return runTransaction(db, async (tx) => {
      const indexSnap = await tx.get(indexRef)

      if (indexSnap.exists()) {
        const canonicalId = String((indexSnap.data() as { uid: unknown }).uid)
        const userRef = doc(db, 'users', canonicalId)
        const userSnap = await tx.get(userRef)

        if (!userSnap.exists()) {
          tx.set(userRef, {
            id: canonicalId,
            phone: cleanPhone,
            displayName: displayName ?? 'Guest',
            email: email ?? '',
            tires: 0,
            walletBalance: 0,
            tier: 'bronze',
            referralCode: 'USER' + canonicalId.slice(-6).toUpperCase(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
            isVerified: false,
          })
          return { canonicalId, created: true }
        }

        tx.set(userRef, { lastLoginAt: serverTimestamp() }, { merge: true })
        return { canonicalId, created: false }
      }

      // First login for this phone — create the index + user doc.
      const canonicalId = firebaseUid ?? cleanPhone
      tx.set(indexRef, { uid: canonicalId, phone: cleanPhone, createdAt: serverTimestamp() })
      tx.set(doc(db, 'users', canonicalId), {
        id: canonicalId,
        phone: cleanPhone,
        displayName: displayName ?? 'Guest',
        email: email ?? '',
        tires: 0,
        walletBalance: 0,
        tier: 'bronze',
        referralCode: 'USER' + canonicalId.slice(-6).toUpperCase(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        isVerified: false,
      })
      return { canonicalId, created: true }
    })
  },
}
