










import { S } from '../../state.js';

let root = null, timer = 0;

function build() {
  root = document.createElement('div');
  root.id = 'battleOpener'; root.className = 'hidden'; root.setAttribute('aria-hidden', 'true');
  root.innerHTML = '<svg class="opTear"></svg><div class="opBand"><span class="opSub"></span><span class="opWord"></span></div>';
  document.body.appendChild(root);
}


export function tearLine(w, h, rnd = Math.random) {
  const pts = [], n = 26, y0 = h * (0.46 + rnd() * 0.08), tilt = (rnd() - 0.5) * h * 0.08;
  for (let i = 0; i <= n; i++) {
    const x = -12 + (w + 24) * i / n, big = (rnd() - 0.5) * h * 0.05, nib = (i % 2 ? 1 : -1) * h * (0.006 + rnd() * 0.01);
    pts.push([x, y0 + tilt * (i / n - 0.5) + big + nib]);
  }
  return pts;
}

export function battleOpener({ boss = false, name = '' } = {}) {
  if (!root) build();
  clearTimeout(timer);
  const w = Math.max(1, innerWidth), h = Math.max(1, innerHeight), t = tearLine(w, h);
  const line = t.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ');
  const back = t.slice().reverse().map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ');
  const off = (dy) => t.map(([x, y]) => `${x.toFixed(1)},${(y + dy).toFixed(1)}`).join(' ');
  const svg = root.querySelector('.opTear');
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.innerHTML = `<defs>
      <pattern id="opDots" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(20)"><circle cx="4.5" cy="4.5" r="1.7" fill="#140a26"/></pattern>
      <radialGradient id="opEdge" cx="50%" cy="50%" r="75%"><stop offset="35%" stop-color="#140a26" stop-opacity="0"/><stop offset="100%" stop-color="#0b0516" stop-opacity=".85"/></radialGradient>
    </defs>
    <g class="opHalf opTop">
      <polygon points="-12,-12 ${w + 12},-12 ${back}" fill="#2b1a4a"/>
      <polygon points="-12,-12 ${w + 12},-12 ${back}" fill="url(#opDots)" opacity=".55"/>
      <polygon points="-12,-12 ${w + 12},-12 ${back}" fill="url(#opEdge)"/>
      <polyline points="${off(-2.5)}" class="opFibre"/>
    </g>
    <g class="opHalf opBot">
      <polygon points="${line} ${w + 12},${h + 12} -12,${h + 12}" fill="#2b1a4a"/>
      <polygon points="${line} ${w + 12},${h + 12} -12,${h + 12}" fill="url(#opDots)" opacity=".55"/>
      <polygon points="${line} ${w + 12},${h + 12} -12,${h + 12}" fill="url(#opEdge)"/>
      <polyline points="${off(2.5)}" class="opFibre"/>
    </g>
    <polyline points="${line}" class="opRun" pathLength="1"/>`;
  root.querySelector('.opSub').textContent = boss ? name : name ? 'vs ' + name : '';
  root.querySelector('.opWord').textContent = boss ? 'BOSS BATTLE!' : 'BATTLE!';
  root.classList.toggle('boss', !!boss);
  root.classList.add('hidden'); void root.offsetWidth; 
  root.classList.remove('hidden');
  S.sfx.play(boss ? 'bossOpener' : 'opener');
  timer = setTimeout(() => root.classList.add('hidden'), 1400);
}
