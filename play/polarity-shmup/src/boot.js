




const q = new URL(location.href).searchParams;


const netMode = q.has('net');

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error(`could not load ${src}`));
    document.head.appendChild(s);
  });
}

if (netMode) {
  document.title = 'Flipwake - co-op netcode proof';
  document.body.classList.add('netmode');
  document.body.appendChild(document.getElementById('net-ui').content.cloneNode(true));
  
  loadScript(new URL('../../../web-engine/vendor/peerjs-1.5.4/peerjs.min.js', import.meta.url).href)
    .then(() => import('./netPage.js'))
    .catch((e) => { document.getElementById('status').textContent = `Could not start: ${e.message}`; });
} else {
  import('./game.js');
}
