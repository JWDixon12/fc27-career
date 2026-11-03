/* Youth Academy: scouts, prospects (age / position / overall only), academy graduates in the squad. */
(function () {
  'use strict';
  const FC = (window.FC = window.FC || {});
  const D = () => window.CAREER;

  const stars = (n, max, label) => `<span class="score5" aria-label="${label} ${n} of ${max}"><b>${n}</b>/${max}</span>`;

  FC.views.youth = {
    render() {
      const U = FC.u;
      const Y = D().youth;
      const grads = D().squad.filter((p) => p.homegrown).sort((a, b) => b.ovr - a.ovr);
      const prospects = [...Y.prospects].sort((a, b) => b.ovr - a.ovr);
      const ages = prospects.map((p) => p.age);
      return `<header class="page-head"><div><h1>Youth Academy</h1><p>${Y.scouts.length} scout${Y.scouts.length === 1 ? '' : 's'} on the road · ${prospects.length} prospect${prospects.length === 1 ? '' : 's'} in the youth squad · ${grads.length} academy product${grads.length === 1 ? '' : 's'} on the books</p></div></header>
        <div class="g12">
          <div class="stack yo-scouts" style="--span:4">${Y.scouts.length ? '' : '<section class="panel"><h2>Scouts</h2><p class="empty-note">No scouts hired.</p></section>'}${Y.scouts.map((s) => `<section class="panel scout"><span class="scout-pin" aria-hidden="true"></span>
            <h2>${U.esc(s.name)}</h2><p class="scout-region">${U.esc(s.region)}</p>
            <dl><div><dt>Knowledge</dt><dd>${stars(s.knowledge, 5, 'Knowledge')}</dd></div><div><dt>Experience</dt><dd>${stars(s.experience, 5, 'Experience')}</dd></div></dl></section>`).join('')}</div>
          <section class="panel yo-pros" style="--span:8"><div class="panel-head"><h2>Prospects</h2><p class="sub">${ages.length ? `Ages ${Math.min(...ages)}–${Math.max(...ages)}` : ''}</p></div>
            ${prospects.length ? `<ol class="prospects">${prospects.map((p) => `<li><span class="pr-ovr">${p.ovr}</span><span class="face-fb" style="--s:46px" aria-hidden="true">${U.esc(U.initials(p.name))}</span>
              <div><b>${U.esc(p.name)}</b><small>${U.esc(p.nat)} · joined ${U.date(p.joined)}</small></div>
              <span class="pos-tag pg-${U.posGroup(p.pos)}">${U.esc(p.pos)}</span><span class="pr-age">${p.age}<small>yrs</small></span></li>`).join('')}</ol>` : '<p class="empty-note">No prospects in the youth squad.</p>'}</section>
          <section class="panel yo-grads" style="--span:12"><div class="panel-head"><h2>Academy graduates</h2><p class="sub">Homegrown players in the senior squad or out on loan</p></div>
            <ul class="grads">${grads.map((p) => `<li data-player="${p.id}" tabindex="0">${U.portrait(p, 48)}<div><b>${U.esc(p.name)}</b>
              <small>${p.pos} · ${p.age} yrs${p.status === 'loaned_out' && p.loan ? ` · on loan at ${U.esc(p.loan.club)}` : p.season && p.season.apps ? ` · ${U.apps(p.season.apps)} this season` : ' · no senior apps yet'}</small></div><span class="pr-ovr sm">${p.ovr}</span></li>`).join('')}</ul></section>
        </div>`;
    },
  };
})();
