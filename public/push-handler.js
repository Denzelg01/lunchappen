self.addEventListener('push', (event) => {
    let notification = {
        title: 'Lunch JB',
        body: 'Dagens lunchmeny är klar.',
        url: '/',
    }

    if (event.data) {
        try {
            notification = {
                ...notification,
                ...event.data.json(),
            }
        } catch {
            notification.body = event.data.text()
        }
    }

    event.waitUntil(
        self.registration.showNotification(notification.title, {
            body: notification.body,
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            data: {
                url: notification.url,
            },
            tag: 'lunch-jb-daily',
        }),
    )
})

self.addEventListener('notificationclick', (event) => {
    event.notification.close()

    const targetUrl = new URL(
        event.notification.data?.url || '/',
        self.location.origin,
    ).href

    event.waitUntil(
        self.clients
            .matchAll({
                type: 'window',
                includeUncontrolled: true,
            })
            .then((windowClients) => {
                const existingWindow = windowClients.find(
                    (client) => client.url === targetUrl,
                )

                if (existingWindow) {
                    return existingWindow.focus()
                }

                return self.clients.openWindow(targetUrl)
            }),
    )
})