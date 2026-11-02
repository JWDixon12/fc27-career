/* Player ratings for captured matches + the match player panel: rating ring, sub-ratings with
   weights, game portrait, per-tab stat lists and per-tab maps (as on the game's Player Performance). */
(function () {
  'use strict';
  const FC = (window.FC = window.FC || {});
  const esc = (s) => FC.u.esc(s);
  const st = { key: null, tab: 'summary' };
  const TAB_LABEL = { summary: 'Summary', possession: 'Possession', shooting: 'Shooting', passing: 'Passing', defending: 'Defending', goalkeeping: 'Goalkeeping' };
  const TAB_MAP = { summary: 'heat', possession: 'possession', shooting: 'shots', passing: 'passes', defending: 'tackles' };
  const MAP_CAPTION = { heat: 'Overall position', possession: 'Ball possession', shots: 'All shots', passes: 'All passes', tackles: 'All tackles' };
  const SUBS = [['dribbling', 'Dribbling'], ['shooting', 'Shooting'], ['passing', 'Passing'], ['defending', 'Defending'], ['goalkeeping', 'Goalkeeper']];

  const rClass = (r) => FC.u.ratingClass(r);

  function table(m, side) {
    const rows = m.players.filter((p) => p.side === side).map((p) => `<tr data-mp="${esc(p.key)}" tabindex="0" class="${p.key === st.key ? 'sel' : ''}" aria-selected="${p.key === st.key}">
      <td><span class="pos-tag pg-${FC.u.posGroup(p.pos)}">${esc(p.pos)}</span></td>
      <td><span class="who"><img class="mp-face" src="${esc(p.face)}" alt="" width="30" height="33" loading="lazy" onerror="this.style.visibility='hidden'"><b>${esc(p.name)}</b>${p.topRated ? ' <span class="motm" title="Highest rated player">★</span>' : ''}</span></td>
      <td class="n"><span class="rating ${rClass(p.rating)}">${p.rating.toFixed(1)}</span></td><td class="n">${p.goals}</td><td class="n">${p.assists}</td><td class="n">${p.ovr}</td></tr>`).join('');
    const subs = (m.unusedSubs && m.unusedSubs[side]) || [];
    return `<div class="mp-team"><h3><span class="side-dot" style="--c:var(--${side === 'home' ? 'L' : 'R'})"></span>${esc(m.sides[side].name)}</h3>
      <div class="table-wrap"><table class="data mp-table"><thead><tr><th>Pos</th><th>Player</th><th class="n">Rating</th><th class="n">G</th><th class="n">A</th><th class="n">OVR</th></tr></thead><tbody>${rows}</tbody></table></div>
      ${subs.length ? `<p class="mp-subs"><b>Unused:</b> ${subs.map(esc).join(', ')}</p>` : ''}</div>`;
  }

  function statList(p, tab) {
    if (tab === 'summary') {
      return `<table class="perf-stats mp-stats"><thead><tr><th></th><th class="n">Player</th><th class="n">Team</th></tr></thead><tbody>${p.summary.map((r) => `<tr><td>${esc(r.label)}</td><td class="n">${r.value}</td><td class="n">${r.team}</td></tr>`).join('')}</tbody></table>
        <p class="mp-note">Team column: totals for counts, team average for minutes and distance (as in the game).</p>`;
    }
    const secs = (p.tabs && p.tabs[tab]) || [];
    return `<table class="perf-stats mp-stats"><tbody>${secs.map((s) => `<tr class="mp-sec"><th colspan="2">${esc(s.section)}</th></tr>${s.rows.map((r) => `<tr><td>${esc(r.label)}</td><td class="n">${typeof r.value === 'number' && !Number.isInteger(r.value) ? r.value.toFixed(2) : r.value}</td></tr>`).join('')}`).join('')}</tbody></table>`;
  }

  function mapFor(m, p, tab) {
    const color = p.side === 'home' ? 'var(--L)' : 'var(--R)';
    if (tab === 'goalkeeping') {
      return `<figure class="gp-goal"><img src="${esc(p.maps.gk_goal)}_raw.jpg" alt="Shots saved, goal view" loading="lazy"><figcaption>Shots saved</figcaption></figure>
        ${FC.gp.map({ src: p.maps.gk_shots, half: true, color, caption: 'All shots faced', label: `${p.name}: shots faced` })}`;
    }
    const key = TAB_MAP[tab];
    if (!p.maps[key]) return '<p class="empty-note">This map was not captured.</p>';
    const slots = tab === 'summary' && p.slot ? [...m.players.filter((q) => q.side === p.side && q.slot && q.key !== p.key).map((q) => ({ ...q.slot, label: `${q.pos} ${q.name}` })), { ...p.slot, me: true, label: `${p.pos} ${p.name}` }] : [];
    return FC.gp.map({ src: p.maps[key], color, slots, caption: MAP_CAPTION[key], label: `${p.name}: ${MAP_CAPTION[key]}` });
  }

  function panel(m) {
    const p = m.players.find((x) => x.key === st.key);
    if (!p) return '';
    const tabs = ['summary', ...Object.keys(p.tabs || {})];
    if (!tabs.includes(st.tab)) st.tab = 'summary';
    const subs = p.subRatings ? `<ul class="subr">${SUBS.filter(([k]) => p.subRatings[k]).map(([k, l]) => {
      const s = p.subRatings[k];
      return `<li><span>${l}</span><span class="subr-track"><i style="width:${s.rating * 10}%" class="${rClass(s.rating)}"></i></span><b>${s.rating.toFixed(1)}</b><small class="w w-${esc(s.weight.toLowerCase())}" title="How much this area counted toward the match rating">${esc(s.weight)}</small></li>`;
    }).join('')}</ul>` : '<p class="empty-note">Sub-ratings and tab breakdowns were captured for the home side only.</p>';
    const sq = typeof p.id === 'number' && FC.u.player(p.id);
    return `<article class="mp-panel" aria-live="polite">
      <header class="mp-head"><img class="mp-big" src="${esc(p.face)}" alt="" width="118" height="162" onerror="this.style.visibility='hidden'">
        <div class="mp-id"><p><span class="pos-tag">${esc(p.pos)}</span> <span class="mp-ovr">${p.ovr}<small>OVR</small></span></p>
          <h3>${esc(p.firstName || '')} <b>${esc(p.lastName || p.name)}</b></h3><p class="muted">${esc(m.sides[p.side].name)} · ${p.mins} min</p>
          ${sq ? `<button type="button" class="link-btn" data-player="${sq.id}">Season profile</button>` : ''}</div>
        ${FC.gp.ratingRing(p.rating, 104)}</header>
      ${subs}
      <nav class="mp-tabs" role="tablist">${tabs.map((t) => `<button type="button" role="tab" data-mptab="${t}" aria-selected="${t === st.tab}">${TAB_LABEL[t]}</button>`).join('')}</nav>
      <div class="mp-body"><div class="mp-map">${mapFor(m, p, st.tab)}</div><div class="mp-list">${statList(p, st.tab)}</div></div></article>`;
  }

  function render(f, m) {
    if (!m.players.find((x) => x.key === st.key)) st.key = (m.players.find((x) => x.topRated) || m.players[0]).key;
    return `<div class="panel-head"><h2>Player ratings</h2><p class="sub">Select a player for his ratings breakdown, maps and every stat tab</p></div>
      <div class="mp-wrap"><div class="mp-teams">${table(m, 'home')}${table(m, 'away')}</div><div class="mp-detail" id="mp-detail">${panel(m)}</div></div>`;
  }

  function bind(box, f, m) {
    if (!box) return;
    const redraw = (focusKey) => {
      box.innerHTML = render(f, m);
      if (focusKey) { const n = box.querySelector(`[data-mp="${focusKey}"]`); if (n) n.focus(); }
    };
    box.addEventListener('click', (e) => {
      const r = e.target.closest('[data-mp]');
      const t = e.target.closest('[data-mptab]');
      if (r) { st.key = r.dataset.mp; redraw(st.key); if (window.innerWidth < 1100) box.querySelector('#mp-detail').scrollIntoView({ block: 'start', behavior: 'smooth' }); }
      if (t) { st.tab = t.dataset.mptab; box.querySelector('#mp-detail').innerHTML = panel(m); }
    });
    box.addEventListener('keydown', (e) => {
      const r = e.target.closest('[data-mp]');
      if (r && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); r.click(); }
    });
  }

  FC.matchPlayer = { render, bind, state: st };
})();
