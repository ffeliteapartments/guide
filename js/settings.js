async function publishOnline() {
  const tokenInput = document.getElementById('s-github-token');
  const typedToken = tokenInput && tokenInput.value.trim();
  let token = typedToken || '';
  if (!token) {
    const enc = localStorage.getItem(HOST_TOKEN_STORE);
    if (enc) token = await decryptToken(enc).catch(() => '');
  }
  const msg = document.getElementById('s-publish-msg');
  const showErr = text => { if (msg) { msg.style.color = 'var(--accent)'; msg.textContent = '❌ ' + text; } else alert('❌ ' + text); };
  const showOk  = text => { if (msg) { msg.style.color = 'var(--teal)';   msg.textContent = '✅ ' + text; } else alert('✅ ' + text); };

  if (!token) {
    showErr('Inserisci il GitHub Token nella sezione Sicurezza PIN prima di pubblicare.');
    return;
  }
  // Persist token encrypted for future use
  encryptToken(token).then(enc => localStorage.setItem(HOST_TOKEN_STORE, enc)).catch(() => {});

  const btn = document.getElementById('publish-btn');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Pubblicazione…'; }
  if (msg) msg.textContent = '';

  try {
    const OWNER = 'ffeliteapartments';
    const REPO  = 'guide';
    const DATA_FILE = 'js/data.js';
    const BRANCH = 'main';
    const DATA_API = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${DATA_FILE}`;

    // Show deploy progress
    const deploySteps = [
      { id: 'step-fetch', label: 'Recupero file dal server...', icon: '📡' },
      { id: 'step-patch', label: 'Applicazione modifiche...', icon: '✏️' },
      { id: 'step-upload', label: 'Caricamento su GitHub...', icon: '⬆️' },
      { id: 'step-deploy', label: 'Avvio deploy su GitHub Pages...', icon: '🚀' }
    ];
    if (msg) {
      msg.innerHTML = '<div class="deploy-steps">' +
        deploySteps.map(s => `<div class="deploy-step" id="${s.id}"><div class="deploy-step-icon">${s.icon}</div><div class="deploy-step-label">${s.label}</div></div>`).join('') +
        '<div class="deploy-timer" id="deploy-timer"></div>' +
        '</div>';
    }
    const setStep = (id, state) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.remove('active', 'done', 'error');
      el.classList.add(state);
      if (state === 'active') el.querySelector('.deploy-step-icon').innerHTML = '<div class="deploy-spinner"></div>';
    };
    const deployStart = Date.now();
    const timerInterval = setInterval(() => {
      const el = document.getElementById('deploy-timer');
      if (el) el.textContent = ((Date.now() - deployStart) / 1000).toFixed(1) + 's';
    }, 100);

    try {
    setStep('step-fetch', 'active');
    // 1. Get current js/data.js file (for SHA)
    const getResp = await fetch(`${DATA_API}?ref=${BRANCH}`, {
      headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' }
    });
    if (!getResp.ok) {
      setStep('step-fetch', 'error');
      const e = await getResp.json().catch(() => ({}));
      throw new Error(e.message || `HTTP ${getResp.status}`);
    }
    const fileData = await getResp.json();
    setStep('step-fetch', 'done');
    const rawContent = decodeURIComponent(escape(atob(fileData.content.replace(/\n/g, ''))));

    setStep('step-patch', 'active');
    // 2. Get current PIN hash
    const pinHash = getStoredPinHash();

    // 3. Get current data from the form (includes unsaved changes in settings)
    const dataStr = JSON.stringify(collectFormData(), null, 2);

    // 4. Patch DEFAULT_PIN_HASH
    let newContent = rawContent.replace(
      /\/\* DEFAULT_PIN_HASH_START \*\/[\s\S]*?\/\* DEFAULT_PIN_HASH_END \*\//,
      `/* DEFAULT_PIN_HASH_START */\nconst DEFAULT_PIN_HASH = deobfuscateHash('${obfuscateHash(pinHash)}');\n/* DEFAULT_PIN_HASH_END */`
    );

    // 4b. Patch DEFAULT_USER_HASH
    const userHash = getStoredUserHash();
    newContent = newContent.replace(
      /\/\* DEFAULT_USER_HASH_START \*\/[\s\S]*?\/\* DEFAULT_USER_HASH_END \*\//,
      `/* DEFAULT_USER_HASH_START */\nconst DEFAULT_USER_HASH = deobfuscateHash('${obfuscateHash(userHash)}');\n/* DEFAULT_USER_HASH_END */`
    );

    // 4c. Patch DEFAULT_PASS_HASH
    const passHash = getStoredPassHash();
    newContent = newContent.replace(
      /\/\* DEFAULT_PASS_HASH_START \*\/[\s\S]*?\/\* DEFAULT_PASS_HASH_END \*\//,
      `/* DEFAULT_PASS_HASH_START */\nconst DEFAULT_PASS_HASH = deobfuscateHash('${obfuscateHash(passHash)}');\n/* DEFAULT_PASS_HASH_END */`
    );

    // 4d. Patch DEFAULT_RECOVERY_HASH
    const recoveryHash = getStoredRecoveryHash();
    newContent = newContent.replace(
      /\/\* DEFAULT_RECOVERY_HASH_START \*\/[\s\S]*?\/\* DEFAULT_RECOVERY_HASH_END \*\//,
      `/* DEFAULT_RECOVERY_HASH_START */\nconst DEFAULT_RECOVERY_HASH = deobfuscateHash('${obfuscateHash(recoveryHash)}');\n/* DEFAULT_RECOVERY_HASH_END */`
    );

    // 5. Patch PUBLISHED_DATA
    newContent = newContent.replace(
      /\/\* PUBLISHED_DATA_START \*\/[\s\S]*?\/\* PUBLISHED_DATA_END \*\//,
      `/* PUBLISHED_DATA_START */\nconst PUBLISHED_DATA = ${dataStr};\n/* PUBLISHED_DATA_END */`
    );

    // 6. Base64-encode (handle Unicode)
    const newContentB64 = btoa(unescape(encodeURIComponent(newContent)));

    setStep('step-patch', 'done');
    setStep('step-upload', 'active');
    // 7. Commit to js/data.js
    const putResp = await fetch(DATA_API, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Aggiorna guida e PIN [via admin panel]',
        content: newContentB64,
        sha: fileData.sha,
        branch: BRANCH
      })
    });

    if (!putResp.ok) {
      setStep('step-upload', 'error');
      const e = await putResp.json().catch(() => ({}));
      throw new Error(e.message || `HTTP ${putResp.status}`);
    }
    setStep('step-upload', 'done');
    setStep('step-deploy', 'active');

    // 8. Patch CACHE_VERSION in sw.js
    try {
      const SW_FILE = 'sw.js';
      const SW_API = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${SW_FILE}`;
      const swGetResp = await fetch(`${SW_API}?ref=${BRANCH}`, {
        headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' }
      });
      if (swGetResp.ok) {
        const swFileData = await swGetResp.json();
        const swRaw = decodeURIComponent(escape(atob(swFileData.content.replace(/\n/g, ''))));
        const newVersion = new Date().toISOString().slice(0, 10) + '-v' + Date.now();
        const swUpdated = swRaw.replace(
          /const CACHE_VERSION = '[^']+';/,
          `const CACHE_VERSION = '${newVersion}';`
        );
        await fetch(SW_API, {
          method: 'PUT',
          headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: '🔄 Aggiorna cache SW [auto]',
            content: btoa(unescape(encodeURIComponent(swUpdated))),
            sha: swFileData.sha,
            branch: BRANCH
          })
        });
      }
    } catch(swErr) { /* Non-fatal: SW cache patch failed */ }

    setTimeout(() => { setStep('step-deploy', 'done'); }, 1500);

    clearInterval(timerInterval);
    showOk('✅ Pubblicato! Le modifiche saranno live su ffeliteapartments.github.io/guide tra qualche secondo.');
    showToast('Pubblicato online!', 'success');
    addChangelogEntry('Pubblicazione online (admin)', 'admin');
    setTimeout(() => { if (msg) msg.innerHTML = ''; }, 12000);
    } catch(innerErr) {
      clearInterval(timerInterval);
      throw innerErr;
    }
  } catch (err) {
    showErr(err.message || 'Errore sconosciuto.');
    showToast(err.message || 'Errore di pubblicazione', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '🚀 Pubblica Online'; }
  }
}

