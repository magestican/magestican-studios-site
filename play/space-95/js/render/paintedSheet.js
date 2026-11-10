





export const POSE_OF_CLIP = {
  idle: ['idle'],
  climb_idle: ['idle'],
  climb_up: ['jump'],
  climb_down: ['fall'],
  ride: ['idle'],
  land_soft: ['idle'],
  land_hard: ['idle'],
  pound_land: ['idle'],
  run_stop: ['idle'],
  ledge_mantle: ['jump'],
  run: ['run1', 'run2'],
  run_start: ['run1', 'run2'],
  land_run: ['run1', 'run2'],
  turn_skid: ['run2'],
  dash_start: ['run1'],
  dash: ['run1'],
  dash_end: ['run2'],
  kick_passive: ['run1', 'run2'],
  jump_takeoff: ['jump'],
  rise: ['jump'],
  apex: ['jump'],
  double_jump_flip: ['jump'],
  wall_jump: ['jump'],
  climb_jump_off: ['jump'],
  dew_bounce: ['jump'],
  fall: ['fall'],
  glide: ['fall'],
  wall_slide: ['fall'],
  pound_start: ['fall'],
  pound_fall: ['fall'],
  hurt: ['hurt'],
  bonk: ['hurt'],
  punted: ['hurt'],
};

export const PAINTED_POSES = ['idle', 'run1', 'run2', 'jump', 'fall', 'hurt'];


const FILL = 0.92;






export function paintedSheet(live, painted, atlas = 'sheet.png') {
  const [cw, ch] = painted.cell;
  const byName = new Map(painted.frames.map((f) => [f.name, f]));
  for (const p of PAINTED_POSES) if (!byName.has(p)) throw new Error(`painted sheet has no ${p} pose`);
  
  const idle = live.clips.idle.frames[0];
  const height = idle.h / live.px_per_u;
  const base = ch - Math.max(1, Math.round((ch * (1 - FILL)) / 2));
  const clips = {};
  for (const [name, c] of Object.entries(live.clips)) {
    const poses = POSE_OF_CLIP[name] ?? ['idle'];
    const n = c.frames.length;
    clips[name] = {
      ...c,
      frames: c.frames.map((f, i) => {
        const pose = byName.get(poses[Math.min(poses.length - 1, Math.floor((i * poses.length) / n))]);
        return { ...f, atlas: 0, x: pose.x, y: pose.y, w: pose.w, h: pose.h, ox: 0, oy: 0, pose: pose.name };
      }),
    };
  }
  return {
    ...live,
    version: `${live.version ?? ''}+painted`,
    cell: [cw, ch],
    pivot: [cw / 2, base],
    px_per_u: (ch * FILL) / height,
    atlases: [atlas],
    clips,
  };
}
