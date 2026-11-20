









import { ENDING } from './ending.js';


export const SPEAKERS = Object.freeze(Object.fromEntries(ENDING.map((e, i) => [e.id, Object.freeze({
  id: e.id, name: e.name, img: e.img, seat: e.id === 'halden' ? null : i,
})])));

const L = (id, line) => Object.freeze({ id, line });


export const INTRO = Object.freeze([
  Object.freeze([
    L('halden', 'Out at Heartfall, the Crown is drinking our sky, Ember and Iris both. Without that light, the land below is losing its colour. You four fly the last ships that still flip between the two lights.'),
    L('sora', "Dustline below. Its fields went grey first. Now the Furnace burns off what's left of them."),
  ]),
  Object.freeze([L('mina', 'Saltpan. Here the Loom spins our light into threads and sends them east. So we cut every thread.')]),
  Object.freeze([L('tevi', 'Foundry. In there the Anvil beats stolen light into ships. So stay close. Nobody flies this one alone.')]),
  Object.freeze([L('sora', 'Twinsea. One sea burns amber, the other runs violet. The Twin wears both of them, one half each. Hit each half with the other light.')]),
  Object.freeze([L('halden', 'Heartfall. Every light we lost pours into the Crown here. Bring that light home, pilots.')]),
]);


export const AFTER = Object.freeze([
  Object.freeze([L('rook', 'One Furnace, cold. So tell me they built a harder one.'), L('mina', "Hush. Out on the salt, something's humming. It sounds like a loom.")]),
  Object.freeze([L('tevi', "The salt's shining again. Behind us, anyway."), L('sora', 'Then we keep it behind us. Those threads run on to the Foundry.')]),
  Object.freeze([L('rook', 'That anvil missed me. It missed every swing.'), L('halden', 'Good, because the next one wears both colours. Save the bragging for after it.')]),
  Object.freeze([L('mina', 'Hear that? Both lights are falling the same way now.'), L('tevi', "They're falling toward Heartfall. And after Heartfall, we go home.")]),
]);





export const readMs = (line) => 2000 + 400 * line.split(/\s+/).filter(Boolean).length;


export function introTimeline(stage) {
  let at = 0;
  return (INTRO[stage] || []).map((b) => {
    const ms = readMs(b.line);
    const step = { at, ms, id: b.id, line: b.line };
    at += ms + 600;
    return step;
  });
}


export function beatItem(b, doc = document) {
  const who = SPEAKERS[b.id];
  const li = doc.createElement('li');
  li.className = who.seat === null ? 'cmd' : 'pilot';
  if (who.seat !== null) li.style.setProperty('--c', `var(--p${who.seat + 1})`);
  const img = doc.createElement('img');
  img.src = who.img;
  img.alt = who.name;
  img.width = 56;
  img.height = 56;
  const name = doc.createElement('b');
  name.textContent = who.name;
  const line = doc.createElement('p');
  line.textContent = b.line;
  const words = doc.createElement('div');
  words.append(name, line);
  li.append(img, words);
  return li;
}


export function renderAfter(list, stage, doc = document) {
  list.replaceChildren(...(AFTER[stage] || []).map((b) => beatItem(b, doc)));
  list.hidden = !(AFTER[stage] || []).length;
}
