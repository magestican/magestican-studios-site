
const IN_VIEW = 12;







export function restartPosts(level) {
  const standing = [...level.checkpoints];
  const posts = [];
  for (const e of level.entities ?? []) {
    for (const { spawn } of e.phases ?? []) {
      if (!spawn || standing.some((c) => Math.hypot(c.x - spawn.x, c.y - spawn.y) < IN_VIEW)) continue;
      standing.push(spawn);
      posts.push({ x: spawn.x, y: spawn.y });
    }
  }
  return posts;
}
