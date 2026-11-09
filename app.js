/* Setrise NASE app. No build step, no libraries. Rise with reasons. */
(function () {
  'use strict';
  var CFG = window.SETRISE_CONFIG || {};
  var TZ = 'Africa/Nairobi';
  var LS = { snap: 'sn_snap_v1', key: 'sn_key_v1', watch: 'sn_watch_v1', mode: 'sn_mode_v1' };

  var state = { tab: 'screen', mode: 'long', q: '', sector: 'All', sort: 'score', ratedOnly: false,
                data: null, offline: false, demo: false, loading: true, keyMsg: '', installEvt: null, err: '' };

  /* ------------------------------ helpers ------------------------------ */
  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function lsGet(k, d) { try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
  function num(v) { return typeof v === 'number' && isFinite(v); }
  function fmt(v, d) { return num(v) ? v.toLocaleString('en-KE', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }) : '–'; }
  function watchSet() { try { return JSON.parse(lsGet(LS.watch, '[]')); } catch (e) { return []; } }
  function saveWatch(a) { lsSet(LS.watch, JSON.stringify(a)); }

  function ratingClass(r) {
    switch (r) {
      case 'Strong candidate': case 'Strong setup': return 'strong';
      case 'Candidate': case 'Setup': return 'good';
      case 'Watch': case 'Neutral': return 'watch';
      case 'Weak': return 'weak';
      case 'Avoid': return 'avoid';
      default: return 'none';
    }
  }
  function pill(r) { return '<span class="pill p-' + ratingClass(r) + '">' + esc(r || 'No data') + '</span>'; }
  function dataPill(d) { return '<span class="pill p-' + (d === 'Fresh' ? 'good' : 'weak') + '">' + esc(d || 'Unknown') + '</span>'; }
  function scoreBadge(v, r) {
    return '<div class="score s-' + (num(v) ? ratingClass(r) : 'none') + '" aria-label="Score ' + (num(v) ? Math.round(v) : 'not available') + '">' + (num(v) ? Math.round(v) : '–') + '</div>';
  }
  function reasons(txt) {
    var out = [], re = /([▲▼])\s*([^▲▼]+)/g, m;
    while ((m = re.exec(txt || '')) !== null) out.push({ up: m[1] === '▲', t: m[2].trim() });
    return out;
  }
  function when(iso) {
    if (!iso) return null;
    var d = new Date(iso); if (isNaN(d)) return null;
    var s = new Intl.DateTimeFormat('en-KE', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
    var mins = Math.round((Date.now() - d.getTime()) / 60000);
    var rel = mins < 2 ? 'just now' : mins < 90 ? mins + ' min ago' : mins < 2880 ? Math.round(mins / 60) + ' h ago' : Math.round(mins / 1440) + ' days ago';
    return { text: s + ' EAT', rel: rel, mins: mins };
  }

  /* ------------------------------ data ------------------------------ */
  function demoData() {
    function s(t, n, sec, p, ls, lr, lw, ss, sr, sw, y, pe, pb, roe) {
      return { ticker: t, name: n, sector: sec, price: p, tier: 'A', turnover: 40, data: 'Fresh', lScore: ls, lRating: lr, lCov: 0.9, lWhy: lw,
        sScore: ss, sRating: sr, sCov: 0.8, sWhy: sw, yield: y, pe: pe, pb: pb, roe: roe, exDiv: null, daysEx: null };
    }
    return { ok: true, locked: false, plan: 'Demo', expires: null, asOf: new Date().toISOString(), health: 'HEALTHY', fullRefresh: null, stocks: [
      s('BANK-A', 'Demo Bank A', 'Banking', 52.4, 88, 'Strong candidate', '▲ ROE 24.1% ▲ Cheap P/E 4.8 ▲ Yield 8.2% ▼ Thin volume', 74, 'Setup', '▲ Above 50 and 200-day average ▲ Volume 1.8x average', 8.2, 4.8, 0.9, 24.1),
      s('BANK-B', 'Demo Bank B', 'Banking', 31.1, 81, 'Strong candidate', '▲ ROE 19.5% ▲ Low P/B 0.7 ▲ Yield 7.1%', 62, 'Neutral', '▲ Trend up ▼ Momentum cooling', 7.1, 5.9, 0.7, 19.5),
      s('TELCO-B', 'Demo Telecom B', 'Telecommunications', 18.9, 72, 'Candidate', '▲ ROE 31% ▼ Rich P/B 5.2 ▲ Yield 6.5%', 80, 'Strong setup', '▲ 3-month momentum strong ▲ RSI 58 ▲ Ex-div in 18 days', 6.5, 12.1, 5.2, 31),
      s('ENERGY-C', 'Demo Energy C', 'Energy & Petroleum', 9.8, 68, 'Candidate', '▲ Cheap P/E 6.3 ▲ Low P/B 0.2 ▼ Yield sustainability', 55, 'Neutral', '▼ Below 50-day average ▲ Volume steady', 7.5, 6.3, 0.2, 3.6),
      s('INS-D', 'Demo Insurance D', 'Insurance', 4.2, 51, 'Watch', '▲ Cheap P/E ▼ Low ROE 6% ▼ Illiquid', 38, 'Weak', '▼ Thin volume ▼ Below averages', 2.4, 7.0, 0.5, 6),
      s('MFG-E', 'Demo Manufacturing E', 'Manufacturing', 120, 34, 'Weak', '▼ Loss-making ▼ Rich P/B', null, 'Building history', '▼ Not enough price history yet', null, null, 3.1, -4),
      s('REIT-F', 'Demo Property F', 'Real Estate', 14.3, null, 'Insufficient data', '▼ Not enough data to rate', null, 'Illiquid - skip', '▼ Illiquid', null, null, null, null)
    ] };
  }

  function apiUrl() {
    var k = lsGet(LS.key, '');
    return CFG.API_URL + (CFG.API_URL.indexOf('?') > -1 ? '&' : '?') + (k ? 'key=' + encodeURIComponent(k) : '');
  }

  function fetchFeed(timeoutMs) {
    var ctl = ('AbortController' in window) ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, timeoutMs);
    return fetch(apiUrl(), { cache: 'no-store', signal: ctl ? ctl.signal : undefined })
      .then(function (r) { clearTimeout(timer); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (d) { if (!d || !d.ok) throw new Error((d && d.error) || 'bad response'); return d; })
      .catch(function (e) { clearTimeout(timer); throw (e && e.name === 'AbortError') ? new Error('timed out') : e; });
  }

  function load() {
    state.loading = true; render();
    if (!CFG.API_URL) { state.data = demoData(); state.demo = true; state.loading = false; render(); return; }
    // Apps Script can take several seconds to wake up, so allow a long wait and one retry.
    fetchFeed(40000).catch(function () { return new Promise(function (res) { setTimeout(res, 1500); }).then(function () { return fetchFeed(40000); }); })
      .then(function (d) {
        state.data = d; state.offline = false; state.err = ''; state.loading = false;
        if (lsGet(LS.key, '') && d.locked) state.keyMsg = d.keyProblem === 'expired' ? 'That key has expired. Ask for a renewal.' :
          d.keyProblem === 'revoked' ? 'That key is no longer active.' : 'That key was not recognised. Check it and try again.';
        else state.keyMsg = '';
        lsSet(LS.snap, JSON.stringify({ t: Date.now(), d: d }));
        render();
      })
      .catch(function (e) {
        state.err = String((e && e.message) || e || 'unknown');
        try { var c = JSON.parse(lsGet(LS.snap, 'null')); if (c && c.d) { state.data = c.d; state.offline = true; } } catch (x) { /* none */ }
        state.loading = false; render();
      });
  }

  /* ------------------------------ views ------------------------------ */
  function banners() {
    var b = [], d = state.data;
    if (state.demo) b.push('<div class="banner demo" role="status"><span>⚠</span><span><b>Demo data.</b> These are illustrative numbers, not real prices. Add your feed link in config.js.</span></div>');
    if (state.offline) b.push('<div class="banner warn" role="status"><span>⚠</span><span>Could not reach the data feed (' + esc(state.err || 'no connection') + '). Showing the last saved data. <a href="#" data-act="reload" style="color:inherit;font-weight:600">Try again</a></span></div>');
    if (d && d.health === 'CHECK') b.push('<div class="banner warn" role="status"><span>⚠</span><span>Data may be delayed while we fix a refresh problem. Check the time above.</span></div>');
    $('#banners').innerHTML = b.join('');
  }

  function header() {
    var d = state.data, el = $('#asof'), w = d && when(d.asOf);
    if (!w) { el.innerHTML = state.loading ? 'Loading…' : ''; return; }
    var cls = w.mins < 360 ? '' : w.mins < 4320 ? 'amber' : 'red';
    el.innerHTML = '<span class="dot ' + cls + '"></span><span>Data as of ' + esc(w.text) + ' · ' + esc(w.rel) + '</span>';
  }

  function visible() {
    var d = state.data; if (!d) return [];
    var q = state.q.trim().toLowerCase(), key = state.mode === 'long' ? 'lScore' : 'sScore';
    var list = d.stocks.filter(function (s) {
      if (state.sector !== 'All' && s.sector !== state.sector) return false;
      if (state.ratedOnly && !num(s[key])) return false;
      if (q && (s.ticker + ' ' + s.name).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    list.sort(function (a, b) {
      if (state.sort === 'az') return a.ticker.localeCompare(b.ticker);
      if (state.sort === 'yield') return (num(b.yield) ? b.yield : -1) - (num(a.yield) ? a.yield : -1);
      return (num(b[key]) ? b[key] : -1) - (num(a[key]) ? a[key] : -1);
    });
    return list;
  }

  function card(s) {
    var long = state.mode === 'long', sc = long ? s.lScore : s.sScore, rt = long ? s.lRating : s.sRating;
    var why = reasons(long ? s.lWhy : s.sWhy)[0], w = watchSet().indexOf(s.ticker) > -1;
    return '<button class="card" data-open="' + esc(s.ticker) + '" aria-label="' + esc(s.ticker + ', ' + (rt || 'no rating')) + '">' +
      scoreBadge(sc, rt) +
      '<div style="min-width:0"><div class="t">' + esc(s.ticker) + (w ? ' <span style="color:#F0A83A">★</span>' : '') + '</div><div class="n">' + esc(s.name) + '</div>' +
      (why ? '<div class="why1 ' + (why.up ? 'up' : 'dn') + '">' + (why.up ? '▲ ' : '▼ ') + esc(why.t) + '</div>' : '') + '</div>' +
      '<div class="right">' + (state.data.locked ? '' : '<div class="price">' + (num(s.price) ? fmt(s.price, 2) : '–') + '</div>') + pill(rt) + '</div></button>';
  }

  function lockPanel() {
    var d = state.data;
    return '<div class="lock"><h3>See all ' + esc(d.total || '') + ' stocks and the reasons</h3>' +
      '<p>You are seeing the free top 5. Members get every stock, the short-term setups and the full reasons behind each rating.</p>' +
      (CFG.SIGNUP_URL ? '<a class="btn block" href="' + esc(CFG.SIGNUP_URL) + '" target="_blank" rel="noopener">Join the waitlist</a>' : '') +
      '<p style="margin:12px 0 0">Already a member? <a href="#" data-go="me" style="color:#F0A83A;font-weight:600">Enter your key</a></p></div>';
  }

  function screener() {
    var d = state.data;
    if (state.loading && !d) return '<div class="empty"><b>Loading scores…</b>This takes a few seconds.</div>';
    if (!d) return '<div class="empty"><b>Could not load data</b>Check your connection and <a href="#" data-act="reload">try again</a>.</div>';
    var sectors = ['All']; d.stocks.forEach(function (s) { if (s.sector && sectors.indexOf(s.sector) < 0) sectors.push(s.sector); });
    var list = visible(), locked = d.locked;
    var h = '';
    if (!locked) {
      h += '<div class="seg" role="tablist"><button role="tab" data-mode="long" class="' + (state.mode === 'long' ? 'on' : '') + '" aria-selected="' + (state.mode === 'long') + '">Long-term</button>' +
           '<button role="tab" data-mode="short" class="' + (state.mode === 'short' ? 'on' : '') + '" aria-selected="' + (state.mode === 'short') + '">Short-term</button></div>' +
           '<label class="sr" for="q">Search stocks</label><input id="q" class="search" type="search" placeholder="Search ticker or company" value="' + esc(state.q) + '" autocomplete="off">' +
           '<div class="chips">' + sectors.map(function (x) { return '<button class="chip ' + (state.sector === x ? 'on' : '') + '" data-sector="' + esc(x) + '">' + esc(x) + '</button>'; }).join('') +
           '<button class="chip ' + (state.ratedOnly ? 'on' : '') + '" data-rated="1">Rated only</button></div>' +
           '<div class="meta"><span>' + list.length + ' stock' + (list.length === 1 ? '' : 's') + '</span><label>Sort <select id="sort"><option value="score"' + (state.sort === 'score' ? ' selected' : '') + '>Score</option><option value="yield"' + (state.sort === 'yield' ? ' selected' : '') + '>Yield</option><option value="az"' + (state.sort === 'az' ? ' selected' : '') + '>A to Z</option></select></label></div>';
    } else {
      h += '<h3 class="sec" style="margin-top:2px">Top long-term candidates (free preview)</h3>';
    }
    h += list.length ? list.map(card).join('') : '<div class="empty"><b>No matches</b>Try clearing the search or filters.</div>';
    if (locked) h += lockPanel();
    h += '<p class="fine" style="margin-top:14px">Setrise NASE is an educational screening tool, not investment advice. Scores use delayed public data and can be wrong. Do your own research.</p>';
    return h;
  }

  function watchView() {
    var d = state.data; if (!d) return '<div class="empty"><b>No data yet</b></div>';
    var w = watchSet(), list = d.stocks.filter(function (s) { return w.indexOf(s.ticker) > -1; });
    if (!list.length) return '<div class="empty"><b>Your watchlist is empty</b>Open any stock and tap the star to follow it here. Your list stays on this phone.</div>';
    return '<h3 class="sec" style="margin-top:2px">Your watchlist</h3>' + list.map(card).join('');
  }

  function meView() {
    var d = state.data, key = lsGet(LS.key, ''), h = '';
    var member = d && !d.locked;
    h += '<div class="panel"><h4>Your access</h4>';
    if (state.demo) h += '<div class="row"><span>Mode</span><b>Demo</b></div>';
    else h += '<div class="row"><span>Plan</span><b>' + (member ? esc(d.plan || 'Member') : 'Free preview') + '</b></div>' +
      (member && d.expires ? '<div class="row"><span>Valid until</span><b>' + esc(d.expires) + '</b></div>' : '');
    if (!state.demo) {
      h += '<div class="keyrow"><input id="key" type="text" inputmode="text" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="SN-XXXX-XXXX-XXXX" value="' + esc(key) + '" aria-label="Access key"><button class="btn" data-act="savekey">' + (key ? 'Update' : 'Unlock') + '</button></div>';
      if (state.keyMsg) h += '<div class="banner warn" style="margin:0 0 6px"><span>⚠</span><span>' + esc(state.keyMsg) + '</span></div>';
      if (key) h += '<button class="btn alt block" data-act="clearkey">Remove key from this phone</button>';
      h += '<p class="fine">Your key is stored only on this phone. Do not share it: it is for one subscriber.</p>';
    }
    h += '</div>';
    if (CFG.SIGNUP_URL) h += '<a class="btn block" href="' + esc(CFG.SIGNUP_URL) + '" target="_blank" rel="noopener">Join the waitlist</a>';
    var links = [];
    if (CFG.TELEGRAM_URL) links.push('<a class="btn alt block" style="margin-top:8px" href="' + esc(CFG.TELEGRAM_URL) + '" target="_blank" rel="noopener">Free weekly top 5 on Telegram</a>');
    if (CFG.WHATSAPP_URL) links.push('<a class="btn alt block" style="margin-top:8px" href="' + esc(CFG.WHATSAPP_URL) + '" target="_blank" rel="noopener">Chat on WhatsApp</a>');
    h += links.join('');
    h += '<h3 class="sec">Install on your phone</h3><div class="panel">';
    if (isStandalone()) h += '<p class="fine" style="margin:0">You are using the installed app.</p>';
    else if (state.installEvt) h += '<button class="btn block" data-act="install">Install Setrise NASE</button>';
    else h += '<p class="fine" style="margin:0"><b>Android (Chrome):</b> menu ⋮ then “Install app” or “Add to Home screen”.<br><b>iPhone (Safari):</b> Share button then “Add to Home Screen”.</p>';
    h += '</div><h3 class="sec">How to read a score</h3><div class="panel"><div class="fine" style="color:var(--text)">' +
      '<b>Long-term (0 to 100):</b> quality + income + value: return on equity, dividends, and price versus earnings and book value.<br><br>' +
      '<b>Short-term (0 to 100):</b> trend, momentum, volume, and dividend run-up. It needs fresh data and price history.<br><br>' +
      '<b>Coverage</b> is the share of the model that had data. Low coverage means a lower-confidence rating. <b>Tier A/B/C</b> shows how easy a stock is to trade; Tier C is illiquid.</div></div>' +
      '<p class="fine">Setrise NASE is an educational screening tool, not investment advice or a recommendation to buy or sell. Data comes from public sources, is delayed, and may contain errors. Past scores do not predict future returns.</p>' +
      '<p class="fine">Rise with reasons. · v1.0</p>';
    return h;
  }

  function isStandalone() { return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true; }

  function render() {
    header(); banners();
    var v = $('#view');
    v.innerHTML = state.tab === 'screen' ? screener() : state.tab === 'watch' ? watchView() : meView();
    document.querySelectorAll('.tabs button').forEach(function (b) { var on = b.dataset.tab === state.tab; b.classList.toggle('on', on); if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    if (state.tab === 'screen') {
      var q = $('#q'); if (q && state._focusQ) { q.focus(); try { q.setSelectionRange(q.value.length, q.value.length); } catch (e) { /* ignore */ } }
    }
  }

  /* ------------------------------ detail sheet ------------------------------ */
  function kv(l, v) { return '<div class="kv"><small>' + l + '</small><b>' + v + '</b></div>'; }
  function scoreBlock(title, sc, rt, cov, why) {
    var rs = reasons(why);
    return '<div class="panel"><h4>' + title + '</h4><div class="big">' + scoreBadge(sc, rt) +
      '<div style="flex:1"><div>' + pill(rt) + '</div>' + (num(cov) ? '<div class="fine" style="margin-top:4px">Data coverage ' + Math.round(cov * 100) + '%</div>' : '') +
      '<div class="bar" aria-hidden="true"><i style="width:' + (num(sc) ? Math.max(2, Math.min(100, sc)) : 0) + '%"></i></div></div></div>' +
      (rs.length ? '<ul class="reasons" style="margin-top:10px">' + rs.map(function (r) { return '<li><span class="' + (r.up ? 'up' : 'dn') + '">' + (r.up ? '▲' : '▼') + '</span><span>' + esc(r.t) + '</span></li>'; }).join('') + '</ul>' : '') + '</div>';
  }

  var lastFocus = null;
  function openSheet(t) {
    var s = state.data.stocks.filter(function (x) { return x.ticker === t; })[0]; if (!s) return;
    var locked = state.data.locked, w = watchSet().indexOf(t) > -1, long = state.mode === 'long';
    var tierTxt = { A: 'Tier A: easy to trade', B: 'Tier B: tradable, mind the spread', C: 'Tier C: illiquid, short-term signals are switched off' }[s.tier] || '';
    var h = '<div class="grab"></div><div class="sh-head"><div><h2 id="sheet-title">' + esc(s.ticker) + '</h2><div class="n" style="white-space:normal">' + esc(s.name) + ' · ' + esc(s.sector || '') + '</div></div>' +
      '<div style="display:flex;gap:6px;align-items:center"><button class="star ' + (w ? 'on' : '') + '" data-star="' + esc(t) + '" aria-label="' + (w ? 'Remove from watchlist' : 'Add to watchlist') + '">' + (w ? '★' : '☆') + '</button><button class="x" data-close="1" aria-label="Close">×</button></div></div>';
    if (!locked) h += '<div class="panel" style="display:flex;justify-content:space-between;align-items:center"><div><small class="fine">Last price (KES)</small><div class="price" style="font-size:22px">' + (num(s.price) ? fmt(s.price, 2) : '–') + '</div></div><div class="right"><small class="fine">Data</small><div>' + dataPill(s.data) + '</div></div></div>';
    if (locked) {
      h += scoreBlock('Long-term score', s.lScore, s.lRating, null, '') + lockPanel();
    } else {
      h += long ? scoreBlock('Long-term score', s.lScore, s.lRating, s.lCov, s.lWhy) + scoreBlock('Short-term score', s.sScore, s.sRating, s.sCov, s.sWhy)
                : scoreBlock('Short-term score', s.sScore, s.sRating, s.sCov, s.sWhy) + scoreBlock('Long-term score', s.lScore, s.lRating, s.lCov, s.lWhy);
      h += '<div class="panel"><h4>Key numbers</h4><div class="grid">' + kv('Yield %', fmt(s.yield, 1)) + kv('P/E', fmt(s.pe, 1)) + kv('P/B', fmt(s.pb, 2)) + kv('ROE %', fmt(s.roe, 1)) +
        kv('Next ex-div', s.exDiv ? esc(s.exDiv) : '–') + kv('Days to ex-div', num(s.daysEx) ? s.daysEx : '–') + '</div>' +
        (tierTxt ? '<p class="fine" style="margin:10px 0 0">' + esc(tierTxt) + '</p>' : '') + '</div>';
    }
    h += '<p class="fine">Educational screening tool, not investment advice. Delayed public data, may be wrong.</p>';
    var sh = $('#sheet'); sh.innerHTML = h; sh.hidden = false; $('#scrim').hidden = false;
    lastFocus = document.activeElement; document.body.style.overflow = 'hidden';
    var x = $('[data-close]', sh); if (x) x.focus();
  }
  function closeSheet() {
    $('#sheet').hidden = true; $('#scrim').hidden = true; document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) { /* ignore */ }
  }

  /* ------------------------------ events ------------------------------ */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-tab],[data-open],[data-mode],[data-sector],[data-rated],[data-star],[data-close],[data-act],[data-go]');
    if (!t) { if (e.target.id === 'scrim') closeSheet(); return; }
    var d = t.dataset;
    if (d.tab) { state.tab = d.tab; closeSheet(); render(); window.scrollTo(0, 0); }
    else if (d.go) { e.preventDefault(); closeSheet(); state.tab = d.go; render(); window.scrollTo(0, 0); }
    else if (d.open) openSheet(d.open);
    else if (d.mode) { state.mode = d.mode; lsSet(LS.mode, d.mode); state._focusQ = false; render(); }
    else if (d.sector) { state.sector = d.sector; state._focusQ = false; render(); }
    else if (d.rated) { state.ratedOnly = !state.ratedOnly; state._focusQ = false; render(); }
    else if (d.star) {
      var a = watchSet(), i = a.indexOf(d.star); if (i > -1) a.splice(i, 1); else a.push(d.star); saveWatch(a);
      var on = i < 0; t.classList.toggle('on', on); t.textContent = on ? '★' : '☆'; t.setAttribute('aria-label', on ? 'Remove from watchlist' : 'Add to watchlist'); state._focusQ = false; var v = $('#view'); var sy = window.scrollY; render(); window.scrollTo(0, sy);
    }
    else if (d.close) closeSheet();
    else if (d.act === 'reload') { e.preventDefault(); load(); }
    else if (d.act === 'savekey') { var k = ($('#key').value || '').trim().toUpperCase(); if (k) { lsSet(LS.key, k); state.keyMsg = ''; load(); } }
    else if (d.act === 'clearkey') { lsDel(LS.key); lsDel(LS.snap); state.keyMsg = ''; load(); }
    else if (d.act === 'install' && state.installEvt) { state.installEvt.prompt(); state.installEvt = null; }
  });
  document.addEventListener('input', function (e) {
    if (e.target.id === 'q') { state.q = e.target.value; state._focusQ = true; var pos = e.target.selectionStart; render(); var q = $('#q'); if (q) { q.focus(); try { q.setSelectionRange(pos, pos); } catch (x) { /* ignore */ } } }
  });
  document.addEventListener('change', function (e) { if (e.target.id === 'sort') { state.sort = e.target.value; state._focusQ = false; render(); } });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !$('#sheet').hidden) closeSheet();
    if (e.key === 'Tab' && !$('#sheet').hidden) {   // keep focus inside the open sheet
      var f = $('#sheet').querySelectorAll('button,a[href],input'); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); state.installEvt = e; if (state.tab === 'me') render(); });
  window.addEventListener('online', load);
  document.addEventListener('visibilitychange', function () { if (!document.hidden && state.data && !state.demo) load(); });

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () { /* optional */ }); });
  }
  state.mode = lsGet(LS.mode, 'long') === 'short' ? 'short' : 'long';
  load();
})();
