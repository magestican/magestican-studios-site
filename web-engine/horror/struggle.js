
























































































export const MASH_GAIN = 0.14;
export const MASH_REPEAT_GAIN = 0.03;
export const MASH_DECAY = 0.55;







export const TAP_TOKENS = Object.freeze(['tap', 'pointer']);









export const MASH_REPEAT_RUN = 3;



export const CIRCLE_TURNS = 3;
export const CIRCLE_TARGET = CIRCLE_TURNS * 2 * Math.PI;   
export const CIRCLE_DECAY = 0.8;                            



export const CIRCLE_DEAD_ZONE = 0.18;


export const CIRCLE_KEY_STEP = Math.PI / 2;



const DIAMOND = Object.freeze(['W', 'D', 'S', 'A']);






export const CROSS_BOX_DIAGONAL = 2 * Math.SQRT2;
export const CROSS_MIN_FRACTION = 0.55;
export const CROSS_MIN_LENGTH = CROSS_BOX_DIAGONAL * CROSS_MIN_FRACTION;
export const CROSS_TOLERANCE_RAD = (28 * Math.PI) / 180;
export const CROSS_WINDOW = 1.6;



const CROSS_STROKES = Object.freeze([
  { id: 'ul-lr', angle: Math.atan2(-1, 1) },   
  { id: 'ur-ll', angle: Math.atan2(-1, -1) },  
]);


const CROSS_KEY_PAIRS = Object.freeze({ 'Q>C': 'ul-lr', 'E>Z': 'ur-ll' });















export const HOLD_SECONDS = 1.4;
export const MODES = Object.freeze(['full', 'reduced', 'hold']);

function scaleFor(mode) {
  return mode === 'reduced' ? 0.5 : 1;
}


function wrapAngle(a) {
  let x = a;
  while (x <= -Math.PI) x += 2 * Math.PI;
  while (x > Math.PI) x -= 2 * Math.PI;
  return x;
}



