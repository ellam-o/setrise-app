/* Setrise NASE app. No build step, no libraries. Rise with reasons. */
(function () {
  'use strict';
  var CFG = window.SETRISE_CONFIG || {};
  var I = window.SN_I18N, GL = window.SN_GLOSSARY, RSW = window.SN_RATING_SW || {};
  var TZ = 'Africa/Nairobi';
  var LS = { snap: 'sn_snap_v1', key: 'sn_key_v1', watch: 'sn_watch_v1', mode: 'sn_mode_v1', lang: 'sn_lang_v1', port: 'sn_port_v1' };
  var CURS = ['SAR', 'AED', 'QAR', 'USD', 'GBP'];
  var ZONES = [{ tz: '', label: null }, { tz: 'Asia/Riyadh', label: 'Saudi Arabia' }, { tz: 'Asia/Dubai', label: 'UAE' }, { tz: 'Asia/Qatar', label: 'Qatar' },
               { tz: 'Europe/London', label: 'UK' }, { tz: 'America/New_York', label: 'US (New York)' }];

  var state = { tab: 'screen', more: '', mode: 'long', q: '', sector: 'All', sort: 'score', ratedOnly: false, mvMode: 'long',
                data: null, offline: false, demo: false, loading: true, keyMsg: '', installEvt: null, err: '', lang: 'en', pmsg: '' };

  /* ------------------------------ helpers ------------------------------ */
  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function lsGet(k, d) { try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
  function num(v) { return typeof v === 'number' && isFinite(v); }
  function loc() { return state.lang === 'sw' ? 'sw-KE' : 'en-KE'; }
  function fmt(v, d) { return num(v) ? v.toLocaleString('en-KE', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }) : '–'; }
  function t(k) { var d = I[state.lang] || I.en; return d[k] !== undefined ? d[k] : (I.en[k] !== undefined ? I.en[k] : k); }
  function rl(r) { return state.lang === 'sw' && RSW[r] ? RSW[r] : (r || ''); }
  function jget(k, d) { try { var v = JSON.parse(lsGet(k, 'null')); return v === null ? d : v; } catch (e) { return d; } }
  function watchSet() { var a = jget(LS.watch, []); return Array.isArray(a) ? a : []; }
  function getPort() { var a = jget(LS.port, []); return Array.isArray(a) ? a : []; }
  function stockBy(tk) { return state.data ? state.data.stocks.filter(function (s) { return s.ticker === tk; })[0] : null; }
  function eatNow() { return new Date(Date.now() + 3 * 3600 * 1000); }   // read with getUTC* to get East Africa Time
  function daysUntil(ds) {
    var e = eatNow(), today = Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate()), tg = Date.parse(ds + 'T00:00:00Z');
    return isNaN(tg) ? null : Math.round((tg - today) / 864e5);
  }
  function fmtDate(ds) {
    var d = new Date(ds + 'T00:00:00Z'); if (isNaN(d)) return esc(ds);
    return new Intl.DateTimeFormat(loc(), { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' }).format(d);
  }

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
  function pill(r) { return '<span class="pill p-' + ratingClass(r) + '">' + esc(rl(r) || '–') + '</span>'; }
  function dataPill(d) { return '<span class="pill p-' + (d === 'Fresh' ? 'good' : 'weak') + '">' + esc(d === 'Fresh' ? t('fresh') : d === 'Stale' ? t('stale') : (d || '–')) + '</span>'; }
  function scoreBadge(v, r) {
    return '<div class="score s-' + (num(v) ? ratingClass(r) : 'none') + '" aria-label="' + (num(v) ? Math.round(v) : '–') + '">' + (num(v) ? Math.round(v) : '–') + '</div>';
  }
  function reasons(txt) {
    var out = [], re = /([▲▼])\s*([^▲▼]+)/g, m;
    while ((m = re.exec(txt || '')) !== null) out.push({ up: m[1] === '▲', t: m[2].trim() });
    return out;
  }
  function when(iso) {
    if (!iso) return null;
    var d = new Date(iso); if (isNaN(d)) return null;
    var s = new Intl.DateTimeFormat(loc(), { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
    var mins = Math.round((Date.now() - d.getTime()) / 60000);
    var rel = mins < 2 ? 'just now' : mins < 90 ? mins + ' min' : mins < 2880 ? Math.round(mins / 60) + ' h' : Math.round(mins / 1440) + ' d';
    return { text: s + ' EAT', rel: mins < 2 ? rel : rel + ' ago', mins: mins };
  }
  function dur(mins) {
    mins = Math.max(0, Math.round(mins));
    var d = Math.floor(mins / 1440), h = Math.floor((mins % 1440) / 60), m = mins % 60;
    return (d ? d + ' d ' : '') + (h ? h + ' h ' : '') + (d ? '' : m + ' min');
  }

  /* ------------------------------ demo data ------------------------------ */
  function demoData() {
    function s(tk, n, sec, p, ls, lr, lw, ss, sr, sw, y, pe, pb, roe, lp, sp, ex) {
      return { ticker: tk, name: n, sector: sec, price: p, tier: 'A', turnover: 40, data: 'Fresh', lScore: ls, lRating: lr, lCov: 0.9, lWhy: lw,
        sScore: ss, sRating: sr, sCov: 0.8, sWhy: sw, yield: y, pe: pe, pb: pb, roe: roe, exDiv: ex || null, daysEx: null, lPrev: lp, sPrev: sp };
    }
    function inDays(n) { var e = eatNow(); return new Date(Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate() + n)).toISOString().slice(0, 10); }
    return { ok: true, locked: false, plan: 'Demo', expires: null, asOf: new Date().toISOString(), health: 'HEALTHY', fullRefresh: null, prevDate: inDays(-1),
      fx: { SAR: 0.029, AED: 0.0284, QAR: 0.0282, USD: 0.0077, GBP: 0.0059 },
      record: { minDays: 14, picks: 18, since: inDays(-20), base: { n: 12, avg: 2.1, hit: 58 }, rows: [
        { rating: 'Strong candidate', horizon: 'Long-term', n: 6, avg: 3.4, hit: 67 }, { rating: 'Candidate', horizon: 'Long-term', n: 6, avg: 1.2, hit: 50 },
        { rating: 'Watch', horizon: 'Long-term', n: 0 }, { rating: 'Weak', horizon: 'Long-term', n: 0 }, { rating: 'Avoid', horizon: 'Long-term', n: 0 },
        { rating: 'Strong setup', horizon: 'Short-term', n: 0 }, { rating: 'Setup', horizon: 'Short-term', n: 0 }, { rating: 'Neutral', horizon: 'Short-term', n: 0 }] },
      stocks: [
      s('BANK-A', 'Demo Bank A', 'Banking', 52.4, 88, 'Strong candidate', '▲ ROE 24.1% ▲ Cheap P/E 4.8 ▲ Yield 8.2% ▼ Thin volume', 74, 'Setup', '▲ Above 50 and 200-day average ▲ Volume 1.8x average', 8.2, 4.8, 0.9, 24.1, 84, 70, inDays(12)),
      s('BANK-B', 'Demo Bank B', 'Banking', 31.1, 81, 'Strong candidate', '▲ ROE 19.5% ▲ Low P/B 0.7 ▲ Yield 7.1%', 62, 'Neutral', '▲ Trend up ▼ Momentum cooling', 7.1, 5.9, 0.7, 19.5, 83, 66, inDays(30)),
      s('TELCO-B', 'Demo Telecom B', 'Telecommunications', 18.9, 72, 'Candidate', '▲ ROE 31% ▼ Rich P/B 5.2 ▲ Yield 6.5%', 80, 'Strong setup', '▲ 3-month momentum strong ▲ RSI 58 ▲ Ex-div in 18 days', 6.5, 12.1, 5.2, 31, 70, 74, inDays(18)),
      s('ENERGY-C', 'Demo Energy C', 'Energy & Petroleum', 9.8, 68, 'Candidate', '▲ Cheap P/E 6.3 ▲ Low P/B 0.2 ▼ Yield sustainability', 55, 'Neutral', '▼ Below 50-day average ▲ Volume steady', 7.5, 6.3, 0.2, 3.6, 68, 57, null),
      s('INS-D', 'Demo Insurance D', 'Insurance', 4.2, 51, 'Watch', '▲ Cheap P/E ▼ Low ROE 6% ▼ Illiquid', 38, 'Weak', '▼ Thin volume ▼ Below averages', 2.4, 7.0, 0.5, 6, 55, 40, inDays(55)),
      s('MFG-E', 'Demo Manufacturing E', 'Manufacturing', 120, 34, 'Weak', '▼ Loss-making ▼ Rich P/B', null, 'Building history', '▼ Not enough price history yet', null, null, 3.1, -4, 36, null, null),
      s('REIT-F', 'Demo Property F', 'Real Estate', 14.3, null, 'Insufficient data', '▼ Not enough data to rate', null, 'Illiquid - skip', '▼ Illiquid', null, null, null, null, null, null, null)
    ] };
  }

  /* ------------------------------ data load ------------------------------ */
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
    fetchFeed(40000).catch(function () { return new Promise(function (res) { setTimeout(res, 1500); }).then(function () { return fetchFeed(40000); }); })
      .then(function (d) {
        state.data = d; state.offline = false; state.err = ''; state.loading = false;
        if (lsGet(LS.key, '') && d.locked) state.keyMsg = d.keyProblem === 'expired' ? 'key_expired' : d.keyProblem === 'revoked' ? 'key_revoked' : 'key_bad';
        else state.keyMsg = '';
        lsSet(LS.snap, JSON.stringify({ t: Date.now(), d: d }));
        render();
      })
      .catch(function (e) {
        state.err = String((e && e.message) || e || 'unknown');
        var c = jget(LS.snap, null); if (c && c.d) { state.data = c.d; state.offline = true; }
        state.loading = false; render();
      });
  }

  /* ------------------------------ shared pieces ------------------------------ */
  function banners() {
    var b = [], d = state.data;
    if (state.demo) b.push('<div class="banner demo" role="status"><span>⚠</span><span>' + t('b_demo') + '</span></div>');
    if (state.offline) b.push('<div class="banner warn" role="status"><span>⚠</span><span>' + t('b_feed') + ' (' + esc(state.err || '–') + '). ' + t('b_saved') + ' <a href="#" data-act="reload" style="color:inherit;font-weight:600">' + t('try_again') + '</a></span></div>');
    if (d && d.health === 'CHECK') b.push('<div class="banner warn" role="status"><span>⚠</span><span>' + t('b_delay') + '</span></div>');
    $('#banners').innerHTML = b.join('');
  }
  function header() {
    var d = state.data, el = $('#asof'), w = d && when(d.asOf);
    if (!w) { el.innerHTML = state.loading ? t('loading') : ''; return; }
    var cls = w.mins < 360 ? '' : w.mins < 4320 ? 'amber' : 'red';
    el.innerHTML = '<span class="dot ' + cls + '"></span><span>' + t('asof') + ' ' + esc(w.text) + ' · ' + esc(w.rel) + '</span>';
  }
  var ICONS = {
    screen: '<path d="M4 20V10m6 10V4m6 16v-7m4 7H2"/>',
    watch: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    port: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
    more: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
    me: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.5 4-6 8-6s7 1.5 8 6"/>'
  };
  function nav() {
    $('.tabs').innerHTML = ['screen', 'watch', 'port', 'more', 'me'].map(function (k) {
      return '<button data-tab="' + k + '" class="' + (state.tab === k ? 'on' : '') + '"' + (state.tab === k ? ' aria-current="page"' : '') + '><svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS[k] + '</svg><span>' + t('tab_' + k) + '</span></button>';
    }).join('');
  }
  function lockPanel() {
    var d = state.data;
    return '<div class="lock"><h3>' + t('lock_h') + '</h3><p>' + t('lock_p') + '</p>' +
      (CFG.SIGNUP_URL ? '<a class="btn block" href="' + esc(CFG.SIGNUP_URL) + '" target="_blank" rel="noopener">' + t('join') + '</a>' : '') +
      '<p style="margin:12px 0 0">' + t('member_q') + ' <a href="#" data-go="me" style="color:#F0A83A;font-weight:600">' + t('enter_key') + '</a></p></div>';
  }
  function backBar(title) {
    return '<button class="back" data-more="">← ' + t('back') + '</button><h3 class="sec" style="margin-top:6px">' + esc(title) + '</h3>';
  }

  /* ------------------------------ screener ------------------------------ */
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
    var why = reasons(long ? s.lWhy : s.sWhy)[0], w = watchSet().indexOf(s.ticker) > -1, locked = state.data.locked;
    return '<div class="card"><button class="cardmain" data-open="' + esc(s.ticker) + '" aria-label="' + esc(s.ticker + ', ' + (rl(rt) || '')) + '">' +
      scoreBadge(sc, rt) +
      '<div style="min-width:0"><div class="t">' + esc(s.ticker) + '</div><div class="n">' + esc(s.name) + '</div>' +
      (why ? '<div class="why1 ' + (why.up ? 'up' : 'dn') + '">' + (why.up ? '▲ ' : '▼ ') + esc(why.t) + '</div>' : '') + '</div>' +
      '<div class="right">' + (locked ? '' : '<div class="price">' + (num(s.price) ? fmt(s.price, 2) : '–') + '</div>') + pill(rt) + '</div></button>' +
      '<button class="star ' + (w ? 'on' : '') + '" data-star="' + esc(s.ticker) + '" aria-pressed="' + w + '" aria-label="' + esc(s.ticker) + ' ' + (w ? '★' : '☆') + '">' + (w ? '★' : '☆') + '</button></div>';
  }
  function screener() {
    var d = state.data;
    if (state.loading && !d) return '<div class="empty"><b>' + t('loading') + '</b></div>';
    if (!d) return '<div class="empty"><b>–</b><a href="#" data-act="reload">' + t('try_again') + '</a></div>';
    var sectors = ['All']; d.stocks.forEach(function (s) { if (s.sector && sectors.indexOf(s.sector) < 0) sectors.push(s.sector); });
    var list = visible(), h = '';
    if (!d.locked) {
      h += '<div class="seg" role="tablist"><button role="tab" data-mode="long" class="' + (state.mode === 'long' ? 'on' : '') + '" aria-selected="' + (state.mode === 'long') + '">' + t('long') + '</button>' +
           '<button role="tab" data-mode="short" class="' + (state.mode === 'short' ? 'on' : '') + '" aria-selected="' + (state.mode === 'short') + '">' + t('short') + '</button></div>' +
           '<label class="sr" for="q">' + t('search') + '</label><input id="q" class="search" type="search" placeholder="' + esc(t('search')) + '" value="' + esc(state.q) + '" autocomplete="off">' +
           '<div class="chips">' + sectors.map(function (x) { return '<button class="chip ' + (state.sector === x ? 'on' : '') + '" data-sector="' + esc(x) + '">' + esc(x === 'All' ? t('all') : x) + '</button>'; }).join('') +
           '<button class="chip ' + (state.ratedOnly ? 'on' : '') + '" data-rated="1">' + t('rated') + '</button></div>' +
           '<div class="meta"><span>' + list.length + ' ' + (list.length === 1 ? t('stock') : t('stocks')) + '</span><label>' + t('sort') + ' <select id="sort"><option value="score"' + (state.sort === 'score' ? ' selected' : '') + '>' + t('s_score') + '</option><option value="yield"' + (state.sort === 'yield' ? ' selected' : '') + '>' + t('s_yield') + '</option><option value="az"' + (state.sort === 'az' ? ' selected' : '') + '>' + t('s_az') + '</option></select></label></div>';
    } else h += '<h3 class="sec" style="margin-top:2px">' + t('free_title') + '</h3>';
    h += list.length ? list.map(card).join('') : '<div class="empty"><b>' + t('no_match') + '</b>' + t('no_match_p') + '</div>';
    if (d.locked) h += lockPanel();
    return h + '<p class="fine" style="margin-top:14px">' + t('disclaimer') + '</p>';
  }
  function watchView() {
    var d = state.data; if (!d) return '<div class="empty"><b>–</b></div>';
    var w = watchSet(), list = d.stocks.filter(function (s) { return w.indexOf(s.ticker) > -1; });
    if (!list.length) return '<div class="empty"><b>' + t('watch_empty') + '</b>' + t('watch_empty_p') + '</div>';
    return '<h3 class="sec" style="margin-top:2px">' + t('watch_h') + '</h3>' + list.map(card).join('');
  }

  /* ------------------------------ portfolio ------------------------------ */
  function portView() {
    var d = state.data; if (!d) return '<div class="empty"><b>–</b></div>';
    if (d.locked) return '<h3 class="sec" style="margin-top:2px">' + t('port_h') + '</h3><p class="fine">' + t('members_only') + '</p>' + lockPanel();
    var P = getPort(), tv = 0, tc = 0, td = 0, h = '<h3 class="sec" style="margin-top:2px">' + t('port_h') + '</h3>';
    var rows = P.map(function (p, i) {
      var s = stockBy(p.t), pr = s && num(s.price) ? s.price : null, val = pr === null ? null : pr * p.q, cost = p.q * p.c;
      if (val !== null) { tv += val; tc += cost; td += val * ((s && num(s.yield)) ? s.yield : 0) / 100; }
      var pl = val === null ? null : val - cost, pct = pl === null || cost <= 0 ? null : pl / cost * 100;
      return '<div class="prow"><div style="flex:1;min-width:0"><div class="t">' + esc(p.t) + ' <span class="n">' + fmt(p.q) + ' × ' + fmt(p.c, 2) + '</span></div>' +
        '<div class="n">' + t('port_value') + ' ' + (val === null ? '–' : fmt(val, 0)) + '</div></div>' +
        '<div class="right"><div class="price ' + (pl === null ? '' : pl >= 0 ? 'up' : 'dn') + '">' + (pl === null ? '–' : (pl >= 0 ? '+' : '') + fmt(pl, 0)) + '</div>' +
        '<div class="n ' + (pct === null ? '' : pct >= 0 ? 'up' : 'dn') + '">' + (pct === null ? '' : (pct >= 0 ? '+' : '') + fmt(pct, 1) + '%') + '</div></div>' +
        '<button class="x sm" data-prem="' + i + '" aria-label="' + t('port_remove') + ' ' + esc(p.t) + '">×</button></div>';
    });
    if (!P.length) h += '<div class="empty"><b>' + t('port_empty') + '</b>' + t('port_empty_p') + '</div>';
    else {
      var plt = tv - tc;
      h += '<div class="panel"><div class="grid"><div class="kv"><small>' + t('port_value') + '</small><b>' + fmt(tv, 0) + '</b></div><div class="kv"><small>' + t('port_cost_total') + '</small><b>' + fmt(tc, 0) + '</b></div>' +
        '<div class="kv"><small>' + t('port_pl') + '</small><b class="' + (plt >= 0 ? 'up' : 'dn') + '">' + (plt >= 0 ? '+' : '') + fmt(plt, 0) + '</b></div></div>' +
        '<p class="fine" style="margin:10px 0 0">' + t('port_div') + ': <b style="color:var(--text)">KES ' + fmt(td, 0) + '</b></p></div>' + rows.join('') +
        '<button class="btn alt block" style="margin-top:8px" data-act="portcsv">' + t('port_export') + '</button>';
    }
    var opts = d.stocks.slice().sort(function (a, b) { return a.ticker.localeCompare(b.ticker); }).map(function (s) { return '<option value="' + esc(s.ticker) + '">' + esc(s.ticker + ' · ' + s.name) + '</option>'; }).join('');
    h += '<div class="panel"><h4>' + t('port_add') + '</h4><label class="lbl" for="pst">' + t('port_stock') + '</label><select id="pst" class="field"><option value="">' + t('port_pick') + '</option>' + opts + '</select>' +
      '<label class="lbl" for="pq">' + t('port_qty') + '</label><input id="pq" class="field" type="number" inputmode="decimal" min="0" step="any">' +
      '<label class="lbl" for="pc">' + t('port_cost') + '</label><input id="pc" class="field" type="number" inputmode="decimal" min="0" step="any">' +
      (state.pmsg ? '<p class="fine dn" role="alert">' + esc(state.pmsg) + '</p>' : '') +
      '<button class="btn block" style="margin-top:10px" data-act="portsave">' + t('port_save') + '</button></div><p class="fine">' + t('port_note') + '</p>';
    return h;
  }

  /* ------------------------------ more ------------------------------ */
  function moreView() {
    var m = state.more, d = state.data;
    if (!m) {
      var items = [['movers', '📈', true], ['cal', '📅', true], ['rec', '🏁', false], ['learn', '📖', false], ['tools', '🌍', false]];
      return '<h3 class="sec" style="margin-top:2px">' + t('more_h') + '</h3>' + items.map(function (it) {
        var lockedItem = it[2] && d && d.locked;
        return '<button class="mrow" data-more="' + it[0] + '"><span class="ico">' + it[1] + '</span><span style="flex:1;min-width:0;text-align:left"><b>' + t('m_' + (it[0] === 'rec' ? 'rec' : it[0])) + '</b><br><span class="n">' + t('m_' + it[0] + '_d') + '</span></span>' +
          (lockedItem ? '<span class="pill p-none">' + t('members_only') + '</span>' : '<span class="n">›</span>') + '</button>';
      }).join('');
    }
    if (m === 'learn') return learnView();
    if (m === 'rec') return recordView();
    if (m === 'tools') return toolsView();
    if (!d) return '<div class="empty"><b>–</b></div>';
    if (d.locked) return backBar(t('m_' + m)) + lockPanel();
    return m === 'movers' ? moversView() : calView();
  }

  function moversView() {
    var d = state.data, key = state.mvMode === 'long' ? ['lScore', 'lPrev', 'lRating'] : ['sScore', 'sPrev', 'sRating'];
    var seg = '<div class="seg"><button data-mv="long" class="' + (state.mvMode === 'long' ? 'on' : '') + '">' + t('long') + '</button><button data-mv="short" class="' + (state.mvMode === 'short' ? 'on' : '') + '">' + t('short') + '</button></div>';
    var rows = d.stocks.filter(function (s) { return num(s[key[0]]) && num(s[key[1]]); }).map(function (s) { return { s: s, dl: s[key[0]] - s[key[1]] }; });
    var h = backBar(t('mv_h')) + seg;
    if (!d.prevDate || !rows.length) return h + '<div class="empty"><b>' + t('mv_none') + '</b>' + t('mv_none_p') + '</div>';
    h += '<p class="fine">' + t('mv_vs') + ' ' + fmtDate(d.prevDate) + '</p>';
    function list(arr, up) {
      return arr.length ? arr.map(function (r) {
        return '<button class="card cardmain solo" data-open="' + esc(r.s.ticker) + '">' + scoreBadge(r.s[key[0]], r.s[key[2]]) + '<div style="min-width:0"><div class="t">' + esc(r.s.ticker) + '</div><div class="n">' + esc(r.s.name) + '</div></div>' +
          '<div class="right"><div class="price ' + (up ? 'up' : 'dn') + '">' + (r.dl >= 0 ? '+' : '') + fmt(r.dl, 1) + ' ' + t('pts') + '</div><div class="n">' + fmt(r.s[key[1]], 0) + ' → ' + fmt(r.s[key[0]], 0) + '</div></div></button>';
      }).join('') : '<p class="fine">–</p>';
    }
    var up = rows.filter(function (r) { return r.dl > 0.05; }).sort(function (a, b) { return b.dl - a.dl; }).slice(0, 5);
    var dn = rows.filter(function (r) { return r.dl < -0.05; }).sort(function (a, b) { return a.dl - b.dl; }).slice(0, 5);
    return h + '<h3 class="sec">' + t('mv_up') + '</h3>' + list(up, true) + '<h3 class="sec">' + t('mv_down') + '</h3>' + list(dn, false);
  }

  function calItems() {
    return state.data.stocks.filter(function (s) { return s.exDiv && daysUntil(s.exDiv) !== null && daysUntil(s.exDiv) >= 0; })
      .sort(function (a, b) { return a.exDiv < b.exDiv ? -1 : 1; });
  }
  function calView() {
    var items = calItems(), h = backBar(t('cal_h'));
    if (!items.length) return h + '<div class="empty"><b>' + t('cal_none') + '</b></div>';
    h += '<button class="btn alt block" data-ics="*" style="margin-bottom:8px">' + t('cal_all') + '</button>';
    h += items.map(function (s) {
      var n = daysUntil(s.exDiv);
      return '<div class="card"><button class="cardmain solo2" data-open="' + esc(s.ticker) + '"><div class="datebox"><b>' + esc(fmtDate(s.exDiv).split(' ').slice(0, 2).join(' ')) + '</b></div><div style="min-width:0"><div class="t">' + esc(s.ticker) + '</div><div class="n">' + esc(s.name) + '</div></div>' +
        '<div class="right"><div class="price">' + (n === 0 ? t('today') : t('in_days') + ' ' + n + ' ' + t('days')) + '</div><div class="n">' + t('yield') + ' ' + fmt(s.yield, 1) + '</div></div></button>' +
        '<button class="star" data-ics="' + esc(s.ticker) + '" aria-label="' + t('cal_add') + ' ' + esc(s.ticker) + '" title="' + t('cal_add') + '">📅</button></div>';
    }).join('') + '<p class="fine">' + t('cal_note') + '</p>';
    return h;
  }
  function makeIcs(list) {
    function ymd(ds) { return ds.replace(/-/g, ''); }
    function next(ds) { var d = new Date(ds + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10).replace(/-/g, ''); }
    var stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    var L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Setrise NASE//EN', 'CALSCALE:GREGORIAN'];
    list.forEach(function (s) {
      L.push('BEGIN:VEVENT', 'UID:' + s.ticker + '-' + s.exDiv + '@setrise-nase', 'DTSTAMP:' + stamp, 'DTSTART;VALUE=DATE:' + ymd(s.exDiv), 'DTEND;VALUE=DATE:' + next(s.exDiv),
        'SUMMARY:' + s.ticker + ' ex-dividend date', 'DESCRIPTION:' + (s.name + ' ex-dividend date (Setrise NASE). Check the book-closure date and your broker settlement time. Not investment advice.').replace(/,/g, '\\,'),
        'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', 'DESCRIPTION:' + s.ticker + ' ex-dividend tomorrow', 'END:VALARM', 'END:VEVENT');
    });
    L.push('END:VCALENDAR');
    return L.join('\r\n');
  }
  function download(name, mime, text) {
    var blob = new Blob([text], { type: mime }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  function recordView() {
    var d = state.data, r = d && d.record, h = backBar(t('rec_h')) + '<p class="fine" style="color:var(--text)">' + t('rec_p') + '</p>';
    if (!r || !r.rows) return h + '<div class="empty"><b>' + t('rec_none') + '</b></div>';
    h += '<div class="banner info"><span>ℹ</span><span><b>' + t('rec_early') + ':</b> ' + fmt(r.picks || 0) + ' ' + t('rec_early_p') + '</span></div>';
    var rows = r.rows.filter(function (x) { return x.n > 0; });
    if (r.base && r.base.n > 0) rows.push({ rating: t('rec_base'), n: r.base.n, avg: r.base.avg, hit: r.base.hit, base: true });
    if (!rows.length) return h + '<div class="empty"><b>' + t('rec_none') + '</b></div><p class="fine">' + t('rec_note') + '</p>';
    h += '<div class="panel" style="padding:6px 12px"><table class="tbl"><thead><tr><th>' + t('rec_rating') + '</th><th>' + t('rec_picks') + '</th><th>' + t('rec_avg') + '</th><th>' + t('rec_hit') + '</th></tr></thead><tbody>' +
      rows.map(function (x) {
        return '<tr' + (x.base ? ' class="base"' : '') + '><td>' + (x.base ? esc(x.rating) : esc(rl(x.rating))) + '</td><td>' + fmt(x.n) + '</td><td class="' + (num(x.avg) ? (x.avg >= 0 ? 'up' : 'dn') : '') + '">' + (num(x.avg) ? (x.avg >= 0 ? '+' : '') + fmt(x.avg, 1) + '%' : '–') + '</td><td>' + (num(x.hit) ? fmt(x.hit) + '%' : '–') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
    return h + '<p class="fine">' + t('rec_note') + (r.minDays ? ' (' + r.minDays + ' d)' : '') + '</p>';
  }

  function learnView() {
    return backBar(t('learn_h')) + GL.map(function (g) {
      return '<details class="gl"><summary>' + esc(g.k) + '</summary><p>' + esc(state.lang === 'sw' ? g.sw : g.en) + '</p></details>';
    }).join('') + '<p class="fine" style="margin-top:12px">' + t('disclaimer') + '</p>';
  }

  /* diaspora tools */
  function fxRates() {
    var r = (state.data && state.data.fx) || {}, f = CFG.FX_FALLBACK || {}, out = {};
    CURS.forEach(function (c) { var v = num(r[c]) ? r[c] : (num(f[c]) ? f[c] : null); if (v) out[c] = v; });
    return out;
  }
  function marketInfo() {
    var e = eatNow(), dow = e.getUTCDay(), mins = e.getUTCHours() * 60 + e.getUTCMinutes();
    if (dow >= 1 && dow <= 5 && mins >= 570 && mins < 900) return { open: true, mins: 900 - mins };
    var add;
    if (dow >= 1 && dow <= 5 && mins < 570) add = 570 - mins;
    else { var days = 1, nd = (dow + 1) % 7; while (nd === 0 || nd === 6) { days++; nd = (nd + 1) % 7; } add = (1440 - mins) + (days - 1) * 1440 + 570; }
    return { open: false, mins: add };
  }
  function zoneTimes(tz) {
    var e = eatNow(), base = Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate());
    var f = new Intl.DateTimeFormat('en-GB', { timeZone: tz || undefined, hour: '2-digit', minute: '2-digit', hour12: false });
    return f.format(new Date(base + (9 * 60 + 30 - 180) * 60000)) + ' – ' + f.format(new Date(base + (15 * 60 - 180) * 60000));
  }
  function toolsView() {
    var rates = fxRates(), d = state.data, mi = marketInfo();
    var h = backBar(t('tools_h'));
    // hours
    h += '<div class="panel"><h4>' + t('hrs_h') + '</h4><div class="big"><span class="dot ' + (mi.open ? '' : 'amber') + '" style="width:12px;height:12px"></span><div><b>' + (mi.open ? t('hrs_open') : t('hrs_closed')) + '</b><div class="fine">' + (mi.open ? t('hrs_closes_in') : t('hrs_opens_in')) + ' ' + dur(mi.mins) + '</div></div></div>' +
      '<table class="tbl" style="margin-top:8px"><tbody>' + ZONES.map(function (z) {
        var lab = z.tz ? z.label : t('hrs_your'); var tzn = z.tz;
        return '<tr><td>' + esc(lab) + '</td><td class="right">' + esc(zoneTimes(tzn)) + '</td></tr>';
      }).join('') + '<tr><td><b>EAT (Nairobi)</b></td><td class="right"><b>09:30 – 15:00</b></td></tr></tbody></table><p class="fine" style="margin:8px 0 0">' + t('hrs_sched') + '</p></div>';
    // fx
    h += '<div class="panel"><h4>' + t('fx_h') + '</h4>';
    if (!Object.keys(rates).length) h += '<p class="fine">' + t('fx_none') + '</p>';
    else {
      h += '<label class="lbl" for="fxamt">' + t('fx_amount') + ' (KES)</label><input id="fxamt" class="field" type="number" inputmode="decimal" min="0" step="any" value="10000">' +
        '<table class="tbl" style="margin-top:8px"><tbody>' + Object.keys(rates).map(function (c) {
          return '<tr><td><b>' + c + '</b></td><td class="right" data-fxout="' + c + '">–</td><td class="right n">1 ' + c + ' = ' + fmt(1 / rates[c], 2) + ' KES</td></tr>';
        }).join('') + '</tbody></table>';
    }
    h += '<p class="fine" style="margin:8px 0 0">' + t('fx_note') + '</p></div>';
    // tax
    var opts = (d && !d.locked) ? d.stocks.filter(function (s) { return num(s.price) && num(s.yield) && s.yield > 0; }).sort(function (a, b) { return a.ticker.localeCompare(b.ticker); })
      .map(function (s) { return '<option value="' + esc(s.ticker) + '">' + esc(s.ticker) + '</option>'; }).join('') : '';
    h += '<div class="panel"><h4>' + t('tax_h') + '</h4>' + (opts ? '<label class="lbl" for="taxstock">' + t('pick_stock') + '</label><select id="taxstock" class="field"><option value="">–</option>' + opts + '</select>' : '') +
      '<label class="lbl" for="taxsh">' + t('tax_shares') + '</label><input id="taxsh" class="field" type="number" inputmode="decimal" min="0" step="any" value="1000">' +
      '<label class="lbl" for="taxdps">' + t('tax_dps') + '</label><input id="taxdps" class="field" type="number" inputmode="decimal" min="0" step="any" value="1">' +
      '<label class="lbl" for="taxrate">' + t('tax_rate') + '</label><select id="taxrate" class="field"><option value="10">' + t('tax_non') + '</option><option value="5">' + t('tax_res') + '</option><option value="custom">' + t('tax_custom') + '</option></select>' +
      '<input id="taxcustom" class="field" type="number" inputmode="decimal" min="0" max="100" step="any" placeholder="%" style="display:none;margin-top:6px">' +
      '<table class="tbl" style="margin-top:10px"><tbody><tr><td>' + t('tax_gross') + '</td><td class="right" id="taxg">–</td></tr><tr><td>' + t('tax_tax') + '</td><td class="right dn" id="taxt">–</td></tr><tr><td><b>' + t('tax_net') + '</b></td><td class="right"><b id="taxn">–</b></td></tr></tbody></table>' +
      '<p class="fine" style="margin:8px 0 0">' + t('tax_note') + '</p></div>';
    return h;
  }
  function updateFx() {
    var rates = fxRates(), a = parseFloat(($('#fxamt') || {}).value);
    document.querySelectorAll('[data-fxout]').forEach(function (el) { var r = rates[el.dataset.fxout]; el.textContent = isFinite(a) && r ? fmt(a * r, 2) : '–'; });
  }
  function updateTax() {
    var sh = parseFloat(($('#taxsh') || {}).value), dps = parseFloat(($('#taxdps') || {}).value), sel = ($('#taxrate') || {}).value, rate;
    if ($('#taxcustom')) $('#taxcustom').style.display = sel === 'custom' ? '' : 'none';
    rate = sel === 'custom' ? parseFloat(($('#taxcustom') || {}).value) : parseFloat(sel);
    if (![sh, dps, rate].every(isFinite)) { ['taxg', 'taxt', 'taxn'].forEach(function (i) { $('#' + i).textContent = '–'; }); return; }
    var g = sh * dps, tx = g * rate / 100, n = g - tx, rates = fxRates();
    $('#taxg').textContent = 'KES ' + fmt(g, 2); $('#taxt').textContent = '− KES ' + fmt(tx, 2);
    $('#taxn').textContent = 'KES ' + fmt(n, 2) + ['SAR', 'AED', 'QAR'].filter(function (c) { return rates[c]; }).map(function (c) { return ' · ≈ ' + c + ' ' + fmt(n * rates[c], 2); }).join('');
  }

  /* ------------------------------ account ------------------------------ */
  function isStandalone() { return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true; }
  function meView() {
    var d = state.data, key = lsGet(LS.key, ''), h = '', member = d && !d.locked;
    h += '<div class="panel"><h4>' + t('me_access') + '</h4>';
    if (state.demo) h += '<div class="row"><span>–</span><b>Demo</b></div>';
    else h += '<div class="row"><span>' + t('plan') + '</span><b>' + (member ? esc(d.plan || t('member')) : t('free_prev')) + '</b></div>' + (member && d.expires ? '<div class="row"><span>' + t('valid_until') + '</span><b>' + esc(d.expires) + '</b></div>' : '');
    if (!state.demo) {
      h += '<div class="keyrow"><input id="key" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="SN-XXXX-XXXX-XXXX" value="' + esc(key) + '" aria-label="Access key"><button class="btn" data-act="savekey">' + (key ? t('update') : t('unlock')) + '</button></div>';
      if (state.keyMsg) h += '<div class="banner warn" style="margin:0 0 6px"><span>⚠</span><span>' + t(state.keyMsg) + '</span></div>';
      if (key) h += '<button class="btn alt block" data-act="clearkey">' + t('remove_key') + '</button>';
      h += '<p class="fine">' + t('key_note') + '</p>';
    }
    h += '</div><div class="panel"><h4>' + t('lang') + '</h4><div class="seg" style="margin:0"><button data-lang="en" class="' + (state.lang === 'en' ? 'on' : '') + '">English</button><button data-lang="sw" class="' + (state.lang === 'sw' ? 'on' : '') + '">Kiswahili</button></div></div>';
    if (CFG.SIGNUP_URL) h += '<a class="btn block" href="' + esc(CFG.SIGNUP_URL) + '" target="_blank" rel="noopener">' + t('join') + '</a>';
    if (CFG.TELEGRAM_URL) h += '<a class="btn alt block" style="margin-top:8px" href="' + esc(CFG.TELEGRAM_URL) + '" target="_blank" rel="noopener">Telegram</a>';
    if (CFG.WHATSAPP_URL) h += '<a class="btn alt block" style="margin-top:8px" href="' + esc(CFG.WHATSAPP_URL) + '" target="_blank" rel="noopener">WhatsApp</a>';
    h += '<h3 class="sec">' + t('install_h') + '</h3><div class="panel">';
    if (isStandalone()) h += '<p class="fine" style="margin:0">' + t('installed') + '</p>';
    else if (state.installEvt) h += '<button class="btn block" data-act="install">' + t('install_btn') + '</button>';
    else h += '<p class="fine" style="margin:0">' + t('install_help') + '</p>';
    h += '</div><h3 class="sec">' + t('read_h') + '</h3><div class="panel"><div class="fine" style="color:var(--text)">' + t('read_p') + '</div></div><p class="fine">' + t('legal') + '</p><p class="fine">Rise with reasons. · v2.0</p>';
    return h;
  }

  /* ------------------------------ render ------------------------------ */
  function render() {
    document.documentElement.lang = state.lang === 'sw' ? 'sw' : 'en';
    header(); banners(); nav();
    var v = $('#view'), h;
    if (state.tab === 'screen') h = screener(); else if (state.tab === 'watch') h = watchView(); else if (state.tab === 'port') h = portView();
    else if (state.tab === 'more') h = moreView(); else h = meView();
    v.innerHTML = h;
    if (state.tab === 'screen') { var q = $('#q'); if (q && state._focusQ) { q.focus(); try { q.setSelectionRange(q.value.length, q.value.length); } catch (e) { /* ignore */ } } }
    if (state.tab === 'more' && state.more === 'tools') { updateFx(); updateTax(); }
  }

  /* ------------------------------ detail sheet ------------------------------ */
  function kv(l, v) { return '<div class="kv"><small>' + l + '</small><b>' + v + '</b></div>'; }
  function scoreBlock(title, sc, rt, cov, why) {
    var rs = reasons(why);
    return '<div class="panel"><h4>' + title + '</h4><div class="big">' + scoreBadge(sc, rt) +
      '<div style="flex:1"><div>' + pill(rt) + '</div>' + (num(cov) ? '<div class="fine" style="margin-top:4px">' + t('coverage') + ' ' + Math.round(cov * 100) + '%</div>' : '') +
      '<div class="bar" aria-hidden="true"><i style="width:' + (num(sc) ? Math.max(2, Math.min(100, sc)) : 0) + '%"></i></div></div></div>' +
      (rs.length ? '<ul class="reasons" style="margin-top:10px">' + rs.map(function (r) { return '<li><span class="' + (r.up ? 'up' : 'dn') + '">' + (r.up ? '▲' : '▼') + '</span><span>' + esc(r.t) + '</span></li>'; }).join('') + '</ul>' : '') + '</div>';
  }
  var lastFocus = null;
  function openSheet(tk) {
    var s = stockBy(tk); if (!s) return;
    var locked = state.data.locked, w = watchSet().indexOf(tk) > -1, long = state.mode === 'long';
    var tierTxt = { A: t('tier_A'), B: t('tier_B'), C: t('tier_C') }[s.tier] || '';
    var h = '<div class="grab"></div><div class="sh-head"><div><h2 id="sheet-title">' + esc(s.ticker) + '</h2><div class="n" style="white-space:normal">' + esc(s.name) + ' · ' + esc(s.sector || '') + '</div></div>' +
      '<div style="display:flex;gap:6px;align-items:center"><button class="star ' + (w ? 'on' : '') + '" data-star="' + esc(tk) + '" aria-pressed="' + w + '" aria-label="' + esc(tk) + '">' + (w ? '★' : '☆') + '</button><button class="x" data-close="1" aria-label="Close">×</button></div></div>';
    if (!locked) h += '<div class="panel" style="display:flex;justify-content:space-between;align-items:center"><div><small class="fine">' + t('last_price') + '</small><div class="price" style="font-size:22px">' + (num(s.price) ? fmt(s.price, 2) : '–') + '</div></div><div class="right"><small class="fine">' + t('data') + '</small><div>' + dataPill(s.data) + '</div></div></div>';
    if (locked) h += scoreBlock(t('long_score'), s.lScore, s.lRating, null, '') + lockPanel();
    else {
      h += long ? scoreBlock(t('long_score'), s.lScore, s.lRating, s.lCov, s.lWhy) + scoreBlock(t('short_score'), s.sScore, s.sRating, s.sCov, s.sWhy)
                : scoreBlock(t('short_score'), s.sScore, s.sRating, s.sCov, s.sWhy) + scoreBlock(t('long_score'), s.lScore, s.lRating, s.lCov, s.lWhy);
      h += '<div class="panel"><h4>' + t('key_numbers') + '</h4><div class="grid">' + kv(t('yield'), fmt(s.yield, 1)) + kv('P/E', fmt(s.pe, 1)) + kv('P/B', fmt(s.pb, 2)) + kv('ROE %', fmt(s.roe, 1)) +
        kv(t('next_exdiv'), s.exDiv ? esc(fmtDate(s.exDiv)) : '–') + kv(t('days_exdiv'), (s.exDiv && daysUntil(s.exDiv) !== null) ? daysUntil(s.exDiv) : '–') + '</div>' + (tierTxt ? '<p class="fine" style="margin:10px 0 0">' + esc(tierTxt) + '</p>' : '') + '</div>';
      h += '<div class="two"><button class="btn alt" data-share="' + esc(tk) + '">⇪ ' + t('share') + '</button><button class="btn alt" data-addport="' + esc(tk) + '">＋ ' + t('add_port') + '</button></div>';
    }
    h += '<p class="fine" style="margin-top:10px">' + t('disclaimer') + '</p>';
    var sh = $('#sheet'); sh.innerHTML = h; sh.hidden = false; $('#scrim').hidden = false;
    lastFocus = document.activeElement; document.body.style.overflow = 'hidden';
    var x = $('[data-close]', sh); if (x) x.focus();
  }
  function closeSheet() {
    $('#sheet').hidden = true; $('#scrim').hidden = true; document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) { /* ignore */ }
  }
  function shareStock(tk) {
    var s = stockBy(tk); if (!s) return;
    var text = s.ticker + ' (' + s.name + '): ' + (rl(s.lRating) || '–') + (num(s.lScore) ? ', ' + Math.round(s.lScore) + '/100' : '') + ' ' + t('shared_text') + ' ' + location.href.split('#')[0];
    if (navigator.share) { navigator.share({ text: text }).catch(function () { /* cancelled */ }); }
    else window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener');
  }

  /* ------------------------------ events ------------------------------ */
  function setTab(tab) { if (tab === 'more' && state.tab === 'more') state.more = ''; state.tab = tab; if (tab !== 'more') state.more = ''; closeSheet(); render(); window.scrollTo(0, 0); }
  document.addEventListener('click', function (e) {
    var tg = e.target.closest('[data-tab],[data-open],[data-mode],[data-sector],[data-rated],[data-star],[data-close],[data-act],[data-go],[data-more],[data-mv],[data-lang],[data-ics],[data-share],[data-addport],[data-prem]');
    if (!tg) { if (e.target.id === 'scrim') closeSheet(); return; }
    var d = tg.dataset;
    if (d.tab) setTab(d.tab);
    else if (d.go) { e.preventDefault(); setTab(d.go); }
    else if (d.open) openSheet(d.open);
    else if (d.mode) { state.mode = d.mode; lsSet(LS.mode, d.mode); state._focusQ = false; render(); }
    else if (d.sector) { state.sector = d.sector; state._focusQ = false; render(); }
    else if (d.rated) { state.ratedOnly = !state.ratedOnly; state._focusQ = false; render(); }
    else if (d.star) {
      var a = watchSet(), i = a.indexOf(d.star); if (i > -1) a.splice(i, 1); else a.push(d.star); lsSet(LS.watch, JSON.stringify(a));
      var on = i < 0; if (!$('#sheet').hidden) { document.querySelectorAll('#sheet [data-star="' + d.star + '"]').forEach(function (b) { b.classList.toggle('on', on); b.textContent = on ? '★' : '☆'; b.setAttribute('aria-pressed', on); }); }
      state._focusQ = false; var sy = window.scrollY; render(); window.scrollTo(0, sy);
    }
    else if (d.close) closeSheet();
    else if (d.more !== undefined) { state.more = d.more; render(); window.scrollTo(0, 0); }
    else if (d.mv) { state.mvMode = d.mv; render(); }
    else if (d.lang) { state.lang = d.lang; lsSet(LS.lang, d.lang); render(); }
    else if (d.ics) {
      var items = calItems(); if (d.ics !== '*') items = items.filter(function (s) { return s.ticker === d.ics; });
      if (items.length) download(d.ics === '*' ? 'setrise-ex-dividends.ics' : d.ics + '-ex-dividend.ics', 'text/calendar', makeIcs(items));
    }
    else if (d.share) shareStock(d.share);
    else if (d.addport) { closeSheet(); state.tab = 'port'; state.pmsg = ''; render(); var sel = $('#pst'); if (sel) { sel.value = d.addport; var q = $('#pq'); if (q) q.focus(); } window.scrollTo(0, 0); }
    else if (d.prem !== undefined) { var P = getPort(); P.splice(parseInt(d.prem, 10), 1); lsSet(LS.port, JSON.stringify(P)); render(); }
    else if (d.act === 'reload') { e.preventDefault(); load(); }
    else if (d.act === 'savekey') { var k = ($('#key').value || '').trim().toUpperCase(); if (k) { lsSet(LS.key, k); state.keyMsg = ''; load(); } }
    else if (d.act === 'clearkey') { lsDel(LS.key); lsDel(LS.snap); state.keyMsg = ''; load(); }
    else if (d.act === 'install' && state.installEvt) { state.installEvt.prompt(); state.installEvt = null; }
    else if (d.act === 'portsave') {
      var tk = $('#pst').value, q2 = parseFloat($('#pq').value), c = parseFloat($('#pc').value);
      if (!tk || !(q2 > 0) || !(c >= 0)) { state.pmsg = t('port_err'); render(); return; }
      var P2 = getPort(), ex = P2.filter(function (p) { return p.t === tk; })[0];
      if (ex) { var tot = ex.q + q2; ex.c = (ex.q * ex.c + q2 * c) / tot; ex.q = tot; } else P2.push({ t: tk, q: q2, c: c });
      lsSet(LS.port, JSON.stringify(P2)); state.pmsg = ''; render();
    }
    else if (d.act === 'portcsv') {
      var csv = 'Ticker,Shares,Average cost (KES),Latest price (KES),Value (KES),Profit/Loss (KES)\n' + getPort().map(function (p) {
        var s = stockBy(p.t), pr = s && num(s.price) ? s.price : ''; return [p.t, p.q, p.c, pr, pr === '' ? '' : (pr * p.q).toFixed(2), pr === '' ? '' : (pr * p.q - p.c * p.q).toFixed(2)].join(',');
      }).join('\n');
      download('setrise-portfolio.csv', 'text/csv', csv);
    }
  });
  document.addEventListener('input', function (e) {
    var id = e.target.id;
    if (id === 'q') { state.q = e.target.value; state._focusQ = true; var pos = e.target.selectionStart; render(); var q = $('#q'); if (q) { q.focus(); try { q.setSelectionRange(pos, pos); } catch (x) { /* ignore */ } } }
    else if (id === 'fxamt') updateFx();
    else if (id === 'taxsh' || id === 'taxdps' || id === 'taxcustom') updateTax();
  });
  document.addEventListener('change', function (e) {
    var id = e.target.id;
    if (id === 'sort') { state.sort = e.target.value; state._focusQ = false; render(); }
    else if (id === 'taxrate') updateTax();
    else if (id === 'taxstock') { var s = stockBy(e.target.value); if (s && num(s.price) && num(s.yield)) { $('#taxdps').value = (s.price * s.yield / 100).toFixed(2); updateTax(); } }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !$('#sheet').hidden) closeSheet();
    if (e.key === 'Tab' && !$('#sheet').hidden) {
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
  var sl = lsGet(LS.lang, ''); state.lang = sl === 'sw' ? 'sw' : sl === 'en' ? 'en' : ((navigator.language || '').slice(0, 2) === 'sw' ? 'sw' : 'en');
  load();
})();
