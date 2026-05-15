export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogContext {
  [key: string]: unknown
}

export interface LogReporter {
  capture(level: LogLevel, message: string, error?: unknown, context?: LogContext): void
}

const isProd = import.meta.env?.PROD === true
let externalReporter: LogReporter | null = null

export function setLogReporter(reporter: LogReporter | null): void {
  externalReporter = reporter
}

const SENSITIVE_KEYS = new Set([
  'phone', 'phoneNumber', 'otp', 'password', 'token', 'accessToken', 'refreshToken',
  'razorpayPaymentId', 'razorpaySignature', 'cardNumber', 'cvv', 'mobile', 'contact',
  'contactNumber', 'userPhone', 'customerPhone', 'razorpayOrderId', 'secret', 'apiKey', 'pswd',
])

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase()
  for (const s of SENSITIVE_KEYS) {
    if (lower === s.toLowerCase()) return true
  }
  return false
}

function scrub(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(scrub)
  const out: Record<string, unknown> = {}
  for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
    out[key] = isSensitiveKey(key) ? '[redacted]' : scrub(v)
  }
  return out
}

function scrubError(error: unknown): unknown {
  if (error === null || error === undefined) return error
  if (error instanceof Error) {
    const scrubbed = new Error(error.message)
    scrubbed.name = error.name
    scrubbed.stack = error.stack
    return scrubbed
  }
  if (typeof error === 'object') return scrub(error)
  return error
}

function emit(level: LogLevel, message: string, error?: unknown, context?: LogContext): void {
  const safeContext = context ? (scrub(context) as LogContext) : undefined
  const safeError = error !== undefined ? scrubError(error) : undefined

  if (externalReporter) {
    try {
      externalReporter.capture(level, message, safeError, safeContext)
    } catch {
      // Reporter must never break the app.
    }
  }

  if (isProd && (level === 'debug' || level === 'info')) return

  const args: unknown[] = [`[${level}] ${message}`]
  if (safeContext) args.push(safeContext)
  if (safeError !== undefined) args.push(safeError)

  switch (level) {
    case 'debug': console.debug(...args); break
    case 'info': console.info(...args); break
    case 'warn': console.warn(...args); break
    case 'error': console.error(...args); break
  }
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    emit('debug', message, undefined, context)
  },
  info(message: string, context?: LogContext): void {
    emit('info', message, undefined, context)
  },
  warn(message: string, context?: LogContext): void {
    emit('warn', message, undefined, context)
  },
  error(message: string, error?: unknown, context?: LogContext): void {
    emit('error', message, error, context)
  },
}
