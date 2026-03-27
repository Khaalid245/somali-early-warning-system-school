// EMERGENCY BROWSER CACHE CLEAR - Run this in browser console
console.log('🚨 EMERGENCY CACHE CLEAR - Fixing SSL errors');

// 1. Clear all storage
localStorage.clear();
sessionStorage.clear();
console.log('✅ Storage cleared');

// 2. Clear all caches
if ('caches' in window) {
  caches.keys().then(names => {
    names.forEach(name => {
      caches.delete(name);
      console.log('✅ Cache deleted:', name);
    });
  });
}

// 3. Unregister service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister();
      console.log('✅ Service worker unregistered');
    });
  });
}

// 4. Force reload without cache
setTimeout(() => {
  console.log('🔄 Hard reloading page...');
  window.location.reload(true);
}, 2000);