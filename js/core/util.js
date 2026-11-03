/* Shared helpers. Classic script: everything hangs off window.FC. */
(function () {
  'use strict';
  const FC = (window.FC = window.FC || {});
  FC.views = FC.views || {};
  const D = () => window.CAREER;

  const esc = (s) =>
    String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  const cur = () => (D().meta && D().meta.currency) || '€';
  function money(n, opts) {
    if (n == null) return '—';
    const sign = n < 0 ? '−' : opts && opts.plus && n > 0 ? '+' : '';
    const a = Math.abs(n);
    let s;
    if (a >= 1e9) s = (a / 1e9).toFixed(2) + 'B';
    else if (a >= 1e6) s = (a / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    else if (a >= 1e3) s = Math.round(a / 1e3) + 'K';
    else s = String(a);
    return sign + cur() + s;
  }
  const num = (n, dp) => (n == null || Number.isNaN(n) ? '—' : Number(n).toLocaleString('en-GB', { minimumFractionDigits: dp || 0, maximumFractionDigits: dp || 0 }));

  const parseDate = (s) => new Date(s + 'T12:00:00');
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  function date(s, style) {
    if (!s) return '—';
    const d = parseDate(s);
    if (style === 'short') return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
    if (style === 'day') return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }
  const daysBetween = (a, b) => Math.round((parseDate(b) - parseDate(a)) / 864e5);

  /* ---------- lookups ---------- */
  const team = (id) => D().teams[String(id)] || { name: String(id), short: String(id).slice(0, 3).toUpperCase(), crest: null };
  const teamName = (id) => (typeof id === 'number' || /^\d+$/.test(String(id)) ? team(id).name : String(id));
  const comp = (id) => D().competitions.find((c) => c.id === id) || { id, name: id, type: 'cup', color: '#888' };
  const squadById = () => {
    if (!FC._squadIdx) FC._squadIdx = new Map(D().squad.map((p) => [p.id, p]));
    return FC._squadIdx;
  };
  const player = (id) => squadById().get(Number(id));
  /** Name for a player id from squad or any captured match line; strings pass through. */
  function personName(id) {
    if (id == null) return '';
    if (typeof id === 'string' && !/^\d+$/.test(id)) return id;
    const p = player(id);
    if (p) return p.short;
    for (const m of Object.values(D().matches)) {
      const ln = m.players.find((x) => x.id === Number(id));
      if (ln && ln.name) return ln.name;
    }
    return 'Unknown';
  }
  const us = () => D().meta.clubId;
  const isUs = (id) => Number(id) === us();
  const opponent = (f) => (f.home === us() ? f.away : f.home);
  /** Result from our point of view: {res:'W'|'D'|'L', gf, ga} or null. */
  function result(f) {
    if (!f.played || f.hg == null || (f.home !== us() && f.away !== us())) return null;
    const home = f.home === us();
    const gf = home ? f.hg : f.ag;
    const ga = home ? f.ag : f.hg;
    return { res: gf > ga ? 'W' : gf === ga ? 'D' : 'L', gf, ga };
  }
  const played = () => D().fixtures.filter((f) => f.played);
  const upcoming = () => D().fixtures.filter((f) => !f.played);

  /* ---------- images with graceful fallback ---------- */
  function initials(name) {
    const parts = String(name).replace(/\./g, '').split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    return (parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  function crest(id, size, extra) {
    const t = team(id);
    const sz = size || 32;
    const fb = esc(t.short || initials(t.name));
    if (!t.crest) return `<span class="crest-fb" style="--s:${sz}px" aria-hidden="true">${fb}</span>`;
    return `<img class="crest ${extra || ''}" src="${esc(t.crest)}" alt="${esc(t.name)} crest" width="${sz}" height="${sz}" loading="lazy" data-fb="${fb}" data-fbk="crest" onerror="FC.u.imgFail(this)">`;
  }
  function portrait(p, size, extra) {
    const sz = size || 48;
    const name = p ? p.name || p.short : '?';
    const fb = esc(initials(name));
    if (!p || !p.portrait) return `<span class="face-fb" style="--s:${sz}px" aria-hidden="true">${fb}</span>`;
    return `<img class="face ${extra || ''}" src="${esc(p.portrait)}" alt="" width="${sz}" height="${sz}" loading="lazy" data-fb="${fb}" data-fbk="face" onerror="FC.u.imgFail(this)">`;
  }
  function flag(p) {
    if (!p || !p.natFlag) return '<span class="flag flag-ph" aria-hidden="true"></span>';
    return `<img class="flag" src="${esc(p.natFlag)}" alt="${esc(p.nat)}" title="${esc(p.nat)}" width="21" height="14" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'flag flag-ph'}))">`;
  }
  function imgFail(img) {
    const span = document.createElement('span');
    span.className = img.dataset.fbk === 'crest' ? 'crest-fb' : 'face-fb';
    span.style.setProperty('--s', (img.getAttribute('width') || 32) + 'px');
    span.setAttribute('aria-hidden', 'true');
    span.textContent = img.dataset.fb || '?';
    if (img.className) span.className += ' ' + img.className.replace(/\b(crest|face)\b/g, '').trim();
    img.replaceWith(span);
  }

  /* ---------- small UI atoms ---------- */
  const compChip = (id) => {
    const c = comp(id);
    return `<span class="comp-chip" style="--c:${esc(c.color)}"><i></i>${esc(c.name)}</span>`;
  };
  const resChip = (r) => (r ? `<span class="res res-${r.res}" title="${{ W: 'Win', D: 'Draw', L: 'Loss' }[r.res]}">${r.res}</span>` : '');
  const resPill = (r) => (r ? `<span class="res-pill rp-${r.res}">${{ W: 'Win', D: 'Draw', L: 'Loss' }[r.res]}</span>` : '');
  /** Goal lines for one team in a captured match: "Name 23' (pen)". */
  const goalsFor = (m, teamId) => (m ? m.events.filter((e) => /goal/.test(e.type) && e.team === teamId)
    .map((e) => `${esc(personName(e.player))} ${e.minute}'${e.type === 'pen_goal' ? ' (pen)' : e.type === 'own_goal' ? ' (og)' : ''}`) : []);
  const apps = (n) => `${n} app${n === 1 ? '' : 's'}`;
  /** Plain empty-state block: a factual heading and one line. */
  const ghostCard = (title, body) => `<section class="panel ghost-card pp-wide"><h3>${esc(title)}</h3><p>${esc(body)}</p></section>`;
  const ratingClass = (r) => (r == null ? '' : r >= 8 ? 'r-elite' : r >= 7 ? 'r-good' : r >= 6 ? 'r-ok' : 'r-poor');
  const sum = (a, f) => a.reduce((s, x) => s + (f ? f(x) : x), 0);
  const posGroup = (pos) =>
    pos === 'GK' ? 'GK' : /B$|CB|WB/.test(pos) ? 'DEF' : /DM|CM|AM|^[LR]M$/.test(pos) ? 'MID' : 'ATT';

  FC.u = {
    esc, money, num, date, parseDate, daysBetween, MONTHS, MONTHS_LONG, DAYS,
    team, teamName, comp, player, personName, us, isUs, opponent, result, played, upcoming,
    initials, crest, portrait, flag, imgFail, compChip, resChip, resPill, goalsFor, apps, ghostCard, ratingClass, sum, posGroup,
  };
})();
