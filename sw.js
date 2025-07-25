// 缓存名称和版本，版本更新会触发重新缓存
const CACHE_NAME = 'birthday-wish-cache-v1';

// 需要缓存的资源列表
const resourcesToCache = [
    // 页面自身
    '/',
    // 图片资源
    'img.jpg',
    '微信图片_20250725201919.jpg',
    '微信图片_20250725201943.jpg',
    '微信图片_20250725201952.jpg',
    // 音频资源
    'birthday.mp3',
    // 外部资源
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net/npm/font-awesome@4.7.0/css/font-awesome.min.css',
    'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap'
];

// 安装Service Worker时缓存资源
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('缓存资源中...');
                return cache.addAll(resourcesToCache);
            })
            .then(() => self.skipWaiting())
    );
});

// 激活Service Worker时清理旧缓存
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('删除旧缓存:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 拦截网络请求，优先使用缓存
self.addEventListener('fetch', event => {
    // 对于图片和音频请求，优先使用缓存
    if (event.request.destination === 'image' || event.request.destination === 'audio') {
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    // 缓存命中则返回缓存，同时后台更新缓存
                    if (response) {
                        // 后台更新缓存
                        fetch(event.request).then(networkResponse => {
                            caches.open(CACHE_NAME).then(cache => {
                                cache.put(event.request, networkResponse);
                            });
                        });
                        return response;
                    }

                    // 缓存未命中则从网络获取，并缓存
                    return fetch(event.request).then(networkResponse => {
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, networkResponse.clone());
                        });
                        return networkResponse;
                    });
                })
        );
    } else {
        // 其他请求使用网络优先，缓存兜底策略
        event.respondWith(
            fetch(event.request)
                .then(networkResponse => {
                    // 更新缓存
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, networkResponse.clone());
                    });
                    return networkResponse;
                })
                .catch(() => {
                    // 网络失败时使用缓存
                    return caches.match(event.request);
                })
        );
    }
});

// 缓存完成后通知页面
self.addEventListener('message', event => {
    if (event.data === 'CHECK_CACHE_STATUS') {
        caches.open(CACHE_NAME).then(cache => {
            cache.matchAll().then(responses => {
                if (responses.length > 0) {
                    event.source.postMessage({ type: 'CACHE_COMPLETE' });
                }
            });
        });
    }
});

// 安装完成后通知客户端缓存完成
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(resourcesToCache))
            .then(() => {
                self.clients.matchAll().then(clients => {
                    clients.forEach(client => {
                        client.postMessage({ type: 'CACHE_COMPLETE' });
                    });
                });
            })
    );
});
