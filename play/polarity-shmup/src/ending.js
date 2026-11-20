











import { tv } from '../../../web-engine/i18n/tr.js';

export const ENDING = [
  { id: 'sora', name: 'Sora', img: 'assets/busts/sora/candidate_1.webp', line: 'The Crown is down! Wake Squadron, check in!' },
  { id: 'rook', name: 'Rook', img: 'assets/busts/rook/candidate_1.webp', line: 'Still flying! Told you. Nothing they fire touches me twice!' },
  { id: 'mina', name: 'Mina', img: 'assets/busts/mina/candidate_2.webp', line: 'Listen. Their channels are silent. Every single one.' },
  { id: 'tevi', name: 'Tevi', img: 'assets/busts/tevi/candidate_1.webp', line: "We did it. Next harvest is on my farm, and you're all invited." },
  { id: 'halden', name: 'Halden', img: 'assets/busts/halden/candidate_2.webp', line: 'Four ships out, four ships coming home. The war is over, pilots. Bring them in gently.' },
];


export function renderEnding(list, doc = document) {
  list.replaceChildren(...ENDING.map((e, i) => {
    const li = doc.createElement('li');
    li.className = e.id === 'halden' ? 'cmd' : 'pilot';
    if (i < 4) li.style.setProperty('--c', `var(--p${i + 1})`);
    const img = doc.createElement('img');
    img.src = e.img;
    img.alt = e.name;
    img.width = 120;
    img.height = 120;
    const name = doc.createElement('b');
    name.textContent = e.name;
    const line = doc.createElement('p');
    line.textContent = tv(e.line);
    const words = doc.createElement('div');
    words.append(name, line);
    li.append(img, words);
    return li;
  }));
}
