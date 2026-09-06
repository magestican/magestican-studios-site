


































import { COLORS, SIZES } from '../../../web-engine/words/style.js';
import * as paint from './paint.js';


export const CHEER_MS = 2200;

const LETTER_MS = 520;
const STAGGER_MS = 95;
const WORD = 'SPANGRAM';

const RAMP = ['green', 'gold', 'red', 'blue'];
const SPARKS_PER_LETTER = 7;


function hashed(n) {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const easeOut = (t) => 1 - (1 - t) ** 3;






export function createSpangramCheer({ now, motion = () => true } = {}) {
  let startedAt = -1;

  return {
    start() { startedAt = now(); },
    
    running() { return startedAt >= 0 && (now() - startedAt) < CHEER_MS; },
    
    stop() { startedAt = -1; },

    draw(g, width, height) {
      if (startedAt < 0) return;
      const age = now() - startedAt;
      if (age >= CHEER_MS) return;

      
      const fade = age > CHEER_MS * 0.8
        ? 1 - (age - CHEER_MS * 0.8) / (CHEER_MS * 0.2)
        : 1;

      
      
      
      
      
      
      
      const TRIAL = 64;
      g.save();
      g.font = paint.font(TRIAL, 800);
      const trialWidths = [...WORD].map((ch) => g.measureText(ch).width);
      const trialTotal = trialWidths.reduce((a, b) => a + b, 0) + TRIAL * 0.1 * (WORD.length - 1);
      const size = Math.max(SIZES.min, Math.min(TRIAL, (TRIAL * width * 0.84) / trialTotal));

      g.globalAlpha = fade;
      g.font = paint.font(size, 800);
      const widths = [...WORD].map((ch) => g.measureText(ch).width);
      const spacing = size * 0.1;
      const total = widths.reduce((a, b) => a + b, 0) + spacing * (WORD.length - 1);
      const cy = height * 0.42;
      let x = (width - total) / 2;

      
      
      
      
      
      
      
      
      
      

      
      
      
      const moving = motion();

      [...WORD].forEach((ch, i) => {
        const t = moving
          ? Math.max(0, Math.min(1, (age - i * STAGGER_MS) / LETTER_MS))
          : 1;
        if (t <= 0) { x += widths[i] + spacing; return; }
        const e = easeOut(t);
        
        
        
        
        const rise = moving ? (1 - e) * size * 1.1 : 0;
        const scale = moving ? 0.6 + 0.4 * e + Math.sin(e * Math.PI) * 0.12 : 1;
        const cxLetter = x + widths[i] / 2;

        if (moving) {
          
          
          
          for (let s = 0; s < SPARKS_PER_LETTER; s += 1) {
            const seed = i * 31 + s;
            const life = Math.max(0, Math.min(1, (t - 0.25 + hashed(seed) * 0.2) / 0.7));
            if (life <= 0 || life >= 1) continue;
            const angle = hashed(seed + 101) * Math.PI * 2;
            const reach = size * (0.55 + hashed(seed + 202) * 0.85) * easeOut(life);
            const sparkSize = Math.max(2, size * 0.09 * (1 - life));
            paint.sparkle(g, {
              x: cxLetter + Math.cos(angle) * reach,
              y: cy + rise + Math.sin(angle) * reach,
              size: sparkSize,
              colour: COLORS[RAMP[(seed + 1) % RAMP.length]],
              alpha: fade * (1 - life),
            });
          }
        }

        paint.cheerLetter(g, ch, {
          x: cxLetter, y: cy + rise, size, scale,
          colour: COLORS[RAMP[i % RAMP.length]], alpha: fade,
        });

        x += widths[i] + spacing;
      });
      g.restore();
    },
  };
}
