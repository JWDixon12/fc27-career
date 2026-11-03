/* Stats: season leaderboards (totals or per 90), scorer race, team xG trend, possession and shots. */
(function () {
  'use strict';
  const FC = (window.FC = window.FC || {});
  let per90 = false;
  const SERIES = ['#e0372a', '#4f9bd9', '#c98500', '#199e70'];

  function fmtVal(v, mt) {
    if (v == null) return '—';
    const dp = mt.avg ? (mt.dp || 1) : per90 && mt.per90 ? 2 : mt.dp || 0;
    return FC.u.num(v, dp) + (mt.unit || '');
  }

  function boards() {
    const U = FC.u;
    const totals = FC.stats.totals();
    return FC.stats.METRICS.filter((mt) => !(per90 && mt.key === 'mins')).map((mt) => {
      const ranked = totals.map((t) => ({ t, v: FC.stats.value(t, mt, per90) })).filter((r) => r.v != null && r.v > 0)
        .sort((a, b) => b.v - a.v).slice(0, 6);
      if (!ranked.length) return '';
      const lead = U.player(ranked[0].t.id);
      const items = ranked.map(({ t, v }) => {
        const p = U.player(t.id);
        return { label: p ? p.short : U.personName(t.id), player: t.id, value: v, display: fmtVal(v, mt),
          tip: `<strong>${U.esc(p ? p.name : '')}</strong>${U.esc(mt.label)}: ${fmtVal(v, mt)}${per90 && mt.per90 ? ' per 90' : ''}<br>${U.apps(t.apps)} · ${t.mins} min`, color: 'var(--home)' };
      });
      const scale = mt.key === 'rating' ? { max: 10 } : mt.key === 'passAcc' ? { max: 100 } : {};
      return `<section class="panel board"><header class="board-head" data-player="${ranked[0].t.id}" tabindex="0">
          ${U.portrait(lead, 54)}<div><h2>${U.esc(mt.label)}${per90 && mt.per90 ? '<small> per 90</small>' : ''}</h2>
          <p><b>${U.esc(lead ? lead.short : '')}</b> ${fmtVal(ranked[0].v, mt)}</p></div></header>
        ${FC.chart.barList(items, scale)}</section>`;
    }).join('');
  }

  FC.views.stats = {
    render() {
      const ts = FC.stats.teamSeries();
      const U = FC.u;
      const gf = U.sum(ts, (x) => x.gf), ga = U.sum(ts, (x) => x.ga), xgf = U.sum(ts, (x) => x.xgFor), xga = U.sum(ts, (x) => x.xgAg);
      return `<header class="page-head"><div><h1>Stats</h1><p>${ts.length ? `${ts.length} matches captured, all competitions. Averages need two appearances; per-90 needs 90 minutes.` : 'No matches captured.'}</p></div>
        <dl class="tiles head-tiles four"><div class="tile"><dt>Goals for / against</dt><dd>${gf}–${ga}</dd></div><div class="tile"><dt>xG for / against</dt><dd>${xgf.toFixed(1)}–${xga.toFixed(1)}</dd></div>
          <div class="tile"><dt>Goals minus xG</dt><dd>${(gf - xgf >= 0 ? '+' : '') + (gf - xgf).toFixed(1)}</dd></div><div class="tile"><dt>Avg possession</dt><dd>${ts.length ? Math.round(U.sum(ts, (x) => x.poss) / ts.length) : 0}%</dd></div></dl></header>
        ${ts.length ? '' : U.ghostCard('No matches played', 'Leaderboards and charts start with the first captured match.')}
        <div class="g12" ${ts.length ? '' : 'hidden'}>
          <section class="panel stretch" style="--span:6;--xl:4"><div class="panel-head"><h2>Scoring race</h2><p class="sub">Cumulative goals, top four scorers</p></div><div class="chart" id="st-race"></div></section>
          <section class="panel stretch" style="--span:6;--xl:4"><div class="panel-head"><h2>Expected goals trend</h2><p class="sub">Per match; dashed lines are three-match averages</p></div><div class="chart" id="st-xg"></div></section>
          <section class="panel stretch" style="--span:12;--xl:4"><div class="panel-head"><h2>Shots per match</h2><p class="sub">Our shots per match</p></div><div class="chart" id="st-shots"></div></section>
        </div>
        <div class="board-bar" ${ts.length ? '' : 'hidden'}><h2>Leaderboards</h2><div class="seg" role="group" aria-label="Stat basis">
          <button type="button" data-basis="tot" aria-pressed="${!per90}">Season totals</button><button type="button" data-basis="p90" aria-pressed="${per90}">Per 90 minutes</button></div></div>
        <div class="boards" id="st-boards">${ts.length ? boards() : ''}</div>`;
    },
    after(root) {
      const U = FC.u;
      const ts = FC.stats.teamSeries();
      if (!ts.length) { root.querySelectorAll('.chart').forEach((c) => { c.innerHTML = '<p class="empty-note">No matches played.</p>'; }); }
      const labels = ts.map((x) => x.label);
      const tip = (i) => `${U.esc(U.team(U.opponent(ts[i].f)).name)} (${ts[i].f.venue}) ${ts[i].gf}–${ts[i].ga}`;
      const scorers = FC.stats.totals().filter((t) => t.goals > 0).sort((a, b) => b.goals - a.goals).slice(0, 4);
      if (ts.length) FC.chart.mount(root.querySelector('#st-race'), (w) => FC.chart.line({
        labels, tipTitle: tip, step: true, height: 240, label: 'Cumulative goals by top scorers',
        series: scorers.map((t, i) => {
          let c = 0;
          return { name: U.personName(t.id), color: SERIES[i], values: ts.map(({ m }) => { const ln = m.players.find((p) => p.id === t.id); c += ln ? ln.goals : 0; return c; }) };
        }),
      }, w));
      if (ts.length) FC.chart.mount(root.querySelector('#st-xg'), (w) => FC.chart.line({
        labels, tipTitle: tip, height: 240, fmt: (v) => v.toFixed(1), label: 'Expected goals for and against per match',
        series: [
          { name: 'xG for', color: 'var(--home)', values: ts.map((x) => x.xgFor) },
          { name: 'xG against', color: 'var(--away)', values: ts.map((x) => x.xgAg) },
          { name: 'For, rolling', color: 'var(--home)', dash: true, values: FC.stats.rolling(ts.map((x) => x.xgFor), 3) },
          { name: 'Against, rolling', color: 'var(--away)', dash: true, values: FC.stats.rolling(ts.map((x) => x.xgAg), 3) },
        ],
      }, w));
      if (ts.length) FC.chart.mount(root.querySelector('#st-shots'), (w) => FC.chart.columns({
        height: 240, label: 'Shots per match',
        items: ts.map((x) => ({ label: x.label, value: x.shots, href: `match/${x.f.id}`, color: U.comp(x.f.comp).color,
          tip: `<strong>${tip(ts.indexOf(x))}</strong>${x.shots} shots taken · ${x.shotsAg} conceded<br>${U.esc(U.comp(x.f.comp).name)}` })),
      }, w) + `<div class="legend">${[...new Set(ts.map((x) => x.f.comp))].map((c) => `<span><i class="sw" style="--c:${U.comp(c).color}"></i>${U.esc(U.comp(c).name)}</span>`).join('')}</div>`);
      root.querySelectorAll('[data-basis]').forEach((b) => b.addEventListener('click', () => {
        per90 = b.dataset.basis === 'p90';
        root.querySelectorAll('[data-basis]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        root.querySelector('#st-boards').innerHTML = boards();
      }));
    },
  };
})();
