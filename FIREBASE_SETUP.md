# 🔥 Guida all'integrazione con Firebase

Questo documento descrive come configurare Firebase per trasformare GuestGuide da applicazione single-tenant (localStorage + GitHub Pages) a SaaS multi-tenant con Firestore e Firebase Authentication.

---

## Prerequisiti

- Un account Google
- Node.js installato (per usare la Firebase CLI)
- Firebase CLI: `npm install -g firebase-tools`

---

## Passo 1 — Creare un progetto Firebase

1. Vai su [https://console.firebase.google.com](https://console.firebase.google.com)
2. Clicca **"Aggiungi progetto"**
3. Scegli un nome (es. `guestguide-saas`)
4. Disabilita Google Analytics se non necessario
5. Clicca **"Crea progetto"**

---

## Passo 2 — Abilitare Cloud Firestore

1. Nel menu laterale della Console Firebase, vai su **Build → Firestore Database**
2. Clicca **"Crea database"**
3. Scegli **"Inizia in modalità produzione"** (le regole di sicurezza sono già configurate nel file `firestore.rules`)
4. Seleziona la regione più vicina ai tuoi utenti (es. `europe-west1` per l'Italia)
5. Clicca **"Abilita"**

---

## Passo 3 — Abilitare Firebase Authentication

1. Nel menu laterale, vai su **Build → Authentication**
2. Clicca **"Inizia"**
3. Nella scheda **"Sign-in method"**, abilita **Email/Password**
4. Clicca **"Salva"**

---

## Passo 4 — Ottenere le credenziali di configurazione

1. Vai su **Impostazioni progetto** (icona ⚙️ in alto a sinistra)
2. Scorri fino alla sezione **"Le tue app"**
3. Clicca sull'icona **`</>`** (Web) per registrare un'app web
4. Scegli un nome (es. `GuestGuide Web`) e clicca **"Registra app"**
5. Copia il blocco `firebaseConfig` che appare. Avrà questa forma:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "guestguide-saas.firebaseapp.com",
  projectId: "guestguide-saas",
  storageBucket: "guestguide-saas.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

---

## Passo 5 — Sostituire i placeholder in `firebase-config.js`

Apri il file `js/firebase-config.js` e sostituisci i valori placeholder con le credenziali ottenute al passo 4:

```javascript
var firebaseConfig = {
  apiKey:            'AIzaSy...',           // ← la tua apiKey
  authDomain:        'guestguide-saas.firebaseapp.com',
  projectId:         'guestguide-saas',
  storageBucket:     'guestguide-saas.appspot.com',
  messagingSenderId: '123456789',
  appId:             '1:123456789:web:abc123'
};
```

> ⚠️ **Importante:** Finché `apiKey` è `'YOUR_API_KEY'`, Firebase non viene inizializzato e l'app continua a funzionare con localStorage (modalità offline/legacy).

---

## Passo 6 — Deployare le regole Firestore

Dalla cartella del progetto, esegui:

```bash
firebase login
firebase use --add   # seleziona il tuo progetto
firebase deploy --only firestore:rules
```

Le regole configurate in `firestore.rules` garantiscono che:
- Chiunque possa **leggere** una guida (necessario per gli ospiti)
- Solo il proprietario autenticato possa **scrivere** la propria guida
- I profili utente (`users/`) siano leggibili solo dal proprietario e non scrivibili dal client

---

## Passo 7 — Creare il primo utente host

### 7a. Creare l'account nel pannello Firebase

1. Vai su **Build → Authentication → Utenti**
2. Clicca **"Aggiungi utente"**
3. Inserisci l'email e la password dell'host
4. Nota l'**UID** generato (es. `abc123xyz`)

### 7b. Creare il profilo utente su Firestore

Vai su **Build → Firestore Database** e crea manualmente:

- Collezione: `users`
- Document ID: `<UID dell'host>` (es. `abc123xyz`)
- Campi:
  ```json
  {
    "email": "host@example.com",
    "guideSlug": "mio-bnb",
    "role": "host"
  }
  ```

> Il campo `guideSlug` determina quale documento nella collezione `guides` questo host può modificare.

### 7c. Creare il documento guida su Firestore

- Collezione: `guides`
- Document ID: `mio-bnb` (deve corrispondere al `guideSlug` dell'utente)
- Campi: copia la struttura da `DEFAULT_DATA` in `js/data.js`, aggiungendo:
  ```json
  {
    "ownerId": "<UID dell'host>",
    "guideSlug": "mio-bnb",
    "bbName": "Il Mio B&B"
  }
  ```

---

## Passo 8 — Configurare il routing per la guida pubblica

Gli ospiti accedono alla guida tramite URL come:
- `https://mia-app.web.app/guida/mio-bnb`
- Oppure `https://mia-app.web.app/?guide=mio-bnb`

Il file `firebase.json` è già configurato con i rewrites necessari per il routing SPA.

Per deployare l'app su Firebase Hosting:

```bash
firebase deploy --only hosting
```

---

## Passo 9 — Testare il tutto

1. Visita `https://<tuo-progetto>.web.app/guida/mio-bnb`
   → Dovrebbe mostrare la guida caricata da Firestore
2. Clicca sull'icona ⚙️ in alto a destra
   → Dovrebbe mostrare il form **"Accesso Host"** con email e password (invece del PIN)
3. Accedi con le credenziali create al Passo 7a
   → Dovrebbe aprire il pannello admin
4. Modifica un campo e salva
   → I dati dovrebbero essere aggiornati su Firestore

---

## Struttura dati consigliata su Firestore

### Collezione `guides/{slug}`

```json
{
  "ownerId": "uid-dell-host",
  "guideSlug": "mio-bnb",
  "bbName": "Il Mio B&B",
  "subtitle": "GUIDA OSPITE",
  "cityZone": "Roma",
  "theme": "dark",
  "hostName": "Mario",
  "hostPhone": "+39 333 1234567",
  "updatedAt": "<timestamp>",
  "apts": [
    {
      "name": "Appartamento A",
      "wifi": "NomeRete",
      "wifiPass": "password",
      "checkIn": "15:00",
      "checkOut": "10:00",
      "places": [],
      "restaurants": [],
      "transport": { "enabled": false },
      "checkoutSteps": []
    }
  ]
}
```

### Collezione `users/{uid}`

```json
{
  "email": "host@example.com",
  "guideSlug": "mio-bnb",
  "role": "host"
}
```

---

## Retrocompatibilità

L'applicazione continua a funzionare **senza Firebase** se `apiKey` è il placeholder `'YOUR_API_KEY'` in `firebase-config.js`. In questo caso:
- I dati vengono caricati da `localStorage` o `PUBLISHED_DATA` (come prima)
- Il login usa PIN e username/password locali (come prima)
- Nessuna chiamata di rete verso Firebase viene effettuata

---

## Struttura file aggiunti

```
js/
  firebase-config.js   ← credenziali Firebase (da personalizzare)
  firebase-public.js   ← caricamento guida pubblica da Firestore
  firebase-auth.js     ← login/logout con Firebase Auth
  firebase-save.js     ← salvataggio dati su Firestore
firestore.rules        ← regole di sicurezza Firestore
firestore.indexes.json ← indici Firestore (vuoto per ora)
firebase.json          ← configurazione Firebase Hosting + rewrites
FIREBASE_SETUP.md      ← questo file
```
