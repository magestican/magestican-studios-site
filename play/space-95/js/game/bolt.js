





const LINES = {
  shiftStart: [
    'Clocking in. Coffee module: empty.',
    'Shift started. Try not to get stepped on.',
    'Survey mode on. Everything here is HUGE.',
  ],
  signal: ["Huh. My antenna's itching.", 'Something shiny back there...', 'Hollow sound. Suspicious.'],
  secret: ['Filed: {name}!', '{name} - into the report it goes.', 'Intel! {name}. Management will love this.'],
  checkpoint: ['Clocked in.', 'Beacon logged.', 'Timesheet updated.'],
  strike: ['STRIKE! That goes in the report.', 'Three for one. Efficient!'],
  dewBounce: ['Wheee- I mean: data acquired.', 'Dew lens. Bouncy. Noted.'],
  sweep: ['The ants did the work. Classic.', 'Express delivery!'],
  ability: ['Boot thrusters repaired! Jump twice. Legally.', 'New tool unlocked. Overtime approved.'],
  hurt: ['Ouch. Paperwork.', 'Careful! I only have one of you.'],
  bossDefeat: ['Foreman down! I am putting that in the quarterly review.', 'Management will hear about this. Good things only.'],
  shellPop: ['Free shell! Health and safety approved.', 'Wear it. Fling it. Your call.'],
  heaveLaunch: ['She breathes, we fly. Noted.', 'Ruuma is helping. Do not wake her.'],
  slipstream: ['Moth taxi! Tip not included.', 'Draft lane engaged. Hold on.'],
  shoeSlow: ["It's slowing down - go!", 'The shoe is tired. Now!'],
  punt: ['Wheee- okay, back to the beacon.', 'Punted! No harm done. Again.'],
  bowl: ['Overtime bowling!', 'Flipped and filed.'],
  shoeGone: ['Door shut. The Vast are home. So are we, almost.', 'Quiet now. Ship ahead.'],
  bossCameo: ['Was that... our lamp? With a CROWN?', 'Royalty. Stealing our lamp. Unbelievable.'],
  honeyStuck: ['Stuck! Honey: one, guards: zero.', 'Sticky situation. For them.'],
  bossEscape: ['She dropped the lamp! Lamp recovered. Duchess: not.', 'She got away. But we got the lamp.'],
  dunk: ['Man overboard! Fishing you out.', 'Splash. Towel module: missing.'],
  capsize: ['Capsized! Nice ripple.', 'Wave of the day!'],
  dishCameo: ['Hey! That is OUR dish!', 'The Mantis took the dish up the tree...'],
  sourBite: ['Sour! She hates those. Again!', 'Pucker power!'],
  dishDrop: ['Our dish! Back where it belongs. Almost.', 'Dish recovered. Signal... from the Vast house?'],
  tetherAttach: ['Hooked! Hold on.', 'Got it! Reeling you in.'],
  slickSlide: ['Too shiny to grip. Vast polish.', 'Slippery! Find cloth or paper.'],
  keystroke: ['You typed a letter! The game liked it.', 'BUG BLASTER: online.'],
  surge: ['Power surge! Sorry, little guys.', 'Circuit fried. Very efficient.'],
  lightsOut: ['Lights out! ...Is that our flight recorder blinking?', 'Dark. But I see a blink.'],
  glide: ['Leaf deployed. Very aerodynamic. Probably.', 'Wind bonus: unlocked.'],
  dig: ['Digging. In a suit. On a Monday.', 'Soil sample acquired. Also, a hole.'],
  clear: ['Shift complete. Clocking out!', "That's a wrap. Same time tomorrow?"],
  
  noPoints: ['No jumping on a train, Jo. Rules. Jump throws the points.'],
  pointsThrow: ['Points thrown! The lit arrow is where we go.'],
  boost: ['Wind-up key! Full steam. Mind the tight bends.'],
  couple: ['Parts coupled! Heavier train - robbers fly farther.'],
  derail: ['Off the rails! Brake before a tight bend. Back on in a jiffy.'],
  
  lanternRaise: ['Hold UP and I light up. Flowers open in bright light.'],
  budPop: ['Fireflies! They flip bugs - and they light the way ahead.'],
  dazzled: ["Don't look at it! Turn away - or out-glow it."],
  bloom: ['It BLOOMED! And look - our nav lamp, in the middle!'],
  ghostBlink: ['She hates the bright. Keep me down.'],
  
  webLand: ['Jump as it SINKS - it throws you!'],
  auntTelegraph: ["Spider. Aunt-sized. She thinks we're breakfast. DASH through her line!"],
  lineCut: ['Snip! She is off home. No hard feelings.'],
  snare: ['Sticky! Mash jump - wriggle out!'],
  pluck: ["She's playing the web. Land as it comes UP."],
  snag: ['Got you! Paperclip. Never fails.'],
};