export function createStruggle(opts = {}) {
  const verb = opts.verb;
  if (!['mash', 'circle', 'cross'].includes(verb)) throw new Error(`unknown verb: ${verb}`);
  const mode = MODES.includes(opts.mode) ? opts.mode : 'full';
  const k = scaleFor(mode);

  return {
    verb,
    mode,
    
    progress: 0,
    done: false,
    
    
    outcome: null,

    
    _mashRaw: 0,
    _lastToken: null,
    _repeatRun: 0,

    
    _angle: 0,          
    _lastVec: null,     
    _lastDiamond: null,

    
    _strokes: new Set(),
    _firstStrokeAt: null,
    _elapsed: 0,
    _dragFrom: null,
    _dragTo: null,
    _lastCrossKey: null,

    
    _held: 0,
    _holding: false,

    get target() {
      if (verb === 'circle') return CIRCLE_TARGET * k;
      if (verb === 'cross') return mode === 'reduced' ? 1 : 2;
      return 1 * k;
    },

    _recompute() {
      if (mode === 'hold') {
        this.progress = Math.min(1, this._held / HOLD_SECONDS);
      } else if (verb === 'mash') {
        this.progress = Math.min(1, this._mashRaw / this.target);
      } else if (verb === 'circle') {
        this.progress = Math.min(1, Math.abs(this._angle) / this.target);
      } else {
        this.progress = Math.min(1, this._strokes.size / this.target);
      }
      if (this.progress >= 1 && !this.done) {
        this.done = true;
        this.outcome = 'escaped';
      }
      return this.progress;
    },

    
    
    update(dt) {
      const step = Math.max(0, dt);
      this._elapsed += step;

      if (mode === 'hold') {
        
        
        
        
        if (this._holding) this._held += step;
        else this._held = 0;
        return this._recompute();
      }

      if (verb === 'mash') {
        this._mashRaw = Math.max(0, this._mashRaw - MASH_DECAY * k * step);
      } else if (verb === 'circle') {
        const decay = CIRCLE_DECAY * k * step;
        const mag = Math.max(0, Math.abs(this._angle) - decay);
        this._angle = Math.sign(this._angle) * mag;
      } else if (this._firstStrokeAt !== null && this._strokes.size === 1) {
        
        
        
        if (this._elapsed - this._firstStrokeAt > CROSS_WINDOW) {
          this._strokes.clear();
          this._firstStrokeAt = null;
        }
      }
      return this._recompute();
    },

    
    
    
    
    
    press(token) {
      if (this.done) return this.progress;
      if (mode === 'hold') { this._holding = true; return this.progress; }

      if (verb === 'mash') {
        const repeated = token === this._lastToken && !TAP_TOKENS.includes(token);
        if (repeated) {
          
          
          
          
          
          
          
          this._repeatRun += 1;
          if (this._repeatRun <= MASH_REPEAT_RUN) this._mashRaw += MASH_REPEAT_GAIN;
        } else {
          this._repeatRun = 0;
          this._mashRaw += MASH_GAIN;
        }
        
        
        
        
        
        
        
        
        this._lastToken = token;
        return this._recompute();
      }

      if (verb === 'circle') {
        const i = DIAMOND.indexOf(token);
        if (i < 0) return this.progress;
        if (this._lastDiamond === null) { this._lastDiamond = token; return this.progress; }
        const j = DIAMOND.indexOf(this._lastDiamond);
        
        
        
        
        
        const step = (i - j + 4) % 4;
        if (step === 1) this._addAngle(-CIRCLE_KEY_STEP);        
        else if (step === 3) this._addAngle(CIRCLE_KEY_STEP);
        this._lastDiamond = token;
        return this._recompute();
      }

      
      const pair = this._lastCrossKey ? `${this._lastCrossKey}>${token}` : null;
      const strokeId = pair ? CROSS_KEY_PAIRS[pair] : undefined;
      if (strokeId) {
        this._lastCrossKey = null;
        return this._bankStroke(strokeId);
      }
      this._lastCrossKey = token;
      return this.progress;
    },

    
    
    hold(down) {
      this._holding = !!down;
      if (!down && mode !== 'hold') this.release();
      return this.progress;
    },

    
    
    
    
    point(x, y) {
      if (this.done) return this.progress;
      if (mode === 'hold') { this._holding = true; return this.progress; }

      if (verb === 'circle') {
        const r = Math.hypot(x, y);
        
        
        
        
        if (r < CIRCLE_DEAD_ZONE) { this._lastVec = null; return this.progress; }
        if (this._lastVec) {
          const d = wrapAngle(Math.atan2(y, x) - Math.atan2(this._lastVec.y, this._lastVec.x));
          this._addAngle(d);
        }
        this._lastVec = { x, y };
        return this._recompute();
      }

      if (verb === 'cross') {
        if (!this._dragFrom) this._dragFrom = { x, y };
        this._dragTo = { x, y };
        return this.progress;
      }

      return this.progress;
    },

    
    
    release() {
      this._holding = false;
      if (verb === 'circle') { this._lastVec = null; return this.progress; }
      if (verb !== 'cross') return this.progress;
      const from = this._dragFrom; const to = this._dragTo;
      this._dragFrom = null; this._dragTo = null;
      if (!from || !to) return this.progress;

      const dx = to.x - from.x; const dy = to.y - from.y;
      const len = Math.hypot(dx, dy);
      
      
      
      if (len < CROSS_MIN_LENGTH * scaleFor(mode)) return this.progress;
      const angle = Math.atan2(dy, dx);
      for (const s of CROSS_STROKES) {
        if (Math.abs(wrapAngle(angle - s.angle)) <= CROSS_TOLERANCE_RAD) return this._bankStroke(s.id);
      }
      return this.progress;
    },

    _addAngle(delta) {
      if (!delta) return;
      
      
      
      if (this._angle !== 0 && Math.sign(delta) !== Math.sign(this._angle)) this._angle *= 0.5;
      this._angle += delta;
    },

    _bankStroke(id) {
      
      
      
      const wasEmpty = this._strokes.size === 0;
      this._strokes.add(id);
      if (wasEmpty && this._strokes.size === 1) this._firstStrokeAt = this._elapsed;
      return this._recompute();
    },

    
    
    
    
    
    
    
    
    breakOut(reason = 'prod') {
      if (this.done) return this.progress;
      this.progress = 1;
      this.done = true;
      this.outcome = reason;
      return this.progress;
    },
  };
}





export const VERB_FOR = Object.freeze({
  chicken: 'mash',
  porker: 'cross',
  cow: 'circle',
});










export function promptFor(verb, lastInput = 'touch') {
  const key = lastInput === 'key';
  if (verb === 'mash') return { icon: 'mash', text: key ? 'ALTERNATE A / D' : 'TAP' };
  if (verb === 'circle') return { icon: 'dial', text: key ? 'W - D - S - A' : 'CIRCLE, ONE WAY' };
  return { icon: 'cross', text: key ? 'Q - C  then  E - Z' : 'SLASH TWICE, CROSSWISE' };
}
