/**
 * Service Worker for Chase Banking Push Notifications
 * Handles background push notifications for credit/debit alerts
 */

const CACHE_NAME = 'chase-banking-v1'
const NOTIFICATION_BADGE = '/icon-light-32x32.png'

// Install event
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Push notification event - fires when a push message is received
self.addEventListener('push', (event) => {
  let data = { title: 'Chase', body: 'You have a new notification', type: 'info' }

  if (event.data) {
    try {
      data = event.data.json()
    } catch {
      data.body = event.data.text()
    }
  }

  const isCredit = data.type === 'credit'
  const isDebit = data.type === 'debit'

  const options = {
    body: data.body || data.message,
    icon: NOTIFICATION_BADGE,
    badge: NOTIFICATION_BADGE,
    tag: data.tag || `chase-${Date.now()}`,
    renotify: true,
    requireInteraction: true,
    vibrate: isCredit ? [200, 100, 200] : [100, 50, 100, 50, 100],
    data: {
      url: data.url || '/',
      type: data.type,
      amount: data.amount,
      notificationId: data.notificationId,
    },
    actions: [
      { action: 'view', title: 'View Details' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') return

  const urlToOpen = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus()
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            data: event.notification.data,
          })
          return
        }
      }
      // Otherwise open new window
      return self.clients.openWindow(urlToOpen)
    })
  )
})

// Message handler for showing notifications from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, notificationType, amount, tag, notificationId } = event.data

    const isCredit = notificationType === 'credit'

    const options = {
      body,
      icon: NOTIFICATION_BADGE,
      badge: NOTIFICATION_BADGE,
      tag: tag || `chase-${Date.now()}`,
      renotify: true,
      requireInteraction: true,
      vibrate: isCredit ? [200, 100, 200] : [100, 50, 100, 50, 100],
      data: {
        url: '/',
        type: notificationType,
        amount,
        notificationId,
      },
      actions: [
        { action: 'view', title: 'View Details' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    }

    event.waitUntil(
      self.registration.showNotification(title, options)
    )
  }
})
