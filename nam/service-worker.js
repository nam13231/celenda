const CACHE_NAME = 'lich-lam-viec-v1';
const OFFLINE_URL = '/offline.html';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  OFFLINE_URL
];

// Cài đặt SW & cache các file tĩnh
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Kích hoạt & dọn cache cũ
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: ưu tiên cache -> network fallback
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(resp => {
      return resp || fetch(event.request).catch(() => caches.match(OFFLINE_URL));
    })
  );
});

// Background Sync: đồng bộ công việc khi online lại
self.addEventListener('sync', event => {
  if (event.tag === 'sync-tasks') {
    event.waitUntil(syncTasksWithServer());
  }
});

async function syncTasksWithServer() {
  // Ở đây bạn gửi dữ liệu localStorage/IndexedDB lên server
  console.log('🔄 Đồng bộ công việc với server...');
}

// Periodic Sync: cập nhật dữ liệu mỗi 24h
self.addEventListener('periodicsync', event => {
  if (event.tag === 'update-calendar') {
    event.waitUntil(updateCalendarData());
  }
});

async function updateCalendarData() {
  console.log('📅 Cập nhật dữ liệu lịch định kỳ...');
  // Fetch API để cập nhật nếu cần
}

// Push Notification: hiển thị khi nhận thông báo
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || '📢 Thông báo', {
      body: data.body || 'Bạn có cập nhật mới trong Lịch Làm Việc',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png'
    })
  );
});
