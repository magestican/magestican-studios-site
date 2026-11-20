













import { PILOTS } from './pilots.js';
import { tv } from '../../../web-engine/i18n/tr.js';

const C = (o) => Object.freeze({ ...o, story: Object.freeze(o.story) });


export const CREW = Object.freeze({
  sora: C({
    callsign: 'Wake Lead',
    story: [
      'The power died on the third shell. Sora was twelve, halfway up the lighthouse stairs at Cape Merrow, and below her the whole harbor went black.',
      '"Dad?"',
      'He was sitting on the landing with his hand on his ankle. "Can\'t climb. The crank, Sora. Up top."',
      'Sora found it in the dark. It was an iron handle as long as her arm, made for a grown man. She leaned her weight on it and the great lamp turned, slow, one sweep across the water. Then another.',
      'Out on the sea, engines changed course. One boat, then three, then too many to count by ear. The Dominion guns kept falling on the cape, closer, then farther off, and she kept turning.',
      'At dawn Sora could not lift her arms. Her father counted the boats tied up in the harbor. Forty.',
      'Seven years later Sora leads Wake Squadron, the youngest flight lead the Republic has ever had. On the radio she never raises her voice. New pilots ask why she stays so calm when the sky is full of fire.',
      '"Somebody has to be the lamp," she tells them, and climbs into her cockpit.',
    ],
  }),
  rook: C({
    callsign: 'Wake Two',
    story: [
      'The mail plane\'s engine coughed twice and quit over the blockade line. Rook was sixteen, the hold behind him packed with crates of medicine for Port Lyle, and the Dominion searchlights were already swinging his way.',
      '"Come on, come on, old girl."',
      'He put her down in a turnip field, rolled out, and ran. Behind him the searchlights found the wreck and the guns opened up on it. He did not look back.',
      'It took him four nights to walk home along the railway. He carried one crate on his shoulder the whole way. When he reached the docks he grinned and told everyone the walk was nothing. He told the story louder every time.',
      'The second crash, he walked home in three nights.',
      'The air force took him at seventeen because nobody else could fly that low and laugh about it. In Wake Squadron he is the loud one, the one who jokes when the radio goes bad, and somehow the others stop shaking when he does.',
      'He keeps a list folded in his flight jacket. One line for every crate he never delivered. Nobody has seen it. He would like the list to stop growing.',
    ],
  }),
  mina: C({
    callsign: 'Wake Three',
    story: [
      'The hum came at 3:12 in the morning, on a channel nobody at Saltpan bothered to watch. Mina was sixteen, the youngest operator at the listening post, and she pressed both hands over her headphones.',
      'Engines. Hundreds of them, far off and low.',
      'She ran the report up to the duty officer. He read it, yawned, and handed it back. "Static, kid. Go to bed."',
      'Mina did not go to bed. She sat at her desk and listened to the hum grow until the windows started to tremble.',
      'Two days later the Dominion fleet came over the salt flats. The post fell before noon. Mina walked out through the drainage tunnel with a radio on her back and reached the coast alone.',
      'Afterward an admiral asked Mina what she wanted. She said she wanted to fly. A pilot, she said, gets listened to.',
      'In Wake Squadron she talks the least. She keeps three channels open at once and hears the enemy turn before anyone sees it. When Mina says "listen," Commander Halden has learned to stop talking.',
    ],
  }),
  tevi: C({
    callsign: 'Wake Four',
    story: [
      'The sky over Dustline turned orange just after supper. Tevi was seventeen, out in the wheat with his two little sisters, and he saw the Dominion\'s Furnace column crest the hill road with its guns already firing.',
      '"Truck. Now. Don\'t run, just walk fast."',
      'His grandmother had the engine going before they reached the yard. They took one suitcase, the seed tin and the dog. Tevi drove with the lights off all night, following the river to the coast, while his sisters slept against his shoulder.',
      'At the harbor town Tevi left them with an aunt and walked to the recruiting office, which opened at eight. He was at the door at seven, still in his farm boots, still smelling of smoke.',
      'He is the newest pilot in Wake Squadron and the one everyone likes. He shares his rations. He remembers birthdays. After every fight he checks on every ship, one by one, before he checks on his own.',
      'His first sortie is over his own fields. Before he left, his sisters made him promise they would plant again by spring. He keeps the seed tin under his seat.',
    ],
  }),
});

let chosen = PILOTS[0].id;


export const chosenPilot = () => PILOTS.find((p) => p.id === chosen);


export function choosePilot(id) {
  if (PILOTS.some((p) => p.id === id)) chosen = id;
  return chosenPilot();
}


export const pilotColour = (p) => PILOTS.indexOf(p) + 1;





export function renderStory(panel, id, doc = document) {
  const p = PILOTS.find((q) => q.id === id) || PILOTS[0];
  const crew = CREW[p.id];
  const head = doc.createElement('h3');
  head.textContent = p.name;
  const sign = doc.createElement('p');
  sign.className = 'sign';
  
  sign.textContent = tv(crew.callsign);
  const paras = crew.story.map((s) => {
    const el = doc.createElement('p');
    el.textContent = tv(s);
    return el;
  });
  panel.replaceChildren(head, sign, ...paras);
  panel.style.setProperty('--c', `var(--p${pilotColour(p)})`);
  return p;
}
