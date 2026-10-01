






























const ID = 'fchess-a11y';


function region() {
  let root = document.getElementById(ID);
  if (root) return root;
  root = document.createElement('div');
  root.id = ID;
  root.className = 'visually-hidden';
  root.innerHTML = [
    '<h2 id="fchess-title"></h2>',
    '<p id="fchess-status" role="status" aria-live="polite"></p>',
    '<div id="fchess-board"></div>',
    '<p id="fchess-keys"></p>',
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
    document.getElementById('fchess-title').textContent = title;
    lastTitle = title;
  }
  if (status !== lastStatus) {
    document.getElementById('fchess-status').textContent = status;
    lastStatus = status;
  }
  const board = lines.join('\n');
  if (board !== lastBoard) {
    const node = document.getElementById('fchess-board');
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
    
    
    document.getElementById('fchess-status').textContent = '';
  }
  document.getElementById('fchess-status').textContent = message;
  lastStatus = message;
}


export function keysAre(text) {
  region();
  document.getElementById('fchess-keys').textContent = text;
}
