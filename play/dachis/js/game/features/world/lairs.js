















export const LAIRS = [
  { boss: 'ashlo', sec: 'coast', uv: [13, 78], after: 'kumabo', 
    
    
    dress: { uv: [5.6, 77.6], off: [{ u: [9.3, 24], v: [70, 81] }, { u: [9.3, 24], v: [81, 84.7] }] },
    hint: 'Something burns on Tomo Coast... face Cinderwarden Ashlo',
    again: "Back again. The ash does not wait for you, Bridge child. Neither do I.",
    last: "Go on, then. Give them back their bell. See if one of them rings it for me.",
    meet: [['boss', 'Forty winters I kept that village warm. Not one of them came down to ask if I was cold. "{creed}"'],
      ['boss', 'I hid the bell\'s clapper so nobody could ring it. I know how that sounds. There is a promised land, Bridge child, and I am going.'],
      ['kid', 'You hid a BELL? You can\'t just - people NEED that bell! What if there\'s a fire?']],
    fall: 'The red goes out of {name}\'s ribs. He looks up at the village on the mountain for a long moment, then limps away into the ash.' },
  
  { boss: 'leviathrum', sec: 'coral', uv: [19.4, 95.4], after: 'boss_ashlo',
    hint: 'The tide pulls below Tomo Coast... face Leviathrum in Coral Deep', 
    again: "You came back. That makes two times. I keep count of everything.",
    last: "Three hundred and twelve streets. I swept every one of them this morning. Who sweeps them tomorrow?",

    meet: [['boss', 'I swept these streets every morning for a hundred years, Bridge child. For them. "{creed}"'],
      ['boss', 'They are not coming back. Someone told me so, and I knew it was true the moment I heard it. So I will go to them.'],
      ['kid', 'Who told you? WHO told you that? ...Fine. Come on, you big tin whale!']],
    fall: '{name}\'s sonar stops. In the quiet you can hear him counting the streets under his breath. Then he sinks away into the deep.' },
  
  { boss: 'bramble', sec: 'verdant', uv: [-19.6, 66.6], after: 'boss_leviathrum',
    hint: 'Face Mother Bramble in the Verdant Wilds', 
    again: "Wipe your feet. ...You came back to stop me. I know. Come in, then.",
    last: "Somebody water the violets. Not too much. They drown.",
    meet: [['boss', 'Mind the beds. You are standing on my violets. ...No. It does not matter now. "{creed}"'],
      ['boss', 'I am only pruning, Bridge child. You cut back the old wood so the new can come. It was explained to me. It made such sense.'],
      ['kid', 'That\'s not pruning! That\'s the WHOLE TREE! Lady, you\'re cutting down the whole tree!']],
    fall: '{name}\'s thorns go soft. She kneels and presses both hands flat on the moss, the way you feel a forehead for a fever, and sinks away into the roots.' },
  
  { boss: 'kingshade', region: 'obsidian-court', sec: 'court-throne', uv: [0, 85.0], after: 'boss_bramble',
    hint: 'Climb to Kingshade\'s throne in the Canopy of Kong',
    again: "Again. My guards tell me you have been training. Show me, then.",
    last: "Stand down. All of you. That is an order, small one, and you are not exempt.",
    meet: [['boss', 'My guards let you through. I will speak to them about that. "{creed}"'],
      ['boss', 'I carried them out of one flood, Bridge child. Never again. This time I take them all at once, and nobody is left on the terrace.'],
      ['kid', 'Did you even ASK them? Their tails are shaking, man! That\'s not \'cause of me! I\'m like four feet tall!']],
    fall: 'The violet light drains out of {name}\'s armour. He is still standing. He makes very sure of that.' },
  
  
  { boss: 'quartz', region: 'deep-seam', sec: 'seam-hollow', uv: [0, 87.4], after: 'boss_kingshade',
    hint: 'Find the Quartz Hermit at the bottom of the Deep Seam',
    again: "You again. With the little light. ...Sit, then, if we must do this twice.",
    last: "Leave one lamp. Just one. By the door. I will not look at it.",
    meet: [['boss', 'Put that out. Please. I asked nicely. I always ask nicely. "{creed}"'],
      ['boss', 'Nine years I sat up with a lamp, Bridge child, listening to the dark move. Then a voice in it told me there was nothing there. Nothing at all. Do you know how that felt?'],
      ['kid', 'So you turned off EVERYBODY\'S lights? Mrs. Alvarez in 4B is scared of the elevator. So she takes the stairs! She doesn\'t go and break it for the whole building!']],
    fall: '{name}\'s lenses go clear. He takes them off one at a time and blinks at the lanterns as if they were too loud.' },
  
  
  { boss: 'glacius', region: 'frost-summit', sec: 'summit-lair', uv: [0, 87.0], after: 'boss_quartz',
    hint: 'Climb to the summit of Frostspine and face Glacius Rex',
    again: "Back. Shh. You will wake them. ...You will not wake them. Nothing wakes them. That is the point.",
    last: "It is cold. It was always cold. I thought it would feel like keeping them.",
    meet: [['boss', 'Hush. Do not stamp. They are sleeping. They have slept since the spring, and they will sleep forever, and nothing will ever hurt them again. "{creed}"'],
      ['boss', 'I watched the thaw take my herd, Bridge child. Every spring, a few more into the mud. A voice in the wind said it need not happen. It said: hold still. So I held everything still.'],
      ['kid', 'They\'re not SLEEPING! There\'s a kid in there! Her aunt\'s making soup and everything! You can\'t just put people on pause \'cause you\'re scared they\'ll get old!']],
    fall: 'The frost runs off {name}\'s tusks like sweat. Behind him the ice blocks creak, and crack, and something small inside the nearest one sneezes.' },
];
export const MEET = 2.3; 
export const lairOf = (boss) => LAIRS.find((l) => l.boss === boss) || null;
export const lairOpen = (l, flags) => !!flags[l.after] && !flags['boss_' + l.boss];

export const nextLair = (flags) => LAIRS.find((l) => lairOpen(l, flags)) || null;
export const meetLines = (l, creed) => l.meet.map(([who, text]) => [who, text.replace('{creed}', creed)]);


export const lastWords = (l) => (l && l.last) || null;
export const fallLine = (l, name) => (l ? l.fall : 'The red fractures go dark, and {name} is gone before you can say a word.').replace('{name}', name);
