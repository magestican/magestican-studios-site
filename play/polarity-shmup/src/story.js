









import { ENDING } from './ending.js';
import { tv } from '../../../web-engine/i18n/tr.js';


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







export const BRIEFING = Object.freeze({
  sora: Object.freeze([
    L('halden', 'Lieutenant Sora. Seven years ago the Dominion shelled your lighthouse at Cape Merrow. You turned that lamp by hand until dawn.'),
    L('sora', 'Forty boats came home that night, sir. I counted.'),
    L('halden', 'Tonight the whole coast needs that lamp. You lead Wake Squadron to Heartfall, and you bring every one of them back.'),
    L('sora', 'Understood, Commander. Wake Lead is ready.'),
  ]),
  rook: Object.freeze([
    L('halden', 'Rook. Two crashes behind enemy lines, and you walked home from both.'),
    L('rook', 'Three, sir. I never reported the third one.'),
    L('halden', 'Then that was your last free one. The Dominion is moving on Port Lyle. You fly wing with the best pilots I have left.'),
    L('rook', 'Relax, Commander. I always come home. Ask anybody on the docks!'),
  ]),
  mina: Object.freeze([
    L('halden', 'Mina. At Saltpan you heard their fleet coming, and nobody believed you.'),
    L('mina', 'Nobody came back to say sorry, sir.'),
    L('halden', "I'm listening now. Every channel you catch out there comes straight to my bridge."),
    L('mina', "Then keep yours open. I'll hear them first."),
  ]),
  tevi: Object.freeze([
    L('halden', "Tevi. First sortie, and it's over Dustline. Your family's farm is under that smoke."),
    L('tevi', 'I know every field down there, sir. My sisters planted half of them.'),
    L('halden', "Then you know what we're fighting for. Stay close to your squad and don't fly angry."),
    L('tevi', 'Yes, sir. Nobody gets left behind. Not today!'),
  ]),
});


export const briefingFor = (id) => BRIEFING[id] || BRIEFING.sora;


export function renderBriefing(list, id, doc = document) {
  list.replaceChildren(...briefingFor(id).map((b) => beatItem(b, doc, false)));
}





export const readMs = (line) => 2000 + 400 * line.split(/\s+/).filter(Boolean).length;






export function introTimeline(stage, spokenMs = () => 0) {
  let at = 0;
  return (INTRO[stage] || []).map((b, i) => {
    const ms = Math.max(readMs(b.line), (spokenMs(i) || 0) + 1000);
    const step = { at, ms, id: b.id, line: b.line };
    at += ms + 600;
    return step;
  });
}


export function beatItem(b, doc = document, translate = true) {
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
  line.textContent = translate ? tv(b.line) : b.line;
  const words = doc.createElement('div');
  words.append(name, line);
  li.append(img, words);
  return li;
}


export function renderAfter(list, stage, doc = document) {
  list.replaceChildren(...(AFTER[stage] || []).map((b) => beatItem(b, doc)));
  list.hidden = !(AFTER[stage] || []).length;
}
