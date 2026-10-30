// Service worker mínimo. No guarda nada en caché ni usa servidor de push.
// Existe porque Chrome en Android NO permite "new Notification()":
// las notificaciones del sistema solo se pueden mostrar con registration.showNotification().

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

// Al tocar la notificación, vuelve a la app (o la abre si estaba cerrada)
self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
            for (const client of list) {
                if ('focus' in client) return client.focus();
            }
            return self.clients.openWindow('./');
        })
    );
});
