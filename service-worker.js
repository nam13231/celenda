const CACHE_NAME = 'lich-cache-v1';
const OFFLINE_URL = '/offline.html';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

/* Install: cache các tài nguyên */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

/* Activate: dọn cache cũ */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* Fetch: trả về cache trước, fallback network, nếu fail -> offline page */
self.addEventListener('fetch', event => {
  // Bypass for POST, non-GET if needed
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      if(cached) return cached;
      return fetch(event.request).then(resp => {
        // cache a copy for future
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(cache => {
          // only cache successful responses
          if(resp && resp.status === 200 && resp.type === 'basic'){
            cache.put(event.request, copy).catch(()=>{});
          }
        });
        return resp;
      }).catch(()=> caches.match(OFFLINE_URL));
    })
  );
});

/* Background Sync (mẫu): khi reg sync-tasks chạy */
self.addEventListener('sync', event => {
  if (event.tag === 'sync-tasks') {
    event.waitUntil(syncTasks());
  }
});

async function syncTasks(){
  // Mẫu: bạn có thể dùng IndexedDB để lưu tasks và gửi lên server ở đây
  // Đây chỉ log minh hoạ
  console.log('[SW] syncTasks called');
  // TODO: fetch(...) để gửi dữ liệu lên backend nếu có
}

/* Periodic Sync (mẫu) */
self.addEventListener('periodicsync', event => {
  if(event.tag === 'update-calendar'){
    event.waitUntil(periodicUpdate());
  }
});

async function periodicUpdate(){
  console.log('[SW] periodicUpdate called');
  // TODO: fetch latest content and cache it
}

/* Push notifications */
self.addEventListener('push', event => {
  let data = { title: 'Thông báo', body: 'Bạn có cập nhật mới', icon: '/icons/icon-192.png' };
  try { if(event.data) data = event.data.json(); } catch(e){}
  const options = { body: data.body, icon: data.icon, badge: data.icon, data: data };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

/* Notification click */
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.matchAll({type:'window'}).then(list => {
    if(list.length>0) return list[0].focus();
    return clients.openWindow('/');
  }));
});
