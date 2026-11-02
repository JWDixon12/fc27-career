/* Club Home: floodlit next-fixture scoreboard, last result, form, league position, leaders, stories. */
(function () {
  'use strict';
  const FC = (window.FC = window.FC || {});
  const u = () => FC.u;
  const D = () => window.CAREER;

  const ordinal = (n) => n + (['th', 'st', 'nd', 'rd'][(n % 100 - 20) % 10] || ['th', 'st', 'nd', 'rd'][n % 100] || 'th');

  function countdown(f) {
    const now = new Date(D().meta.gameDate + 'T09:00:00');
    const ko = new Date(`${f.date}T${f.time || '15:00'}:00`);
    let mins = Math.max(0, Math.round((ko - now) / 60000));
    const d = Math.floor(mins / 1440); mins -= d * 1440;
    const h = Math.floor(mins / 60); mins -= h * 60;
    const cell = (v, l) => `<div class="cd-cell"><b>${String(v).padStart(2, '0')}</b><small>${l}</small></div>`;
    return `<div class="countdown" aria-label="Kick-off in ${d} days ${h} hours ${mins} minutes">${cell(d, 'days')}<i>:</i>${cell(h, 'hours')}<i>:</i>${cell(mins, 'mins')}</div>`;
  }

  /** Club name on two balanced lines (last word on its own line) so both sides match. */
  function twoLine(name) {
    const w = String(name).split(' ');
    return w.length < 2 ? FC.u.esc(name) : `${FC.u.esc(w.slice(0, -1).join(' '))}<br>${FC.u.esc(w[w.length - 1])}`;
  }

  function hero(f) {
    const U = u();
    if (!f) return `<section class="hero panel"><h2>Season complete</h2><p class="empty-note">No fixtures left on the calendar.</p></section>`;
    const c = U.comp(f.comp);
    const side = (id) => `<div class="hero-side ${U.isUs(id) ? 'is-us' : ''}">${U.crest(id, 160, 'hero-crest')}<h2 class="hero-name"><span>${twoLine(U.team(id).name)}</span></h2></div>`;
    return `<section class="hero" style="--comp:${U.esc(c.color)}" aria-labelledby="hero-h">
      <div class="hero-beams" aria-hidden="true"></div>
      <header class="hero-top"><span class="overline hero-kicker" id="hero-h">Next match</span>${U.compChip(f.comp)}<span class="hero-round">${U.esc(f.round)}</span>
        <span class="venue-pill ${f.venue === 'H' ? 'vp-h' : 'vp-a'}">${f.venue === 'H' ? 'Home' : 'Away'}</span></header>
      <div class="hero-face">${side(f.home)}
        <span class="hero-vs" aria-hidden="true">v</span>
        <div class="hero-mid">${countdown(f)}
          <p class="hero-when">${U.date(f.date, 'day')} · ${U.esc(f.time || '')} · ${U.esc(f.venue === 'H' ? D().club.stadium : U.team(f.home).name)}</p></div>
        ${side(f.away)}</div>
      ${upcomingStrip()}
    </section>`;
  }

  /** Next fixtures as one horizontal snap carousel of mini cards. */
  function upcomingStrip() {
    const U = u();
    const list = U.upcoming().slice(1, 9);
    if (!list.length) return '';
    return `<div class="hn-wrap"><span class="overline">Coming up</span><ol class="hero-next">${list.map((n) => {
      const o = U.opponent(n);
      return `<li><a class="hn-card" href="#calendar" style="--c:${U.comp(n.comp).color}" data-tip="${U.esc(`${U.comp(n.comp).name} ${n.round || ''}`)}">
        ${U.crest(o, 30)}<span class="hn-txt"><b>${U.esc(U.team(o).short)}</b><span>${U.date(n.date, 'short')}</span></span>
        <small class="ha ha-${n.venue}">${n.venue === 'H' ? 'H' : 'A'}</small></a></li>`;
    }).join('')}</ol></div>`;
  }

  function lastResult(f) {
    const U = u();
    if (!f) return '<section class="panel"><h2>Last result</h2><p class="empty-note">No matches played yet.</p></section>';
    const m = D().matches[f.id];
    const r = U.result(f);
    const side = (t, cls) => {
      const g = U.goalsFor(m, t);
      return `<div class="lr-side ${cls}">${U.crest(t, 64)}<b>${U.esc(U.team(t).short)}</b>${g.length ? `<ul>${g.map((x) => `<li>${x}</li>`).join('')}</ul>` : ''}</div>`;
    };
    return `<section class="panel last-res res-edge-${r.res}">
      <div class="panel-head"><h2>Last result</h2><div class="tools">${U.compChip(f.comp)}${U.resPill(r)}</div></div>
      <div class="lr-board">${side(f.home, 'h')}<span class="lr-score">${f.hg}<i>–</i>${f.ag}</span>${side(f.away, 'a')}</div>
      ${m ? `<a class="btn-red" href="#match/${f.id}">Open in Match Centre</a>` : ''}
    </section>`;
  }

  function formStrip(list) {
    const U = u();
    if (!list.length) return '';
    return `<section class="panel form-p"><div class="panel-head"><div><span class="overline">Form</span><h2>Last ${list.length}</h2></div><p class="sub">All competitions, newest right</p></div>
      <ol class="form-chips">${list.map((f) => {
        const r = U.result(f);
        const has = !!D().matches[f.id];
        return `<li><${has ? `a href="#match/${f.id}"` : 'span'} class="form-chip fc-${r.res}" style="--c:${U.comp(f.comp).color}" data-tip="${U.esc(`<strong>${U.team(f.home).name} ${f.hg}–${f.ag} ${U.team(f.away).name}</strong>${U.comp(f.comp).name} · ${U.date(f.date)}`)}">
          <i class="fc-res">${r.res}</i>${U.crest(U.opponent(f), 28)}<b>${r.gf}–${r.ga}</b></${has ? 'a' : 'span'}></li>`;
      }).join('')}</ol></section>`;
  }

  function leaders() {
    const U = u();
    const sq = D().squad.filter((p) => p.season && p.season.apps);
    if (!sq.length) return '<section class="panel"><div class="panel-head"><h2>Season leaders</h2></div><p class="empty-note">Leaders appear after the first captured match.</p></section>';
    const top = (fn) => [...sq].sort((a, b) => fn(b) - fn(a))[0];
    const cards = [
      ['Top scorer', top((p) => p.season.goals + p.season.assists / 100), (p) => `${p.season.goals}`, () => 'goals'],
      ['Most assists', top((p) => p.season.assists + p.season.goals / 100), (p) => `${p.season.assists}`, () => 'assists'],
      ['Best average rating', top((p) => (p.season.apps >= 2 ? p.season.avgRating : 0)), (p) => p.season.avgRating.toFixed(2), (p) => `in ${FC.u.apps(p.season.apps)}`],
      ['Player of the match', top((p) => p.season.motm + p.season.avgRating / 100), (p) => `${p.season.motm}`, () => 'awards'],
    ];
    return `<section class="panel leaders-panel"><div class="panel-head"><h2>Season leaders</h2><a class="sub" href="#stats">All stats</a></div>
      <div class="leaders">${cards.map(([label, p, val, unit]) => `<button class="leader" type="button" data-player="${p.id}">
        ${U.portrait(p, 76)}<span class="ld-label">${label}</span><b class="ld-val">${val(p)}</b>
        <span class="ld-name">${U.esc(p.short)} <small>${unit(p)}</small></span></button>`).join('')}</div></section>`;
  }

  function stories() {
    const U = u();
    return `<section class="panel"><div class="panel-head"><div><span class="overline">The Room</span><h2>Storylines</h2></div><a class="sub" href="#room">Open</a></div>
      ${D().room.storylines.length ? '' : '<p class="empty-note">No storylines running.</p>'}<ul class="stories">${D().room.storylines.map((s) => `<li><span class="story-status st-${U.esc(s.status)}">${U.esc(s.status)}</span>
        <h3>${U.esc(s.title)}</h3><p>${U.esc(s.body)}</p><small>${U.date(s.updated)}</small></li>`).join('')}</ul></section>`;
  }

  function objectives() {
    const U = u();
    return `<section class="panel"><div class="panel-head"><h2>Board objectives</h2></div>
      ${D().club.boardObjectives.length ? '' : '<p class="empty-note">The board sets its objectives before the first match.</p>'}<ul class="objectives">${D().club.boardObjectives.map((o) => `<li><span>${U.esc(o.text)}</span><span class="status-tag s-${U.esc(o.status)}">${U.esc(o.status.replace('_', ' '))}</span></li>`).join('')}</ul></section>`;
  }

  function gapText(row) {
    const t = D().table.PL;
    const pos = t.indexOf(row);
    if (pos < 4) {
      const fifth = t[4];
      return fifth ? `${row.pts - fifth.pts} clear of 5th` : 'in the top four';
    }
    return `${t[3].pts - row.pts} behind 4th`;
  }

  FC.views.home = {
    render() {
      const U = u();
      const next = U.upcoming()[0];
      const played = U.played();
      const row = (D().table.PL || []).find((r) => U.isUs(r.team));
      const pos = row && row.posHistory.length ? row.posHistory[row.posHistory.length - 1] : null;
      const P = FC.homePre;
      if (!played.length) {
        return `<div class="g12 home-grid pre">
          <div class="stack fill" style="--span:8;--xl:7">${hero(next)}${P.seasonStarts()}</div>
          <div class="stack" style="--span:4;--xl:5">${P.identity()}${P.ratings()}${P.honours()}${P.expiring()}${P.lockedObjectives()}</div>
          <div style="--span:12">${P.snapshot()}</div>
          <div style="--span:12;--xl:7">${P.ribbon()}</div>
          <div style="--span:12;--xl:5">${stories()}</div>
        </div>`;
      }
      return `<div class="g12 home-grid">
        <div class="stack" style="--span:8;--xl:6">${hero(next)}${formStrip(played.slice(-6))}</div>
        <div class="stack ${pos ? 'fill' : ''}" style="--span:4;--xl:3">${lastResult(played[played.length - 1])}
          <section class="panel grow"><div class="panel-head"><div><span class="overline">Premier League</span><h2>League position</h2></div>
          ${pos ? `<p class="pos-now"><b>${ordinal(pos)}</b><span>${row.pts} pts after ${row.p} games · ${gapText(row)}</span></p>` : ''}</div>
          ${pos ? '<div class="chart" id="home-pos"></div>' : '<p class="empty-note">The position chart starts after matchday 1.</p>'}</section></div>
        <div class="stack" style="--span:12;--xl:3">${P.honours()}<div class="home-pair">${leaders()}${D().club.boardObjectives.length ? objectives() : P.lockedObjectives()}</div></div>
        <div style="--span:12">${P.snapshot()}</div>
        <div style="--span:12;--xl:7">${P.ribbon()}</div>
        <div style="--span:12;--xl:5">${stories()}</div>
      </div>`;
    },
    after(root) {
      FC.homePre.animate(root);
      const row = (D().table.PL || []).find((r) => u().isUs(r.team));
      if (!row || !row.posHistory.length) return;
      const n = D().table.PL.length;
      FC.chart.mount(root.querySelector('#home-pos'), (w, h) => FC.chart.line({
        labels: row.posHistory.map((_, i) => `MD${i + 1}`),
        series: [{ name: 'Position', color: 'var(--home)', values: row.posHistory, area: false }],
        yMin: 1, yMax: n, invert: true, yTicks: [1, 5, 10, 15, 20].filter((t) => t <= n), height: h || 220,
        fmt: (v) => String(v), label: 'League position after each matchday', tipTitle: (i) => `Matchday ${i + 1}`,
      }, w), { fill: true });
    },
  };
})();
