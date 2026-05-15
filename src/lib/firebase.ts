import { initializeApp } from 'firebase/app'
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth'
import { getFirestore, initializeFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { logger } from './logger'

const REQUIRED_KEYS = ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_APP_ID'] as const

const missing = REQUIRED_KEYS.filter((k) => !import.meta.env[k]?.trim())
if (missing.length > 0) {
  const message = `Missing required Firebase env vars: ${missing.join(', ')}`
  logger.error('firebase.missing_env', undefined, { message })
  throw new Error(message)
}

const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) ?? '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) ?? '',
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) ?? '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
  measurementId: (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string) ?? '',
})

export const auth = getAuth(app)

if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    logger.error('firebase.auth_persistence_failed', err)
  })
}

// Forces long-polling to prevent "INTERNAL ASSERTION FAILED" errors under heavy
// listener churn + StrictMode. initializeFirestore must be the first call — fall
// back to getFirestore if another path beat us.
let dbInstance
try {
  dbInstance = initializeFirestore(app, { experimentalForceLongPolling: true }, 'asquare-app-db')
} catch (err) {
  logger.warn('firebase.long_polling_init_skipped', {
    reason: err instanceof Error ? err.message : String(err),
  })
  dbInstance = getFirestore(app, 'asquare-app-db')
}

export const db = dbInstance
export const storage = getStorage(app)
export { app as firebaseApp }
