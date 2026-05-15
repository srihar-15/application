import type { BranchLocation } from '@/types'

export const FALLBACK_LOCATIONS: BranchLocation[] = [
  { slug: 'visakhapatnam', branchId: '0', displayName: 'Visakhapatnam', shortName: 'Vizag', enabled: true, firestoreDocId: 'visakhapatnam' },
  { slug: 'kakinada', branchId: '1', displayName: 'Kakinada', shortName: 'Kakinada', enabled: true, firestoreDocId: 'kakinada' },
  { slug: 'rajahmundry', branchId: '2', displayName: 'Rajahmundry', shortName: 'Rajahmundry', enabled: true, firestoreDocId: 'rajahmundry' },
  { slug: 'srikakulam', branchId: '5', displayName: 'Srikakulam', shortName: 'Srikakulam', enabled: true, firestoreDocId: 'srikakulam' },
]

const LEGACY_ALIASES: Record<string, string> = {
  vizag: 'visakhapatnam',
  vskp: 'visakhapatnam',
  kkd: 'kakinada',
  rjy: 'rajahmundry',
}

let currentLocations: BranchLocation[] = FALLBACK_LOCATIONS
let bySlug = new Map<string, BranchLocation>()
let byBranchId = new Map<string, BranchLocation>()

function rebuildMaps(locations: BranchLocation[]) {
  currentLocations = locations
  bySlug = new Map()
  byBranchId = new Map()
  for (const loc of locations) {
    bySlug.set(loc.slug.toLowerCase(), loc)
    byBranchId.set(loc.branchId, loc)
  }
  for (const [alias, target] of Object.entries(LEGACY_ALIASES)) {
    const resolved = bySlug.get(target)
    if (resolved) bySlug.set(alias, resolved)
  }
}

rebuildMaps(FALLBACK_LOCATIONS)

export function setLocations(locations: BranchLocation[]): void {
  rebuildMaps(locations.filter((l) => l.enabled))
}

export function getLocations(): BranchLocation[] {
  return currentLocations
}

export function getLocationBySlug(slug: string): BranchLocation | undefined {
  return bySlug.get(slug.toLowerCase())
}

export function getLocationByBranchId(branchId: string): BranchLocation | undefined {
  return byBranchId.get(branchId)
}
