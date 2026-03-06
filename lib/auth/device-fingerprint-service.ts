/**
 * Device Fingerprint Service
 * Generates a unique identifier for devices and tracks them
 */

interface DeviceFingerprint {
  id: string
  userAgent: string
  platform: string
  language: string
  timezone: string
  screenResolution: string
  hardwareConcurrency?: number
  deviceMemory?: number
  createdAt: number
  lastSeen: number
}

interface StoredDevice {
  fingerprintId: string
  name: string
  isTrusted: boolean
  createdAt: number
  lastUsed: number
  expiresAt: number
  location?: {
    country: string
    city: string
  }
}

const trustedDevices = new Map<string, StoredDevice[]>()

export const deviceFingerprintService = {
  /**
   * Generate a device fingerprint
   */
  generateFingerprint(): DeviceFingerprint {
    if (typeof window === 'undefined') {
      return {
        id: '',
        userAgent: '',
        platform: '',
        language: '',
        timezone: '',
        screenResolution: '',
        createdAt: Date.now(),
        lastSeen: Date.now(),
      }
    }

    const navigator_ = navigator
    const screen_ = window.screen

    // Create a unique identifier based on device characteristics
    const fingerprintData = {
      userAgent: navigator_.userAgent,
      language: navigator_.language,
      platform: navigator_.platform,
      screenResolution: `${screen_.width}x${screen_.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      hardwareConcurrency: navigator_.hardwareConcurrency || 0,
      deviceMemory: (navigator_ as any).deviceMemory || 0,
    }

    // Generate a simple hash
    const fingerprintString = JSON.stringify(fingerprintData)
    const hash = this.simpleHash(fingerprintString)

    return {
      id: hash,
      userAgent: fingerprintData.userAgent,
      platform: fingerprintData.platform,
      language: fingerprintData.language,
      timezone: fingerprintData.timezone,
      screenResolution: fingerprintData.screenResolution,
      hardwareConcurrency: fingerprintData.hardwareConcurrency,
      deviceMemory: fingerprintData.deviceMemory,
      createdAt: Date.now(),
      lastSeen: Date.now(),
    }
  },

  /**
   * Simple hash function for fingerprint data
   */
  simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16)
  },

  /**
   * Check if a device is trusted
   */
  isDeviceTrusted(userId: string, fingerprintId: string): boolean {
    const devices = trustedDevices.get(userId) || []
    const device = devices.find((d) => d.fingerprintId === fingerprintId)

    if (!device) return false
    if (!device.isTrusted) return false
    if (Date.now() > device.expiresAt) {
      // Device trust has expired
      this.removeTrustedDevice(userId, fingerprintId)
      return false
    }

    return true
  },

  /**
   * Mark a device as trusted
   */
  trustDevice(
    userId: string,
    fingerprintId: string,
    deviceName?: string,
    trustDurationDays: number = 30,
  ): StoredDevice {
    const devices = trustedDevices.get(userId) || []

    // Remove existing entry if present
    const filteredDevices = devices.filter((d) => d.fingerprintId !== fingerprintId)

    const now = Date.now()
    const newDevice: StoredDevice = {
      fingerprintId,
      name: deviceName || this.generateDeviceName(),
      isTrusted: true,
      createdAt: now,
      lastUsed: now,
      expiresAt: now + trustDurationDays * 24 * 60 * 60 * 1000,
    }

    filteredDevices.push(newDevice)
    trustedDevices.set(userId, filteredDevices)

    return newDevice
  },

  /**
   * Remove a trusted device
   */
  removeTrustedDevice(userId: string, fingerprintId: string): void {
    const devices = trustedDevices.get(userId) || []
    const filtered = devices.filter((d) => d.fingerprintId !== fingerprintId)
    if (filtered.length > 0) {
      trustedDevices.set(userId, filtered)
    } else {
      trustedDevices.delete(userId)
    }
  },

  /**
   * Get all trusted devices for a user
   */
  getTrustedDevices(userId: string): StoredDevice[] {
    const devices = trustedDevices.get(userId) || []
    const now = Date.now()

    // Filter out expired devices
    const validDevices = devices.filter((d) => now < d.expiresAt)

    // Update storage
    if (validDevices.length > 0) {
      trustedDevices.set(userId, validDevices)
    } else {
      trustedDevices.delete(userId)
    }

    return validDevices
  },

  /**
   * Update last used time for a device
   */
  updateLastUsed(userId: string, fingerprintId: string): void {
    const devices = trustedDevices.get(userId) || []
    const device = devices.find((d) => d.fingerprintId === fingerprintId)

    if (device) {
      device.lastUsed = Date.now()
    }
  },

  /**
   * Generate a human-readable device name
   */
  generateDeviceName(): string {
    const devices = ['iPhone', 'iPad', 'MacBook', 'Windows PC', 'Android', 'Chromebook']
    const device = devices[Math.floor(Math.random() * devices.length)]
    const now = new Date()
    const date = `${now.getMonth() + 1}/${now.getDate()}`
    return `${device} - ${date}`
  },

  /**
   * Get device info for display
   */
  getDeviceInfo(fingerprint: DeviceFingerprint): {
    type: string
    name: string
    browser: string
  } {
    const ua = fingerprint.userAgent.toLowerCase()

    let type = 'Computer'
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      type = 'Mobile'
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      type = 'Tablet'
    }

    let browser = 'Unknown'
    if (ua.includes('firefox')) browser = 'Firefox'
    else if (ua.includes('chrome')) browser = 'Chrome'
    else if (ua.includes('safari')) browser = 'Safari'
    else if (ua.includes('edge')) browser = 'Edge'

    return {
      type,
      name: `${type} • ${browser}`,
      browser,
    }
  },
}
