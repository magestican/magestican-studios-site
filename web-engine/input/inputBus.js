


const DEFAULT_BINDINGS = {
  moveForward: ['KeyW', 'ArrowUp'],
  moveBack:    ['KeyS', 'ArrowDown'],
  moveLeft:    ['KeyA', 'ArrowLeft'],
  moveRight:   ['KeyD', 'ArrowRight'],
  jump:        ['Space'],
  fire:        ['Mouse0'],
  weapon1:     ['Digit1'],
  weapon2:     ['Digit2'],
  weapon3:     ['Digit3'],
  reload:      ['KeyR'],
  interact:    ['KeyE'],
  scoreboard:  ['Tab'],
  cancel:      ['Escape'],
  
  
  
  
  
  
  
  observerDown:  ['KeyC', 'ControlLeft', 'ShiftRight'],
  observerBoost: ['ShiftLeft'],
  observerCrawl: ['AltLeft', 'AltRight'],
};

export class InputBus {
  constructor(target = window) {
    this.target = target;
    this.bindings = { ...DEFAULT_BINDINGS };
    this.pressed = new Set();
    this._pressedThisFrame = new Set();
    this._releasedThisFrame = new Set();

    this._onKeyDown = (e) => {
      if (this.pressed.has(e.code)) return;
      this.pressed.add(e.code);
      this._pressedThisFrame.add(e.code);
    };
    this._onKeyUp = (e) => {
      this.pressed.delete(e.code);
      this._releasedThisFrame.add(e.code);
    };
    this._onMouseDown = (e) => {
      const code = `Mouse${e.button}`;
      if (this.pressed.has(code)) return;
      this.pressed.add(code);
      this._pressedThisFrame.add(code);
    };
    this._onMouseUp = (e) => {
      const code = `Mouse${e.button}`;
      this.pressed.delete(code);
      this._releasedThisFrame.add(code);
    };

    target.addEventListener('keydown', this._onKeyDown);
    target.addEventListener('keyup',   this._onKeyUp);
    target.addEventListener('mousedown', this._onMouseDown);
    target.addEventListener('mouseup',   this._onMouseUp);
  }

  detach() {
    this.target.removeEventListener('keydown', this._onKeyDown);
    this.target.removeEventListener('keyup', this._onKeyUp);
    this.target.removeEventListener('mousedown', this._onMouseDown);
    this.target.removeEventListener('mouseup', this._onMouseUp);
  }

  

  
  _synth = new Set();
  _synthPressedThisFrame = new Set();
  _synthReleasedThisFrame = new Set();

  setSynthetic(action, isDown) {
    const was = this._synth.has(action);
    if (isDown && !was) { this._synth.add(action); this._synthPressedThisFrame.add(action); }
    else if (!isDown && was) { this._synth.delete(action); this._synthReleasedThisFrame.add(action); }
  }

  isDown(action) {
    if (this._synth.has(action)) return true;
    const codes = this.bindings[action];
    if (!codes) return false;
    for (const c of codes) if (this.pressed.has(c)) return true;
    return false;
  }

  wasPressed(action) {
    if (this._synthPressedThisFrame.has(action)) return true;
    const codes = this.bindings[action];
    if (!codes) return false;
    for (const c of codes) if (this._pressedThisFrame.has(c)) return true;
    return false;
  }

  wasReleased(action) {
    if (this._synthReleasedThisFrame.has(action)) return true;
    const codes = this.bindings[action];
    if (!codes) return false;
    for (const c of codes) if (this._releasedThisFrame.has(c)) return true;
    return false;
  }

  
  
  endFrame() {
    this._pressedThisFrame.clear();
    this._releasedThisFrame.clear();
    this._synthPressedThisFrame.clear();
    this._synthReleasedThisFrame.clear();
  }
}
