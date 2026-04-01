if ('serviceWorker' in navigator) {
  let refreshing = false;
  // Quando il nuovo SW prende il controllo, ricarica la pagina
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      location.reload();
    }
  });

  // Listen for background-update notifications from stale-while-revalidate
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data && event.data.type === 'CONTENT_UPDATED') {
      // null = background update (no SW worker reference needed; reload directly)
      showUpdateBanner(null);
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

function _swBannerLang() {
  try {
    return (typeof currentLang !== 'undefined' && currentLang) ||
      localStorage.getItem('bnb_lang') ||
      document.documentElement.lang ||
      'it';
  } catch (_) { return 'it'; }
}

function showUpdateBanner(worker) {
  // If the user just clicked "Update", skip showing the banner on the first reload
  if (sessionStorage.getItem('sw_just_updated')) {
    sessionStorage.removeItem('sw_just_updated');
    return;
  }
  if (document.getElementById('sw-update-banner')) return;
  const lang = _swBannerLang();
  const isEn = lang === 'en';
  const msg    = isEn ? '🔄 New version available!'   : '🔄 Nuova versione disponibile!';
  const btnUpd = isEn ? 'Update'                       : 'Aggiorna';
  const banner = document.createElement('div');
  banner.id = 'sw-update-banner';
  banner.innerHTML = `${msg} <button class="sw-banner-btn-update" id="sw-update-btn">${btnUpd}</button><button class="sw-banner-btn-close" id="sw-close-btn">✕</button>`;
  document.body.appendChild(banner);

  document.getElementById('sw-close-btn').addEventListener('click', function() { banner.remove(); });
  document.getElementById('sw-update-btn').addEventListener('click', () => {
    sessionStorage.setItem('sw_just_updated', '1');
    if (worker) {
      // Dice al nuovo SW di attivarsi → trigga controllerchange → reload
      worker.postMessage({ type: 'SKIP_WAITING' });
    } else {
      // Background update — just reload to get fresh assets
      location.reload();
    }
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
