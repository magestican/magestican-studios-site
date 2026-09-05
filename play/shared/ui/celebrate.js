

























import { pieces, done, at, alive, CONFETTI_MS } from '../../../web-engine/words/confetti.js';















export function createCelebration({
  now, colours = {}, count = 64, motion = () => true,
} = {}) {
  let startedAt = -1;
  let list = [];

  const elapsed = () => (startedAt < 0 ? -1 : now() - startedAt);

  return {
    







    start() {
      
      
      
      
      
      if (!motion()) return;
      list = pieces(count, Math.round(now()) % 9973);
      startedAt = now();
    },

    stop() { startedAt = -1; list = []; },

    
    running() {
      const ms = elapsed();
      return ms >= 0 && !done(ms);
    },

    







    draw(g, width, height) {
      const ms = elapsed();
      if (ms < 0) return;
      if (done(ms)) { startedAt = -1; list = []; return; }
      g.save();
      for (const piece of list) {
        if (!alive(piece, ms)) continue;
        const p = at(piece, ms);
        g.globalAlpha = p.alpha;
        g.fillStyle = colours[piece.colour] ?? '#17150F';
        g.translate(p.x * width, p.y * height);
        g.rotate(p.angle);
        
        
        const w = piece.strip ? piece.size * 0.42 : piece.size;
        g.fillRect(-w / 2, -piece.size / 2, w, piece.size);
        g.rotate(-p.angle);
        g.translate(-p.x * width, -p.y * height);
      }
      g.restore();
    },

    
    ms: CONFETTI_MS,
  };
}