// ════════════════════════════════════════════
//  SETTINGS: DYNAMIC APARTMENTS
// ════════════════════════════════════════════
function renderSettingsApts(apts) {
  const container = document.getElementById('s-apts-container');
  container.dataset.count = apts.length;
  container.innerHTML = '';
  apts.forEach((apt, i) => {
    const canDel = apts.length > 1;
    const section = document.createElement('details');
    section.className = 's-section';
    const delBtn = canDel
      ? `<button class="s-remove-btn" onclick="event.stopPropagation(); removeSettingsApt(${i})">🗑️ Elimina</button>`
      : '';
    section.innerHTML = `
      <summary class="s-section-title"><span class="s-section-title-inner">🏠 Appartamento ${i + 1}${delBtn}</span></summary>
      <div class="s-fields">
        <div class="s-field"><label>Nome (IT)</label><input type="text" id="s-a${i}-name" value="${escAttr(apt.name || '')}" placeholder="Appartamento ${i + 1}"></div>
        <div class="s-field"><label>Indirizzo completo</label><input type="text" id="s-a${i}-address" value="${escAttr(apt.address || '')}"></div>
        <div class="s-field"><label>Indirizzo breve</label><input type="text" id="s-a${i}-addressShort" value="${escAttr(apt.addressShort || '')}"></div>
        <div class="s-field"><label>Link Google Maps</label><input type="url" id="s-a${i}-mapsLink" value="${escAttr(apt.mapsLink || '')}"></div>
        <div class="s-field"><label>Max ospiti (IT)</label><input type="text" id="s-a${i}-maxGuests" value="${escAttr(apt.maxGuests || '')}"></div>
        <div class="s-field"><label>Max ospiti (EN)</label><input type="text" id="s-a${i}-maxGuestsEn" value="${escAttr(apt.maxGuestsEn || '')}"></div>
        <div class="s-field"><label>WiFi — Nome rete</label><input type="text" id="s-a${i}-wifi" value="${escAttr(apt.wifi || '')}"></div>
        <div class="s-field"><label>WiFi — Password</label><input type="text" id="s-a${i}-wifiPass" value="${escAttr(deobfuscate(apt.wifiPass || ''))}"></div>
        <div class="s-field"><label>Check-in (orario)</label><input type="text" id="s-a${i}-checkin" value="${escAttr(apt.checkin || '')}" placeholder="15:00"></div>
        <div class="s-field"><label>Check-out (orario)</label><input type="text" id="s-a${i}-checkout" value="${escAttr(apt.checkout || '')}" placeholder="10:00"></div>
        <div class="s-divider"></div>
        <div class="s-sub-title">🌤️ Meteo</div>
        <div class="s-field"><label>Latitudine (per widget meteo)</label><input type="text" id="s-a${i}-lat" value="${escAttr(apt.lat || '')}" placeholder="41.9028 (Roma)"></div>
        <div class="s-field"><label>Longitudine (per widget meteo)</label><input type="text" id="s-a${i}-lon" value="${escAttr(apt.lon || '')}" placeholder="12.4964 (Roma)"></div>
        <div class="s-divider"></div>
        <div class="s-sub-title">📍 Come raggiungerci</div>
        <div class="s-field"><label>Come raggiungerci 🇮🇹</label><textarea id="s-a${i}-howToReachIt" placeholder="Dalla stazione centrale..." onblur="autoTranslateField('s-a${i}-howToReachIt','s-a${i}-howToReachEn')">${escHtml(apt.howToReachIt || '')}</textarea></div>
        <div class="s-field"><label>Come raggiungerci 🇬🇧</label><textarea id="s-a${i}-howToReachEn">${escHtml(apt.howToReachEn || '')}</textarea></div>
        <div class="s-divider"></div>
        <div class="s-sub-title">🗝️ Come accedere</div>
        <div class="s-field"><label>Come accedere 🇮🇹</label><textarea id="s-a${i}-howToAccessIt" placeholder="Le chiavi vi verranno consegnate..." onblur="autoTranslateField('s-a${i}-howToAccessIt','s-a${i}-howToAccessEn')">${escHtml(apt.howToAccessIt || '')}</textarea></div>
        <div class="s-field"><label>Come accedere 🇬🇧</label><textarea id="s-a${i}-howToAccessEn">${escHtml(apt.howToAccessEn || '')}</textarea></div>
        <div class="s-divider"></div>
        <div class="s-sub-title">🚗 Parcheggio</div>
        <div class="s-field"><label>Parcheggio 🇮🇹</label><textarea id="s-a${i}-parkingIt" placeholder="Parcheggio pubblico disponibile..." onblur="autoTranslateField('s-a${i}-parkingIt','s-a${i}-parkingEn')">${escHtml(apt.parkingIt || '')}</textarea></div>
        <div class="s-field"><label>Parcheggio 🇬🇧</label><textarea id="s-a${i}-parkingEn">${escHtml(apt.parkingEn || '')}</textarea></div>
        <div class="s-divider"></div>
        <div class="s-sub-title">🏠 Regole della casa</div>
        <div id="s-a${i}-rules" data-count="0"></div>
        <button class="s-add-btn" style="margin-top:8px" onclick="addAptHouseRule(${i})">➕ Aggiungi Regola</button>
        <div class="s-divider"></div>
        <div class="s-sub-title">🛌 Camera da Letto — Dotazioni (comma-separato)</div>
        <div class="s-field"><label>Dotazioni camera 🇮🇹</label><input type="text" id="s-a${i}-bedroomTagsIt" value="${escAttr(apt.bedroomTagsIt || '')}" placeholder="Letto matrimoniale,Armadio,Biancheria..." onblur="autoTranslateField('s-a${i}-bedroomTagsIt','s-a${i}-bedroomTagsEn')"></div>
        <div class="s-field"><label>Dotazioni camera 🇬🇧</label><input type="text" id="s-a${i}-bedroomTagsEn" value="${escAttr(apt.bedroomTagsEn || '')}" placeholder="Double bed,Wardrobe,Linen..."></div>
        <div class="s-divider"></div>
        <div class="s-sub-title">🍳 Cucina — Dotazioni (comma-separato)</div>
        <div class="s-field"><label>Dotazioni cucina 🇮🇹</label><input type="text" id="s-a${i}-kitchenTagsIt" value="${escAttr(apt.kitchenTagsIt || '')}" placeholder="Piano cottura,Forno,Frigorifero..." onblur="autoTranslateField('s-a${i}-kitchenTagsIt','s-a${i}-kitchenTagsEn')"></div>
        <div class="s-field"><label>Dotazioni cucina 🇬🇧</label><input type="text" id="s-a${i}-kitchenTagsEn" value="${escAttr(apt.kitchenTagsEn || '')}" placeholder="Hob,Oven,Fridge..."></div>
        <div class="s-divider"></div>
        <div class="s-sub-title">🚿 Bagno — Dotazioni (comma-separato)</div>
        <div class="s-field"><label>Dotazioni bagno 🇮🇹</label><input type="text" id="s-a${i}-bathroomTagsIt" value="${escAttr(apt.bathroomTagsIt || '')}" placeholder="Doccia,Asciugamani,Phon..." onblur="autoTranslateField('s-a${i}-bathroomTagsIt','s-a${i}-bathroomTagsEn')"></div>
        <div class="s-field"><label>Dotazioni bagno 🇬🇧</label><input type="text" id="s-a${i}-bathroomTagsEn" value="${escAttr(apt.bathroomTagsEn || '')}" placeholder="Shower,Towels,Hair dryer..."></div>
        <div class="s-divider"></div>
        <div class="s-sub-title">✨ Servizi Extra</div>
        <div id="s-a${i}-services" data-count="0"></div>
        <button class="s-add-btn" style="margin-top:8px" onclick="addAptExtraService(${i})">➕ Aggiungi Servizio</button>
        <div class="s-divider"></div>
        <div class="s-sub-title">🗺️ Luoghi da Visitare</div>
        <div id="s-a${i}-places" data-count="0"></div>
        <button class="s-add-btn" style="margin-top:8px" onclick="addAptPlace(${i})">➕ Aggiungi Luogo</button>
        <div class="s-divider"></div>
        <div class="s-sub-title">🍽️ Ristoranti</div>
        <div id="s-a${i}-restaurants" data-count="0"></div>
        <button class="s-add-btn" style="margin-top:8px" onclick="addAptRest(${i})">➕ Aggiungi Ristorante</button>
        <div class="s-divider"></div>
        <div class="s-sub-title">🛒 Supermercati</div>
        <div id="s-a${i}-supermarkets" data-count="0"></div>
        <button class="s-add-btn" style="margin-top:8px" onclick="addAptSupermarket(${i})">➕ Aggiungi Supermercato</button>
        <div class="s-divider"></div>
        <div class="s-sub-title">🚇 Trasporti</div>
        <div class="s-fields">
          <div class="s-sub-title" style="font-size:12px">✈️ Aeroporto</div>
          <div class="s-field" style="flex-direction:row;align-items:center;gap:10px;flex-wrap:wrap">
            <label style="white-space:nowrap">Mostra sezione</label>
            <input type="checkbox" id="s-a${i}-tr-airportEnabled" ${(apt.transport && apt.transport.airportEnabled !== false) ? 'checked' : ''} style="width:auto;accent-color:var(--teal)">
          </div>
          <div class="s-field"><label>Emoji</label><input type="text" id="s-a${i}-tr-airportIcon" value="${escAttr((apt.transport && apt.transport.airportIcon) || '✈️')}" placeholder="✈️" style="max-width:80px"></div>
          <div class="s-field"><label>Descrizione 🇮🇹</label><textarea id="s-a${i}-tr-airportIt" placeholder="All'uscita dell'aeroporto..." onblur="autoTranslateField('s-a${i}-tr-airportIt','s-a${i}-tr-airportEn')">${escHtml((apt.transport && apt.transport.airportIt) || '')}</textarea></div>
          <div class="s-field"><label>Descrizione 🇬🇧</label><textarea id="s-a${i}-tr-airportEn">${escHtml((apt.transport && apt.transport.airportEn) || '')}</textarea></div>
          <div class="s-field"><label>Link Maps</label><input type="url" id="s-a${i}-tr-airportMaps" value="${escAttr((apt.transport && apt.transport.airportMaps) || '')}" placeholder="https://maps.google.com/..."></div>
          <div class="s-divider"></div>
          <div class="s-sub-title" style="font-size:12px">🚉 Stazione</div>
          <div class="s-field" style="flex-direction:row;align-items:center;gap:10px;flex-wrap:wrap">
            <label style="white-space:nowrap">Mostra sezione</label>
            <input type="checkbox" id="s-a${i}-tr-stationEnabled" ${(apt.transport && apt.transport.stationEnabled !== false) ? 'checked' : ''} style="width:auto;accent-color:var(--teal)">
          </div>
          <div class="s-field"><label>Emoji</label><input type="text" id="s-a${i}-tr-stationIcon" value="${escAttr((apt.transport && apt.transport.stationIcon) || '🚉')}" placeholder="🚉" style="max-width:80px"></div>
          <div class="s-field"><label>Descrizione 🇮🇹</label><textarea id="s-a${i}-tr-stationIt" placeholder="Dalla stazione..." onblur="autoTranslateField('s-a${i}-tr-stationIt','s-a${i}-tr-stationEn')">${escHtml((apt.transport && apt.transport.stationIt) || '')}</textarea></div>
          <div class="s-field"><label>Descrizione 🇬🇧</label><textarea id="s-a${i}-tr-stationEn">${escHtml((apt.transport && apt.transport.stationEn) || '')}</textarea></div>
          <div class="s-field"><label>Link Maps</label><input type="url" id="s-a${i}-tr-stationMaps" value="${escAttr((apt.transport && apt.transport.stationMaps) || '')}" placeholder="https://maps.google.com/..."></div>
          <div class="s-divider"></div>
          <div class="s-sub-title" style="font-size:12px">🚇 Metro</div>
          <div class="s-field" style="flex-direction:row;align-items:center;gap:10px;flex-wrap:wrap">
            <label style="white-space:nowrap">Mostra sezione</label>
            <input type="checkbox" id="s-a${i}-tr-metroEnabled" ${(apt.transport && apt.transport.metroEnabled !== false) ? 'checked' : ''} style="width:auto;accent-color:var(--teal)">
          </div>
          <div class="s-field"><label>Emoji</label><input type="text" id="s-a${i}-tr-metroIcon" value="${escAttr((apt.transport && apt.transport.metroIcon) || '🚇')}" placeholder="🚇" style="max-width:80px"></div>
          <div class="s-field"><label>Descrizione 🇮🇹</label><input type="text" id="s-a${i}-tr-metroIt" value="${escAttr((apt.transport && apt.transport.metroIt) || '')}" placeholder="Fermata più vicina..." onblur="autoTranslateField('s-a${i}-tr-metroIt','s-a${i}-tr-metroEn')"></div>
          <div class="s-field"><label>Descrizione 🇬🇧</label><input type="text" id="s-a${i}-tr-metroEn" value="${escAttr((apt.transport && apt.transport.metroEn) || '')}" placeholder="Nearest stop..."></div>
          <div class="s-field"><label>Link Maps</label><input type="url" id="s-a${i}-tr-metroMaps" value="${escAttr((apt.transport && apt.transport.metroMaps) || '')}" placeholder="https://maps.google.com/..."></div>
          <div class="s-divider"></div>
          <div class="s-sub-title" style="font-size:12px">🚌 Bus</div>
          <div class="s-field" style="flex-direction:row;align-items:center;gap:10px;flex-wrap:wrap">
            <label style="white-space:nowrap">Mostra sezione</label>
            <input type="checkbox" id="s-a${i}-tr-busEnabled" ${(apt.transport && apt.transport.busEnabled !== false) ? 'checked' : ''} style="width:auto;accent-color:var(--teal)">
          </div>
          <div class="s-field"><label>Emoji</label><input type="text" id="s-a${i}-tr-busIcon" value="${escAttr((apt.transport && apt.transport.busIcon) || '🚌')}" placeholder="🚌" style="max-width:80px"></div>
          <div class="s-field"><label>Descrizione 🇮🇹</label><input type="text" id="s-a${i}-tr-busIt" value="${escAttr((apt.transport && apt.transport.busIt) || '')}" placeholder="Linee principali..." onblur="autoTranslateField('s-a${i}-tr-busIt','s-a${i}-tr-busEn')"></div>
          <div class="s-field"><label>Descrizione 🇬🇧</label><input type="text" id="s-a${i}-tr-busEn" value="${escAttr((apt.transport && apt.transport.busEn) || '')}" placeholder="Main lines..."></div>
          <div class="s-field"><label>Link Maps</label><input type="url" id="s-a${i}-tr-busMaps" value="${escAttr((apt.transport && apt.transport.busMaps) || '')}" placeholder="https://maps.google.com/..."></div>
          <div class="s-divider"></div>
          <div class="s-sub-title" style="font-size:12px">🎫 Biglietti</div>
          <div class="s-field"><label>Descrizione 🇮🇹</label><textarea id="s-a${i}-tr-ticketsIt" placeholder="Biglietto singolo: ~€1,50..." onblur="autoTranslateField('s-a${i}-tr-ticketsIt','s-a${i}-tr-ticketsEn')">${escHtml((apt.transport && apt.transport.ticketsIt) || '')}</textarea></div>
          <div class="s-field"><label>Descrizione 🇬🇧</label><textarea id="s-a${i}-tr-ticketsEn">${escHtml((apt.transport && apt.transport.ticketsEn) || '')}</textarea></div>
          <div class="s-divider"></div>
          <div class="s-sub-title" style="font-size:12px">🚖 Taxi &amp; App</div>
          <div class="s-field"><label>Descrizione 🇮🇹</label><textarea id="s-a${i}-tr-taxiIt" placeholder="Taxi ufficiali: trovate i posteggi..." onblur="autoTranslateField('s-a${i}-tr-taxiIt','s-a${i}-tr-taxiEn')">${escHtml((apt.transport && apt.transport.taxiIt) || '')}</textarea></div>
          <div class="s-field"><label>Descrizione 🇬🇧</label><textarea id="s-a${i}-tr-taxiEn">${escHtml((apt.transport && apt.transport.taxiEn) || '')}</textarea></div>
        </div>
        <div class="s-divider"></div>
        <div class="s-sub-title">🧳 Istruzioni Check-out</div>
        <div id="s-a${i}-checkoutSteps" data-count="0"></div>
        <button class="s-add-btn" style="margin-top:8px" onclick="addAptCheckoutStep(${i})">➕ Aggiungi Passo</button>
      </div>`;
    container.appendChild(section);
    renderAptHouseRules(i, apt.houseRules || []);
    renderAptExtraServices(i, apt.extraServices || []);
    renderAptPlaces(i, apt.places || []);
    renderAptRests(i, apt.restaurants || []);
    renderAptSupermarkets(i, apt.supermarkets || []);
    renderAptCheckoutSteps(i, apt.checkoutSteps || []);
  });
}

