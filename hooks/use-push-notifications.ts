'use client'

import { useEffect, useRef, useCallback } from 'react'

/**
 * Hook to register the service worker and handle push notification permissions.
 * Call this once at the app level after the user logs in.
 */
export function usePushNotifications() {
  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null)
  const permissionRef = useRef<NotificationPermission>('default')

  // Register service worker on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        })
        swRegistrationRef.current = registration
        console.log('[v0] Service Worker registered successfully')

        // Check current permission status
        if ('Notification' in window) {
          permissionRef.current = Notification.permission
        }
      } catch (error) {
        console.error('[v0] Service Worker registration failed:', error)
      }
    }

    registerSW()

    // Listen for messages from service worker (notification clicks)
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NOTIFICATION_CLICKED') {
        console.log('[v0] Notification clicked:', event.data.data)
        // Could navigate to transaction details, etc.
      }
    }

    navigator.serviceWorker.addEventListener('message', handleMessage)

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage)
    }
  }, [])

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false
    if (!('Notification' in window)) return false

    if (Notification.permission === 'granted') {
      permissionRef.current = 'granted'
      return true
    }

    if (Notification.permission === 'denied') {
      permissionRef.current = 'denied'
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      permissionRef.current = permission
      return permission === 'granted'
    } catch {
      return false
    }
  }, [])

  // Send a push notification via the service worker
  const showNotification = useCallback(
    async (options: {
      title: string
      body: string
      type?: 'credit' | 'debit' | 'info' | 'alert'
      amount?: number
      tag?: string
      notificationId?: string
    }) => {
      // First try using the service worker (works even in background)
      if (swRegistrationRef.current?.active) {
        swRegistrationRef.current.active.postMessage({
          type: 'SHOW_NOTIFICATION',
          title: options.title,
          body: options.body,
          notificationType: options.type || 'info',
          amount: options.amount,
          tag: options.tag || `chase-${Date.now()}`,
          notificationId: options.notificationId,
        })
        return true
      }

      // Fallback to basic Notification API
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(options.title, {
          body: options.body,
          icon: '/icon-light-32x32.png',
          tag: options.tag || `chase-${Date.now()}`,
        })
        return true
      }

      return false
    },
    []
  )

  return {
    requestPermission,
    showNotification,
    isSupported: typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window,
    permission: permissionRef.current,
  }
}
