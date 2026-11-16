










export const ENDING = [
  { id: 'sora', name: 'Sora', img: 'assets/busts/sora/candidate_1.webp', line: "Crown's down. Check in, everyone." },
  { id: 'rook', name: 'Rook', img: 'assets/busts/rook/candidate_1.webp', line: 'Still flying. Told you nothing they fire can touch me twice.' },
  { id: 'mina', name: 'Mina', img: 'assets/busts/mina/candidate_2.webp', line: "Listen. The channel's gone quiet. Only the wind now." },
  { id: 'tevi', name: 'Tevi', img: 'assets/busts/tevi/candidate_1.webp', line: 'Good flying, all of you. First round back home is mine.' },
  { id: 'halden', name: 'Halden', img: 'assets/busts/halden/candidate_2.webp', line: 'That closes it. Four ships out, four ships coming home. Land gently, pilots.' },
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
    line.textContent = e.line;
    const words = doc.createElement('div');
    words.append(name, line);
    li.append(img, words);
    return li;
  }));
}
