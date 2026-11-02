/* Club Home modules that make the club feel alive before (and alongside) results: identity strip,
   squad ratings, honours shelf, squad snapshot, expiring contracts, season ribbon, locked board card
   and the "season starts" card with ghosted previews of what will fill in. */
(function () {
  'use strict';
  const FC = (window.FC = window.FC || {});
  const D = () => window.CAREER;
  const esc = (s) => FC.u.esc(s);

  function seasonEndYear() {
    const d = FC.u.parseDate(D().meta.gameDate);
    return d.getMonth() >= 6 ? d.getFullYear() + 1 : d.getFullYear();
  }

  function identity() {
    const C = D().club;
    const cap = C.capacity ? FC.u.num(C.capacity) : null;
    return `<section class="identity" aria-label="Club identity">
      <span class="overline">Home ground</span>
      <p class="id-main"><b>${esc(C.stadium)}</b><span>${cap ? `${cap} seats · ` : ''}Theatre of Dreams</span></p>
      ${C.clubWorth ? `<p class="id-sub">Club worth <b>${FC.u.money(C.clubWorth)}</b>${C.prestige ? ` · Prestige ${C.prestige.domestic}/10 home, ${C.prestige.international}/10 abroad` : ''}</p>` : ''}</section>`;
  }

  function ratings() {
    const r = D().club.ratings;
    if (!r || r.attack == null) return '';
    const g = (v, l) => `<figure class="rg"><svg viewBox="0 0 72 72" aria-hidden="true"><circle class="rg-t" cx="36" cy="36" r="30"/><circle class="rg-f" cx="36" cy="36" r="30" stroke-dasharray="${(188.5 * v) / 100} 188.5" transform="rotate(-90 36 36)"/></svg>
      <b>${v}</b><figcaption>${l}</figcaption></figure>`;
    return `<section class="panel ratings-p"><span class="overline">Squad ratings</span>
      <div class="rgs">${g(r.attack, 'ATT')}${g(r.midfield, 'MID')}${g(r.defence, 'DEF')}<div class="rg-ovr"><b>${r.overall}</b><span>Overall</span></div></div></section>`;
  }

  const CUP = '<svg viewBox="0 0 40 48" aria-hidden="true"><path d="M10 4h20v10a10 10 0 0 1-20 0z"/><path d="M10 7H5a5 5 0 0 0 5 8M30 7h5a5 5 0 0 1-5 8M20 24v8M13 42h14l-2-10H15z"/></svg>';
  function honours() {
    const h = D().club.honours;
    if (!h) return '';
    const items = [[h.league, 'League titles'], [h.domesticCups, 'Domestic cups'], [h.europeanCups, 'European Cups']];
    return `<section class="panel honours"><span class="overline">Honours</span>
      <ul class="shelf">${items.map(([n, l], i) => `<li class="sh-${i}">${CUP}<b data-count="${n}">${n}</b><span>${l}</span></li>`).join('')}</ul></section>`;
  }

  function snapshot() {
    const top = D().squad.filter((p) => p.status !== 'loaned_out').sort((a, b) => b.ovr - a.ovr).slice(0, 12);
    return `<section class="panel snap-p"><div class="panel-head"><div><span class="overline">Squad snapshot</span><h2>The first team</h2></div><a class="sub" href="#squad">Full squad</a></div>
      <ol class="snap">${top.map((p) => `<li><button type="button" class="snap-card" data-player="${p.id}">
        <span class="sc-ovr pg-${FC.u.posGroup(p.pos)}">${p.ovr}</span>${FC.u.portrait(p, 96, 'sc-face')}<b>${esc(p.short)}</b><small>${esc(p.pos)}${p.captain ? ' · Captain' : ''}</small></button></li>`).join('')}</ol></section>`;
  }

  function expiring() {
    const y = seasonEndYear();
    const list = D().squad.filter((p) => p.contractEnd <= y && p.status !== 'loaned_out').sort((a, b) => b.ovr - a.ovr);
    if (!list.length) return '';
    return `<section class="panel expiring"><span class="overline">Contracts expiring ${y}</span>
      <div class="facestack">${list.slice(0, 7).map((p) => `<button type="button" data-player="${p.id}" title="${esc(p.name)}">${FC.u.portrait(p, 52)}</button>`).join('')}${list.length > 7 ? `<span class="fs-more">+${list.length - 7}</span>` : ''}</div>
      <p class="exp-names">${list.map((p) => `<button type="button" class="link-btn" data-player="${p.id}">${esc(p.short)}</button>`).join(', ')}</p>
      <a class="sub" href="#finances">Contract timeline</a></section>`;
  }

  function ribbon() {
    const U = FC.u;
    const fx = D().fixtures;
    if (!fx.length) return '';
    const next = U.upcoming()[0];
    const months = {};
    fx.forEach((f) => { const k = f.date.slice(0, 7); (months[k] = months[k] || []).push(f); });
    return `<section class="panel ribbon-p"><div class="panel-head"><div><span class="overline">Season ribbon</span><h2>${fx.length} fixtures</h2></div>
      <div class="legend">${D().competitions.filter((c) => fx.some((f) => f.comp === c.id)).map((c) => `<span><i class="sw" style="--c:${esc(c.color)}"></i>${esc(c.name)}</span>`).join('')}</div></div>
      <div class="ribbon">${Object.entries(months).map(([k, list]) => {
        const d = U.parseDate(`${k}-01`);
        return `<div class="rb-month"><span class="rb-name">${U.MONTHS[d.getMonth()]}</span><div class="rb-fx">${list.map((f) => {
          const r = U.result(f);
          const tip = `<strong>${esc(U.team(f.home).name)} ${f.played ? `${f.hg}–${f.ag}` : 'v'} ${esc(U.team(f.away).name)}</strong>${esc(U.comp(f.comp).name)} · ${U.date(f.date, 'day')}`;
          return `<a href="#calendar" class="rb-f ${f === next ? 'next' : ''} ${r ? `rb-${r.res}` : ''}" style="--c:${esc(U.comp(f.comp).color)}" data-tip="${esc(tip)}" aria-label="${esc(U.team(U.opponent(f)).name)} ${U.date(f.date)}">${U.crest(U.opponent(f), 24)}<i>${f.venue}</i></a>`;
        }).join('')}</div></div>`;
      }).join('')}</div></section>`;
  }

  const LOCK = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg>';
  function lockedObjectives() {
    return `<section class="panel locked"><span class="overline">Board objectives</span>
      <div class="lk-body">${LOCK}<p><b>Unlocks after the first match</b><span>The board sets the season's targets once the campaign is under way.</span></p></div>
      <ul class="ghost-list" aria-hidden="true"><li></li><li></li><li></li></ul></section>`;
  }

  function seasonStarts() {
    const U = FC.u;
    const first = U.upcoming()[0];
    const days = first ? Math.max(0, U.daysBetween(D().meta.gameDate, first.date)) : 0;
    return `<section class="panel starts grow"><span class="overline">Pre-season</span>
      <h2>Season starts in <b>${days}</b> day${days === 1 ? '' : 's'}</h2>
      <p class="sub">Form, the league position chart and season leaders fill in from matchday 1.</p>
      <div class="ghosts" aria-hidden="true">
        <div class="gh-form">${'<i></i>'.repeat(5)}</div>
        <svg class="gh-line" viewBox="0 0 200 60" preserveAspectRatio="none"><path d="M0 48 L40 36 L80 40 L120 22 L160 26 L200 12"/></svg>
        <div class="gh-leaders">${'<span><i></i><b></b></span>'.repeat(3)}</div></div></section>`;
  }

  /** Count honours up from zero once (respects reduced motion). */
  function animate(root) {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    root.querySelectorAll('[data-count]').forEach((el) => {
      const to = Number(el.dataset.count);
      const t0 = performance.now();
      const step = (t) => {
        const k = Math.min(1, (t - t0) / 900);
        el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(step);
      };
      el.textContent = '0';
      requestAnimationFrame(step);
    });
  }

  FC.homePre = { identity, ratings, honours, snapshot, expiring, ribbon, lockedObjectives, seasonStarts, animate };
})();
