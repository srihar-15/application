import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, ArrowRight, ChevronLeft, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

type Step = 'phone' | 'otp'

export default function LoginPage() {
  const { sendOTP, verifyOTP, error, clearError } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const otpInputRef = useRef<HTMLInputElement>(null)

  const displayError = localError ?? error

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10)
    setPhone(val)
    setLocalError(null)
    clearError()
  }

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault()
    if (phone.length !== 10) {
      setLocalError('Enter a valid 10-digit mobile number')
      return
    }
    setSending(true)
    setLocalError(null)
    clearError()
    try {
      await sendOTP(`+91${phone}`)
      setStep('otp')
      setTimeout(() => otpInputRef.current?.focus(), 100)
    } catch {
      // Error is set in AuthContext
    } finally {
      setSending(false)
    }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault()
    if (otp.length !== 6) {
      setLocalError('Enter the 6-digit OTP')
      return
    }
    setVerifying(true)
    setLocalError(null)
    clearError()
    try {
      await verifyOTP(otp)
      navigate('/', { replace: true })
    } catch {
      // Error is set in AuthContext
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center px-6">
      {/* reCAPTCHA mount point — invisible, must be in DOM before sendOTP */}
      <div id="recaptcha-container" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo / brand */}
        <div className="text-center mb-10">
          <h1 className="text-2xl font-display font-bold text-white">A Square GoKarting</h1>
          <p className="text-dark-300 text-sm mt-1">Sign in to book your ride</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'phone' ? (
            <motion.form
              key="phone"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleSendOTP}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  Mobile number
                </label>
                <div className="flex items-center bg-dark-800 border border-dark-600 rounded-xl overflow-hidden focus-within:border-primary-500 transition-colors">
                  <span className="flex items-center gap-2 px-4 py-3 border-r border-dark-600 text-dark-300 text-sm whitespace-nowrap">
                    <Phone className="w-4 h-4" />
                    +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoFocus
                    placeholder="9876543210"
                    value={phone}
                    onChange={handlePhoneChange}
                    className="flex-1 bg-transparent px-4 py-3 text-white placeholder-dark-500 text-sm outline-none"
                  />
                </div>
              </div>

              {displayError && (
                <p className="text-red-400 text-sm">{displayError}</p>
              )}

              <button
                type="submit"
                disabled={sending || phone.length !== 10}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all',
                  'bg-primary text-white hover:bg-primary-600',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                )}
              >
                {sending ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>Send OTP <ArrowRight className="w-4 h-4" /></>
                )}
              </button>

              <p className="text-dark-400 text-xs text-center">
                OTP will be sent via SMS. Standard rates apply.
              </p>
            </motion.form>
          ) : (
            <motion.form
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleVerifyOTP}
              className="space-y-4"
            >
              <button
                type="button"
                onClick={() => { setStep('phone'); setOtp(''); clearError(); setLocalError(null) }}
                className="flex items-center gap-1 text-dark-400 text-sm hover:text-white transition-colors mb-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Change number
              </button>

              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1">
                  Enter OTP
                </label>
                <p className="text-dark-400 text-xs mb-3">
                  Sent to +91 {phone}
                </p>
                <input
                  ref={otpInputRef}
                  type="tel"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                    setLocalError(null)
                    clearError()
                  }}
                  className={cn(
                    'w-full bg-dark-800 border rounded-xl px-4 py-3 text-white text-center',
                    'text-xl tracking-[0.5em] placeholder-dark-600 outline-none',
                    'focus:border-primary-500 transition-colors',
                    displayError ? 'border-red-500' : 'border-dark-600',
                  )}
                />
              </div>

              {displayError && (
                <p className="text-red-400 text-sm">{displayError}</p>
              )}

              <button
                type="submit"
                disabled={verifying || otp.length !== 6}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all',
                  'bg-primary text-white hover:bg-primary-600',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                )}
              >
                {verifying ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>Verify OTP <ShieldCheck className="w-4 h-4" /></>
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
