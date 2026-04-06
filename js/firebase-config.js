// ════════════════════════════════════════════
//  FIREBASE CONFIG
//  Inizializzazione Firebase con compat SDK (no bundler)
//  ⚠️  Sostituire i valori placeholder con le credenziali del
//      proprio progetto Firebase (vedi FIREBASE_SETUP.md)
// ════════════════════════════════════════════

(function() {
  'use strict';

  var PLACEHOLDER_API_KEY = 'YOUR_API_KEY';

  var firebaseConfig = {
    apiKey:            'YOUR_API_KEY',
    authDomain:        'YOUR_PROJECT_ID.firebaseapp.com',
    projectId:         'YOUR_PROJECT_ID',
    storageBucket:     'YOUR_PROJECT_ID.appspot.com',
    messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
    appId:             'YOUR_APP_ID'
  };

  // Se le credenziali sono ancora i placeholder, non inizializzare Firebase
  if (firebaseConfig.apiKey === PLACEHOLDER_API_KEY) {
    window._firebaseConfigured = false;
    return;
  }

  try {
    // Inizializza Firebase (compat SDK già caricato via CDN)
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }

    window.db   = firebase.firestore();
    window.auth = firebase.auth();
    window._firebaseConfigured = true;
  } catch (e) {
    console.error('[firebase-config] Inizializzazione Firebase fallita:', e);
    window._firebaseConfigured = false;
  }
})();
