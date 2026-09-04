



























const ID = 'fs-a11y';


function region() {
  let root = document.getElementById(ID);
  if (root) return root;
  root = document.createElement('div');
  root.id = ID;
  root.className = 'visually-hidden';
  root.innerHTML = [
    '<h2 id="fs-title"></h2>',
    '<p id="fs-status" role="status" aria-live="polite"></p>',
    '<div id="fs-board"></div>',
    '<p id="fs-keys"></p>',
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
    document.getElementById('fs-title').textContent = title;
    lastTitle = title;
  }
  if (status !== lastStatus) {
    document.getElementById('fs-status').textContent = status;
    lastStatus = status;
  }
  const board = lines.join('\n');
  if (board !== lastBoard) {
    const node = document.getElementById('fs-board');
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
    
    
    document.getElementById('fs-status').textContent = '';
  }
  document.getElementById('fs-status').textContent = message;
  lastStatus = message;
}


export function keysAre(text) {
  region();
  document.getElementById('fs-keys').textContent = text;
}
