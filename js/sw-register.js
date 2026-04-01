if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then(reg => {
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateBanner();
          }
        });
      });
    }).catch(() => {});
  });
}

function showUpdateBanner() {
  if (document.getElementById('sw-update-banner')) return;
  const banner = document.createElement('div');
  banner.id = 'sw-update-banner';
  banner.innerHTML = '🔄 Nuova versione disponibile! <button class="sw-banner-btn-update" onclick="location.reload()">Aggiorna</button><button class="sw-banner-btn-close" onclick="this.parentElement.remove()">✕</button>';
  document.body.appendChild(banner);
}

// Call init after all scripts are loaded.
// Use a retry loop in case deferred scripts haven't finished loading yet
// (script execution order isn't guaranteed across all browsers/configurations).
function tryInit(attempts) {
  if (typeof init === 'function') {
    init();
  } else if (attempts > 0) {
    setTimeout(() => tryInit(attempts - 1), 50);
  }
}
tryInit(10);
