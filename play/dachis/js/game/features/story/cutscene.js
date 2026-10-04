
import { G, S } from '../../state.js';
import { CS } from './scenes.js';
import { createPixelLayer } from '../../../engine/ui/pixelLayer.js';

let layer = null;

const playSfx = (sfx) => { if (!sfx || !S.sfx) return; for (const [n, ms] of typeof sfx === 'string' ? [[sfx, 0]] : sfx) ms ? setTimeout(() => S.sfx.play(n, { tag: 'dlg' }), ms) : S.sfx.play(n, { tag: 'dlg' }); };

const $ = id => document.getElementById(id);

export const Cutscene = {
  scenes: null, scene: 0, li: 0, done: null, prevMode: 'world',
  
  play(scenes, onDone, opts = {}) {
    this.scenes = scenes; this.scene = 0; this.done = onDone; this.onLine = opts.onLine || null;
    this.prevMode = G.mode; G.mode = 'cutscene';
    for (const sc of scenes) if (sc.prewarm) sc.prewarm(); 
    $('skipBtn').classList.remove('hidden');
    const st = opts.start;
    if (st && st.scene > 0 && st.scene < scenes.length) this.scene = st.scene;
    this.playScene(st && st.scene === this.scene ? st.li : 0);
  },
  playScene(from = 0) {
    const sc = this.scenes[this.scene];
    CS.t = 0; this.li = 0; CS.flashed = false;
    const all = sc.lines(), n = this.scene;
    from = Math.max(0, Math.min(all.length - 1, from));
    for (let i = 0; i < from; i++) if (all[i].fx) all[i].fx(CS); 
    const lines = all.map((l, i) => Object.assign({}, l, { onShow: () => { this.li = i; if (l.fx) l.fx(CS); playSfx(l.sfx); if (this.onLine) this.onLine(n, i); } })).slice(from);
    S.dialog.say(lines, () => {
      this.scene++;
      if (this.scene >= this.scenes.length) this.finish(); else this.playScene();
    });
  },
  skip() { if (G.mode !== 'cutscene') return; S.sfx.fade('dlg', 0.4); S.dialog.clear(); this.finish(); }, 
  finish() {
    if (G.mode !== 'cutscene') return;
    $('skipBtn').classList.add('hidden');
    G.mode = 'world';
    const f = this.done; this.done = null; f && f();
  },
  update(dt) { CS.t += dt; CS.flash = Math.max(0, CS.flash - dt * 1.5); },
  
  
  
  draw(out, w, h) {
    const sc = this.scenes[Math.min(this.scene, this.scenes.length - 1)];
    const L = layer ||= createPixelLayer({ readback: true }), low = S.stage.pixel.low;
    L.begin(w, h, low.x, low.y);
    const ctx = L.ctx;
    ctx.save(); ctx.scale(1 / L.k, 1 / L.k); ctx.imageSmoothingEnabled = false;
    if (sc.shake && sc.shake({ li: this.li })) ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
    sc.draw(ctx, w, h, CS.t, this.li);
    ctx.restore();
    ctx.save(); ctx.scale(1 / L.k, 1 / L.k);
    if (CS.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${CS.flash})`; ctx.fillRect(0, 0, w, h); }
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h * 0.06); ctx.fillRect(0, h * 0.94, w, h * 0.06);
    ctx.restore();
    L.quantise();
    L.end(out, w, h, Math.min(2, devicePixelRatio || 1));
  },
};
