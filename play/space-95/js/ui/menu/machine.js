









export const MOTION = {
  slide: { kind: 'slide', enterMs: 220, leaveMs: 160 },
  fade: { kind: 'fade', enterMs: 120, leaveMs: 120 },
};


export const CLOCKIN_MS = 3000;

const SHIFTS = 20;
export const ROOT = 'title';


export const UI_CUES = ['ui.move', 'ui.confirm', 'ui.back', 'ui.error', 'ui.clockIn', 'ui.stamp', 'ui.pause'];





const unlocked = ( cleared,  n) => n === 1 || cleared.includes(n - 1) || cleared.includes(n);

const nextShift = ( cleared) => {
  for (let n = 1; n <= SHIFTS; n++) if (!cleared.includes(n) && unlocked(cleared, n)) return n;
  return SHIFTS;
};

const OPTIONS = ['music', 'sfx', 'ambience', 'brightness', 'reduceMotion', 'controls'];


export const SLIDERS = ['music', 'sfx', 'ambience'];
const LEVEL_MAX = 10;

export const CYCLES =  ({
  brightness: [100, 130, 160],
});
export const DEFAULT_SETTINGS = Object.freeze({ music: 8, sfx: 8, ambience: 8, brightness: 100 });


function cleanSettings( raw = {}) {
  
  const out = { ...DEFAULT_SETTINGS };
  for (const k of SLIDERS) {
    const v = raw[k];
    if (Number.isInteger(v) && v >= 0 && v <= LEVEL_MAX) out[k] = v;
  }
  for (const [k, vals] of Object.entries(CYCLES)) if (vals.includes(raw[k])) out[k] = raw[k];
  return out;
}


const STARTS = new Set(['title', 'map', 'clockin', 'play']);






export const SCREENS = {
  boot: { items: () => [], back: null },
  title: {
    items: () => [
      { id: 'clockIn' },
      { id: 'explorer', to: 'profile' },
      { id: 'coop', to: 'lobby' },
      { id: 'prizes', to: 'prizes' },
      { id: 'options', to: 'options' },
      { id: 'credits', to: 'credits' },
    ],
    back: null,
  },
  profile: {
    items: () => [
      { id: 'variant', value: 'woman' },
      { id: 'variant', value: 'man' },
    ],
    back: 'prev',
    primary: (ctx, it) =>
      Math.max(
        0,
        it.findIndex((i) => i.value === ctx.variant),
      ),
  },
  map: {
    items: (ctx) => [
      ...Array.from({ length: SHIFTS }, (_, i) => ({ id: 'shift', shift: i + 1, locked: !unlocked(ctx.save.cleared, i + 1) })),
      { id: 'options', to: 'options' },
      { id: 'credits', to: 'credits' },
    ],
    back: 'title',
    primary: (ctx) => nextShift(ctx.save.cleared) - 1,
  },
  clockin: { items: () => [{ id: 'start' }], back: 'map' },
  play: { items: () => [], back: 'pause' },
  pause: {
    items: () => [
      { id: 'resume' },
      { id: 'options', to: 'options' },
      { id: 'explorer', to: 'profile' },
      { id: 'restartBeacon' },
      { id: 'restartShift', to: 'confirmRestart' },
      { id: 'map' },
    ],
    back: 'play',
  },
  confirmRestart: { items: () => [{ id: 'no' }, { id: 'yes' }], back: 'pause' },
  
  options: {
    items: (ctx) => [...OPTIONS.filter((id) => id !== 'brightness' || ctx.dark).map((id) => ({ id })), { id: 'done' }],
    back: 'prev',
  },
  timesheet: { items: (ctx) => [...(ctx.shift < SHIFTS ? [{ id: 'next' }] : []), { id: 'retry' }, { id: 'map' }], back: 'map' },
  lobby: { items: () => [{ id: 'host' }, { id: 'join' }], back: 'title' },
  credits: { items: () => [{ id: 'done' }], back: 'prev' },
  prizes: { items: () => [{ id: 'done' }], back: 'prev' },
  ending: { items: () => [{ id: 'credits', to: 'credits' }, { id: 'map' }], back: 'map' },
};


const OVERLAYS = new Set(['profile', 'options', 'credits', 'prizes']);







