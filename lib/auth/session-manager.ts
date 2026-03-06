/**
 * Session Manager
 * Handles user session lifecycle, timeouts, and multi-device sessions
 */

interface SessionData {
  sessionId: string
  userId: string
  deviceId: string
  createdAt: number
  lastActivityAt: number
  expiresAt: number
  ipAddress?: string
  location?: {
    country: string
    city: string
  }
}

interface SessionConfig {
  SESSION_TIMEOUT_MS: number // Inactivity timeout
  WARNING_BEFORE_EXPIRY_MS: number // Show warning before timeout
  MAX_SESSION_DURATION_MS: number // Absolute max duration
}

const DEFAULT_CONFIG: SessionConfig = {
  SESSION_TIMEOUT_MS: 15 * 60 * 1000, // 15 minutes
  WARNING_BEFORE_EXPIRY_MS: 2 * 60 * 1000, // 2 minutes before expiry
  MAX_SESSION_DURATION_MS: 8 * 60 * 60 * 1000, // 8 hours absolute max
}

const sessions = new Map<string, SessionData>()
const userSessions = new Map<string, string[]>() // userId -> sessionIds

export const sessionManager = {
  /**
   * Create a new session
   */
  createSession(
    userId: string,
    deviceId: string,
    ipAddress?: string,
    config: Partial<SessionConfig> = {},
  ): SessionData {
    const finalConfig = { ...DEFAULT_CONFIG, ...config }
    const sessionId = this.generateSessionId()
    const now = Date.now()

    const session: SessionData = {
      sessionId,
      userId,
      deviceId,
      createdAt: now,
      lastActivityAt: now,
      expiresAt: now + finalConfig.MAX_SESSION_DURATION_MS,
      ipAddress,
    }

    sessions.set(sessionId, session)

    // Track session for user
    const userSessionIds = userSessions.get(userId) || []
    userSessionIds.push(sessionId)
    userSessions.set(userId, userSessionIds)

    return session
  },

  /**
   * Get session by ID
   */
  getSession(sessionId: string): SessionData | null {
    const session = sessions.get(sessionId)
    if (!session) return null

    const config = DEFAULT_CONFIG
    if (Date.now() > session.expiresAt) {
      this.destroySession(sessionId)
      return null
    }

    return session
  },

  /**
   * Update session activity
   */
  updateSessionActivity(sessionId: string): SessionData | null {
    const session = this.getSession(sessionId)
    if (!session) return null

    const config = DEFAULT_CONFIG
    session.lastActivityAt = Date.now()
    session.expiresAt = session.lastActivityAt + config.MAX_SESSION_DURATION_MS

    return session
  },

  /**
   * Check if session is about to expire
   */
  isSessionExpiring(sessionId: string): boolean {
    const session = this.getSession(sessionId)
    if (!session) return true

    const config = DEFAULT_CONFIG
    const timeUntilExpiry = session.expiresAt - Date.now()

    return timeUntilExpiry < config.WARNING_BEFORE_EXPIRY_MS
  },

  /**
   * Get time remaining before session expires
   */
  getTimeRemaining(sessionId: string): number {
    const session = this.getSession(sessionId)
    if (!session) return 0

    return Math.max(0, session.expiresAt - Date.now())
  },

  /**
   * Destroy a session
   */
  destroySession(sessionId: string): void {
    const session = sessions.get(sessionId)
    if (!session) return

    sessions.delete(sessionId)

    // Remove from user sessions
    const userSessionIds = userSessions.get(session.userId) || []
    const filtered = userSessionIds.filter((id) => id !== sessionId)

    if (filtered.length > 0) {
      userSessions.set(session.userId, filtered)
    } else {
      userSessions.delete(session.userId)
    }
  },

  /**
   * Destroy all sessions for a user
   */
  destroyAllUserSessions(userId: string): void {
    const userSessionIds = userSessions.get(userId) || []
    userSessionIds.forEach((sessionId) => sessions.delete(sessionId))
    userSessions.delete(userId)
  },

  /**
   * Destroy all sessions except one
   */
  destroyAllUserSessionsExcept(userId: string, keepSessionId: string): void {
    const userSessionIds = userSessions.get(userId) || []
    userSessionIds.forEach((sessionId) => {
      if (sessionId !== keepSessionId) {
        sessions.delete(sessionId)
      }
    })
    userSessions.set(userId, [keepSessionId])
  },

  /**
   * Get all active sessions for a user
   */
  getUserSessions(userId: string): SessionData[] {
    const userSessionIds = userSessions.get(userId) || []
    return userSessionIds
      .map((id) => this.getSession(id))
      .filter((session): session is SessionData => session !== null)
  },

  /**
   * Check if user has multiple active sessions
   */
  hasMultipleSessions(userId: string): boolean {
    const sessions_ = this.getUserSessions(userId)
    return sessions_.length > 1
  },

  /**
   * Generate a unique session ID
   */
  generateSessionId(): string {
    const randomBytes = new Uint8Array(16)
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(randomBytes)
    } else {
      // Fallback for server-side
      for (let i = 0; i < randomBytes.length; i++) {
        randomBytes[i] = Math.floor(Math.random() * 256)
      }
    }

    return Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  },

  /**
   * Clear expired sessions (cleanup)
   */
  clearExpiredSessions(): number {
    let cleared = 0
    const now = Date.now()

    for (const [sessionId, session] of sessions.entries()) {
      if (now > session.expiresAt) {
        this.destroySession(sessionId)
        cleared++
      }
    }

    return cleared
  },
}
