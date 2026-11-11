




const JUMPS = ['stage', 'room', 'demo', 't', 'cheat', 'phase', 'players', 'input', 'nocamera', 'godmode'];


export const wantsTitle = (q) => !JUMPS.some((k) => q.has(k));





export function showTitle(root, { onStart, goal, prizes }) {
  const box = document.createElement('div');
  box.className = 'title';
  const name = document.createElement('h1');
  name.className = 'title-name';
  name.textContent = 'Rex Rampage';
  const tape = document.createElement('div');
  tape.className = 'title-tape';
  const start = document.createElement('button');
  start.type = 'button';
  start.className = 'title-start';
  start.textContent = 'START';
  start.addEventListener('click', () => {
    box.remove();
    onStart();
  });
  tape.appendChild(start);
  box.append(name);
  if (goal) {
    const line = document.createElement('p');
    line.className = 'title-goal';
    line.textContent = goal;
    box.append(line);
  }
  box.append(tape);
  if (prizes) {
    const count = document.createElement('p');
    count.className = 'title-prizes';
    count.textContent = prizes;
    box.append(count);
  }
  root.appendChild(box);
  start.focus();
}
