const CACHE_NAME = 'scratch-win-v1'; // കാഷിന്റെ പേര് (വേർഷൻ മാറിക്കൊണ്ടിരിക്കാം)
const urlsToCache = [
    './', // index.html
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    // നിങ്ങൾ ഉപയോഗിക്കുന്ന icon ചിത്രങ്ങളുടെ പാത ഇവിടെ ചേർക്കുക
    './icons/icon-72x72.png',
    './icons/icon-96x96.png',
    './icons/icon-128x128.png',
    './icons/icon-144x144.png',
    './icons/icon-152x152.png',
    './icons/icon-192x192.png',
    './icons/icon-384x384.png',
    './icons/icon-512x512.png'
    // Google Fonts-ഉം ഇവിടെ കാഷ് ചെയ്യാം, പക്ഷെ അത് കുറച്ച് സങ്കീർണ്ണമാണ്.
    // ഉദാ: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Poppins:wght@600;700&display=swap'
];

// Service Worker ഇൻസ്റ്റാൾ ചെയ്യുമ്പോൾ
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache); // കാഷ് ചെയ്യേണ്ട ഫയലുകൾ ചേർക്കുന്നു
            })
    );
});

// നെറ്റ്വർക്ക് അഭ്യർത്ഥനകൾ കൈകാര്യം ചെയ്യാൻ
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // കാഷിൽ ഫയൽ ഉണ്ടെങ്കിൽ അത് തിരികെ നൽകുന്നു
                if (response) {
                    return response;
                }
                // കാഷിൽ ഇല്ലെങ്കിൽ നെറ്റ്‌വർക്കിൽ നിന്ന് നേടുന്നു
                return fetch(event.request).catch(() => {
                    // നെറ്റ്‌വർക്ക് ലഭ്യമല്ലെങ്കിൽ ഒരു ഓഫ്‌ലൈൻ പേജ് കാണിക്കാം (ഓപ്ഷണൽ)
                    // ഉദാ: return caches.match('/offline.html');
                });
            })
    );
});

// പഴയ കാഷുകൾ നീക്കം ചെയ്യാൻ
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) { // പുതിയ കാഷല്ലെങ്കിൽ നീക്കം ചെയ്യുക
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
                  
