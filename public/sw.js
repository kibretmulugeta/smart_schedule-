// Service Worker for Antigravity AI Lock Screen Notifications & Push Alarms
const CACHE_NAME = 'antigravity-schedule-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listen for message from main window to fire high-priority lock-screen notification
self.addEventListener('message', (event) => {
  const data = event.data;
  if (data && data.type === 'TRIGGER_LOCK_SCREEN_ALERT') {
    const title = data.title || '⏰ Antigravity AI Alert';
    const options = {
      body: data.message || 'Scheduled routine or meeting is starting now.',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      // High-priority device vibration to wake the phone and alert through lock screen
      vibrate: [300, 150, 300, 150, 400],
      requireInteraction: true, // Keeps notification active on mobile lock screen until dismissed
      renotify: true,
      tag: `schedule-alert-${data.eventId || Date.now()}`,
      data: {
        url: data.url || '/',
        eventId: data.eventId,
      },
      actions: [
        { action: 'view', title: 'Open Calendar' },
        { action: 'dismiss', title: 'Acknowledge' },
      ],
    };

    event.waitUntil(self.registration.showNotification(title, options));
  }
});

// Handle notification click on phone lock screen or desktop
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