export function createMenu(opts = {}) {
  const cleared = [...(opts.save?.cleared ?? [])];
  const start = opts.start && STARTS.has(opts.start.screen) ? opts.start.screen : ROOT;
  const pick = opts.start?.shift;
  const shift = Number.isInteger(pick) && pick >= 1 && pick <= SHIFTS ? pick : nextShift(cleared);
  return {
    screen: 'boot',
    focus: -1,
    stack: [],
    ctx: {
      save: { cleared },
      shift,
      reduceMotion: !!opts.reduceMotion,
      variant: opts.variant ?? 'woman',
      clockMs: 0,
      settings: cleanSettings(opts.settings),
      start,
      dark: !!opts.dark,
    },
  };
}


const itemsOf = (s) => SCREENS[s.screen].items(s.ctx);


function enter(s, screen, out, ctx = {}) {
  const nctx = { ...s.ctx, ...ctx, save: { cleared: [...(ctx.save ?? s.ctx.save).cleared] }, clockMs: 0 };
  let stack = s.stack;
  if (OVERLAYS.has(screen) && !OVERLAYS.has(s.screen)) stack = [...stack, s.screen];
  else if (!OVERLAYS.has(screen)) stack = [];
  const def = SCREENS[screen];
  const it = def.items(nctx);
  const focus = it.length === 0 ? -1 : Math.min(it.length - 1, Math.max(0, def.primary ? def.primary(nctx, it) : 0));
  out.push({ transition: nctx.reduceMotion ? MOTION.fade : MOTION.slide, from: s.screen, to: screen });
  if (screen === 'clockin') out.push({ cue: 'ui.clockIn' });
  if (screen === 'timesheet') out.push({ cue: 'ui.stamp' });
  return { screen, focus, stack, ctx: nctx };
}


function goBack(s, out) {
  const def = SCREENS[s.screen];
  if (def.back === null) return s;
  let to = def.back;
  if (to === 'prev') to = s.stack[s.stack.length - 1] ?? ROOT;
  if (to === 'play') out.push({ go: 'resume' });
  if (s.screen === 'clockin') out.push({ go: 'quit' });
  out.push({ cue: to === 'play' || to === 'pause' ? 'ui.pause' : 'ui.back' });
  const n = enter(s, to, out);
  
  return OVERLAYS.has(s.screen) ? { ...n, stack: s.stack.slice(0, -1) } : n;
}


function choose(s, item, out) {
  out.push({ press: true });
  const ctx = s.ctx;
  switch (s.screen) {
    case 'title':
      if (item.id === 'clockIn') {
        out.push({ cue: 'ui.confirm' });
        
        return ctx.save.cleared.length === 0 ? enter(s, 'clockin', out, { shift: 1 }) : enter(s, 'map', out);
      }
      break;
    case 'map':
      if (item.id === 'shift') {
        if (item.locked) {
          out.push({ cue: 'ui.error' });
          return s;
        }
        out.push({ cue: 'ui.confirm' });
        return enter(s, 'clockin', out, { shift: item.shift });
      }
      break;
    case 'clockin':
      out.push({ cue: 'ui.confirm' }, { go: 'play', shift: ctx.shift });
      return enter(s, 'play', out);
    case 'pause':
      if (item.id === 'resume') {
        out.push({ cue: 'ui.pause' }, { go: 'resume' });
        return enter(s, 'play', out);
      }
      if (item.id === 'restartBeacon') {
        out.push({ cue: 'ui.confirm' }, { restart: 'beacon' });
        return enter(s, 'play', out);
      }
      if (item.id === 'map') {
        out.push({ cue: 'ui.back' }, { go: 'quit' });
        return enter(s, 'map', out);
      }
      break;
    case 'confirmRestart':
      if (item.id === 'yes') {
        out.push({ cue: 'ui.confirm' }, { restart: 'shift' });
        return enter(s, 'clockin', out);
      }
      out.push({ cue: 'ui.back' });
      return enter(s, 'pause', out);
    case 'profile':
      out.push({ cue: 'ui.confirm' }, { setting: 'variant', value: item.value });
      return finishOverlay(s, { variant: item.value ?? ctx.variant }, out);
    case 'options':
      if (item.id === 'done') return finishOverlay(s, {}, out, 'ui.back');
      if (item.id === 'reduceMotion') {
        out.push({ cue: 'ui.confirm' }, { setting: 'reduceMotion', value: !ctx.reduceMotion });
        return { ...s, ctx: { ...ctx, reduceMotion: !ctx.reduceMotion } };
      }
      if (CYCLES[item.id]) return adjust(s, item.id, 1, out);
      
      out.push({ cue: 'ui.move' });
      return s;
    case 'credits':
    case 'prizes':
      return finishOverlay(s, {}, out, 'ui.back');
    case 'timesheet':
      if (item.id === 'next') {
        out.push({ cue: 'ui.confirm' });
        return enter(s, 'clockin', out, { shift: ctx.shift + 1 });
      }
      if (item.id === 'retry') {
        out.push({ cue: 'ui.confirm' });
        return enter(s, 'clockin', out);
      }
      out.push({ cue: 'ui.back' });
      return enter(s, 'map', out);
    case 'lobby':
      out.push({ cue: 'ui.confirm' }, { coop: item.id });
      return s;
    case 'ending':
      if (item.id === 'map') {
        out.push({ cue: 'ui.back' });
        return enter(s, 'map', out);
      }
      break;
  }
  if (item.to) {
    out.push({ cue: 'ui.confirm' });
    return enter(s, item.to, out);
  }
  out.push({ cue: 'ui.error' });
  return s;
}