function collectSettingsApts() {
  const container = document.getElementById('s-apts-container');
  const count = parseInt(container.dataset.count || '0');
  const apts = [];
  for (let i = 0; i < count; i++) {
    const apt = {};
    ['name','address','addressShort','mapsLink','maxGuests','maxGuestsEn','wifi','wifiPass','checkin','checkout','lat','lon',
     'howToReachIt','howToReachEn','howToAccessIt','howToAccessEn','parkingIt','parkingEn',
     'bedroomTagsIt','bedroomTagsEn','kitchenTagsIt','kitchenTagsEn','bathroomTagsIt','bathroomTagsEn'].forEach(k => {
      const el = document.getElementById(`s-a${i}-${k}`);
      if (el) apt[k] = k === 'wifiPass' ? obfuscate(el.value) : el.value; // re-obfuscate WiFi password before storing
    });
    apt.houseRules = collectAptHouseRules(i);
    apt.extraServices = collectAptExtraServices(i);
    apt.places = collectAptPlaces(i);
    apt.restaurants = collectAptRests(i);
    apt.supermarkets = collectAptSupermarkets(i);
    apt.transport = collectAptTransport(i);
    apt.checkoutSteps = collectAptCheckoutSteps(i);
    apts.push(apt);
  }
  return apts;
}

