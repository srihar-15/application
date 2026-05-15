// ── Branch Location ────────────────────────────────────────────────────
export interface BranchLocation {
  slug: string
  branchId: string
  displayName: string
  shortName: string
  enabled: boolean
  firestoreDocId: string
}

// ── User ──────────────────────────────────────────────────────────────
export interface User {
  id: string
  phone?: string
  email?: string
  displayName: string
  photoURL?: string
  height?: number
  weight?: number
  emergencyContact?: {
    name: string
    phone: string
    relation: string
  }
  tires: number
  walletBalance?: number
  tier: string
  referralCode: string
  referredBy?: string
  createdAt: Date
  updatedAt: Date
  isVerified?: boolean
  locked?: boolean
}

// ── Activity ──────────────────────────────────────────────────────────
export type ActivityType = string

export interface Activity {
  id: ActivityType
  apiId?: string
  name: string
  description: string
  longDescription?: string
  icon?: string
  image: string
  minAge?: number
  maxParticipants?: number
  duration?: number
  basePrice: number
  peakMultiplier?: number
  available?: boolean
  temporarilyUnavailable?: boolean
  temporarilyUnavailableReason?: string
  temporarilyUnavailableSince?: string
  temporarilyUnavailableUntil?: string
  platforms?: ('web' | 'windows' | 'android' | 'ios' | 'pos' | 'bookings')[]
  category?: string
  gameTypeId?: string
  offerPercent?: number
  variants?: { laps: number; price: number; apiId: string }[]
  terms?: string[]
  safetyInstructions?: string[]
  locationIds?: string[]
  schedule?: { locationId: string; startDate: string; endDate: string }[]
  branch?: string
  actualPrice?: number
  offerPrice?: number
  availableDates?: string[]
  dateStatuses?: Record<string, 'available' | 'fast_filling' | 'booked_full'>
  createdDateTime?: string
  skuPerDay?: number
}

// ── Booking ───────────────────────────────────────────────────────────
export type BookingSource = 'APP_BOOKING' | 'ADMIN_BOOKING' | 'POS'

export interface BookingItem {
  activity: Activity
  quantity: number
  duration: number
  date: string
  timeSlot: string
  price: number
}

export interface BillingItem {
  itemName: string
  quantity: number
  unitPrice: number
  gameId?: string
  subGameId?: string
  variantId?: string
  vendorId?: string
  itemDiscount?: number
  itemBaseAmount?: number
  itemGstAmount?: number
  vendorSharePercent?: number
  vendorBase?: number
  vendorGst?: number
  vendorTotal?: number
  companyBase?: number
  companyGst?: number
  companyTotal?: number
  serialStart?: number
  printIndividualTokens?: boolean
  refunded?: boolean
}

export interface Booking {
  id: string
  userId: string
  locationId: string
  items: BookingItem[]
  totalAmount: number
  discountAmount: number
  finalAmount: number
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded'
  bookingStatus: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show'
  qrCode: string
  createdAt: Date
  sessionDate: Date
  tires: number
  paymentId?: string
  paymentMethod?: string
  cashbackAmount?: number
  pdfUrl?: string
  userDisplayName?: string
  userPhone?: string
  couponCode?: string
  couponAmount?: number
  createdByAdminId?: string
  createdByAdminName?: string
  createdByRole?: string
  checkInStatus?: 'pending' | 'completed' | 'boarded'
  source?: BookingSource
  sourceType?: string
  invoiceNumber?: string
  baseAmount?: number
  gstAmount?: number
  subtotal?: number
  discount?: number
  vendorId?: string
  vendorBase?: number
  vendorGst?: number
  vendorTotal?: number
  refundStatus?: 'None' | 'Partial' | 'Full'
  refundAmount?: number
  visitDate?: string
  originalVisitDate?: string
  rescheduledAt?: string
  transactionDate?: string
  billingItems?: BillingItem[]
}

// ── Cart ──────────────────────────────────────────────────────────────
export interface CartItem {
  id: string
  activity: Activity
  quantity: number
  date: string
  timeSlot: string
  price: number
  variantId?: string
}

// ── Wallet ────────────────────────────────────────────────────────────
export interface WalletTransaction {
  id: string
  userId: string
  type: 'credit' | 'debit'
  amount: number
  reason: string
  bookingId?: string
  createdAt: Date
}

// ── Coupon ────────────────────────────────────────────────────────────
export interface Coupon {
  id: string
  code: string
  discountType: 'flat' | 'percent'
  discountValue: number
  minOrderValue?: number
  maxDiscount?: number
  expiryDate?: string
  usageLimit?: number
  usedCount?: number
  perUserLimit?: number
  applicableLocationIds?: string[]
  active: boolean
}

// ── Time Slot ─────────────────────────────────────────────────────────
export interface TimeSlot {
  time: string
  available: boolean
  occupancy: number
  maxCapacity: number
}

// ── Toast ─────────────────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}