function adjust( s,  id,  d,  out) {
  const cur = s.ctx.settings[id];
  let value;
  if (SLIDERS.includes(id)) value = Math.max(0, Math.min(LEVEL_MAX, cur + d));
  else {
    const vals = CYCLES[id];
    value = vals[(vals.indexOf(cur) + d + vals.length) % vals.length];
  }
  out.push({ cue: value === cur ? 'ui.error' : 'ui.move' });
  if (value === cur) return s;
  out.push({ setting: id, value });
  return { ...s, ctx: { ...s.ctx, settings: { ...s.ctx.settings, [id]: value } } };
}


function finishOverlay( s,  ctx,  out, cue = 'ui.confirm') {
  if (cue !== 'ui.confirm') out.push({ cue });
  const to = s.stack[s.stack.length - 1] ?? ROOT;
  const n = enter({ ...s, ctx: { ...s.ctx, ...ctx } }, to, out);
  return { ...n, stack: s.stack.slice(0, -1) };
}








export function step(s, a) {
  
  const out = [];
  const it = itemsOf(s);
  switch (a.type) {
    case 'loaded':
      return { state: s.screen === 'boot' ? enter(s, s.ctx.start ?? ROOT, out) : s, out };
    case 'move': {
      if (it.length === 0) return { state: s, out };
      const d = a.dir === 'up' || a.dir === 'left' ? -1 : 1;
      const id = it[s.focus]?.id;
      const sideways = a.dir === 'left' || a.dir === 'right';
      if (s.screen === 'options' && sideways && id && (SLIDERS.includes(id) || CYCLES[id])) return { state: adjust(s, id, d, out), out };
      out.push({ cue: 'ui.move' });
      return { state: { ...s, focus: (s.focus + d + it.length) % it.length }, out };
    }
    case 'confirm':
      if (s.focus < 0 || !it[s.focus]) return { state: s, out };
      return { state: choose(s, it[s.focus], out), out };
    case 'tap': {
      const i = a.index ?? -1;
      if (!it[i]) return { state: s, out };
      return { state: choose({ ...s, focus: i }, it[i], out), out };
    }
    case 'back':
      return { state: goBack(s, out), out };
    case 'pause':
      if (s.screen === 'play' || s.screen === 'pause') return { state: goBack(s, out), out };
      return { state: s, out };
    case 'tick': {
      if (s.screen !== 'clockin') return { state: s, out };
      const clockMs = s.ctx.clockMs + (a.ms ?? 0);
      if (clockMs < CLOCKIN_MS) return { state: { ...s, ctx: { ...s.ctx, clockMs } }, out };
      out.push({ go: 'play', shift: s.ctx.shift });
      return { state: enter(s, 'play', out), out };
    }
    case 'event':
      if (a.name === 'shiftClear' && s.screen === 'play') {
        const cleared = s.ctx.save.cleared.includes(s.ctx.shift) ? s.ctx.save.cleared : [...s.ctx.save.cleared, s.ctx.shift];
        return { state: enter(s, 'timesheet', out, { save: { cleared } }), out };
      }
      if (a.name === 'ending' && (s.screen === 'play' || s.screen === 'timesheet')) return { state: enter(s, 'ending', out), out };
      return { state: s, out };
  }
  return { state: s, out };
}
