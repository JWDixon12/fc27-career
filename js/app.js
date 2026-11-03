/* App shell: masthead, tab nav, hash router (#view or #view/arg), player drawer, global clicks. */
(function () {
  'use strict';
  const FC = (window.FC = window.FC || {});
  FC.views = FC.views || {};
  const TABS = [
    ['home', 'Club Home'], ['calendar', 'Calendar'], ['squad', 'Squad'], ['match', 'Match Centre'], ['stats', 'Stats'],
    ['league', 'League'], ['transfers', 'Transfers'], ['finances', 'Financials'], ['youth', 'Youth Academy'], ['room', 'The Room'],
  ];

  function fail(msg) {
    document.getElementById('view').innerHTML = `<section class="empty-state"><h1>Career data not loaded</h1><p>${FC.u ? FC.u.esc(msg) : msg}</p></section>`;
  }

  function masthead() {
    const C = window.CAREER;
    const u = FC.u;
    const crest = u.crest(C.meta.clubId, 56, 'mast-crest');
    document.getElementById('mast').innerHTML = `
      <a class="mast-id" href="#home" aria-label="Club home">${crest}
        <span class="mast-name"><b>${u.esc(C.club.name)}</b><small>${u.esc(C.meta.season)} · Manager ${u.esc(C.meta.manager)}</small></span></a>
      <div class="mast-meta">
        ${C.meta.sample ? '<span class="sample-badge" title="Generated sample data, not your save">Sample data</span>' : ''}
        <span class="game-date" title="Current in-game date"><small>In-game date</small><b>${u.date(C.meta.gameDate, 'day')} ${u.parseDate(C.meta.gameDate).getFullYear()}</b></span>
      </div>
      <p class="mast-pill" aria-label="Season, manager and in-game date"><span>${u.esc(C.meta.season)}</span><span>${u.esc(C.meta.manager)}</span><span>${u.date(C.meta.gameDate)}</span></p>`;
    document.getElementById('tabs').innerHTML = TABS.map(([id, label]) => `<a href="#${id}" data-tab="${id}">${label}</a>`).join('');
  }

  function parse() {
    const raw = (location.hash || '#home').slice(1);
    const [view, ...rest] = raw.split('/');
    return { view: FC.views[view] ? view : 'home', arg: rest.join('/') || null };
  }

  function route() {
    const { view, arg } = parse();
    const root = document.getElementById('view');
    FC.tip.hide();
    if (FC.nav) { FC.nav.update(view); FC.nav.close(); }
    if (!document.getElementById('drawer').hidden) closePlayer();
    document.querySelectorAll('#tabs a').forEach((a) => {
      const on = a.dataset.tab === view;
      a.classList.toggle('on', on);
      if (on) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
      if (on && a.scrollIntoView) a.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
    const v = FC.views[view];
    try {
      root.innerHTML = `<div class="view view-${view}">${v.render(arg)}</div>`;
      if (v.after) v.after(root.firstElementChild, arg);
      FC.chart.refill();
    } catch (err) {
      root.innerHTML = `<section class="empty-state"><h1>This tab hit a data problem</h1><p>${FC.u.esc(err.message)}</p><p>Check that data/career.js follows docs/DATA_SCHEMA.md.</p></section>`;
      setTimeout(() => { throw err; });
    }
    const label = (TABS.find((t) => t[0] === view) || [])[1];
    document.title = `${label} · ${window.CAREER.club.short} career`;
    if (FC._lastView !== view) window.scrollTo({ top: 0 });
    FC._lastView = view;
  }

  /* ---------- player drawer ---------- */
  let lastFocus = null;
  function openPlayer(id) {
    const p = FC.u.player(id);
    if (!p || !FC.views._player) return;
    const dr = document.getElementById('drawer');
    lastFocus = document.activeElement;
    dr.querySelector('.drawer-body').innerHTML = FC.views._player.render(p);
    dr.hidden = false;
    requestAnimationFrame(() => dr.classList.add('open'));
    document.body.classList.add('drawer-open');
    FC.views._player.after(dr.querySelector('.drawer-body'), p);
    dr.querySelector('.drawer-close').focus();
  }
  function closePlayer() {
    const dr = document.getElementById('drawer');
    if (dr.hidden) return;
    dr.classList.remove('open');
    document.body.classList.remove('drawer-open');
    setTimeout(() => { dr.hidden = true; }, 260);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  FC.openPlayer = openPlayer;

  document.addEventListener('click', (e) => {
    const t = e.target;
    if (t.closest('.drawer-close') || t.classList.contains('drawer-scrim')) { closePlayer(); return; }
    const pl = t.closest('[data-player]');
    if (pl && FC.u.player(pl.dataset.player)) { e.preventDefault(); openPlayer(pl.dataset.player); return; }
    const href = t.closest('[data-href]');
    if (href) { e.preventDefault(); closePlayer(); location.hash = href.dataset.href; return; }
    if (t.closest('.drawer-panel a[href^="#"]')) closePlayer();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePlayer();
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-player],[data-href]') && !e.target.matches('a,button')) {
      e.preventDefault();
      e.target.click();
    }
  });

  function boot() {
    if (!window.CAREER) { fail('data/career.js did not load or does not set window.CAREER.'); return; }
    try {
      masthead();
    } catch (err) {
      fail(err.message);
      throw err;
    }
    if (FC.nav) FC.nav.mount();
    const setH = () => document.documentElement.style.setProperty('--mast-h', `${document.querySelector('.mast').offsetHeight}px`);
    setH();
    window.addEventListener('resize', setH);
    window.addEventListener('hashchange', route);
    route();
    document.body.classList.add('ready');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
