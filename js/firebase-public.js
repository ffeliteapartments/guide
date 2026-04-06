// ════════════════════════════════════════════
//  FIREBASE PUBLIC
//  Caricamento guida pubblica da Firestore
// ════════════════════════════════════════════

// Estrae lo slug della guida dall'URL corrente.
// Supporta:
//   - Path-based: /guida/ff-elite-apartments
//   - Query param: ?guide=ff-elite-apartments
//   - Fallback: 'default'
function getGuideSlugFromUrl() {
  try {
    var path = window.location.pathname;
    var match = path.match(/\/guida\/([^/?#]+)/);
    if (match && match[1]) return decodeURIComponent(match[1]);

    var params = new URLSearchParams(window.location.search);
    var guide = params.get('guide');
    if (guide) return guide;
  } catch (e) {}
  return 'default';
}

// Carica il documento guida da Firestore usando lo slug come document ID.
// - Salva il risultato in localStorage come cache offline.
// - Aggiorna currentData e ri-renderizza se i dati cambiano.
// - Se Firestore non è disponibile o il fetch fallisce, non fa nulla
//   (il rendering avviene già con i dati localStorage/PUBLISHED_DATA).
async function loadGuideFromFirestore(slug) {
  if (!window._firebaseConfigured || !window.db) return;

  var cacheKey = 'bnb_guide_cache_' + slug;

  try {
    var docRef = window.db.collection('guides').doc(slug);
    var docSnap = await docRef.get();

    if (!docSnap.exists) {
      console.warn('[firebase-public] Nessuna guida trovata per slug:', slug);
      return;
    }

    var firestoreData = docSnap.data();

    // Salva in cache locale per uso offline
    try {
      localStorage.setItem(cacheKey, JSON.stringify(firestoreData));
    } catch (e) {
      console.warn('[firebase-public] Impossibile salvare in cache:', e);
    }

    // Aggiorna currentData e ri-renderizza solo se necessario
    if (typeof mergeWithDefaults === 'function' && typeof DEFAULT_DATA !== 'undefined') {
      var merged = mergeWithDefaults(firestoreData, DEFAULT_DATA);
      if (typeof currentData !== 'undefined') {
        currentData = merged;
      }
    }

    if (typeof applyTheme === 'function' && firestoreData.theme) {
      applyTheme(firestoreData.theme);
    }
    if (typeof renderLanding === 'function') renderLanding();
  } catch (e) {
    console.error('[firebase-public] Errore caricamento Firestore:', e);
  }
}

// Ascolta in tempo reale gli aggiornamenti della guida su Firestore.
// Restituisce la funzione unsubscribe.
function subscribeGuideFromFirestore(slug, onUpdate) {
  if (!window._firebaseConfigured || !window.db) return function() {};

  var cacheKey = 'bnb_guide_cache_' + slug;

  var unsubscribe = window.db.collection('guides').doc(slug)
    .onSnapshot(function(docSnap) {
      if (!docSnap.exists) return;
      var firestoreData = docSnap.data();

      try {
        localStorage.setItem(cacheKey, JSON.stringify(firestoreData));
      } catch (e) {}

      if (typeof onUpdate === 'function') onUpdate(firestoreData);
    }, function(e) {
      console.error('[firebase-public] Errore subscription Firestore:', e);
    });

  return unsubscribe;
}

window.getGuideSlugFromUrl       = getGuideSlugFromUrl;
window.loadGuideFromFirestore    = loadGuideFromFirestore;
window.subscribeGuideFromFirestore = subscribeGuideFromFirestore;
