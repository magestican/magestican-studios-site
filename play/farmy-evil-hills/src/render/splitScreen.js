
































export const SPLIT = Object.freeze({
  




  gutter: 4,
  




  minHalf: 120,
  



















  partnerEveryNth: 2,
});










export function splitViewports(width, height, count = 2, gutter = SPLIT.gutter) {
  const w = Math.max(1, Math.floor(width));
  const h = Math.max(1, Math.floor(height));
  if (count < 2) return [{ x: 0, y: 0, w, h, role: 'full' }];
  const g = Math.min(gutter, Math.max(0, h - 2));
  const half = Math.floor((h - g) / 2);
  return [
    
    { x: 0, y: h - half, w, h: half, role: 'top' },
    { x: 0, y: 0, w, h: half, role: 'bottom' },
  ];
}


export const aspectOf = (view) => (view.h > 0 ? view.w / view.h : 1);











let splitFrame = 0;

export function renderSplit({
  renderer, scene, cameras, width, height, gutter = SPLIT.gutter,
  partnerEveryNth = SPLIT.partnerEveryNth,
}) {
  const views = splitViewports(width, height, cameras.length, gutter);
  splitFrame += 1;
  
  
  
  
  const drawPartner = partnerEveryNth <= 1 || (splitFrame % partnerEveryNth) === 0;
  
  
  
  renderer.setScissorTest(true);
  for (let i = 0; i < views.length && i < cameras.length; i += 1) {
    const v = views[i];
    const cam = cameras[i];
    if (!cam) continue;
    if (i > 0 && !drawPartner) continue;
    const a = aspectOf(v);
    if (cam.isPerspectiveCamera && Math.abs((cam.aspect || 0) - a) > 1e-4) {
      cam.aspect = a;
      cam.updateProjectionMatrix();
    }
    renderer.setViewport(v.x, v.y, v.w, v.h);
    renderer.setScissor(v.x, v.y, v.w, v.h);
    
    
    renderer.render(scene, cam);
  }
  renderer.setScissorTest(false);
  renderer.setViewport(0, 0, Math.max(1, Math.floor(width)), Math.max(1, Math.floor(height)));
  return views;
}














export function createSplitHud(doc = globalThis.document) {
  if (!doc?.createElement) return null;
  const root = doc.createElement('div');
  root.id = 'coopHud';
  root.className = 'hud';
  root.style.cssText = [
    'position:absolute', 'left:0', 'right:0', 'bottom:0', 'height:34px',
    'display:none', 'align-items:center', 'gap:14px', 'padding:0 12px',
    'font:11px/1.4 ui-monospace,Menlo,Consolas,monospace', 'letter-spacing:.10em',
    'color:#cfe3dc', 'background:linear-gradient(0deg,rgba(6,10,12,.86),rgba(6,10,12,0))',
    'pointer-events:none', 'z-index:7',
  ].join(';');
  root.innerHTML = '<span class="coop-who"></span>'
    + '<span class="coop-hp"></span>'
    + '<span class="coop-state" style="color:#e2a03f"></span>';

  const banner = doc.createElement('div');
  banner.id = 'coopWatch';
  banner.className = 'hud';
  banner.style.cssText = [
    'position:absolute', 'left:50%', 'top:10px', 'transform:translateX(-50%)',
    'display:none', 'padding:4px 12px', 'border:1px solid #3d5a63', 'border-radius:4px',
    'background:rgba(6,10,12,.72)', 'color:#9fd6c6',
    'font:11px/1.4 ui-monospace,Menlo,Consolas,monospace', 'letter-spacing:.18em',
    'pointer-events:none', 'z-index:8',
  ].join(';');
  banner.textContent = '\u{1F441} WATCHING';

  const wrap = doc.getElementById('wrap') || doc.body;
  wrap.appendChild(root);
  wrap.appendChild(banner);

  const who = root.querySelector('.coop-who');
  const hp = root.querySelector('.coop-hp');
  const state = root.querySelector('.coop-state');

  return {
    root,
    banner,
    
    setMode(mode) {
      const on = mode === 'split' || mode === 'watch';
      root.style.display = on ? 'flex' : 'none';
      banner.style.display = mode === 'watch' ? 'block' : 'none';
      const body = doc.body;
      if (!body) return;
      body.classList.toggle('coopSplit', on);
      
      
      
      
      
      
      
      
      body.classList.toggle('coopWatch', mode === 'watch');
    },
    paint(s) {
      who.textContent = s.name || 'PARTNER';
      const health = Math.max(0, Math.round(s.health ?? 0));
      hp.textContent = s.present === false ? 'NOT CONNECTED' : `HP ${health}`;
      state.textContent = s.note || '';
    },
    destroy() {
      root.remove();
      banner.remove();
      doc.body?.classList.remove('coopSplit');
    },
  };
}
