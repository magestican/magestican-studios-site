





import { intelPercent } from '../../sim/intel.js';
import { CLOCKIN_MS, CYCLES, SCREENS, SLIDERS } from './machine.js';

const SHIFTS = 20;
const PER_SHIFT = 3; 

const COPY = {
  brand: 'Space 95 Survey Co.',
  title: {
    kicker: 'Space 95 Survey Co. presents',
    heading: 'SPACE 95',
    lede: 'Two friends. One 9-to-5 job. A planet called Galaxa Z where everything is gigantic.',
    clockIn: 'Clock in',
    explorer: 'Explorer',
    coop: 'Play with a friend',
    prizes: 'Prizes',
    options: 'Options',
    credits: 'Credits',
    nextGoal: 'Next goal',
  },
  prizes: { kicker: 'Staff awards', heading: 'Prizes', done: 'Done', yours: 'Yours.' },
  profile: { kicker: 'Staff pass', heading: 'Choose your explorer', lede: 'Same job, same jump. Change it any time.' },
  map: { kicker: 'Survey map', heading: 'Galaxa Z', lede: (pct) => `Intel filed: ${pct.toFixed(1)} %` },
  clockin: { kicker: 'Time card', heading: (n) => `Shift ${n}`, start: 'Punch in', intel: 'Intel filed', par: 'Par time' },
  play: { kicker: '', heading: '' },
  pause: {
    kicker: 'Break room',
    heading: 'Paused',
    resume: 'Back to work',
    restartBeacon: 'Restart from beacon',
    restartShift: 'Restart shift',
    map: 'Survey map',
  },
  confirmRestart: { kicker: 'Break room', heading: 'Restart the shift?', no: 'No, keep going', yes: 'Yes, start over' },
  options: {
    kicker: 'Settings',
    heading: 'Options',
    music: 'Music',
    sfx: 'Sound effects',
    ambience: 'World sounds',
    reduceMotion: 'Reduce motion',
    brightness: 'Night brightness',
    controls: 'Controls',
    done: 'Done',
    values: { on: 'On', off: 'Off' },
  },
  timesheet: {
    kicker: 'Timesheet',
    heading: (n) => `Shift ${n} done`,
    next: 'Next shift',
    retry: 'Clock in again',
    map: 'Survey map',
    time: 'Time on shift',
    par: 'Par',
    intel: 'Intel filed',
    stampPar: 'Under par',
    stampOk: 'Approved',
  },
  lobby: {
    kicker: 'Co-op',
    heading: 'Play with a friend',
    lede: 'You are Jo. Your friend plays Bolt on their own screen.',
    host: 'Host this shift',
    join: 'Join with a code',
  },
  credits: { kicker: 'Staff list', heading: 'Credits', done: 'Done' },
  ending: { kicker: 'Head office', heading: 'Performance review', credits: 'Credits', map: 'Survey map' },
  explorer: { woman: 'Jo (woman)', man: 'Jo (man)' },
};


const CONTROLS = [
  { label: 'Run', value: 'Arrows / A D / stick' },
  { label: 'Jump (hold = higher)', value: 'Space / pad A' },
  { label: 'Fast fall', value: 'Down' },
  { label: 'Dash', value: 'Shift' },
  { label: 'Hook', value: 'K' },
  { label: 'Retry from beacon', value: 'R' },
  { label: 'Sound on / off', value: 'M' },
  { label: 'Pause', value: 'Esc / pad Start' },
];

const CREDITS = [
  { label: 'Game', value: 'Magestican Games' },
  { label: 'Design', value: 'Magestican Game Designer' },
  { label: 'Art', value: 'Magestican Artist' },
  { label: 'Animation', value: 'Magestican Animator' },
  { label: 'Music', value: 'Magestican Records' },
  { label: 'Type', value: 'Lilita One and Fredoka (SIL Open Font License)' },
];


export const clearedIds = ( save) => save.cleared.flatMap((c, i) => (c ? [i + 1] : []));


export function startFromUrl( search,  levelId) {
  const m = new URLSearchParams(search).get('menu');
  return { screen: m === 'clockin' || m === 'map' ? m : 'title', shift: levelId };
}


export function pageFor( state,  levelId) {
  if (state.screen === 'clockin' && state.ctx.shift !== levelId) return `?level=${state.ctx.shift}&menu=clockin`;
  return null;
}





const intelOf = (save, n) => save.secrets.slice((n - 1) * PER_SHIFT, n * PER_SHIFT).filter(Boolean).length;
const medalOf = (save, pars, n) => save.bestTimes[n - 1] !== null && pars[n - 1] && save.bestTimes[n - 1] <= pars[n - 1];


