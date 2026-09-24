
























import { PART_CLIP_KINDS } from '../mesh/meshData.mjs';

export const PART_CLIPS = PART_CLIP_KINDS;
export const REST = Object.freeze({ angle: 0, scale: 1 });
const TAU = Math.PI * 2;

export function stepPart(clip, prev = REST, ctx = {}) {
  if (!clip) return prev;
  const t = ctx.t || 0, dt = Math.max(0, ctx.dt || 0);
  const wind = ctx.wind === undefined ? 1 : Math.max(0, ctx.wind);
  switch (clip.kind) {
    case 'spin': {
      const a = prev.angle + clip.rate * (clip.wind ? wind : 1) * dt;
      return { angle: a - TAU * Math.floor(a / TAU), scale: 1 };
    }
    case 'swing': {
      const since = ctx.since === undefined ? Infinity : ctx.since;
      const rung = since >= 0 && Number.isFinite(since) ? clip.amp * Math.exp(-since / clip.decay) : 0;
      return { angle: (rung + (clip.idle || 0) * wind) * Math.sin((TAU * t) / clip.period), scale: 1 };
    }
    case 'hinge': {
      const target = Math.min(1, Math.max(0, ctx.open || 0)) * clip.max;
      const d = target - prev.angle, step = clip.speed * dt;
      return { angle: Math.abs(d) <= step ? target : prev.angle + Math.sign(d) * step, scale: 1 };
    }
    case 'flicker': {
      const w = TAU * clip.rate * t + (clip.phase || 0);
      return { angle: 0, scale: 1 + clip.amp * (0.6 * Math.sin(w) + 0.4 * Math.sin(2.37 * w + 1.3)) };
    }
    default:
      throw new Error(`unknown part clip '${clip.kind}'`);
  }
}


export function clipProblems(clip) {
  if (!clip) return [];
  if (!PART_CLIPS.includes(clip.kind)) return [`unknown part clip '${clip.kind}'`];
  const need = { spin: ['rate'], swing: ['amp', 'period', 'decay'], hinge: ['max', 'speed'], flicker: ['amp', 'rate'] }[clip.kind];
  const out = [];
  for (const k of need) if (!Number.isFinite(clip[k])) out.push(`${clip.kind}: '${k}' is not a number`);
  for (const k of ['period', 'decay', 'speed']) if (k in clip && !(clip[k] > 0)) out.push(`${clip.kind}: '${k}' must be > 0`);
  if (clip.kind === 'flicker' && !(clip.amp >= 0 && clip.amp < 1)) out.push('flicker: amp must be in [0, 1)');
  return out;
}
