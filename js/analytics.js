// ════════════════════════════════════════════
//  GUEST ANALYTICS — localStorage only
// ════════════════════════════════════════════
const GuestAnalytics = (function () {
  const KEY = 'gg_analytics';
  const UUID_KEY = 'gg_visitor_uuid';
  const OWNER_DEVICE_KEY = 'bnb_is_owner_device';

  function _isOwnerDevice() {
    if (localStorage.getItem(OWNER_DEVICE_KEY) === 'true') return true;
    if (typeof currentRole !== 'undefined' && (currentRole === 'host' || currentRole === 'admin')) return true;
    return false;
  }

  let _cache = null;
  let _saveTimer = null;
  let _tabEntryTime = null;
  let _currentTab = null;

  function _load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function _saveNow() {
    if (_cache) {
      try { localStorage.setItem(KEY, JSON.stringify(_cache)); } catch (e) {}
    }
  }

  function _debounceSave() {
    if (_saveTimer) clearTimeout(_saveTimer);
    _saveTimer = setTimeout(_saveNow, 500);
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden' && _cache) {
        if (_currentTab) _flushTabTime();
        if (_saveTimer) clearTimeout(_saveTimer);
        _saveNow();
      }
    });
  }

  function _empty() {
    return {
      totalVisits: 0,
      uniqueVisitors: 0,
      returnVisits: 0,
      firstVisit: null,
      lastVisit: null,
      pageViews: { home: 0, stay: 0, places: 0, food: 0, transport: 0, departure: 0 },
      tabDurations: { home: 0, stay: 0, places: 0, food: 0, transport: 0, departure: 0 },
      langCounts: { it: 0, en: 0 },
      deviceCounts: { mobile: 0, tablet: 0, desktop: 0 },
      hourlyDist: Array(24).fill(0),
      externalClicks: { maps: 0, restaurant: 0, whatsapp: 0, review: 0, other: 0 },
      wifiCopyClicks: 0,
      aptVisits: {},
      qrScans: 0,
      bounceCount: 0,
      enteredGuide: false
    };
  }

  function _getDevice() {
    const w = window.innerWidth || screen.width;
    if (w < 768) return 'mobile';
    if (w < 1024) return 'tablet';
    return 'desktop';
  }

  function _getOrCreateUuid() {
    let uuid = localStorage.getItem(UUID_KEY);
    if (!uuid) {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        uuid = crypto.randomUUID();
      } else if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        uuid = Array.from(bytes).map(function(b, i) {
          const hex = b.toString(16).padStart(2, '0');
          return (i === 4 || i === 6 || i === 8 || i === 10) ? '-' + hex : hex;
        }).join('');
      } else {
        // Fallback for environments without crypto API: use a timestamp-based ID
        uuid = 'v-' + Date.now().toString(36) + '-' + performance.now().toString(36).replace('.', '');
      }
      localStorage.setItem(UUID_KEY, uuid);
      return { uuid, isNew: true };
    }
    return { uuid, isNew: false };
  }

  function getData() {
    if (!_cache) _cache = _load() || _empty();
    // ensure all fields present (backward compat)
    const e = _empty();
    for (const k of Object.keys(e)) {
      if (_cache[k] === undefined) _cache[k] = e[k];
    }
    if (!Array.isArray(_cache.hourlyDist)) _cache.hourlyDist = Array(24).fill(0);
    if (!_cache.externalClicks) _cache.externalClicks = { maps: 0, restaurant: 0, whatsapp: 0, review: 0, other: 0 };
    if (!_cache.aptVisits) _cache.aptVisits = {};
    return _cache;
  }

  function _flushTabTime() {
    if (!_currentTab || !_tabEntryTime) return;
    const d = getData();
    if (!d.tabDurations) d.tabDurations = {};
    d.tabDurations[_currentTab] = (d.tabDurations[_currentTab] || 0) + Math.floor((Date.now() - _tabEntryTime) / 1000);
    _tabEntryTime = null;
    _currentTab = null;
  }

  function trackVisit() {
    if (_isOwnerDevice()) return;
    const d = getData();
    const now = new Date();
    const isoNow = now.toISOString();
    d.totalVisits = (d.totalVisits || 0) + 1;
    if (!d.firstVisit) d.firstVisit = isoNow;
    d.lastVisit = isoNow;

    // Unique visitors
    const { isNew } = _getOrCreateUuid();
    if (isNew) {
      d.uniqueVisitors = (d.uniqueVisitors || 0) + 1;
    } else {
      // Any visit by a known UUID (non-new visitor) counts as a return visit
      d.returnVisits = (d.returnVisits || 0) + 1;
    }

    // Device
    const dev = _getDevice();
    if (!d.deviceCounts) d.deviceCounts = { mobile: 0, tablet: 0, desktop: 0 };
    d.deviceCounts[dev] = (d.deviceCounts[dev] || 0) + 1;

    // Hourly distribution
    const hour = now.getHours();
    if (!Array.isArray(d.hourlyDist)) d.hourlyDist = Array(24).fill(0);
    d.hourlyDist[hour] = (d.hourlyDist[hour] || 0) + 1;

    // QR scan detection
    if (window.location.search.includes('apt=')) {
      d.qrScans = (d.qrScans || 0) + 1;
    }

    // Apt visit tracking
    const aptMatch = window.location.search.match(/[?&]apt=(\d+)/);
    if (aptMatch) {
      const aptKey = 'apt' + aptMatch[1];
      if (!d.aptVisits) d.aptVisits = {};
      d.aptVisits[aptKey] = (d.aptVisits[aptKey] || 0) + 1;
    }

    // Bounce: initially false until user enters guide
    d.enteredGuide = false;
    _debounceSave();
  }

  function trackPageView(tabName) {
    if (_isOwnerDevice()) return;
    const d = getData();
    _flushTabTime();
    _currentTab = tabName;
    _tabEntryTime = Date.now();
    if (!d.pageViews) d.pageViews = {};
    d.pageViews[tabName] = (d.pageViews[tabName] || 0) + 1;
    // Mark that user entered the guide (not a bounce)
    d.enteredGuide = true;
    _debounceSave();
  }

  function trackLang(lang) {
    if (_isOwnerDevice()) return;
    const d = getData();
    if (!d.langCounts) d.langCounts = { it: 0, en: 0 };
    const key = (lang === 'en') ? 'en' : 'it';
    d.langCounts[key] = (d.langCounts[key] || 0) + 1;
    _debounceSave();
  }

  function trackExternalClick(type) {
    if (_isOwnerDevice()) return;
    const d = getData();
    if (!d.externalClicks) d.externalClicks = { maps: 0, restaurant: 0, whatsapp: 0, review: 0, other: 0 };
    const k = ['maps', 'restaurant', 'whatsapp', 'review', 'other'].includes(type) ? type : 'other';
    d.externalClicks[k] = (d.externalClicks[k] || 0) + 1;
    _debounceSave();
  }

  function trackWifiCopy() {
    if (_isOwnerDevice()) return;
    const d = getData();
    d.wifiCopyClicks = (d.wifiCopyClicks || 0) + 1;
    _debounceSave();
  }

  function trackGuideEntered() {
    if (_isOwnerDevice()) return;
    const d = getData();
    d.enteredGuide = true;
    _debounceSave();
  }

  function reset() {
    _cache = null;
    if (_saveTimer) clearTimeout(_saveTimer);
    _currentTab = null;
    _tabEntryTime = null;
    localStorage.removeItem(KEY);
  }

  function exportCsv() {
    const d = getData();
    const lines = [];
    lines.push('Metrica,Valore');
    lines.push('Visite totali,' + (d.totalVisits || 0));
    lines.push('Visitatori unici,' + (d.uniqueVisitors || 0));
    lines.push('Visite di ritorno,' + (d.returnVisits || 0));
    lines.push('QR scan,' + (d.qrScans || 0));
    lines.push('Copia WiFi,' + (d.wifiCopyClicks || 0));
    lines.push('Prima visita,' + (d.firstVisit || ''));
    lines.push('Ultima visita,' + (d.lastVisit || ''));
    const tabs = ['home','stay','places','food','transport','departure'];
    tabs.forEach(function(tab) {
      lines.push('Visite_' + tab + ',' + (d.pageViews[tab] || 0));
    });
    tabs.forEach(function(tab) {
      lines.push('Durata_sec_' + tab + ',' + ((d.tabDurations && d.tabDurations[tab]) || 0));
    });
    const lc = d.langCounts || {};
    lines.push('Lingua_IT,' + (lc.it || 0));
    lines.push('Lingua_EN,' + (lc.en || 0));
    const dc = d.deviceCounts || {};
    lines.push('Dispositivo_mobile,' + (dc.mobile || 0));
    lines.push('Dispositivo_tablet,' + (dc.tablet || 0));
    lines.push('Dispositivo_desktop,' + (dc.desktop || 0));
    const ec = d.externalClicks || {};
    lines.push('Click_maps,' + (ec.maps || 0));
    lines.push('Click_restaurant,' + (ec.restaurant || 0));
    lines.push('Click_whatsapp,' + (ec.whatsapp || 0));
    lines.push('Click_review,' + (ec.review || 0));
    const hd = d.hourlyDist || [];
    for (let h = 0; h < 24; h++) {
      lines.push('Ora_' + String(h).padStart(2,'0') + ',' + (hd[h] || 0));
    }
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analytics_' + new Date().toISOString().slice(0,10) + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function renderDashboard(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const d = getData();
    const lang = (typeof currentLang !== 'undefined') ? currentLang : 'it';
    const isEn = lang === 'en';

    const pv = d.pageViews || {};
    const td = d.tabDurations || {};
    const tabs = ['home', 'stay', 'places', 'food', 'transport', 'departure'];
    const tabLabels = isEn
      ? { home: 'Home', stay: 'Stay', places: 'Places', food: 'Food', transport: 'Transport', departure: 'Departure' }
      : { home: 'Home', stay: 'Soggiorno', places: 'Luoghi', food: 'Mangiare', transport: 'Muoversi', departure: 'Partenza' };
    const maxPv = Math.max(1, ...tabs.map(function(tab) { return pv[tab] || 0; }));

    const lc = d.langCounts || { it: 0, en: 0 };
    const totalLang = (lc.it || 0) + (lc.en || 0);
    const itPct = totalLang ? Math.round((lc.it || 0) / totalLang * 100) : 0;
    const enPct = totalLang ? 100 - itPct : 0;

    const dc = d.deviceCounts || {};
    const totalDev = (dc.mobile || 0) + (dc.tablet || 0) + (dc.desktop || 0);

    const hd = d.hourlyDist || Array(24).fill(0);
    const maxHour = Math.max(1, ...hd);

    const ec = d.externalClicks || {};
    const totalExt = (ec.maps||0) + (ec.restaurant||0) + (ec.whatsapp||0) + (ec.review||0) + (ec.other||0);

    const aptVisits = d.aptVisits || {};
    const topApt = Object.keys(aptVisits).reduce(function(a, b) { return (aptVisits[a]||0) >= (aptVisits[b]||0) ? a : b; }, '—');

    const topTabKey = tabs.reduce(function(a, b) { return (pv[a]||0) >= (pv[b]||0) ? a : b; }, tabs[0]);

    function fmtDate(iso) {
      if (!iso) return '—';
      try { return new Date(iso).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' }); } catch(e) { return iso.slice(0,16).replace('T',' '); }
    }
    function fmtDur(sec) {
      if (!sec) return '0s';
      if (sec < 60) return sec + 's';
      return Math.floor(sec/60) + 'm ' + (sec%60) + 's';
    }

    function devBar(label, icon, key) {
      const count = dc[key] || 0;
      const pct = totalDev ? Math.round(count / totalDev * 100) : 0;
      return '<div class="an-dev-row">' +
        '<span class="an-dev-label">' + icon + ' ' + label + '</span>' +
        '<div class="an-bar-wrap"><div class="an-bar-fill" style="width:' + pct + '%"></div></div>' +
        '<span class="an-dev-count">' + count + ' (' + pct + '%)</span>' +
        '</div>';
    }

    const L = {
      totalVisits:   isEn ? 'Total visits' : 'Visite totali',
      uniqueVis:     isEn ? 'Unique visitors' : 'Visitatori unici',
      returnVis:     isEn ? 'Return visits' : 'Visite di ritorno',
      topSection:    isEn ? 'Top section' : 'Sezione top',
      topAptLabel:   isEn ? 'Top apartment' : 'Appartamento top',
      qrScans:       isEn ? 'QR scans' : 'Scansioni QR',
      wifiCopy:      isEn ? 'WiFi copies' : 'Copia WiFi',
      sections:      isEn ? '📊 Section visits' : '📊 Sezioni visitate',
      timeOnSection: isEn ? '⏱️ Time per section' : '⏱️ Tempo per sezione',
      languages:     isEn ? '🌍 Languages' : '🌍 Lingue',
      devices:       isEn ? '📱 Devices' : '📱 Dispositivi',
      hourly:        isEn ? '🕐 Hourly distribution' : '🕐 Distribuzione oraria',
      extLinks:      isEn ? '🔗 External link clicks' : '🔗 Click link esterni',
      firstVisit:    isEn ? '🗓️ First visit' : '🗓️ Prima visita',
      lastVisit:     isEn ? '🕐 Last visit' : '🕐 Ultima visita',
      resetBtn:      isEn ? '🗑️ Reset Analytics' : '🗑️ Reset Analytics',
      exportBtn:     isEn ? '📥 Export CSV' : '📥 Esporta CSV',
      mobile:        'Mobile',
      tablet:        'Tablet',
      desktop:       'Desktop',
    };

    const tabBars = tabs.map(function(tab) {
      const count = pv[tab] || 0;
      const pct = Math.round(count / maxPv * 100);
      return '<div class="an-bar-row">' +
        '<span class="an-bar-label">' + tabLabels[tab] + '</span>' +
        '<div class="an-bar-wrap"><div class="an-bar-fill" style="width:' + pct + '%"></div></div>' +
        '<span class="an-bar-count">' + count + '</span>' +
        '</div>';
    }).join('');

    const maxSec = Math.max(1, ...tabs.map(function(t) { return td[t] || 0; }));
    const durBars = tabs.map(function(tab) {
      const sec = td[tab] || 0;
      const pct = Math.round(sec / maxSec * 100);
      return '<div class="an-bar-row">' +
        '<span class="an-bar-label">' + tabLabels[tab] + '</span>' +
        '<div class="an-bar-wrap"><div class="an-bar-fill an-bar-teal" style="width:' + pct + '%"></div></div>' +
        '<span class="an-bar-count">' + fmtDur(sec) + '</span>' +
        '</div>';
    }).join('');

    const extItems = [
      {key:'maps', label: isEn ? 'Maps' : 'Maps', icon:'🗺️'},
      {key:'restaurant', label: isEn ? 'Restaurants' : 'Ristoranti', icon:'🍽️'},
      {key:'whatsapp', label: 'WhatsApp', icon:'💬'},
      {key:'review', label: isEn ? 'Reviews' : 'Recensioni', icon:'⭐'},
    ];
    const extBars = extItems.map(function(item) {
      const count = ec[item.key] || 0;
      const pct = totalExt ? Math.round(count / totalExt * 100) : 0;
      return '<div class="an-bar-row">' +
        '<span class="an-bar-label">' + item.icon + ' ' + item.label + '</span>' +
        '<div class="an-bar-wrap"><div class="an-bar-fill an-bar-teal" style="width:' + pct + '%"></div></div>' +
        '<span class="an-bar-count">' + count + '</span>' +
        '</div>';
    }).join('');

    const hourCells = hd.map(function(count, h) {
      const intensity = maxHour > 0 ? count / maxHour : 0;
      const alpha = Math.round(intensity * 100);
      const hh = String(h).padStart(2,'0');
      return '<div class="an-hour-cell" title="' + hh + ':00 — ' + count + '" style="--alpha:' + alpha + '%">' +
        '<span class="an-hour-label">' + hh + '</span></div>';
    }).join('');

    container.innerHTML =
      '<div class="an-cards-row">' +
        '<div class="an-stat-card"><div class="an-stat-value">' + (d.totalVisits || 0) + '</div><div class="an-stat-label">' + L.totalVisits + '</div></div>' +
        '<div class="an-stat-card"><div class="an-stat-value">' + (d.uniqueVisitors || 0) + '</div><div class="an-stat-label">' + L.uniqueVis + '</div></div>' +
        '<div class="an-stat-card"><div class="an-stat-value">' + (d.returnVisits || 0) + '</div><div class="an-stat-label">' + L.returnVis + '</div></div>' +
        '<div class="an-stat-card"><div class="an-stat-value">' + (tabLabels[topTabKey] || '—') + '</div><div class="an-stat-label">' + L.topSection + '</div></div>' +
        '<div class="an-stat-card"><div class="an-stat-value">' + (topApt !== '—' ? topApt.replace('apt','#') : '—') + '</div><div class="an-stat-label">' + L.topAptLabel + '</div></div>' +
        '<div class="an-stat-card"><div class="an-stat-value">' + (d.qrScans || 0) + '</div><div class="an-stat-label">' + L.qrScans + '</div></div>' +
        '<div class="an-stat-card"><div class="an-stat-value">' + (d.wifiCopyClicks || 0) + '</div><div class="an-stat-label">' + L.wifiCopy + '</div></div>' +
      '</div>' +

      '<div class="an-section-title">' + L.sections + '</div>' +
      '<div class="an-bars">' + tabBars + '</div>' +

      '<div class="an-section-title">' + L.timeOnSection + '</div>' +
      '<div class="an-bars">' + durBars + '</div>' +

      '<div class="an-section-title">' + L.languages + '</div>' +
      '<div class="an-lang-bars">' +
        '<div class="an-lang-row"><span>🇮🇹 IT</span><div class="an-bar-wrap"><div class="an-bar-fill an-bar-gold" style="width:' + itPct + '%"></div></div><span>' + (lc.it||0) + ' (' + itPct + '%)</span></div>' +
        '<div class="an-lang-row"><span>🇬🇧 EN</span><div class="an-bar-wrap"><div class="an-bar-fill" style="width:' + enPct + '%"></div></div><span>' + (lc.en||0) + ' (' + enPct + '%)</span></div>' +
      '</div>' +

      '<div class="an-section-title">' + L.devices + '</div>' +
      '<div class="an-devices">' +
        devBar(L.mobile, '📱', 'mobile') +
        devBar(L.tablet, '📟', 'tablet') +
        devBar(L.desktop, '🖥️', 'desktop') +
      '</div>' +

      '<div class="an-section-title">' + L.hourly + '</div>' +
      '<div class="an-hourly-grid">' + hourCells + '</div>' +

      '<div class="an-section-title">' + L.extLinks + '</div>' +
      '<div class="an-bars">' + extBars + '</div>' +

      '<div class="an-dates">' +
        '<span>' + L.firstVisit + ': <strong>' + fmtDate(d.firstVisit) + '</strong></span>' +
        '<span>' + L.lastVisit + ': <strong>' + fmtDate(d.lastVisit) + '</strong></span>' +
      '</div>' +

      '<div class="an-actions">' +
        '<button class="s-btn danger" onclick="GuestAnalytics.reset(); if(typeof renderAdminAnalytics===\'function\') renderAdminAnalytics();">' + L.resetBtn + '</button>' +
        '<button class="s-btn" onclick="GuestAnalytics.exportCsv();">' + L.exportBtn + '</button>' +
      '</div>';
  }

  return { getData, trackVisit, trackPageView, trackLang, trackExternalClick, trackWifiCopy, trackGuideEntered, reset, exportCsv, renderDashboard };
})();

function renderAdminAnalytics() {
  GuestAnalytics.renderDashboard('an-dashboard');
}
