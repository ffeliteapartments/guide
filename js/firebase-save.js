// ════════════════════════════════════════════
//  FIREBASE SAVE
//  Salvataggio dati guida su Firestore
// ════════════════════════════════════════════

// Salva/aggiorna il documento guida su Firestore.
// Verifica che l'utente sia autenticato e che il guideSlug
// corrisponda al suo profilo Firestore.
async function saveGuideToFirestore(data) {
  if (!window._firebaseConfigured || !window.db || !window.auth) return;

  var user = window.auth.currentUser;
  if (!user) {
    console.warn('[firebase-save] Nessun utente autenticato, salvataggio Firestore saltato.');
    return;
  }

  // Verifica profilo e slug
  var guideSlug = null;
  try {
    var profileSnap = await window.db.collection('users').doc(user.uid).get();
    if (profileSnap.exists) {
      guideSlug = profileSnap.data().guideSlug || null;
    }
  } catch (e) {
    console.warn('[firebase-save] Impossibile leggere profilo utente:', e);
  }

  // Fallback slug dall'URL
  if (!guideSlug && typeof getGuideSlugFromUrl === 'function') {
    guideSlug = getGuideSlugFromUrl();
  }
  if (!guideSlug) {
    console.warn('[firebase-save] guideSlug non determinabile, salvataggio Firestore saltato.');
    return;
  }

  try {
    var docRef = window.db.collection('guides').doc(guideSlug);
    await docRef.set(
      Object.assign({}, data, {
        ownerId:     user.uid,
        updatedAt:   firebase.firestore.FieldValue.serverTimestamp(),
        guideSlug:   guideSlug
      }),
      { merge: true }
    );

    // Aggiorna cache locale
    try {
      localStorage.setItem('bnb_guide_cache_' + guideSlug, JSON.stringify(data));
    } catch (e) {}

    console.log('[firebase-save] Guida salvata su Firestore:', guideSlug);
  } catch (e) {
    console.error('[firebase-save] Errore salvataggio Firestore:', e);
  }
}

window.saveGuideToFirestore = saveGuideToFirestore;
