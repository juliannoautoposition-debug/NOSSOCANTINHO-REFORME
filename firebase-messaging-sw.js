importScripts('https://www.gstatic.com/firebasejs/11.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.6.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyAc04sOSgo4j461uSijJ3dKMOhXmClMS_M',
  authDomain: 'nossocantinho-b1ac1.firebaseapp.com',
  projectId: 'nossocantinho-b1ac1',
  storageBucket: 'nossocantinho-b1ac1.firebasestorage.app',
  messagingSenderId: '640849577601',
  appId: '1:640849577601:web:c83874ac8970703ebfaf80'
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notification = payload.notification || {};
  const title = notification.title || 'Nosso Cantinho ❤️';
  const options = {
    body: notification.body || 'Você recebeu uma nova notificação.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: payload.data || {}
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || '/';
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
    for (const client of clientList) {
      if ('focus' in client) return client.focus();
    }
    if (clients.openWindow) return clients.openWindow(target);
  }));
});