const TEACH = new Set([
  'noPoints',
  'pointsThrow',
  'boost',
  'couple',
  'derail',
  'lanternRaise',
  'budPop',
  'dazzled',
  'bloom',
  'ghostBlink',
  'webLand',
  'auntTelegraph',
  'lineCut',
  'snare',
  'pluck',
  'snag',
]);


export function createBoltVoice() {
  const used = {};
  let cooldown = 0;
  const pick = (kind, vars = {}) => {
    const list = LINES[kind];
    const i = used[kind] ?? 0;
    used[kind] = i + 1;
    return list[i % list.length].replace('{name}', vars.name ?? 'something');
  };
  return {
    
    onEvent(e, dt = 0) {
      cooldown = Math.max(0, cooldown - dt);
      const teach = TEACH.has(e.type) && !used[e.type] && (e.type !== 'noPoints' || e.first !== false);
      const important =
        e.type === 'secret' || e.type === 'clear' || e.type === 'ability' || e.type === 'strike' || e.type === 'bossDefeat' || teach;
      if (cooldown > 0 && !important) return null;
      let kind = null;
      if (TEACH.has(e.type)) kind = teach ? e.type : null;
      
      else if (e.type === 'signal' && !e.repeat && e.state === undefined) kind = 'signal';
      else if (e.type === 'defeat' && e.how === 'sweep') kind = 'sweep';
      else if (e.type === 'dewBounce' && e.bounces === 1) kind = 'dewBounce';
      else if (e.type === 'ability' && e.grant === 'glide') kind = 'glide';
      else if (e.type === 'surge') kind = (used.surge ?? 0) < 2 ? 'surge' : null;
      else if (e.type === 'tetherAttach' || e.type === 'slickSlide' || e.type === 'keystroke')
        kind = (used[e.type] ?? 0) < 1 ? e.type : null; 
      else if (e.type === 'sourBite') kind = (used.sourBite ?? 0) < 2 ? 'sourBite' : null;
      else if (e.type === 'dunk') kind = (used.dunk ?? 0) < 2 ? 'dunk' : null;
      else if (e.type === 'capsize') kind = (e.n ?? 1) >= 4 && (used.capsize ?? 0) < 2 ? 'capsize' : null;
      else if (e.type === 'dishCameo') kind = e.step === 0 || e.step === 3 ? 'dishCameo' : null;
      else if (e.type === 'honeyStuck') kind = (used.honeyStuck ?? 0) < 2 ? 'honeyStuck' : null;
      else if (e.type === 'bowl') kind = e.n >= 4 ? 'bowl' : null;
      else if (e.type === 'punt') kind = (used.punt ?? 0) < 2 ? 'punt' : null;
      else if (e.type === 'slipstream') kind = (used.slipstream ?? 0) < 2 ? 'slipstream' : null;
      else if (e.type === 'heaveLaunch' || e.type === 'dig')
        kind = (used[e.type] ?? 0) < 2 ? e.type : null; 
      else if (e.type in LINES && e.type !== 'signal' && e.type !== 'dewBounce' && e.type !== 'sweep') kind = e.type;
      if (!kind) return null;
      cooldown = 4;
      const beep = kind === 'signal' ? 'bolt_beep_curious' : kind === 'hurt' ? null : 'bolt_beep_happy';
      return { text: pick(kind, e), beep, mood: kind === 'signal' ? 'curious' : kind === 'hurt' ? 'worried' : 'happy' };
    },
    start: () => ({ text: pick('shiftStart'), beep: 'bolt_beep_happy', mood: 'happy' }),
  };
}


export function followJo(b, jo, facing, dt, time) {
  const tx = jo.x - facing * 1.4;
  const ty = jo.y + 1.6 + Math.sin(time * 3) * 0.12;
  const k = 1 - Math.exp(-dt * 5);
  b.x += (tx - b.x) * k;
  b.y += (ty - b.y) * k;
  return b;
}