function label(screen, item, ctx, d) {
  const o = COPY.options;
  switch (screen) {
    case 'title':
      return item.id === 'explorer'
        ? { label: `${COPY.title.explorer}: ${COPY.explorer[ctx.variant] ?? COPY.explorer.woman}`.slice(0, 24) }
        : { label: COPY.title[item.id] };
    case 'profile':
      return { label: COPY.explorer[item.value], checked: item.value === ctx.variant, kind: 'pick' };
    case 'map':
      if (item.id === 'shift') {
        const n = item.shift;
        const cleared = !!d.save.cleared[n - 1];
        const state = item.locked ? 'locked' : cleared ? 'cleared' : n === nextOpen(d.save) ? 'next' : 'open';
        return {
          label: d.names[n] ?? `Shift ${n}`,
          kind: 'node',
          n,
          state,
          intel: intelOf(d.save, n),
          medal: !!medalOf(d.save, d.pars, n),
          locked: !!item.locked,
        };
      }
      return { label: COPY.title[item.id] };
    case 'clockin':
      return { label: COPY.clockin.start };
    case 'pause':
      return {
        label:
          item.id === 'explorer'
            ? `${COPY.title.explorer}: ${COPY.explorer[ctx.variant]}`.slice(0, 24)
            : item.id === 'options'
              ? COPY.title.options
              : COPY.pause[item.id],
      };
    case 'confirmRestart':
      return { label: COPY.confirmRestart[item.id] };
    case 'options': {
      const v = ctx.settings[item.id];
      if (SLIDERS.includes(item.id)) return { label: o[item.id], kind: 'slider', value: v, max: 10, detail: `${v} / 10` };
      if (item.id === 'reduceMotion')
        return { label: o.reduceMotion, kind: 'toggle', detail: ctx.reduceMotion ? o.values.on : o.values.off };
      if (CYCLES[item.id]) return { label: o[item.id], kind: 'cycle', detail: item.id === 'brightness' ? `${v} %` : o.values[v] };
      return { label: o[item.id] };
    }
    case 'timesheet':
      return { label: COPY.timesheet[item.id] };
    case 'lobby':
      return { label: COPY.lobby[item.id] };
    case 'credits':
      return { label: COPY.credits.done };
    case 'prizes':
      return { label: COPY.prizes.done };
    case 'ending':
      return { label: COPY.ending[item.id] };
  }
  return { label: item.id };
}


function nextOpen(save) {
  for (let n = 1; n <= SHIFTS; n++) if (!save.cleared[n - 1] && (n === 1 || save.cleared[n - 2])) return n;
  return 0;
}








export function viewOf(state, d) {
  const { screen, ctx } = state;
  const def = SCREENS[screen];
  const items = def.items(ctx).map((item, i) => ({ id: item.id, ...label(screen, item, ctx, d), focused: i === state.focus }));
  const c =  (COPY)[screen] ?? {};
  
  const v = { screen, kicker: c.kicker ?? COPY.brand, heading: typeof c.heading === 'function' ? '' : (c.heading ?? ''), items };
  if (c.lede && typeof c.lede === 'string') v.lede = c.lede;
  switch (screen) {
    case 'title': {
      const won = (d.prizes ?? []).filter((p) => p.got).length;
      if (d.goal?.text) v.rows = [{ label: COPY.title.nextGoal, value: d.goal.text }];
      const p = items.find((i) => i.id === 'prizes');
      if (p && d.prizes?.length) p.detail = `${won} of ${d.prizes.length}`;
      break;
    }
    case 'map':
      v.lede = COPY.map.lede(intelPercent(d.save));
      break;
    case 'clockin': {
      const n = ctx.shift;
      v.heading = COPY.clockin.heading(n);
      v.sub = d.names[n] ?? '';
      v.rows = [
        { label: COPY.clockin.intel, value: `${intelOf(d.save, n)} of ${PER_SHIFT}` },
        { label: COPY.clockin.par, value: d.pars[n - 1] ? `${Math.round(d.pars[n - 1])} s` : '-' },
      ];
      v.countdown = Math.max(0, Math.ceil((CLOCKIN_MS - ctx.clockMs) / 1000));
      break;
    }
    case 'options': {
      const f = items[state.focus];
      if (f?.id === 'controls') v.panel = { heading: COPY.options.controls, rows: CONTROLS };
      break;
    }
    case 'timesheet': {
      v.heading = COPY.timesheet.heading(ctx.shift);
      v.sub = d.names[ctx.shift] ?? '';
      const r = d.result;
      if (r) {
        const t = COPY.timesheet;
        v.rows = [
          { label: t.time, value: `${r.time.toFixed(1)} s` },
          ...(r.par ? [{ label: t.par, value: `${Math.round(r.par)} s` }] : []),
          { label: t.intel, value: `${r.found} of ${r.total}` },
        ];
        v.stamp = r.par && r.time <= r.par ? t.stampPar : t.stampOk;
      }
      break;
    }
    case 'prizes':
      v.rows = (d.prizes ?? []).map((p) => ({ label: p.name, value: p.got ? COPY.prizes.yours : p.desc }));
      break;
    case 'credits':
      v.rows = CREDITS;
      break;
  }
  return v;
}
