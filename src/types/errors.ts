export class ApplicationError extends Error {
  code: string
  statusCode: number
  details?: Record<string, unknown>

  constructor(message: string, code: string, statusCode = 500, details?: Record<string, unknown>) {
    super(message)
    this.name = this.constructor.name
    this.code = code
    this.statusCode = statusCode
    this.details = details
    Object.setPrototypeOf(this, ApplicationError.prototype)
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, details)
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

export class NetworkError extends ApplicationError {
  constructor(message = 'Network connection failed', details?: Record<string, unknown>) {
    super(message, 'NETWORK_ERROR', 503, details)
    Object.setPrototypeOf(this, NetworkError.prototype)
  }
}

export class PaymentError extends ApplicationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'PAYMENT_ERROR', 402, details)
    Object.setPrototypeOf(this, PaymentError.prototype)
  }
}

export class APIError extends ApplicationError {
  constructor(message: string, code: string, details?: Record<string, unknown>) {
    super(message, code, 500, details)
    Object.setPrototypeOf(this, APIError.prototype)
  }
}
