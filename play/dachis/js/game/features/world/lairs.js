












export const LAIRS = [
  { boss: 'ashlo', sec: 'coast', uv: [13, 78], after: 'kumabo', 
    hint: 'Something burns on Tomo Coast... face Cinderwarden Ashlo',
    meet: [['boss', 'So the Bridge child walks the ash. Listen, little one: "{creed}"'],
      ['boss', 'The god opens the way to the promised land. You will not close it.'],
      ['kid', 'Nobody is burning this island. Not while we are here!']],
    fall: 'The red fractures dim... {name} sinks into the ash and is gone. For now.' },
  
  { boss: 'leviathrum', sec: 'coral', uv: [19.4, 95.4], after: 'boss_ashlo',
    hint: 'The tide pulls below Tomo Coast... face Leviathrum in Coral Deep', 

    meet: [['boss', 'Down here the light gives out, Bridge child, and so does every promise. Listen: "{creed}"'],
      ['boss', 'This city sank waiting for someone to save it. Nobody came. The god will carry us where no tide can follow.'],
      ['kid', 'Then I\'m the somebody. Surface, you big tin whale!']],
    fall: 'Its sonar fades to a whisper... {name} sinks into the deep and is gone. For now.' },
];
export const MEET = 2.3; 
export const lairOf = (boss) => LAIRS.find((l) => l.boss === boss) || null;
export const lairOpen = (l, flags) => !!flags[l.after] && !flags['boss_' + l.boss];

export const nextLair = (flags) => LAIRS.find((l) => lairOpen(l, flags)) || null;
export const meetLines = (l, creed) => l.meet.map(([who, text]) => [who, text.replace('{creed}', creed)]);

export const fallLine = (l, name) => (l ? l.fall : 'The red fractures dim... {name} is gone. For now.').replace('{name}', name);
