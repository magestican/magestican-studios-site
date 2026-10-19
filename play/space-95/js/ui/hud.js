



import { KEY_ICON, SHELL_ICON, SPARK_ICON } from './icons.js';

const ASSIST_LABEL = {
  coyote: 'Coyote jump',
  buffered: 'Buffered jump',
  corner: 'Corner slide',
  mantle: 'Ledge assist',
};


export function createHud(root, challenges, visible, title = 'Metrics gym') {
  root.innerHTML = `
    <div class="hud-card hud-title"><strong>Space 95</strong><span>${title}</span><span class="hud-hearts" data-el="hearts"></span></div>
    <div class="hud-card hud-train" data-el="train" hidden></div>
    <div class="hud-card hud-challenge" data-el="challenge"></div>
    <div class="hud-card hud-stats" data-el="stats"></div>
    <div class="hud-flash" data-el="flash"></div>`;
  const el = (k) => root.querySelector(`[data-el="${k}"]`);
  const stats = { jumpH: 0, air: 0, takeoff: 0, airStart: 0, airborne: false, fps: 60 };
  let flashT = 0;
  let trainHtml = '';
  root.hidden = !visible;
  root.dataset.mode = title === 'Metrics gym' ? 'gym' : 'shift';

  const flash = (text) => {
    const f = el('flash');
    f.textContent = text;
    f.classList.remove('is-on');
    void f.offsetWidth;
    f.classList.add('is-on');
    flashT = 1.2;
  };

  return {
    
    toggle() {
      if (root.hidden) root.hidden = false;
      else if (!root.classList.contains('is-expanded')) root.classList.add('is-expanded');
      else {
        root.classList.remove('is-expanded');
        root.hidden = true;
      }
    },
    onEvent(e, s) {
      if (e.type === 'jump') {
        stats.takeoff = s.player.y;
        stats.airStart = s.time;
        stats.airborne = true;
        if (e.coyote) flash(ASSIST_LABEL.coyote);
        else if (e.buffered) flash(ASSIST_LABEL.buffered);
      }
      if (e.type === 'leave') {
        stats.takeoff = s.player.y;
        stats.airStart = s.time;
        stats.airborne = true;
      }
      if (e.type === 'corner') flash(ASSIST_LABEL.corner);
      if (e.type === 'mantle') flash(ASSIST_LABEL.mantle);
      if (e.type === 'land' && stats.airborne) {
        stats.airborne = false;
        stats.air = s.time - stats.airStart;
        stats.jumpH = Math.max(0, (e.fall ?? 0) + s.player.y - stats.takeoff); 
      }
      if (e.type === 'checkpoint') flash(`Clocked in: ${e.id}`);
      if (e.type === 'pit') flash('Oops');
      if (e.type === 'secret') flash(`Intel found: ${e.name ?? e.secret}`);
      if (e.type === 'clear') flash(`Shift clear: ${e.time.toFixed(1)} s`);
      if (e.type === 'gameOver') flash('Back to the start - Intel kept');
    },
    update(s, dt) {
      if (root.hidden) return;
      stats.fps += (1 / Math.max(dt, 1e-3) - stats.fps) * 0.05;
      const p = s.player;
      el('hearts').textContent = `${'\u2665'.repeat(Math.max(0, s.hearts))}  x${s.lives}`;
      const next = challenges.find((c) => c.id === s.checkpoint + 1) ?? challenges[challenges.length - 1];
      const cur = challenges.find((c) => c.id === s.checkpoint) ?? next;
      
      const t = s.train;
      if (t) {
        const pips = Array.from({ length: 3 }, (_, i) => `<i class="hud-pip${i < t.charges ? ' is-on' : ''}"></i>`).join('');
        const html = [
          `<span class="hud-train-item" title="Wind-up keys: Boost">${KEY_ICON}<span class="hud-pips">${pips}</span></span>`,
          s.shield ? `<span class="hud-train-item" title="Shell Shield">${SHELL_ICON}<span>Shield</span></span>` : '',
          t.sparkT > 0
            ? `<span class="hud-train-item is-spark" title="Spark Wheels">${SPARK_ICON}<span class="hud-v">${t.sparkT.toFixed(1)} s</span></span>`
            : '',
        ].join('');
        if (html !== trainHtml) {
          trainHtml = html;
          el('train').innerHTML = html;
          el('train').hidden = false;
        }
      }
      el('challenge').innerHTML = `<span class="hud-k">Challenge ${cur.id}</span><strong>${cur.label}</strong><span>${cur.proves}</span>`;
      el('stats').innerHTML = [
        ['Speed', `${Math.abs(p.vx).toFixed(1)} u/s`],
        ['Last jump', `${stats.jumpH.toFixed(2)} u`],
        ['Air time', `${stats.air.toFixed(2)} s`],
        ['Falls', `${s.deaths}`],
        ['Intel', `${s.found.size}`],
        ['Time', `${s.time.toFixed(1)} s`],
        ['FPS', `${Math.round(stats.fps)}`],
      ]
        .map(([k, v]) => `<div><span class="hud-k">${k}</span><span class="hud-v">${v}</span></div>`)
        .join('');
      if (flashT > 0) flashT -= dt;
    },
  };
}