function addSettingsApt() {
  const current = collectSettingsApts();
  const n = current.length + 1;
  current.push({
    name: `Appartamento ${n}`,
    address: '', addressShort: '', mapsLink: '',
    maxGuests: '4 persone', maxGuestsEn: '4 people',
    wifi: '', wifiPass: '',
    checkin: '15:00', checkout: '10:00',
    lat: '', lon: '',
    howToReachIt: '', howToReachEn: '', howToAccessIt: '', howToAccessEn: '', parkingIt: '', parkingEn: '',
    houseRules: [],
    bedroomTagsIt: '', bedroomTagsEn: '', kitchenTagsIt: '', kitchenTagsEn: '', bathroomTagsIt: '', bathroomTagsEn: '',
    extraServices: [],
    places: [],
    restaurants: [],
    supermarkets: [],
    transport: {
      airportEnabled: true, airportIcon: '✈️', airportIt: '', airportEn: '', airportMaps: '',
      stationEnabled: true, stationIcon: '🚉', stationIt: '', stationEn: '', stationMaps: '',
      metroEnabled: true, metroIcon: '🚇', metroIt: '', metroEn: '', metroMaps: '',
      busEnabled: true, busIcon: '🚌', busIt: '', busEn: '', busMaps: '',
      ticketsIt: '', ticketsEn: '', taxiIt: '', taxiEn: ''
    },
    checkoutSteps: []
  });
  renderSettingsApts(current);
  const last = document.getElementById('s-apts-container').lastElementChild;
  if (last) { last.open = true; last.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
}

function removeSettingsApt(idx) {
  const current = collectSettingsApts();
  if (current.length <= 1) { alert('Devi avere almeno un appartamento.'); return; }
  if (!confirm(`Eliminare Appartamento ${idx + 1}? Le modifiche non salvate verranno perse.`)) return;
  current.splice(idx, 1);
  renderSettingsApts(current);
}

// ════════════════════════════════════════════
//  TRANSLATION DICTIONARY (IT→EN fallback)
// ════════════════════════════════════════════
const TRANSLATION_DICT = {
  "Check-in": "Check-in",
  "Check-out": "Check-out",
  "Benvenuti": "Welcome",
  "Benvenuto": "Welcome",
  "Siamo felici di avervi come ospiti": "We are delighted to have you as our guests",
  "Le chiavi sono nella cassetta di sicurezza": "The keys are in the lockbox",
  "La password del WiFi è": "The WiFi password is",
  "In caso di emergenza chiamare": "In case of emergency call",
  "Raccolta differenziata": "Waste sorting",
  "Non fumare": "No smoking",
  "Vietato fumare": "No smoking",
  "Orario di silenzio": "Quiet hours",
  "Riscaldamento": "Heating",
  "Aria condizionata": "Air conditioning",
  "Cucina": "Kitchen",
  "Bagno": "Bathroom",
  "Camera": "Bedroom",
  "Soggiorno": "Living room",
  "Terrazzo": "Terrace",
  "Balcone": "Balcony",
  "Parcheggio": "Parking",
  "Ascensore": "Elevator",
  "Wifi": "WiFi",
  "WiFi": "WiFi",
  "Asciugamani": "Towels",
  "Lenzuola": "Bedsheets",
  "Biancheria": "Linen",
  "Lavatrice": "Washing machine",
  "Lavastoviglie": "Dishwasher",
  "Frigorifero": "Refrigerator",
  "Forno": "Oven",
  "Microonde": "Microwave",
  "Piano cottura": "Hob",
  "Caffettiera": "Coffee maker",
  "Ferro da stiro": "Iron",
  "Phon": "Hair dryer",
  "Asciugacapelli": "Hair dryer",
  "Televisione": "Television",
  "Armadio": "Wardrobe",
  "Cassaforte": "Safe",
  "Grazie per aver scelto il nostro B&B": "Thank you for choosing our B&B",
  "È stato un piacere avervi come ospiti": "It has been a pleasure having you as guests",
  "Per ulteriori informazioni": "For further information",
  "Non esitate a contattarci": "Do not hesitate to contact us",
  "Buon soggiorno": "Enjoy your stay",
  "Buona permanenza": "Enjoy your stay",
  "Stazione": "Train station",
  "Aeroporto": "Airport",
  "Metropolitana": "Metro",
  "Autobus": "Bus",
  "Taxi": "Taxi",
  "Farmacia": "Pharmacy",
  "Ospedale": "Hospital",
  "Supermercato": "Supermarket",
  "Ristorante": "Restaurant",
  "Bar": "Bar",
  "Pizzeria": "Pizzeria",
  "Emergenza": "Emergency",
  "Orario": "Schedule",
  "Prezzo": "Price",
  "Biglietto": "Ticket",
  "Ingresso": "Entrance",
  "Uscita": "Exit",
  "Aperto": "Open",
  "Chiuso": "Closed",
  "Gratuito": "Free",
  "Letto matrimoniale": "Double bed",
  "Letto singolo": "Single bed",
  "Doccia": "Shower",
  "Vasca da bagno": "Bathtub"
};

function translateWithDict(text) {
  const lower = text.trim().toLowerCase();
  for (const [it, en] of Object.entries(TRANSLATION_DICT)) {
    if (it.toLowerCase() === lower) return en;
  }
  for (const [it, en] of Object.entries(TRANSLATION_DICT)) {
    if (lower.includes(it.toLowerCase())) {
      return text.replace(new RegExp(it, 'gi'), en);
    }
  }
  return null;
}

// ════════════════════════════════════════════
//  AUTO-TRANSLATE (Italian → English via MyMemory + dictionary fallback)
// ════════════════════════════════════════════
async function autoTranslateField(itElId, enElId) {
  const itEl = document.getElementById(itElId);
  const enEl = document.getElementById(enElId);
  if (!itEl || !enEl) return;
  const text = itEl.value.trim();
  if (!text) return;
  if (enEl.value.trim()) return;
  const prev = enEl.placeholder;
  enEl.placeholder = '⏳ Traducendo…';
  enEl.disabled = true;
  try {
    const params = new URLSearchParams({ q: text, langpair: 'it|en' });
    const res = await fetch('https://api.mymemory.translated.net/get?' + params.toString());
    const json = await res.json();
    const translated = json && json.responseData && json.responseData.translatedText;
    if (translated && String(json.responseStatus) === '200') {
      enEl.value = translated;
      enEl.disabled = false;
      enEl.placeholder = prev;
      return;
    }
  } catch (e) {
    // fall through to dictionary
  }
  const dictResult = translateWithDict(text);
  if (dictResult) enEl.value = dictResult;
  enEl.disabled = false;
  enEl.placeholder = prev;
}

// ════════════════════════════════════════════
//  SETTINGS: APT HOUSE RULES (dynamic)
// ════════════════════════════════════════════
function renderAptHouseRules(aptIndex, rules) {
  const container = document.getElementById(`s-a${aptIndex}-rules`);
  if (!container) return;
  container.dataset.count = rules.length;
  let html = '';
  rules.forEach((r, j) => {
    html += `
      <div class="s-sub-title s-sub-title-row" style="margin-top:12px">
        <span>Regola ${j + 1}</span>
        <button class="s-remove-btn" onclick="removeAptHouseRule(${aptIndex}, ${j})">🗑️ Rimuovi</button>
      </div>
      <div class="s-field"><label>Icona (emoji)</label><input type="text" id="s-a${aptIndex}-r${j}-icon" value="${escAttr(r.icon || '')}" placeholder="🔇"></div>
      <div class="s-field"><label>Titolo 🇮🇹</label><input type="text" id="s-a${aptIndex}-r${j}-titleIt" value="${escAttr(r.titleIt || '')}" onblur="autoTranslateField('s-a${aptIndex}-r${j}-titleIt','s-a${aptIndex}-r${j}-titleEn')"></div>
      <div class="s-field"><label>Titolo 🇬🇧</label><input type="text" id="s-a${aptIndex}-r${j}-titleEn" value="${escAttr(r.titleEn || '')}"></div>
      <div class="s-field"><label>Descrizione 🇮🇹</label><textarea id="s-a${aptIndex}-r${j}-descIt" onblur="autoTranslateField('s-a${aptIndex}-r${j}-descIt','s-a${aptIndex}-r${j}-descEn')">${escHtml(r.descIt || '')}</textarea></div>
      <div class="s-field"><label>Descrizione 🇬🇧</label><textarea id="s-a${aptIndex}-r${j}-descEn">${escHtml(r.descEn || '')}</textarea></div>`;
  });
  container.innerHTML = html;
}

function collectAptHouseRules(aptIndex) {
  const container = document.getElementById(`s-a${aptIndex}-rules`);
  if (!container) return [];
  const count = parseInt(container.dataset.count || '0');
  const rules = [];
  for (let j = 0; j < count; j++) {
    const rule = {};
    ['icon', 'titleIt', 'titleEn', 'descIt', 'descEn'].forEach(k => {
      const el = document.getElementById(`s-a${aptIndex}-r${j}-${k}`);
      if (el) rule[k] = el.value;
    });
    rules.push(rule);
  }
  return rules;
}

function addAptHouseRule(aptIndex) {
  const current = collectAptHouseRules(aptIndex);
  current.push({ icon: '🏠', titleIt: '', descIt: '' });
  renderAptHouseRules(aptIndex, current);
}

function removeAptHouseRule(aptIndex, ruleIdx) {
  if (!confirm(`Rimuovere la regola ${ruleIdx + 1}?`)) return;
  const current = collectAptHouseRules(aptIndex);
  current.splice(ruleIdx, 1);
  renderAptHouseRules(aptIndex, current);
}

// ════════════════════════════════════════════
//  SETTINGS: APT EXTRA SERVICES (dynamic)
// ════════════════════════════════════════════
function renderAptExtraServices(aptIndex, services) {
  const container = document.getElementById(`s-a${aptIndex}-services`);
  if (!container) return;
  container.dataset.count = services.length;
  let html = '';
  services.forEach((svc, j) => {
    html += `
      <div class="s-sub-title s-sub-title-row" style="margin-top:12px">
        <span>Servizio ${j + 1}</span>
        <button class="s-remove-btn" onclick="removeAptExtraService(${aptIndex}, ${j})">🗑️ Rimuovi</button>
      </div>
      <div class="s-field"><label>Icona (emoji)</label><input type="text" id="s-a${aptIndex}-svc${j}-icon" value="${escAttr(svc.icon || '')}" placeholder="✨"></div>
      <div class="s-field"><label>Nome 🇮🇹</label><input type="text" id="s-a${aptIndex}-svc${j}-nameIt" value="${escAttr(svc.nameIt || '')}" onblur="autoTranslateField('s-a${aptIndex}-svc${j}-nameIt','s-a${aptIndex}-svc${j}-nameEn')"></div>
      <div class="s-field"><label>Nome 🇬🇧</label><input type="text" id="s-a${aptIndex}-svc${j}-nameEn" value="${escAttr(svc.nameEn || '')}"></div>
      <div class="s-field"><label>Descrizione 🇮🇹</label><input type="text" id="s-a${aptIndex}-svc${j}-descIt" value="${escAttr(svc.descIt || '')}" onblur="autoTranslateField('s-a${aptIndex}-svc${j}-descIt','s-a${aptIndex}-svc${j}-descEn')"></div>
      <div class="s-field"><label>Descrizione 🇬🇧</label><input type="text" id="s-a${aptIndex}-svc${j}-descEn" value="${escAttr(svc.descEn || '')}"></div>
`;
  });
  container.innerHTML = html;
}

function collectAptExtraServices(aptIndex) {
  const container = document.getElementById(`s-a${aptIndex}-services`);
  if (!container) return [];
  const count = parseInt(container.dataset.count || '0');
  const services = [];
  for (let j = 0; j < count; j++) {
    const svc = {};
    ['icon', 'nameIt', 'nameEn', 'descIt', 'descEn'].forEach(k => {
      const el = document.getElementById(`s-a${aptIndex}-svc${j}-${k}`);
      if (el) svc[k] = el.value;
    });
    services.push(svc);
  }
  return services;
}

function addAptExtraService(aptIndex) {
  const current = collectAptExtraServices(aptIndex);
  current.push({ icon: '✨', nameIt: '', descIt: '' });
  renderAptExtraServices(aptIndex, current);
}

function removeAptExtraService(aptIndex, svcIdx) {
  if (!confirm(`Rimuovere il servizio ${svcIdx + 1}?`)) return;
  const current = collectAptExtraServices(aptIndex);
  current.splice(svcIdx, 1);
  renderAptExtraServices(aptIndex, current);
}

// ════════════════════════════════════════════
//  SETTINGS: APT PLACES (dynamic, per-apt)
// ════════════════════════════════════════════
function renderAptPlaces(aptIndex, places) {
  const container = document.getElementById(`s-a${aptIndex}-places`);
  if (!container) return;
  container.dataset.count = places.length;
  let html = '';
  places.forEach((p, j) => {
    html += `
      <div class="s-sub-title s-sub-title-row" style="margin-top:12px">
        <span>Luogo ${j + 1}</span>
        <button class="s-remove-btn" onclick="removeAptPlace(${aptIndex}, ${j})">🗑️ Rimuovi</button>
      </div>
      <div class="s-field"><label>Emoji</label><input type="text" id="s-a${aptIndex}-pl${j}-emoji" value="${escAttr(p.emoji || '📍')}" placeholder="📍" style="max-width:80px"></div>
      <div class="s-field"><label>Nome</label><input type="text" id="s-a${aptIndex}-pl${j}-name" value="${escAttr(p.name || '')}"></div>
      <div class="s-field"><label>Descrizione 🇮🇹</label><textarea id="s-a${aptIndex}-pl${j}-descIt" onblur="autoTranslateField('s-a${aptIndex}-pl${j}-descIt','s-a${aptIndex}-pl${j}-descEn')">${escHtml(p.descIt || '')}</textarea></div>
      <div class="s-field"><label>Descrizione 🇬🇧</label><textarea id="s-a${aptIndex}-pl${j}-descEn">${escHtml(p.descEn || '')}</textarea></div>
      <div class="s-field"><label>Come arrivarci 🇮🇹</label><textarea id="s-a${aptIndex}-pl${j}-howIt" onblur="autoTranslateField('s-a${aptIndex}-pl${j}-howIt','s-a${aptIndex}-pl${j}-howEn')">${escHtml(p.howIt || '')}</textarea></div>
      <div class="s-field"><label>Come arrivarci 🇬🇧</label><textarea id="s-a${aptIndex}-pl${j}-howEn">${escHtml(p.howEn || '')}</textarea></div>
      <div class="s-field"><label>Link Maps</label><input type="url" id="s-a${aptIndex}-pl${j}-maps" value="${escAttr(p.maps || '')}"></div>`;
  });
  container.innerHTML = html;
}

function collectAptPlaces(aptIndex) {
  const container = document.getElementById(`s-a${aptIndex}-places`);
  if (!container) return [];
  const count = parseInt(container.dataset.count || '0');
  const places = [];
  for (let j = 0; j < count; j++) {
    const emojiEl = document.getElementById(`s-a${aptIndex}-pl${j}-emoji`);
    const p = { emoji: emojiEl ? emojiEl.value : '📍' };
    ['name', 'descIt', 'descEn', 'howIt', 'howEn', 'maps'].forEach(k => {
      const el = document.getElementById(`s-a${aptIndex}-pl${j}-${k}`);
      if (el) p[k] = el.value.trim();
    });
    places.push(p);
  }
  return places;
}

function addAptPlace(aptIndex) {
  const current = collectAptPlaces(aptIndex);
  current.push({ name: '', emoji: '📍', descIt: '', howIt: '', maps: '#' });
  renderAptPlaces(aptIndex, current);
}

function removeAptPlace(aptIndex, placeIdx) {
  if (!confirm(`Rimuovere il luogo ${placeIdx + 1}?`)) return;
  const current = collectAptPlaces(aptIndex);
  current.splice(placeIdx, 1);
  renderAptPlaces(aptIndex, current);
}

// ════════════════════════════════════════════
//  SETTINGS: APT RESTAURANTS (dynamic, per-apt)
// ════════════════════════════════════════════
function renderAptRests(aptIndex, rests) {
  const container = document.getElementById(`s-a${aptIndex}-restaurants`);
  if (!container) return;
  container.dataset.count = rests.length;
  let html = '';
  rests.forEach((r, j) => {
    html += `
      <div class="s-sub-title s-sub-title-row" style="margin-top:12px">
        <span>Ristorante ${j + 1}</span>
        <button class="s-remove-btn" onclick="removeAptRest(${aptIndex}, ${j})">🗑️ Rimuovi</button>
      </div>
      <div class="s-field"><label>Emoji</label><input type="text" id="s-a${aptIndex}-rt${j}-emoji" value="${escAttr(r.emoji || '🍽️')}" placeholder="🍽️" style="max-width:80px"></div>
      <div class="s-field"><label>Nome</label><input type="text" id="s-a${aptIndex}-rt${j}-name" value="${escAttr(r.name || '')}"></div>
      <div class="s-field"><label>Tipo</label><input type="text" id="s-a${aptIndex}-rt${j}-tipo" value="${escAttr(r.tipo || '')}"></div>
      <div class="s-field"><label>Descrizione 🇮🇹</label><textarea id="s-a${aptIndex}-rt${j}-descIt" onblur="autoTranslateField('s-a${aptIndex}-rt${j}-descIt','s-a${aptIndex}-rt${j}-descEn')">${escHtml(r.descIt || '')}</textarea></div>
      <div class="s-field"><label>Descrizione 🇬🇧</label><textarea id="s-a${aptIndex}-rt${j}-descEn">${escHtml(r.descEn || '')}</textarea></div>
      <div class="s-field"><label>Fascia prezzo</label><input type="text" id="s-a${aptIndex}-rt${j}-price" value="${escAttr(r.price || '')}" placeholder="€ / €€ / €€€"></div>
      <div class="s-field"><label>Link Maps</label><input type="url" id="s-a${aptIndex}-rt${j}-maps" value="${escAttr(r.maps || '')}"></div>`;
  });
  container.innerHTML = html;
}

function collectAptRests(aptIndex) {
  const container = document.getElementById(`s-a${aptIndex}-restaurants`);
  if (!container) return [];
  const count = parseInt(container.dataset.count || '0');
  const rests = [];
  for (let j = 0; j < count; j++) {
    const emojiEl = document.getElementById(`s-a${aptIndex}-rt${j}-emoji`);
    const r = { emoji: emojiEl ? emojiEl.value : '🍽️' };
    ['name', 'tipo', 'descIt', 'descEn', 'price', 'maps'].forEach(k => {
      const el = document.getElementById(`s-a${aptIndex}-rt${j}-${k}`);
      if (el) r[k] = el.value.trim();
    });
    rests.push(r);
  }
  return rests;
}

function addAptRest(aptIndex) {
  const current = collectAptRests(aptIndex);
  current.push({ name: '', emoji: '🍽️', tipo: '', descIt: '', price: '€€', maps: '#' });
  renderAptRests(aptIndex, current);
}

function removeAptRest(aptIndex, restIdx) {
  if (!confirm(`Rimuovere il ristorante ${restIdx + 1}?`)) return;
  const current = collectAptRests(aptIndex);
  current.splice(restIdx, 1);
  renderAptRests(aptIndex, current);
}

// ════════════════════════════════════════════
//  SETTINGS: APT SUPERMARKETS (per-apt)
// ════════════════════════════════════════════
function renderAptSupermarkets(aptIndex, supermarkets) {
  const container = document.getElementById(`s-a${aptIndex}-supermarkets`);
  if (!container) return;
  container.dataset.count = supermarkets.length;
  let html = '';
  supermarkets.forEach((s, j) => {
    html += `
      <div class="s-sub-title s-sub-title-row" style="margin-top:12px">
        <span>Supermercato ${j + 1}</span>
        <button class="s-remove-btn" onclick="removeAptSupermarket(${aptIndex}, ${j})">🗑️ Rimuovi</button>
      </div>
      <div class="s-field"><label>Emoji</label><input type="text" id="s-a${aptIndex}-sm${j}-emoji" value="${escAttr(s.emoji || '🛒')}" placeholder="🛒" style="max-width:80px"></div>
      <div class="s-field"><label>Nome</label><input type="text" id="s-a${aptIndex}-sm${j}-name" value="${escAttr(s.name || '')}"></div>
      <div class="s-field"><label>Tipo</label><input type="text" id="s-a${aptIndex}-sm${j}-tipo" value="${escAttr(s.tipo || '')}"></div>
      <div class="s-field"><label>Descrizione 🇮🇹</label><textarea id="s-a${aptIndex}-sm${j}-descIt" onblur="autoTranslateField('s-a${aptIndex}-sm${j}-descIt','s-a${aptIndex}-sm${j}-descEn')">${escHtml(s.descIt || '')}</textarea></div>
      <div class="s-field"><label>Descrizione 🇬🇧</label><textarea id="s-a${aptIndex}-sm${j}-descEn">${escHtml(s.descEn || '')}</textarea></div>
      <div class="s-field"><label>Fascia prezzo</label><input type="text" id="s-a${aptIndex}-sm${j}-price" value="${escAttr(s.price || '')}" placeholder="€ / €€ / €€€"></div>
      <div class="s-field"><label>Link Maps</label><input type="url" id="s-a${aptIndex}-sm${j}-maps" value="${escAttr(s.maps || '')}"></div>`;
  });
  container.innerHTML = html;
}

function collectAptSupermarkets(aptIndex) {
  const container = document.getElementById(`s-a${aptIndex}-supermarkets`);
  if (!container) return [];
  const count = parseInt(container.dataset.count || '0');
  const supermarkets = [];
  for (let j = 0; j < count; j++) {
    const emojiEl = document.getElementById(`s-a${aptIndex}-sm${j}-emoji`);
    const s = { emoji: emojiEl ? emojiEl.value : '🛒' };
    ['name', 'tipo', 'descIt', 'descEn', 'price', 'maps'].forEach(k => {
      const el = document.getElementById(`s-a${aptIndex}-sm${j}-${k}`);
      if (el) s[k] = el.value.trim();
    });
    supermarkets.push(s);
  }
  return supermarkets;
}

function addAptSupermarket(aptIndex) {
  const current = collectAptSupermarkets(aptIndex);
  current.push({ name: '', emoji: '🛒', tipo: '', descIt: '', descEn: '', price: '', maps: '' });
  renderAptSupermarkets(aptIndex, current);
}

function removeAptSupermarket(aptIndex, smIdx) {
  if (!confirm(`Rimuovere il supermercato ${smIdx + 1}?`)) return;
  const current = collectAptSupermarkets(aptIndex);
  current.splice(smIdx, 1);
  renderAptSupermarkets(aptIndex, current);
}

// ════════════════════════════════════════════
//  SETTINGS: APT TRANSPORT (per-apt)
// ════════════════════════════════════════════
function collectAptTransport(aptIndex) {
  const g = id => document.getElementById(`s-a${aptIndex}-tr-${id}`);
  return {
    airportEnabled: g('airportEnabled') ? g('airportEnabled').checked : true,
    airportIcon:  (g('airportIcon')  || {}).value || '✈️',
    airportIt:    (g('airportIt')    || {}).value || '',
    airportEn:    (g('airportEn')    || {}).value || '',
    airportMaps:  (g('airportMaps')  || {}).value || '',
    stationEnabled: g('stationEnabled') ? g('stationEnabled').checked : true,
    stationIcon:  (g('stationIcon')  || {}).value || '🚉',
    stationIt:    (g('stationIt')    || {}).value || '',
    stationEn:    (g('stationEn')    || {}).value || '',
    stationMaps:  (g('stationMaps')  || {}).value || '',
    metroEnabled: g('metroEnabled') ? g('metroEnabled').checked : true,
    metroIcon:    (g('metroIcon')    || {}).value || '🚇',
    metroIt:      (g('metroIt')      || {}).value || '',
    metroEn:      (g('metroEn')      || {}).value || '',
    metroMaps:    (g('metroMaps')    || {}).value || '',
    busEnabled:   g('busEnabled') ? g('busEnabled').checked : true,
    busIcon:      (g('busIcon')      || {}).value || '🚌',
    busIt:        (g('busIt')        || {}).value || '',
    busEn:        (g('busEn')        || {}).value || '',
    busMaps:      (g('busMaps')      || {}).value || '',
    ticketsIt:    (g('ticketsIt')    || {}).value || '',
    ticketsEn:    (g('ticketsEn')    || {}).value || '',
    taxiIt:       (g('taxiIt')       || {}).value || '',
    taxiEn:       (g('taxiEn')       || {}).value || ''
  };
}

// ════════════════════════════════════════════
//  SETTINGS: APT CHECKOUT STEPS (dynamic, per-apt)
// ════════════════════════════════════════════
function renderAptCheckoutSteps(aptIndex, steps) {
  const container = document.getElementById(`s-a${aptIndex}-checkoutSteps`);
  if (!container) return;
  container.dataset.count = steps.length;
  let html = '';
  steps.forEach((step, j) => {
    html += `
      <div class="s-sub-title s-sub-title-row" style="margin-top:12px">
        <span>Passo ${j + 1}</span>
        <button class="s-remove-btn" onclick="removeAptCheckoutStep(${aptIndex}, ${j})">🗑️ Rimuovi</button>
      </div>
      <div class="s-field"><label>Titolo 🇮🇹</label><input type="text" id="s-a${aptIndex}-cs${j}-titleIt" value="${escAttr(step.titleIt || '')}" onblur="autoTranslateField('s-a${aptIndex}-cs${j}-titleIt','s-a${aptIndex}-cs${j}-titleEn')"></div>
      <div class="s-field"><label>Titolo 🇬🇧</label><input type="text" id="s-a${aptIndex}-cs${j}-titleEn" value="${escAttr(step.titleEn || '')}"></div>
      <div class="s-field"><label>Descrizione 🇮🇹</label><textarea id="s-a${aptIndex}-cs${j}-descIt" onblur="autoTranslateField('s-a${aptIndex}-cs${j}-descIt','s-a${aptIndex}-cs${j}-descEn')">${escHtml(step.descIt || '')}</textarea></div>
      <div class="s-field"><label>Descrizione 🇬🇧</label><textarea id="s-a${aptIndex}-cs${j}-descEn">${escHtml(step.descEn || '')}</textarea></div>`;
  });
  container.innerHTML = html;
}

function collectAptCheckoutSteps(aptIndex) {
  const container = document.getElementById(`s-a${aptIndex}-checkoutSteps`);
  if (!container) return [];
  const count = parseInt(container.dataset.count || '0');
  const steps = [];
  for (let j = 0; j < count; j++) {
    const step = {};
    ['titleIt', 'titleEn', 'descIt', 'descEn'].forEach(k => {
      const el = document.getElementById(`s-a${aptIndex}-cs${j}-${k}`);
      if (el) step[k] = el.value;
    });
    steps.push(step);
  }
  return steps;
}

function addAptCheckoutStep(aptIndex) {
  const current = collectAptCheckoutSteps(aptIndex);
  current.push({ titleIt: '', descIt: '' });
  renderAptCheckoutSteps(aptIndex, current);
}

function removeAptCheckoutStep(aptIndex, stepIdx) {
  if (!confirm(`Rimuovere il passo ${stepIdx + 1}?`)) return;
  const current = collectAptCheckoutSteps(aptIndex);
  current.splice(stepIdx, 1);
  renderAptCheckoutSteps(aptIndex, current);
}

// ════════════════════════════════════════════
//  SETTINGS: CHECK-IN STEPS
// ════════════════════════════════════════════
function renderSettingsCheckinSteps(steps) {
  const container = document.getElementById('s-checkin-container');
  if (!container) return;
  container.dataset.count = steps.length;
  let html = '';
  steps.forEach((step, j) => {
    html += `
      <div class="s-sub-title s-sub-title-row" style="margin-top:12px">
        <span>Step ${j + 1}</span>
        <button class="s-remove-btn" onclick="removeSettingsCheckinStep(${j})">🗑️ Rimuovi</button>
      </div>
      <div class="s-field"><label>Emoji</label><input type="text" id="s-ci${j}-icon" value="${escAttr(step.icon || '')}" style="max-width:80px"></div>
      <div class="s-field"><label>Titolo 🇮🇹</label><input type="text" id="s-ci${j}-titleIt" value="${escAttr(step.titleIt || '')}" onblur="autoTranslateField('s-ci${j}-titleIt','s-ci${j}-titleEn')"></div>
      <div class="s-field"><label>Titolo 🇬🇧</label><input type="text" id="s-ci${j}-titleEn" value="${escAttr(step.titleEn || '')}"></div>
      <div class="s-field"><label>Descrizione 🇮🇹</label><textarea id="s-ci${j}-descIt" onblur="autoTranslateField('s-ci${j}-descIt','s-ci${j}-descEn')">${escHtml(step.descIt || '')}</textarea></div>
      <div class="s-field"><label>Descrizione 🇬🇧</label><textarea id="s-ci${j}-descEn">${escHtml(step.descEn || '')}</textarea></div>`;
  });
  container.innerHTML = html;
}

function collectSettingsCheckinSteps() {
  const container = document.getElementById('s-checkin-container');
  if (!container) return [];
  const count = parseInt(container.dataset.count || '0');
  const steps = [];
  for (let j = 0; j < count; j++) {
    const step = {};
    ['icon', 'titleIt', 'titleEn', 'descIt', 'descEn'].forEach(k => {
      const el = document.getElementById(`s-ci${j}-${k}`);
      if (el) step[k] = k === 'descIt' || k === 'descEn' ? el.value : el.value.trim();
    });
    steps.push(step);
  }
  return steps;
}

function addSettingsCheckinStep() {
  if (parseInt((document.getElementById('s-checkin-container') || {}).dataset.count || '0') >= 6) {
    showToast('Massimo 6 step check-in.', 'error');
    return;
  }
  const current = collectSettingsCheckinSteps();
  current.push({ icon: '', titleIt: '', titleEn: '', descIt: '', descEn: '' });
  renderSettingsCheckinSteps(current);
}

function removeSettingsCheckinStep(idx) {
  if (!confirm(`Rimuovere lo step ${idx + 1}?`)) return;
  const current = collectSettingsCheckinSteps();
  current.splice(idx, 1);
  renderSettingsCheckinSteps(current);
}

// ════════════════════════════════════════════
// ════════════════════════════════════════════
//  SETTINGS: DYNAMIC CONTACTS
// ════════════════════════════════════════════
function renderSettingsContacts(contacts) {
  const container = document.getElementById('s-contacts-fields');
  container.dataset.count = contacts.length;
  container.innerHTML = '';
  let html = '';
  contacts.forEach((c, i) => {
    html += `
      <div class="s-sub-title s-sub-title-row">
        <span>Contatto ${i + 1}</span>
        <button class="s-remove-btn" onclick="removeSettingsContact(${i})">🗑️ Rimuovi</button>
      </div>
      <div class="s-field"><label>Nome</label><input type="text" id="s-c${i}-name" value="${escAttr(c.name || '')}" placeholder="Nome Contatto"></div>
      <div class="s-field"><label>Telefono</label><input type="tel" id="s-c${i}-phone" value="${escAttr(c.phone || '')}" placeholder="+39 000 000 0000"></div>
      ${i < contacts.length - 1 ? '<div class="s-divider"></div>' : ''}`;
  });
  container.innerHTML = html;
}

function collectSettingsContacts() {
  const container = document.getElementById('s-contacts-fields');
  const count = parseInt(container.dataset.count || '0');
  const contacts = [];
  for (let i = 0; i < count; i++) {
    const nameEl = document.getElementById(`s-c${i}-name`);
    const phoneEl = document.getElementById(`s-c${i}-phone`);
    contacts.push({
      name: nameEl ? nameEl.value.trim() : '',
      phone: phoneEl ? phoneEl.value.trim() : ''
    });
  }
  return contacts;
}

function addSettingsContact() {
  const current = collectSettingsContacts();
  current.push({ name: '', phone: '' });
  renderSettingsContacts(current);
  const container = document.getElementById('s-contacts-fields');
  const idx = current.length - 1;
  const el = document.getElementById(`s-c${idx}-name`);
  if (el) el.focus();
}

function removeSettingsContact(idx) {
  const current = collectSettingsContacts();
  current.splice(idx, 1);
  renderSettingsContacts(current);
}

// ════════════════════════════════════════════
//  SETTINGS PANEL
// ════════════════════════════════════════════

function populateSettingsForms() {
  const d = currentData;

  // Info
  document.getElementById('s-bbName').value = d.bbName;
  document.getElementById('s-subtitle').value = d.subtitle;
  document.getElementById('s-cityZone').value = d.cityZone;
  document.getElementById('s-hostName').value = d.hostName;
  document.getElementById('s-hostPhone').value = d.hostPhone;
  document.getElementById('s-welcomeIt').value = d.welcomeIt || '';
  document.getElementById('s-welcomeEn').value = d.welcomeEn || '';
  document.getElementById('s-googleReviewUrl').value = d.googleReviewUrl || '';
  document.getElementById('s-closingTitleIt').value = d.closingTitleIt || '';
  document.getElementById('s-closingTitleEn').value = d.closingTitleEn || '';
  document.getElementById('s-closingTextIt').value = d.closingTextIt || '';
  document.getElementById('s-closingTextEn').value = d.closingTextEn || '';

  // Apts (dynamic)
  renderSettingsApts(d.apts);

  // Dynamic contacts
  renderSettingsContacts(d.extraContacts || []);

  // Reviews
  renderSettingsReviews(d.reviews || []);

  // Check-in steps
  renderSettingsCheckinSteps(d.checkinSteps || []);

  // Custom domain
  const cdEl = document.getElementById('s-customDomain');
  if (cdEl) cdEl.value = d.customDomain || '';

  // Char counters
  initCharCounters();

  // Nav Labels
  const nl = d.navLabels || {};
  document.getElementById('s-nl-homeIcon').value = nl.homeIcon || '';
  document.getElementById('s-nl-homeIt').value = nl.homeIt || '';
  document.getElementById('s-nl-homeEn').value = nl.homeEn || '';
  document.getElementById('s-nl-stayIcon').value = nl.stayIcon || '';
  document.getElementById('s-nl-stayIt').value = nl.stayIt || '';
  document.getElementById('s-nl-stayEn').value = nl.stayEn || '';
  document.getElementById('s-nl-placesIcon').value = nl.placesIcon || '';
  document.getElementById('s-nl-placesIt').value = nl.placesIt || '';
  document.getElementById('s-nl-placesEn').value = nl.placesEn || '';
  document.getElementById('s-nl-foodIcon').value = nl.foodIcon || '';
  document.getElementById('s-nl-foodIt').value = nl.foodIt || '';
  document.getElementById('s-nl-foodEn').value = nl.foodEn || '';
  document.getElementById('s-nl-transportIcon').value = nl.transportIcon || '';
  document.getElementById('s-nl-transportIt').value = nl.transportIt || '';
  document.getElementById('s-nl-transportEn').value = nl.transportEn || '';
  document.getElementById('s-nl-departureIcon').value = nl.departureIcon || '';
  document.getElementById('s-nl-departureIt').value = nl.departureIt || '';
  document.getElementById('s-nl-departureEn').value = nl.departureEn || '';

  // Section Titles
  const st = d.sectionTitles || {};
  document.getElementById('s-st-stayEyebrowIt').value = st.stayEyebrowIt || '';
  document.getElementById('s-st-stayEyebrowEn').value = st.stayEyebrowEn || '';
  document.getElementById('s-st-stayTitleIt').value = st.stayTitleIt || '';
  document.getElementById('s-st-stayTitleEn').value = st.stayTitleEn || '';
  document.getElementById('s-st-placesEyebrowIt').value = st.placesEyebrowIt || '';
  document.getElementById('s-st-placesEyebrowEn').value = st.placesEyebrowEn || '';
  document.getElementById('s-st-placesTitleIt').value = st.placesTitleIt || '';
  document.getElementById('s-st-placesTitleEn').value = st.placesTitleEn || '';
  document.getElementById('s-st-foodEyebrowIt').value = st.foodEyebrowIt || '';
  document.getElementById('s-st-foodEyebrowEn').value = st.foodEyebrowEn || '';
  document.getElementById('s-st-foodTitleIt').value = st.foodTitleIt || '';
  document.getElementById('s-st-foodTitleEn').value = st.foodTitleEn || '';
  document.getElementById('s-st-transportEyebrowIt').value = st.transportEyebrowIt || '';
  document.getElementById('s-st-transportEyebrowEn').value = st.transportEyebrowEn || '';
  document.getElementById('s-st-transportTitleIt').value = st.transportTitleIt || '';
  document.getElementById('s-st-transportTitleEn').value = st.transportTitleEn || '';
  document.getElementById('s-st-departureEyebrowIt').value = st.departureEyebrowIt || '';
  document.getElementById('s-st-departureEyebrowEn').value = st.departureEyebrowEn || '';
  document.getElementById('s-st-departureTitleIt').value = st.departureTitleIt || '';
  document.getElementById('s-st-departureTitleEn').value = st.departureTitleEn || '';

  // GitHub token (show indicator if saved, but do not reveal the token)
  const ghField = document.getElementById('s-github-token');
  if (ghField) {
    const encTok = localStorage.getItem(HOST_TOKEN_STORE);
    ghField.value = '';
    ghField.placeholder = encTok ? '[Token salvato ✅]' : 'ghp_...';
  }

  // QR Base URL
  const qrBaseUrlField = document.getElementById('s-qrBaseUrl');
  if (qrBaseUrlField) qrBaseUrlField.value = d.qrBaseUrl || '';

  // Support WhatsApp
  const supportPhone = (d.supportPhone || '+393450307922').replace(/\D/g, '');
  const waBtn = document.getElementById('s-support-wa-btn');
  if (waBtn) waBtn.setAttribute('href', 'https://wa.me/' + supportPhone);
  const supportPhoneField = document.getElementById('s-supportPhone');
  if (supportPhoneField) supportPhoneField.value = d.supportPhone || '+393450307922';

  // QR codes
  renderQrSection();

  // Analytics dashboard
  if (typeof GuestAnalytics !== 'undefined') GuestAnalytics.renderDashboard('an-dashboard');
}

function collectFormData() {
  const d = deepClone(currentData);

  d.bbName = document.getElementById('s-bbName').value.trim() || d.bbName;
  d.subtitle = document.getElementById('s-subtitle').value.trim() || d.subtitle;
  d.cityZone = document.getElementById('s-cityZone').value.trim() || d.cityZone;
  d.hostName = document.getElementById('s-hostName').value.trim() || d.hostName;
  d.hostPhone = document.getElementById('s-hostPhone').value.trim() || d.hostPhone;
  d.welcomeIt = document.getElementById('s-welcomeIt').value;
  d.welcomeEn = document.getElementById('s-welcomeEn').value;
  d.googleReviewUrl = document.getElementById('s-googleReviewUrl').value.trim();
  d.qrBaseUrl = (document.getElementById('s-qrBaseUrl') || {}).value || '';
  d.supportPhone = (document.getElementById('s-supportPhone') || {}).value || '+393450307922';
  d.closingTitleIt = document.getElementById('s-closingTitleIt').value.trim();
  d.closingTitleEn = document.getElementById('s-closingTitleEn').value.trim();
  d.closingTextIt = document.getElementById('s-closingTextIt').value.trim();
  d.closingTextEn = document.getElementById('s-closingTextEn').value.trim();

  // Dynamic apts
  d.apts = collectSettingsApts();

  // Dynamic contacts
  d.extraContacts = collectSettingsContacts();

  // Reviews
  d.reviews = collectSettingsReviews();

  // Check-in steps
  d.checkinSteps = collectSettingsCheckinSteps();

  // Custom domain
  const cdEl = document.getElementById('s-customDomain');
  if (cdEl) d.customDomain = cdEl.value.trim();

  // Nav Labels
  d.navLabels = {
    homeIt:         document.getElementById('s-nl-homeIt').value.trim() || 'Home',
    homeEn:         document.getElementById('s-nl-homeEn').value.trim(),
    homeIcon:       document.getElementById('s-nl-homeIcon').value.trim() || '🏠',
    stayIt:         document.getElementById('s-nl-stayIt').value.trim() || 'Soggiorno',
    stayEn:         document.getElementById('s-nl-stayEn').value.trim(),
    stayIcon:       document.getElementById('s-nl-stayIcon').value.trim() || '🛋️',
    placesIt:       document.getElementById('s-nl-placesIt').value.trim() || 'Luoghi',
    placesEn:       document.getElementById('s-nl-placesEn').value.trim(),
    placesIcon:     document.getElementById('s-nl-placesIcon').value.trim() || '🗺️',
    foodIt:         document.getElementById('s-nl-foodIt').value.trim() || 'Mangiare',
    foodEn:         document.getElementById('s-nl-foodEn').value.trim(),
    foodIcon:       document.getElementById('s-nl-foodIcon').value.trim() || '🍽️',
    transportIt:    document.getElementById('s-nl-transportIt').value.trim() || 'Muoversi',
    transportEn:    document.getElementById('s-nl-transportEn').value.trim(),
    transportIcon:  document.getElementById('s-nl-transportIcon').value.trim() || '🚇',
    departureIt:    document.getElementById('s-nl-departureIt').value.trim() || 'Partenza',
    departureEn:    document.getElementById('s-nl-departureEn').value.trim(),
    departureIcon:  document.getElementById('s-nl-departureIcon').value.trim() || '🧳'
  };

  // Section Titles
  d.sectionTitles = {
    stayEyebrowIt:      document.getElementById('s-st-stayEyebrowIt').value.trim() || 'Il Tuo Appartamento',
    stayEyebrowEn:      document.getElementById('s-st-stayEyebrowEn').value.trim(),
    stayTitleIt:        document.getElementById('s-st-stayTitleIt').value.trim() || 'Soggiorno',
    stayTitleEn:        document.getElementById('s-st-stayTitleEn').value.trim(),
    placesEyebrowIt:    document.getElementById('s-st-placesEyebrowIt').value.trim() || 'Scopri la Città',
    placesEyebrowEn:    document.getElementById('s-st-placesEyebrowEn').value.trim(),
    placesTitleIt:      document.getElementById('s-st-placesTitleIt').value.trim() || 'Luoghi',
    placesTitleEn:      document.getElementById('s-st-placesTitleEn').value.trim(),
    foodEyebrowIt:      document.getElementById('s-st-foodEyebrowIt').value.trim() || 'Dove Mangiare',
    foodEyebrowEn:      document.getElementById('s-st-foodEyebrowEn').value.trim(),
    foodTitleIt:        document.getElementById('s-st-foodTitleIt').value.trim() || 'Mangiare',
    foodTitleEn:        document.getElementById('s-st-foodTitleEn').value.trim(),
    transportEyebrowIt: document.getElementById('s-st-transportEyebrowIt').value.trim() || 'In Città',
    transportEyebrowEn: document.getElementById('s-st-transportEyebrowEn').value.trim(),
    transportTitleIt:   document.getElementById('s-st-transportTitleIt').value.trim() || 'Muoversi',
    transportTitleEn:   document.getElementById('s-st-transportTitleEn').value.trim(),
    departureEyebrowIt: document.getElementById('s-st-departureEyebrowIt').value.trim() || 'È Ora di Partire',
    departureEyebrowEn: document.getElementById('s-st-departureEyebrowEn').value.trim(),
    departureTitleIt:   document.getElementById('s-st-departureTitleIt').value.trim() || 'Partenza',
    departureTitleEn:   document.getElementById('s-st-departureTitleEn').value.trim()
  };

  return d;
}

// ════════════════════════════════════════════
//  FORM VALIDATION
// ════════════════════════════════════════════
function validateSettingsForm() {
  const errors = [];

  // Validazione URL
  const urlFields = ['s-googleReviewUrl'];
  const aptCount = parseInt(document.getElementById('s-apts-container').dataset.count || '0');
  for (let i = 0; i < aptCount; i++) {
    urlFields.push(`s-a${i}-mapsLink`);
    ['airport', 'station', 'metro', 'bus'].forEach(tr => {
      urlFields.push(`s-a${i}-tr-${tr}Maps`);
    });
  }
  urlFields.forEach(id => {
    const el = document.getElementById(id);
    if (el && el.value.trim() && !el.value.trim().match(/^https?:\/\//)) {
      el.style.borderColor = 'var(--accent)';
      const labelEl = el.closest('.s-field') && el.closest('.s-field').querySelector('label');
      errors.push(`Il campo "${labelEl ? labelEl.textContent : id}" deve essere un URL valido (https://...)`);
    } else if (el) {
      el.style.borderColor = '';
    }
  });

  // Validazione telefono
  const phoneEl = document.getElementById('s-hostPhone');
  if (phoneEl && phoneEl.value.trim() && !/^[\+\d\s\-\(\)]+$/.test(phoneEl.value.trim())) {
    phoneEl.style.borderColor = 'var(--accent)';
    errors.push('Il numero di telefono host non è valido.');
  } else if (phoneEl) {
    phoneEl.style.borderColor = '';
  }

  return errors;
}

function saveAndApply() {
  const validationErrors = validateSettingsForm();
  if (validationErrors.length > 0) {
    showToast('⚠️ ' + validationErrors[0], 'error');
    return;
  }
  if (currentRole === 'host') {
    if (!confirm('Vuoi salvare le modifiche? Le vedranno tutti gli ospiti.')) return;
    const d = collectFormData();
    currentData = d;
    saveData(d);
    renderLanding();
    settingsDirty = false;
    // Stay in settings panel - show toast feedback
    showToast("✅ Salvato! Ricorda di cliccare '🚀 Pubblica Ora' per aggiornare il sito online.", 'success');
    addChangelogEntry('Impostazioni salvate', 'host');
    if (typeof renderChangelogSection === 'function') renderChangelogSection();
  } else {
    const d = collectFormData();
    currentData = d;
    saveData(d);
    renderLanding();
    settingsDirty = false;
    // Stay in settings panel - show toast feedback
    showToast('✅ Salvato con successo!', 'success');
    addChangelogEntry('Impostazioni salvate', 'admin');
    if (typeof renderChangelogSection === 'function') renderChangelogSection();
  }
}

function sendChangesAsHost() {
  window.open('https://wa.me/393450307922', '_blank');
  showToast('💬 WhatsApp aperto.', 'success');
}

// ════════════════════════════════════════════
//  HOST PUBLISH: TOKEN PRE-SALVATO DALL'ADMIN
// ════════════════════════════════════════════

async function saveTokenForHost() {
  const tokenInput = document.getElementById('s-github-token');
  const token = (tokenInput && tokenInput.value.trim()) || '';
  if (!token) {
    showToast('⚠️ Inserisci prima il GitHub Token nel campo sopra.', 'error');
    return;
  }
  try {
    const enc = await encryptToken(token);
    localStorage.setItem(HOST_TOKEN_STORE, enc);
    if (tokenInput) { tokenInput.value = ''; tokenInput.placeholder = '[Token salvato ✅]'; }
    showToast('✅ Token cifrato e salvato in modo sicuro nel browser!', 'success');
  } catch (e) {
    showToast('❌ Errore nel salvataggio del token.', 'error');
  }
}

async function hostPublishNow() {
  const btn = document.getElementById('host-publish-btn');

  // Prova a recuperare il token pre-salvato dall'admin (cifrato in localStorage)
  const encTok = localStorage.getItem(HOST_TOKEN_STORE) || '';
  const token = encTok ? await decryptToken(encTok).catch(() => '') : '';

  if (!token) {
    // Fallback: nessun token configurato, usa il vecchio metodo di invio email/JSON
    showToast('⚠️ L\'amministratore non ha ancora configurato la pubblicazione automatica. Invio modifiche via email...', 'info');
    sendChangesAsHost();
    return;
  }

  if (!confirm('Vuoi pubblicare le modifiche online? Saranno visibili a tutti gli ospiti in pochi secondi.')) return;

  // 1. Salva localmente
  const d = collectFormData();
  currentData = d;
  saveData(d);
  renderLanding();

  // 2. Pubblica usando il token pre-salvato
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Pubblicazione…'; }

  try {
    const OWNER = 'ffeliteapartments';
    const REPO = 'guide';
    const DATA_FILE = 'js/data.js';
    const BRANCH = 'main';
    const DATA_API = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${DATA_FILE}`;

    // Get current js/data.js SHA
    const getResp = await fetch(`${DATA_API}?ref=${BRANCH}`, {
      headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' }
    });
    if (!getResp.ok) {
      const e = await getResp.json().catch(() => ({}));
      throw new Error(e.message || `HTTP ${getResp.status}`);
    }
    const fileData = await getResp.json();

    // Build updated js/data.js
    const rawHtml = decodeURIComponent(escape(atob(fileData.content.replace(/\n/g, ''))));
    const jsonStr = JSON.stringify(d, null, 2);
    const updatedHtml = rawHtml.replace(
      /\/\* PUBLISHED_DATA_START \*\/[\s\S]*?\/\* PUBLISHED_DATA_END \*\//,
      '/* PUBLISHED_DATA_START */\nconst PUBLISHED_DATA = ' + jsonStr + ';\n/* PUBLISHED_DATA_END */'
    );

    // Push updated file
    const putResp = await fetch(DATA_API, {
      method: 'PUT',
      headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: '📱 Aggiornamento guida (host) — ' + new Date().toLocaleDateString('it-IT'),
        content: btoa(unescape(encodeURIComponent(updatedHtml))),
        sha: fileData.sha,
        branch: BRANCH
      })
    });

    if (!putResp.ok) {
      const e = await putResp.json().catch(() => ({}));
      throw new Error(e.message || `HTTP ${putResp.status}`);
    }

    showToast('✅ Pubblicato! Le modifiche saranno online tra qualche secondo.', 'success');
    closeSettings();
  } catch (err) {
    showToast('❌ Errore: ' + (err.message || 'Errore sconosciuto.') + ' Prova a contattare l\'amministratore.', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '🚀 Pubblica Ora'; }
  }
}

function resetData() {
  if (!confirm('Ripristinare i dati predefiniti? Tutte le modifiche verranno perse.')) return;
  currentData = deepClone(DEFAULT_DATA);
  saveData(currentData);
  renderLanding();
  closeSettings();
  showToast('Dati resettati', 'info');
}

function exportJSON() {
  const d = collectFormData();
  const json = JSON.stringify(d, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'bnb-guide-data.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importJSON(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const imported = JSON.parse(e.target.result);
      currentData = mergeWithDefaults(imported, DEFAULT_DATA);
      saveData(currentData);
      renderLanding();
      populateSettingsForms();
      alert('Dati importati con successo!');
    } catch(err) {
      alert('Errore nel file JSON. Verificare il formato.');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}


// ════════════════════════════════════════════
//  QR CODE GENERATOR (lazy-loaded from js/qr-lib.js)
// ════════════════════════════════════════════

// Perf: lazy-load QR library only when needed
async function loadQrLib() {
  if (window.qrcode) return;
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'js/qr-lib.js';
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// ════════════════════════════════════════════
//  QR CODE SECTION
// ════════════════════════════════════════════
function getGuideBaseUrl() {
  return (currentData && currentData.qrBaseUrl && currentData.qrBaseUrl.trim())
    ? currentData.qrBaseUrl.trim()
    : window.location.origin + window.location.pathname;
}

async function renderQrSection() {
  const grid = document.getElementById('qr-grid');
  if (!grid) return;
  const apts = (currentData && currentData.apts) || [];
  const base = getGuideBaseUrl();
  grid.innerHTML = '';
  if (!apts.length) {
    grid.innerHTML = '<p style="color:var(--text2);font-size:12px">Nessun appartamento configurato.</p>';
    return;
  }
  try { await loadQrLib(); } catch(e) { console.error('Failed to load QR library:', e); }
  apts.forEach(function(apt, idx) {
    const url = base + '?apt=' + idx;
    const name = apt.name || ('Appartamento ' + (idx + 1));
    const card = document.createElement('div');
    card.className = 'qr-card';
    const title = document.createElement('div');
    title.className = 'qr-apt-name';
    title.textContent = name;
    card.appendChild(title);
    const wrap = document.createElement('div');
    wrap.className = 'qr-canvas-wrap';
    const canvas = document.createElement('canvas');
    canvas.id = 'qr-canvas-' + idx;
    wrap.appendChild(canvas);
    card.appendChild(wrap);
    const urlLabel = document.createElement('div');
    urlLabel.className = 'qr-url';
    urlLabel.textContent = url;
    card.appendChild(urlLabel);
    const dlBtn = document.createElement('button');
    dlBtn.className = 'qr-dl-btn';
    dlBtn.textContent = '📥 Scarica QR';
    dlBtn.onclick = (function(i, n) { return function() { downloadQr(i, n); }; })(idx, name);
    card.appendChild(dlBtn);
    grid.appendChild(card);
    // Generate QR
    try {
      var qr = qrcode(0, 'M');
      qr.addData(url);
      qr.make();
      var moduleCount = qr.getModuleCount();
      var size = 200;
      var cellSize = Math.floor(size / moduleCount);
      var actualSize = cellSize * moduleCount;
      canvas.width = actualSize;
      canvas.height = actualSize;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#1a3238';
      ctx.fillRect(0, 0, actualSize, actualSize);
      ctx.fillStyle = '#c9a84c';
      for (var row = 0; row < moduleCount; row++) {
        for (var col = 0; col < moduleCount; col++) {
          if (qr.isDark(row, col)) {
            ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
          }
        }
      }
    } catch(e) {
      canvas.style.display = 'none';
      urlLabel.textContent += ' (QR non disponibile)';
    }
  });
}

function downloadQr(idx, aptName) {
  var canvas = document.getElementById('qr-canvas-' + idx);
  if (!canvas) return;
  var link = document.createElement('a');
  link.download = 'qr-' + (aptName || ('apt-' + idx)).replace(/[^a-zA-Z0-9]/g, '_') + '.png';
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function printAllQr() {
  var apts = (currentData && currentData.apts) || [];
  var base = getGuideBaseUrl();
  var items = '';
  apts.forEach(function(apt, idx) {
    var canvas = document.getElementById('qr-canvas-' + idx);
    var dataUrl = canvas ? canvas.toDataURL('image/png') : '';
    var name = apt.name || ('Appartamento ' + (idx + 1));
    var url = base + '?apt=' + idx;
    items += '<div style="page-break-inside:avoid;display:inline-block;margin:20px;text-align:center;vertical-align:top">'
      + '<p style="font-family:serif;font-size:16px;color:#c9a84c;margin-bottom:8px">' + name + '</p>'
      + (dataUrl ? '<img src="' + dataUrl + '" style="width:200px;height:200px">' : '')
      + '<p style="font-size:10px;color:#666;margin-top:8px;word-break:break-all;max-width:200px">' + url + '</p>'
      + '</div>';
  });
  var win = window.open('', '_blank', 'noopener');
  if (!win) return;
  win.document.write('<html><head><title>QR Codes</title><style>body{background:#fff;text-align:center;padding:20px}@media print{@page{margin:1cm}}</style></head><body>' + items + '</body></html>');
  win.document.close();
  win.focus();
  setTimeout(function() { win.print(); }, 300);
}


async function changeRecoveryWord() {
  const currentWord = document.getElementById('s-recovery-current').value;
  const newWord = document.getElementById('s-recovery-new').value;
  const msg = document.getElementById('s-recovery-msg');
  const showErr = text => { msg.style.color = 'var(--accent)'; msg.textContent = '❌ ' + text; };
  const showOk = text => { msg.style.color = 'var(--teal)'; msg.textContent = '✅ ' + text; };
  if (!currentWord) { showErr('Inserisci la parola attuale.'); return; }
  const currentHash = await hashPin(currentWord);
  if (currentHash !== getStoredRecoveryHash()) { showErr('Parola attuale non corretta.'); return; }
  if (!newWord) { showErr('La nuova parola non può essere vuota.'); return; }
  const newHash = await hashPin(newWord);
  localStorage.setItem(RECOVERY_KEY, newHash);
  document.getElementById('s-recovery-current').value = '';
  document.getElementById('s-recovery-new').value = '';
  showOk('Parola di recovery aggiornata!');
  setTimeout(() => { msg.textContent = ''; }, 3000);
}

// ════════════════════════════════════════════
//  GITHUB TOKEN REMOVAL
// ════════════════════════════════════════════
function removeGithubToken() {
  localStorage.removeItem(TOKEN_STORE);
  localStorage.removeItem(HOST_TOKEN_STORE);
  const field = document.getElementById('s-github-token');
  if (field) { field.value = ''; field.placeholder = 'ghp_...'; }
  const msg = document.getElementById('s-publish-msg');
  if (msg) { msg.style.color = 'var(--teal)'; msg.textContent = '✅ Token rimosso.'; setTimeout(() => { msg.textContent = ''; }, 2000); }
}


function renderSettingsReviews(reviews) {
  const container = document.getElementById('s-reviews-container');
  if (!container) return;
  const existingReviews = container.querySelectorAll('.s-review-item');
  existingReviews.forEach(function(el) { el.remove(); });
  (reviews || []).forEach(function(r, i) {
    container.appendChild(_buildReviewItem(r, i));
  });
  container.dataset.count = (reviews || []).length;
}

function _buildReviewItem(r, idx) {
  const wrap = document.createElement('div');
  wrap.className = 's-review-item';
  wrap.style.cssText = 'border:1px solid var(--border);border-radius:10px;padding:12px;margin-bottom:10px';
  wrap.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
      '<strong style="font-size:12px;color:var(--gold)">Recensione #' + (idx+1) + '</strong>' +
      '<button onclick="removeSettingsReview(' + idx + ')" style="background:transparent;border:none;color:var(--accent);cursor:pointer;font-size:16px">✕</button>' +
    '</div>' +
    '<div class="s-field"><label>Nome Ospite</label><input type="text" class="rev-author" placeholder="es. Maria R." value="' + escHtml(r.author || '') + '"></div>' +
    '<div class="s-field"><label>Stelle</label><select class="rev-stars">' +
      [5,4,3,2,1].map(function(n) { return '<option value="' + n + '"' + (n === (r.stars||5) ? ' selected' : '') + '>' + n + ' ★</option>'; }).join('') +
    '</select></div>' +
    '<div class="s-field"><label>Testo 🇮🇹</label><textarea class="rev-textIt" rows="2" placeholder="Testo recensione in italiano...">' + escHtml(r.textIt || '') + '</textarea></div>' +
    '<div class="s-field"><label>Testo 🇬🇧</label><textarea class="rev-textEn" rows="2" placeholder="Review text in English...">' + escHtml(r.textEn || '') + '</textarea></div>';
  return wrap;
}

function collectSettingsReviews() {
  const container = document.getElementById('s-reviews-container');
  if (!container) return [];
  const items = container.querySelectorAll('.s-review-item');
  const reviews = [];
  items.forEach(function(item) {
    reviews.push({
      author: item.querySelector('.rev-author').value.trim(),
      stars: parseInt(item.querySelector('.rev-stars').value, 10) || 5,
      textIt: item.querySelector('.rev-textIt').value.trim(),
      textEn: item.querySelector('.rev-textEn').value.trim()
    });
  });
  return reviews;
}

function addSettingsReview() {
  const container = document.getElementById('s-reviews-container');
  if (!container) return;
  const current = collectSettingsReviews();
  const newReview = { author: '', stars: 5, textIt: '', textEn: '' };
  current.push(newReview);
  container.appendChild(_buildReviewItem(newReview, current.length - 1));
  container.dataset.count = current.length;
  settingsDirty = true;
}

function removeSettingsReview(idx) {
  const current = collectSettingsReviews();
  current.splice(idx, 1);
  renderSettingsReviews(current);
  settingsDirty = true;
}



// ════════════════════════════════════════════
//  CHANGELOG SECTION
// ════════════════════════════════════════════
function renderChangelogSection() {
  const container = document.getElementById('changelog-list');
  if (!container) return;
  const log = getChangelog();
  if (log.length === 0) {
    container.innerHTML = '<p style="font-size:12px;color:var(--text2);text-align:center;padding:12px">Nessuna modifica registrata.</p>';
    return;
  }
  container.innerHTML = log.map(entry => {
    const d = new Date(entry.ts);
    const dateStr = d.toLocaleDateString('it-IT') + ' ' + d.toLocaleTimeString('it-IT', {hour:'2-digit',minute:'2-digit'});
    const who = entry.who || 'admin';
    return `<div class="changelog-entry">
      <div class="changelog-entry-header">
        <span class="changelog-entry-desc">${escHtml(entry.desc || '')}</span>
        <span class="changelog-entry-who ${who === 'admin' ? 'admin' : 'host'}">${who === 'admin' ? '🛡️ Admin' : '👤 Host'}</span>
      </div>
      <div class="changelog-entry-meta">${dateStr}</div>
    </div>`;
  }).join('');
}

function clearChangelog() {
  if (!confirm('Cancellare tutto lo storico modifiche?')) return;
  localStorage.removeItem('bnb_changelog');
  renderChangelogSection();
}

function copyCnameRecord() {
  const el = document.getElementById('s-customDomain');
  const domain = el ? el.value.trim() : '';
  const githubUser = (typeof currentData !== 'undefined' && currentData.qrBaseUrl)
    ? (currentData.qrBaseUrl.match(/^https?:\/\/([^\/]+)/) || [])[1] || '<username>.github.io'
    : '<username>.github.io';
  const text = githubUser;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => showToast('📋 Record CNAME copiato!', 'success')).catch(() => showToast('⚠️ Copia fallita.', 'error'));
  } else {
    showToast('⚠️ Copia non supportata su questo browser.', 'error');
  }
}

function resetAnalytics() {
  if (!confirm('Azzerare tutti i dati analytics?')) return;
  if (typeof GuestAnalytics !== 'undefined') {
    GuestAnalytics.reset();
    GuestAnalytics.renderDashboard('an-dashboard');
  }
  showToast('📊 Analytics azzerati.', 'success');
}
