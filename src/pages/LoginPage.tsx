import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, ArrowRight, ChevronLeft, ShieldCheck, RotateCcw } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

type Step = 'phone' | 'otp'

const OTP_LENGTH = 6
const RESEND_COOLDOWN = 30

export default function LoginPage() {
  const { sendOTP, verifyOTP, error, clearError } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  const digitRefs = useRef<(HTMLInputElement | null)[]>([])
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const displayError = localError ?? error
  const otp = digits.join('')

  const startCooldown = useCallback(() => {
    setResendCooldown(RESEND_COOLDOWN)
    cooldownTimer.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownTimer.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  useEffect(() => () => { if (cooldownTimer.current) clearInterval(cooldownTimer.current) }, [])

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
    setLocalError(null)
    clearError()
  }

  async function handleSendOTP(e?: React.FormEvent) {
    e?.preventDefault()
    if (phone.length !== 10) {
      setLocalError('Enter a valid 10-digit mobile number')
      return
    }
    setSending(true)
    setLocalError(null)
    clearError()
    try {
      await sendOTP(`+91${phone}`)
      setDigits(Array(OTP_LENGTH).fill(''))
      setStep('otp')
      startCooldown()
      setTimeout(() => digitRefs.current[0]?.focus(), 150)
    } catch {
      // error set in AuthContext
    } finally {
      setSending(false)
    }
  }

  async function handleVerifyOTP() {
    if (otp.length !== OTP_LENGTH) return
    setVerifying(true)
    setLocalError(null)
    clearError()
    try {
      await verifyOTP(otp)
      setSuccess(true)
      setTimeout(() => navigate('/', { replace: true }), 2000)
    } catch {
      setDigits(Array(OTP_LENGTH).fill(''))
      digitRefs.current[0]?.focus()
    } finally {
      setVerifying(false)
    }
  }

  function handleDigitChange(index: number, value: string) {
    const char = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = char
    setDigits(next)
    setLocalError(null)
    clearError()

    if (char && index < OTP_LENGTH - 1) {
      digitRefs.current[index + 1]?.focus()
    }

    if (next.join('').length === OTP_LENGTH) {
      // slight delay so last digit renders before submit
      setTimeout(handleVerifyOTP, 80)
    }
  }

  function handleDigitKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      const next = [...digits]
      next[index - 1] = ''
      setDigits(next)
      digitRefs.current[index - 1]?.focus()
    }
  }

  function handleDigitPaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return
    const next = [...digits]
    pasted.split('').forEach((ch, i) => { next[i] = ch })
    setDigits(next)
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1)
    digitRefs.current[focusIndex]?.focus()
    if (pasted.length === OTP_LENGTH) {
      setTimeout(handleVerifyOTP, 80)
    }
  }

  function handleBack() {
    setStep('phone')
    setDigits(Array(OTP_LENGTH).fill(''))
    setLocalError(null)
    clearError()
    if (cooldownTimer.current) clearInterval(cooldownTimer.current)
    setResendCooldown(0)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* reCAPTCHA mount — must be in DOM before sendOTP */}
      <div id="recaptcha-container" className="hidden" />

      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-orange-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center px-5 py-12">
        {/* Brand */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 mb-5">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-orange-400 text-xs font-semibold tracking-wide uppercase">Live Track Booking</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">A Square GoKarting</h1>
          <p className="text-gray-400 text-sm mt-2">Sign in to book your ride</p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-sm bg-gray-900/80 border border-gray-800 rounded-2xl p-7 backdrop-blur-xl shadow-2xl"
        >
          <AnimatePresence mode="wait">
            {step === 'phone' ? (
              <motion.form
                key="phone"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleSendOTP}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-lg font-semibold text-white mb-1">Enter your mobile number</h2>
                  <p className="text-gray-500 text-xs">We'll send you a 6-digit OTP to verify</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
                    Mobile number
                  </label>
                  <div className={cn(
                    'flex items-center rounded-xl overflow-hidden border transition-all duration-200',
                    'bg-gray-800/60',
                    localError ? 'border-red-500/60' : 'border-gray-700 focus-within:border-blue-500',
                  )}>
                    <span className="flex items-center gap-2 px-4 py-3.5 border-r border-gray-700 text-gray-400 text-sm select-none">
                      <Phone className="w-4 h-4" />
                      +91
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      autoFocus
                      autoComplete="tel"
                      placeholder="98765 43210"
                      value={phone}
                      onChange={handlePhoneChange}
                      className="flex-1 bg-transparent px-4 py-3.5 text-white placeholder-gray-600 text-sm outline-none"
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {displayError && (
                    <motion.p
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-red-400 text-sm flex items-start gap-2"
                    >
                      <span className="mt-0.5">⚠</span> {displayError}
                    </motion.p>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={sending || phone.length !== 10}
                  className={cn(
                    'w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl',
                    'font-semibold text-sm transition-all duration-200',
                    'bg-blue-600 text-white hover:bg-blue-500',
                    'disabled:opacity-40 disabled:cursor-not-allowed',
                    'active:scale-[0.98]',
                  )}
                >
                  {sending ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Send OTP <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>

                <p className="text-gray-600 text-xs text-center">
                  OTP will be sent via SMS. Standard carrier rates apply.
                </p>
              </motion.form>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                <div>
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex items-center gap-1 text-gray-500 text-xs hover:text-white transition-colors mb-4"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Change number
                  </button>
                  <h2 className="text-lg font-semibold text-white mb-1">Enter OTP</h2>
                  <p className="text-gray-500 text-xs">
                    Sent to <span className="text-gray-300 font-medium">+91 {phone.slice(0, 5)} {phone.slice(5)}</span>
                  </p>
                </div>

                {/* OTP digit boxes */}
                <div className="flex gap-2.5 justify-between" onPaste={handleDigitPaste}>
                  {digits.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { digitRefs.current[i] = el }}
                      type="tel"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(i, e.target.value)}
                      onKeyDown={(e) => handleDigitKeyDown(i, e)}
                      disabled={verifying}
                      className={cn(
                        'w-full aspect-square rounded-xl border text-center text-xl font-bold text-white',
                        'bg-gray-800/60 outline-none transition-all duration-150',
                        'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20',
                        digit ? 'border-blue-500/50' : 'border-gray-700',
                        displayError ? 'border-red-500/60 bg-red-500/5' : '',
                        verifying ? 'opacity-50' : '',
                      )}
                    />
                  ))}
                </div>

                <AnimatePresence>
                  {displayError && (
                    <motion.p
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-red-400 text-sm flex items-start gap-2"
                    >
                      <span className="mt-0.5">⚠</span> {displayError}
                    </motion.p>
                  )}
                </AnimatePresence>

                <button
                  type="button"
                  onClick={handleVerifyOTP}
                  disabled={verifying || otp.length !== OTP_LENGTH}
                  className={cn(
                    'w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl',
                    'font-semibold text-sm transition-all duration-200',
                    'bg-blue-600 text-white hover:bg-blue-500',
                    'disabled:opacity-40 disabled:cursor-not-allowed',
                    'active:scale-[0.98]',
                  )}
                >
                  {verifying ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Verify OTP <ShieldCheck className="w-4 h-4" /></>
                  )}
                </button>

                {/* Resend */}
                <div className="text-center">
                  {resendCooldown > 0 ? (
                    <p className="text-gray-500 text-xs">
                      Resend OTP in <span className="text-gray-300 font-medium tabular-nums">{resendCooldown}s</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendOTP()}
                      disabled={sending}
                      className="flex items-center gap-1.5 mx-auto text-blue-400 text-xs font-medium hover:text-blue-300 transition-colors disabled:opacity-50"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Resend OTP
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Terms */}
        <p className="text-gray-700 text-xs text-center mt-6 max-w-xs">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>

      {/* Success overlay */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-950"
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', duration: 0.6 }}
              className="relative flex items-center justify-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="absolute w-32 h-32 rounded-full border border-blue-500/20 border-t-blue-500/60"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                className="absolute w-44 h-44 rounded-full border border-orange-500/10 border-t-orange-500/40"
              />
              <div className="w-20 h-20 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center">
                <ShieldCheck className="w-9 h-9 text-blue-400" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mt-8 text-center"
            >
              <p className="text-white font-semibold text-lg">Verified!</p>
              <p className="text-gray-500 text-sm mt-1">Taking you to your dashboard…</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-1.5 mt-6"
            >
              {[0, 150, 300].map((delay) => (
                <div
                  key={delay}
                  className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
