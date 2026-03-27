// Clear browser cache and force HTTP for localhost development
console.log('🧹 Clearing browser cache for localhost development...');

// Clear localStorage and sessionStorage
localStorage.clear();
sessionStorage.clear();

// Clear service worker cache if exists
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => registration.unregister());
  });
}

// Clear all caches
if ('caches' in window) {
  caches.keys().then(names => {
    names.forEach(name => caches.delete(name));
  });
}

// Force reload without cache
setTimeout(() => {
  console.log('✅ Cache cleared! Reloading page...');
  window.location.reload(true);
}, 1000);