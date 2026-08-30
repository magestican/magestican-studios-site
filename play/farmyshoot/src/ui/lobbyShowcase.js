








































import * as THREE from 'three';
import {
  createShowcase, nudge, selectId, selectedId, stepShowcase, slotsOf, dragToNudge,
} from '../../../../web-engine/kart/characterShowcase.js';
import { buildCharacter } from '../entities/character.js';





const SPACING = 1.9;










function studioLights() {
  const g = new THREE.Group();

  const key = new THREE.DirectionalLight(0xfff2dd, 2.2);
  key.position.set(-2.8, 3.6, 4.2);
  g.add(key);

  const fill = new THREE.DirectionalLight(0xcfe2ff, 0.75);
  fill.position.set(3.8, 1.4, 2.2);
  g.add(fill);

  
  
  
  const rim = new THREE.DirectionalLight(0xf4c95d, 1.5);
  rim.position.set(0.5, 2.2, -4.0);
  g.add(rim);

  g.add(new THREE.AmbientLight(0x6f7d94, 0.75));
  return g;
}

export class LobbyShowcase {
  
  
  
  constructor(canvas, ids, { onSelect = null, selected = null } = {}) {
    this.canvas = canvas;
    this.ids = ids.slice();
    this.onSelect = onSelect;
    this.state = createShowcase(this.ids, selected);
    this._running = false;
    this._last = 0;
    this._lastAnnounced = selectedId(this.state);

    this.scene = new THREE.Scene();
    this.scene.add(studioLights());

    this.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
    this.camera.position.set(0, 1.25, 5.4);
    this.camera.lookAt(0, 0.85, 0);

    
    
    
    
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setClearColor(0x000000, 0);

    this.bodies = new Map();
    for (const id of this.ids) {
      
      
      
      
      const built = buildCharacter(id, null);
      const g = built.group || built;
      this.scene.add(g);
      this.bodies.set(id, { group: g, built });
    }

    this._onPointerDown = (e) => this._dragStart(e);
    this._onPointerMove = (e) => this._dragMove(e);
    this._onPointerUp = () => { this._drag = null; };
    canvas.addEventListener('pointerdown', this._onPointerDown);
    window.addEventListener('pointermove', this._onPointerMove);
    window.addEventListener('pointerup', this._onPointerUp);

    this._layout(0.016);
  }

  select(id) { selectId(this.state, id); }
  nudge(dir) { nudge(this.state, dir); }
  selected() { return selectedId(this.state); }

  
  
  _dragStart(e) {
    this._drag = { x: e.clientX };
    this.canvas.setPointerCapture?.(e.pointerId);
  }

  _dragMove(e) {
    if (!this._drag) return;
    
    
    
    
    const step = dragToNudge(e.clientX - this._drag.x);
    if (step) {
      nudge(this.state, step);
      this._drag.x = e.clientX;
    }
  }

  start() {
    if (this._running) return;
    this._running = true;
    this._last = performance.now();
    const tick = () => {
      if (!this._running) return;
      const now = performance.now();
      const dt = Math.min(0.05, (now - this._last) / 1000);
      this._last = now;
      this._layout(dt);
      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  
  
  
  stop() { this._running = false; }

  _layout(dt) {
    
    
    
    const w = this.canvas.clientWidth | 0;
    const h = this.canvas.clientHeight | 0;
    if (w > 0 && h > 0 && (this._w !== w || this._h !== h)) {
      this._w = w; this._h = h;
      this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }

    stepShowcase(this.state, dt);

    
    
    
    
    for (const body of this.bodies.values()) body.group.visible = false;

    for (const s of slotsOf(this.state)) {
      const body = this.bodies.get(s.id);
      if (!body) continue;
      const g = body.group;
      g.visible = true;
      g.position.set(s.slot * SPACING, 0, s.depth);
      g.scale.setScalar(s.scale);
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      g.rotation.y = s.spin;
      
      
      

      
      
      
      
      
      
      if (body.opacity !== s.opacity) {
        body.opacity = s.opacity;
        g.traverse((o) => {
          if (!o.isMesh || !o.material) return;
          
          
          
          o.material.transparent = s.opacity < 0.999;
          o.material.opacity = s.opacity;
        });
      }
    }

    const now = selectedId(this.state);
    if (now !== this._lastAnnounced) {
      this._lastAnnounced = now;
      this.onSelect?.(now);
    }
  }

  dispose() {
    this.stop();
    this.canvas.removeEventListener('pointerdown', this._onPointerDown);
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup', this._onPointerUp);
    this.renderer.dispose();
  }
}
