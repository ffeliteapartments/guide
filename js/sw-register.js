if ('serviceWorker' in navigator) {
  let refreshing = false;
  // Quando il nuovo SW prende il controllo, ricarica la pagina
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      location.reload();
    }
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then(reg => {
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateBanner(newWorker);
          }
        });
      });
    }).catch(() => {});
  });
}

function showUpdateBanner(worker) {
  if (document.getElementById('sw-update-banner')) return;
  const banner = document.createElement('div');
  banner.id = 'sw-update-banner';
  banner.innerHTML = '🔄 Nuova versione disponibile! <button class="sw-banner-btn-update" id="sw-update-btn">Aggiorna</button><button class="sw-banner-btn-close" id="sw-close-btn">✕</button>';
  document.body.appendChild(banner);

  document.getElementById('sw-close-btn').addEventListener('click', function() { banner.remove(); });
  document.getElementById('sw-update-btn').addEventListener('click', () => {
    // Dice al nuovo SW di attivarsi → trigga controllerchange → reload
    worker.postMessage({ type: 'SKIP_WAITING' });
  });
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
