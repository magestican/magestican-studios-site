













export const LAIRS = [
  { boss: 'ashlo', sec: 'coast', uv: [13, 78], after: 'kumabo', 
    hint: 'Something burns on Tomo Coast... face Cinderwarden Ashlo',
    meet: [['boss', 'Forty winters I kept that village warm. Not one of them came down to ask if I was cold. "{creed}"'],
      ['boss', 'I hid the bell\'s clapper so nobody could ring it. I know how that sounds. There is a promised land, Bridge child, and I am going.'],
      ['kid', 'You hid a BELL? You can\'t just - people NEED that bell! What if there\'s a fire?']],
    fall: 'The red goes out of {name}\'s ribs. He looks up at the village on the mountain for a long moment, then limps away into the ash.' },
  
  { boss: 'leviathrum', sec: 'coral', uv: [19.4, 95.4], after: 'boss_ashlo',
    hint: 'The tide pulls below Tomo Coast... face Leviathrum in Coral Deep', 

    meet: [['boss', 'I swept these streets every morning for a hundred years, Bridge child. For them. "{creed}"'],
      ['boss', 'They are not coming back. Someone told me so, and I knew it was true the moment I heard it. So I will go to them.'],
      ['kid', 'Who told you? WHO told you that? ...Fine. Come on, you big tin whale!']],
    fall: '{name}\'s sonar stops. In the quiet you can hear him counting the streets under his breath. Then he sinks away into the deep.' },
  
  { boss: 'bramble', sec: 'verdant', uv: [-19.6, 66.6], after: 'boss_leviathrum',
    hint: 'Face Mother Bramble in the Verdant Wilds', 
    meet: [['boss', 'Mind the beds. You are standing on my violets. ...No. It does not matter now. "{creed}"'],
      ['boss', 'I am only pruning, Bridge child. You cut back the old wood so the new can come. It was explained to me. It made such sense.'],
      ['kid', 'That is not pruning! That is the WHOLE TREE! Lady, you are cutting down the whole tree!']],
    fall: '{name}\'s thorns go soft. She kneels and presses both hands flat on the moss, the way you feel a forehead for a fever, and sinks away into the roots.' },
  
  { boss: 'kingshade', region: 'obsidian-court', sec: 'court-throne', uv: [0, 85.0], after: 'boss_bramble',
    hint: 'Climb to Kingshade\'s throne in the Canopy of Kong',
    meet: [['boss', 'My guards let you through. I will speak to them about that. "{creed}"'],
      ['boss', 'I carried them out of one flood, Bridge child. Never again. This time I take them all at once, and nobody is left on the terrace.'],
      ['kid', 'Did you even ASK them? Their tails are shaking, man! That is not me! I am like four feet tall!']],
    fall: 'The violet light drains out of {name}\'s armour. He is still standing. He makes very sure of that.' },
];
export const MEET = 2.3; 
export const lairOf = (boss) => LAIRS.find((l) => l.boss === boss) || null;
export const lairOpen = (l, flags) => !!flags[l.after] && !flags['boss_' + l.boss];

export const nextLair = (flags) => LAIRS.find((l) => lairOpen(l, flags)) || null;
export const meetLines = (l, creed) => l.meet.map(([who, text]) => [who, text.replace('{creed}', creed)]);

export const fallLine = (l, name) => (l ? l.fall : 'The red fractures go dark, and {name} is gone before you can say a word.').replace('{name}', name);
