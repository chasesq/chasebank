/**
 * Login Security Service
 * Handles rate limiting, account lockout, and security tracking
 */

interface LoginAttempt {
  timestamp: number
  ipAddress?: string
  success: boolean
}

interface AccountLockout {
  locked: boolean
  lockUntil: number
  attempts: number
}

const RATE_LIMIT_CONFIG = {
  MAX_ATTEMPTS: 3,
  INITIAL_LOCKOUT_MS: 15 * 60 * 1000, // 15 minutes
  PROGRESSIVE_MULTIPLIER: 1.5,
  MAX_LOCKOUT_MS: 30 * 60 * 1000, // 30 minutes
}

// In-memory store for rate limiting (in production, use Redis or database)
const loginAttempts = new Map<string, LoginAttempt[]>()
const accountLockouts = new Map<string, AccountLockout>()

export const loginSecurityService = {
  /**
   * Check if an account is locked out
   */
  isAccountLocked(identifier: string): boolean {
    const lockout = accountLockouts.get(identifier)
    if (!lockout || !lockout.locked) return false

    if (Date.now() > lockout.lockUntil) {
      accountLockouts.delete(identifier)
      return false
    }

    return true
  },

  /**
   * Get remaining lockout time in milliseconds
   */
  getLockoutTimeRemaining(identifier: string): number {
    const lockout = accountLockouts.get(identifier)
    if (!lockout || !lockout.locked) return 0

    const remaining = lockout.lockUntil - Date.now()
    return Math.max(0, remaining)
  },

  /**
   * Record a login attempt
   */
  recordLoginAttempt(identifier: string, success: boolean, ipAddress?: string): void {
    const now = Date.now()
    const attempts = loginAttempts.get(identifier) || []

    // Clean up old attempts (older than 1 hour)
    const recentAttempts = attempts.filter((a) => now - a.timestamp < 60 * 60 * 1000)

    recentAttempts.push({
      timestamp: now,
      ipAddress,
      success,
    })

    loginAttempts.set(identifier, recentAttempts)

    // Check if we need to lock the account
    const failedAttempts = recentAttempts.filter((a) => !a.success).length

    if (failedAttempts >= RATE_LIMIT_CONFIG.MAX_ATTEMPTS) {
      this.lockAccount(identifier)
    }
  },

  /**
   * Lock an account after failed login attempts
   */
  lockAccount(identifier: string): void {
    const existingLockout = accountLockouts.get(identifier)
    let lockoutDuration = RATE_LIMIT_CONFIG.INITIAL_LOCKOUT_MS

    // Progressive lockout - increase duration for repeated failures
    if (existingLockout) {
      lockoutDuration = Math.min(
        existingLockout.lockUntil - Date.now() * RATE_LIMIT_CONFIG.PROGRESSIVE_MULTIPLIER,
        RATE_LIMIT_CONFIG.MAX_LOCKOUT_MS,
      )
    }

    const lockUntil = Date.now() + lockoutDuration

    accountLockouts.set(identifier, {
      locked: true,
      lockUntil,
      attempts: (existingLockout?.attempts || 0) + 1,
    })
  },

  /**
   * Unlock an account manually (for admins)
   */
  unlockAccount(identifier: string): void {
    accountLockouts.delete(identifier)
  },

  /**
   * Get login attempt history
   */
  getLoginAttempts(identifier: string, hours: number = 24): LoginAttempt[] {
    const attempts = loginAttempts.get(identifier) || []
    const cutoffTime = Date.now() - hours * 60 * 60 * 1000

    return attempts.filter((a) => a.timestamp > cutoffTime)
  },

  /**
   * Clear login attempts for an account
   */
  clearLoginAttempts(identifier: string): void {
    loginAttempts.delete(identifier)
  },

  /**
   * Validate password against security requirements
   */
  validatePassword(password: string): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (password.length < 12) {
      errors.push('Password must be at least 12 characters long')
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }

    // Check for common patterns
    const commonPatterns = ['123456', 'password', 'qwerty', 'abc123', '000000', '111111']
    if (commonPatterns.some((pattern) => password.toLowerCase().includes(pattern))) {
      errors.push('Password contains common patterns')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  },
}
