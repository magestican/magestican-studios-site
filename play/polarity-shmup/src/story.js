










import { ENDING } from './ending.js';
import { tv } from '../../../web-engine/i18n/tr.js';


export const SPEAKERS = Object.freeze(Object.fromEntries(ENDING.map((e, i) => [e.id, Object.freeze({
  id: e.id, name: e.name, img: e.img, seat: e.id === 'halden' ? null : i,
})])));

const L = (id, line) => Object.freeze({ id, line });







export const INTRO = Object.freeze([
  Object.freeze([
    L('halden', 'Wake Squadron, this is Harrow! The Furnace column is burning its way across Dustline. Stop it before it reaches the river!'),
    L('sora', 'Wake copies. Weapons hot. Everybody stay on me!'),
  ]),
  Object.freeze([
    L('halden', "Saltpan was our listening post once. Now it's their depot. Burn it, and their whole front goes hungry."),
    L('mina', "I'm hearing them on every channel. They know we're coming."),
  ]),
  Object.freeze([
    L('halden', "The Foundry builds their gunships day and night. Today it builds nothing! Hit the Anvil and don't stop!"),
    L('rook', 'Finally, a target big enough to be worth the fuel!'),
  ]),
  Object.freeze([
    L('halden', 'The Twin leads their fleet. Break it, and the strait is ours. Harrow holds as long as you do!'),
    L('tevi', "Hang on, Commander! We're coming!"),
  ]),
  Object.freeze([
    L('halden', 'Heartfall. The Crown has shelled our coast for six years. I lost my first squadron under those guns. I will not lose this one!'),
    L('sora', "All Wake, this is it. Everything we've got!"),
  ]),
]);


export const AFTER = Object.freeze([
  Object.freeze([
    L('tevi', "The column's broken! The farms are still standing!"),
    L('rook', "One down. Who's buying?"),
    L('halden', 'Hold the cheering. Their supply road runs on through Saltpan.'),
  ]),
  Object.freeze([
    L('mina', "The depot's quiet now. Quieter than the night it fell."),
    L('sora', 'You came back for it, Mina. That counts.'),
  ]),
  Object.freeze([
    L('rook', 'Did you see that? The whole Foundry folded!'),
    L('halden', 'Wake, Harrow is taking fire! Their fleet came out of Twinsea behind us. Get back here, now!'),
  ]),
  Object.freeze([
    L('sora', 'Harrow, Harrow, this is Wake Lead. Commander, do you read me?'),
    L('halden', "Still here, Lead. The bridge is full of smoke, but I'm here. Heartfall is open. Finish it."),
  ]),
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
  
  list.replaceChildren(...briefingFor(id).map((b) => beatItem(b, doc)));
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
