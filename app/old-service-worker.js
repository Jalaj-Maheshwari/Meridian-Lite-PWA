var cacheName = 'WeatherByMeridianCache_v1.17';
var filesToCache = [
  '/',
  '/index.html',
  '/scripts/app.js',
  '/scripts/localforage.min.js',
  '/scripts/toastr.js',
  '/styles/style.css',
  '/styles/toastr.min.css',
  '/images/clear.png',
  '/images/cloudy-scattered-showers.png',
  '/images/cloudy.png',
  '/images/fog.png',
  '/images/ic_add_white_24px.svg',
  '/images/ic_refresh_white_24px.svg',
  '/images/partly-cloudy.png',
  '/images/rain.png',
  '/images/scattered-showers.png',
  '/images/sleet.png',
  '/images/snow.png',
  '/images/thunderstorm.png',
  '/images/wind.png'
];

/* 
 * Cache all the required files once this service worker is installed in the client browser.
 */
// Here 'self' refers to 'window.self' & 'e'refers to event paramter of class 'Extendable Event'. 
// Refer below link for difference between 'self' and 'this' keyword : 
// https://stackoverflow.com/questions/16875767/difference-between-this-and-self-in-javascript
self.addEventListener('install', function(e) {
  console.log('[ServiceWorker] Install');
  // the ExtendableEvent.waitUntil() method extends the lifetime of the event. 
  // If you don't call it inside a method, the service worker could be stopped at any time.
  // the waitUntil() method is used to tell the browser not to terminate the service worker 
  // until the promise (Promise Overview: https://www.sitepoint.com/overview-javascript-promises/) 
  // passed to waitUntil is either resolved or rejected. Here,'caches' acts a as promise object.
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      console.log('[ServiceWorker] Caching app shell');
      // The addAll() method of the Cache interface takes an array of URLs, retrieves them, 
      // and adds the resulting response objects to the given cache. The request objects created 
      // during retrieval become keys to the stored response operations.
      return cache.addAll(filesToCache);
    }));
  // `skipWaiting()` forces the waiting ServiceWorker to become the
  // active ServiceWorker, triggering the `onactivate` event.
  // Together with `Clients.claim()` this allows a worker to take effect
  // immediately in the client(s).
  return self.skipWaiting();	
  });

/* 
 * Update the app shell cache (by deleting old cached files) with new changes once 
 * this service worker is activated.
 */  
self.addEventListener('activate', function(e) {
	console.log('[ServiceWorker] Activate');
	e.waitUntil(
  	caches.keys().then(function(keyList) {
  		// The Promise.all(iterable) method returns a single Promise that resolves when all of 
  		// the promises in the iterable argument have resolved or when the iterable argument 
  		// contains no promises. It rejects with the reason of the first promise that rejects.
  		// The map() method creates a new array with the results of calling a function for 
  		// every array element in same order. Here, 'key' refers to objects to each of 
  		// cache files saved earlier. 
    	return Promise.all(keyList.map(function(key) {
      	if (key !== cacheName) {
        	console.log('[ServiceWorker] Removing old cache', key);
        	return caches.delete(key);
      	}
    	}));
    })
	);
	// When a service worker is initially registered, pages won't use it until they next load. 
	// The claim() method causes those pages to be controlled immediately so that the caches 
	// would be updated immediately.
    return self.clients.claim();  
});

/*
 * Serve the app shell from local cache by re-defining the action that should happen
 * on browser's default fetch request. 
 */
self.addEventListener('fetch', function(e) {
  // The request read-only property of the FetchEvent interface returns the Request that 
  // triggered the event handler.		
  console.log('[ServiceWorker] Fetch', e.request.url);
  // The respondWith() method of FetchEvenst prevents the browser's default fetch handling,
  // and allows you to provide a promise for a Response yourself.
  // Here, This promise resolves to see if the file requested in fetch request is present in 
  // in the cache [using caches.match()] and returns a 'file' or 'undefind' as a response.      
  // If no match is found, the code fetches a response from the network.
  e.respondWith(
    caches.match(e.request).then(function(response) {
      return response || fetch(e.request);
    })
  );
});
