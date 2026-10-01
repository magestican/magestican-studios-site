
































const ID = 'fch-a11y';


function region() {
  let root = document.getElementById(ID);
  if (root) return root;
  root = document.createElement('div');
  root.id = ID;
  root.className = 'visually-hidden';
  root.innerHTML = [
    '<h2 id="fch-title"></h2>',
    '<p id="fch-status" role="status" aria-live="polite"></p>',
    '<div id="fch-board"></div>',
    '<p id="fch-keys"></p>',
  ].join('');
  document.body.appendChild(root);
  return root;
}

let lastTitle = '';
let lastStatus = '';
let lastBoard = '';









export function mirror({ title, status, lines }) {
  region();
  if (title !== lastTitle) {
    document.getElementById('fch-title').textContent = title;
    lastTitle = title;
  }
  if (status !== lastStatus) {
    document.getElementById('fch-status').textContent = status;
    lastStatus = status;
  }
  const board = lines.join('\n');
  if (board !== lastBoard) {
    const node = document.getElementById('fch-board');
    node.textContent = '';
    for (const line of lines) {
      const p = document.createElement('p');
      p.textContent = line;
      node.appendChild(p);
    }
    lastBoard = board;
  }
}









export function announce(message) {
  region();
  if (message === lastStatus) {
    
    
    document.getElementById('fch-status').textContent = '';
  }
  document.getElementById('fch-status').textContent = message;
  lastStatus = message;
}


export function keysAre(text) {
  region();
  document.getElementById('fch-keys').textContent = text;
}
