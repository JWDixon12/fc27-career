/* Youth Academy: scouts, prospects (age / position / overall / nation only - never potential), graduates. */
(function () {
  'use strict';
  const FC = (window.FC = window.FC || {});
  const D = () => window.CAREER;

  const GROUPS = [['GK', 'Goalkeepers'], ['DEF', 'Defenders'], ['MID', 'Midfielders'], ['ATT', 'Attackers']];
  const GROUP_OF = { GK: 'GK', CB: 'DEF', LCB: 'DEF', RCB: 'DEF', LB: 'DEF', RB: 'DEF', LWB: 'DEF', RWB: 'DEF', SW: 'DEF',
    CDM: 'MID', LDM: 'MID', RDM: 'MID', CM: 'MID', LCM: 'MID', RCM: 'MID', CAM: 'MID', LAM: 'MID', RAM: 'MID', LM: 'MID', RM: 'MID' };
  const groupOf = (pos) => GROUP_OF[pos] || 'ATT';

  /** Five-pip meter for scout knowledge / experience. */
  function pips(n, label) {
    return `<span class="yo-pips" role="img" aria-label="${label} ${n} of 5">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>`;
  }

  function flag(src, alt, cls) {
    return src ? `<img class="${cls || 'yo-flag'}" src="${src}" alt="${FC.u.esc(alt || '')}" width="24" height="16" loading="lazy">` : '';
  }

  function scoutCard(s, best) {
    const U = FC.u;
    return `<article class="yo-scout${best ? ' best' : ''}">
      ${s.flag ? `<img class="yo-scout-bg" src="${s.flag}" alt="" aria-hidden="true">` : ''}
      <p class="yo-kicker">${best ? 'Chief scout · ' : ''}Scouting</p>
      <h3 class="yo-country">${U.esc(s.country || 'Unassigned')}</h3>
      <p class="yo-scout-name">${flag(s.natFlag, s.nat, 'yo-flag sm')}${U.esc(s.name)}</p>
      <dl class="yo-meters"><div><dt>Knowledge</dt><dd>${pips(s.knowledge, 'Knowledge')}</dd></div><div><dt>Experience</dt><dd>${pips(s.experience, 'Experience')}</dd></div></dl>
      ${s.returns ? `<p class="yo-return">Reports back <b>${U.date(s.returns)}</b></p>` : ''}
    </article>`;
  }

  function prospectRow(p) {
    const U = FC.u;
    return `<li class="yo-row">
      <span class="yo-ovr">${p.ovr}</span>
      <div class="yo-who"><b>${U.esc(p.name)}</b><small>${flag(p.natFlag, p.nat, 'yo-flag sm')}${U.esc(p.nat || '')}</small></div>
      <span class="pos-tag pg-${U.posGroup(p.pos)}">${U.esc(p.pos)}</span>
      <span class="yo-age">${p.age}<small>yrs</small></span>
    </li>`;
  }

  FC.views.youth = {
    render() {
      const U = FC.u;
      const Y = D().youth;
      const grads = D().squad.filter((p) => p.homegrown).sort((a, b) => b.ovr - a.ovr);
      const prospects = [...Y.prospects].sort((a, b) => b.ovr - a.ovr || a.age - b.age);
      const bestScout = Y.scouts.reduce((b, s) => (!b || s.knowledge + s.experience > b.knowledge + b.experience ? s : b), null);
      const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
      const groups = GROUPS.map(([g, label]) => [label, prospects.filter((p) => groupOf(p.pos) === g)]).filter(([, l]) => l.length);
      return `<header class="page-head yo-head"><div><h1>Youth Academy</h1>
          <p class="yo-stats"><span><b>${Y.scouts.length}</b> ${Y.scouts.length === 1 ? 'scout' : 'scouts'}</span><span><b>${prospects.length}</b> ${prospects.length === 1 ? 'prospect' : 'prospects'}</span><span><b>${grads.length}</b> ${grads.length === 1 ? 'graduate' : 'graduates'}</span></p></div></header>
        <section class="yo-sec"><h2 class="yo-h">Scouting network</h2>
          ${Y.scouts.length ? `<div class="yo-scouts">${Y.scouts.map((s) => scoutCard(s, s === bestScout)).join('')}</div>` : '<p class="empty-note">No scouts hired.</p>'}</section>
        <div class="yo-grid">
          <section class="yo-sec panel yo-pros"><div class="panel-head"><h2>Prospects</h2><p class="sub">${prospects.length ? `Youth squad · ages ${Math.min(...prospects.map((p) => p.age))}–${Math.max(...prospects.map((p) => p.age))}` : ''}</p></div>
            ${groups.length ? groups.map(([label, list]) => `<h3 class="yo-group">${label}<span>${list.length}</span></h3><ol class="yo-list">${list.map(prospectRow).join('')}</ol>`).join('') : '<p class="empty-note">No prospects in the youth squad.</p>'}</section>
          <section class="yo-sec panel yo-grads"><div class="panel-head"><h2>Academy graduates</h2><p class="sub">Promoted to the senior squad</p></div>
            ${grads.length ? `<ul class="yo-gradlist">${grads.map((p) => `<li data-player="${p.id}" tabindex="0">${U.portrait(p, 52)}<div class="yo-who"><b>${U.esc(p.name)}</b>
              <small>${p.natFlag ? flag(p.natFlag, p.nat, 'yo-flag sm') : ''}${U.esc(p.pos)} · ${p.age} yrs${p.status === 'loaned_out' && p.loan ? ` · on loan at ${U.esc(p.loan.club)}` : p.season && p.season.apps ? ` · ${U.apps(p.season.apps)}` : ' · awaiting debut'}</small></div><span class="yo-ovr">${p.ovr}</span></li>`).join('')}</ul>` : '<p class="empty-note">No academy graduates yet.</p>'}
            <p class="yo-note">${plural(prospects.length, 'prospect')} in the youth squad. Promote from the Youth Academy screen in game; they appear here after your next save.</p></section>
        </div>`;
    },
  };
})();
