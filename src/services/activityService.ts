import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Activity } from '@/types'
import { logger } from '@/lib/logger'

function isLocationMatch(activity: Activity, locationId: string): boolean {
  const today = new Date().toISOString().split('T')[0]

  if (activity.schedule?.length) {
    return activity.schedule.some(
      (s) => s.locationId === locationId && s.startDate <= today && s.endDate >= today,
    )
  }
  if (activity.locationIds?.length) {
    return activity.locationIds.includes(locationId)
  }
  if (activity.branch) {
    return activity.branch === locationId
  }
  return true
}

export function subscribeToActivities(
  locationId: string | null,
  onData: (activities: Activity[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(collection(db, 'activities'), where('available', '==', true))

  const unsub = onSnapshot(
    q,
    (snap) => {
      const all = snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Activity)
      const filtered = locationId
        ? all.filter(
            (a) =>
              !a.temporarilyUnavailable &&
              isLocationMatch(a, locationId),
          )
        : all.filter((a) => !a.temporarilyUnavailable)

      onData(filtered)
    },
    (err) => {
      logger.error('activityService.subscribe_failed', err)
      onError?.(err)
    },
  )

  return unsub
}
