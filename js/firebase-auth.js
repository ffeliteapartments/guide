// ════════════════════════════════════════════
//  FIREBASE AUTH
//  Autenticazione host con Firebase Authentication
// ════════════════════════════════════════════

// Ritorna true se Firebase Auth è configurato e pronto.
function isFirebaseAuthEnabled() {
  return !!(window._firebaseConfigured && window.auth);
}

// Login host con Firebase Auth (email + password).
// Dopo il login carica il profilo utente da users/{uid} per ottenere
// guideSlug e role.
async function firebaseLogin(email, password) {
  if (!isFirebaseAuthEnabled()) {
    throw new Error('Firebase Auth non configurato.');
  }

  var credential = await window.auth.signInWithEmailAndPassword(email, password);
  var uid = credential.user.uid;

  // Carica profilo utente da Firestore
  var profile = null;
  try {
    if (window.db) {
      var docSnap = await window.db.collection('users').doc(uid).get();
      if (docSnap.exists) profile = docSnap.data();
    }
  } catch (e) {
    console.warn('[firebase-auth] Impossibile caricare profilo utente:', e);
  }

  return { user: credential.user, profile: profile };
}

// Logout dall'account Firebase.
async function firebaseLogout() {
  if (!isFirebaseAuthEnabled()) return;
  await window.auth.signOut();
}

// Wrapper di onAuthStateChanged.
// Restituisce la funzione unsubscribe.
function onAuthChange(callback) {
  if (!isFirebaseAuthEnabled()) return function() {};
  return window.auth.onAuthStateChanged(callback);
}

// Restituisce l'utente Firebase attualmente autenticato, o null.
function getCurrentFirebaseUser() {
  if (!isFirebaseAuthEnabled()) return null;
  return window.auth.currentUser || null;
}

// Gestisce il submit del form Firebase email/password nel modal.
async function submitFirebaseLogin() {
  var emailEl = document.getElementById('fb-login-email');
  var passEl  = document.getElementById('fb-login-password');
  var errEl   = document.getElementById('fb-login-error');

  if (!emailEl || !passEl) return;

  var email    = emailEl.value.trim();
  var password = passEl.value;

  if (errEl) errEl.textContent = '';

  if (!email || !password) {
    if (errEl) errEl.textContent = '❌ Inserisci email e password.';
    return;
  }

  var submitBtn = document.querySelector('#firebase-login-view .login-submit-btn');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '⏳ Accesso…'; }

  try {
    var result = await firebaseLogin(email, password);
    var profile = result.profile;

    // Determina role e guideSlug dal profilo Firestore
    var role = (profile && profile.role) || 'host';
    var guideSlug = (profile && profile.guideSlug) || getGuideSlugFromUrl();

    // Aggiorna currentRole
    if (typeof currentRole !== 'undefined') {
      if (typeof window !== 'undefined') window._fbCurrentRole = role;
    }

    // Carica la guida associata a questo host
    if (typeof loadGuideFromFirestore === 'function') {
      await loadGuideFromFirestore(guideSlug);
    }

    // Chiudi modal e apri settings panel
    if (typeof closePinModal === 'function') closePinModal();
    if (role === 'admin' || role === 'host') {
      if (typeof _openSettingsPanel === 'function') _openSettingsPanel();
    }
  } catch (e) {
    console.error('[firebase-auth] Errore login:', e);
    var msg = '❌ Credenziali non corrette.';
    if (e.code === 'auth/invalid-email')    msg = '❌ Email non valida.';
    if (e.code === 'auth/user-not-found')   msg = '❌ Utente non trovato.';
    if (e.code === 'auth/wrong-password')   msg = '❌ Password errata.';
    if (e.code === 'auth/too-many-requests') msg = '🔒 Troppi tentativi. Riprova più tardi.';
    if (errEl) errEl.textContent = msg;
  } finally {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Accedi'; }
  }
}

window.isFirebaseAuthEnabled  = isFirebaseAuthEnabled;
window.firebaseLogin          = firebaseLogin;
window.firebaseLogout         = firebaseLogout;
window.onAuthChange           = onAuthChange;
window.getCurrentFirebaseUser = getCurrentFirebaseUser;
window.submitFirebaseLogin    = submitFirebaseLogin;
