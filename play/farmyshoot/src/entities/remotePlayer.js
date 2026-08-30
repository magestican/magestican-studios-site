

import * as THREE from 'three';
import { buildCharacter } from './character.js';
import { idlePose, idlePhase, idleWeight } from './characterIdleSpec.js';
import { applyRig } from './characterRig.js';
import { isBodyConcealedFrom } from '../../../../web-engine/render/hayVisibility.js';
import { emptyConcealment, stepConcealment, concealmentDraw }
  from '../../../../web-engine/render/concealment.js';



const _eyeTmp = new THREE.Vector3();

const TEAM_HEX = { red: 0xd0503e, blue: 0x4f8adb };



const OUTLINE_HEX = { red: 0xff2a1a, blue: 0x2a7cff };

export class RemotePlayer {
  constructor(scene, peerId, { character, team, name, localTeam }) {
    this.peerId = peerId;
    this.team = team;
    this.name = name;
    this.character = character;
    
    
    
    const isEnemy = localTeam && team && team !== localTeam;
    const haloTeam = isEnemy ? 'red' : (localTeam ? 'blue' : team);
    const haloHex = OUTLINE_HEX[haloTeam] || OUTLINE_HEX.red;

    const built = buildCharacter(character, TEAM_HEX[team] || 0xffffff);
    this.group = built.group;
    this.headBone = built.headBone;
    
    
    
    this.idlePivot = built.idlePivot || null;
    
    
    
    this._built = built;
    this._gaitDist = 0;
    this._lastGaitX = 0;
    this._lastGaitZ = 0;
    this._lastGaitY = 0;
    this._airborne = false;
    
    
    
    this._idleT = idlePhase(peerId) * 20;
    this._idlePhase = idlePhase(peerId + ':' + (character || ''));
    this._speed = 0;
    this._lastPos = new THREE.Vector3();
    scene.add(this.group);

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    this._placed = false;
    this.group.visible = false;

    
    
    
    
    
    
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeHaloTexture(haloHex),
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    }));
    halo.position.set(0, 0.85, 0);      
    halo.scale.set(2.2, 2.6, 1);        
    halo.renderOrder = -1;              
    this.group.add(halo);
    this.halo = halo;

    
    
    
    
    
    
    
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.52, 0.72, 28),
      new THREE.MeshBasicMaterial({
        color: haloHex, transparent: true, opacity: 0.85,
        side: THREE.DoubleSide, depthWrite: false,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.06;             
    this.group.add(ring);
    this.ring = ring;
    this.team = team;
    this._localTeam = localTeam;

    
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = team === 'red' ? '#ff7b6a' : '#7cb0ff';
    ctx.font = 'bold 28px -apple-system, "Segoe UI", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(name.slice(0, 16), 128, 32);
    const tex = new THREE.CanvasTexture(canvas);
    
    
    
    
    
    
    
    
    
    
    
    
    
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: tex, transparent: true, depthWrite: false,
    }));
    sprite.scale.set(1.4, 0.35, 1);
    sprite.position.y = 2.0;
    this.group.add(sprite);
    this.nameplate = sprite;
    this.bodyScale = 1;

    
    this._targetPos = new THREE.Vector3();
    this._targetYaw = 0;
    this._targetPitch = 0;

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    this._conceal = emptyConcealment();
    this._baseOpacity = { halo: 0.85, ring: 0.85, nameplate: 1 };
    this._scene = scene;
    this._worldMesh = null;
    this._camera = null;
  }

  
  
  
  
  
  
  
  _view(view) {
    if (view && view.grid && view.eye) return view;
    if (!this._camera || this._camera.parent !== this._scene) {
      this._camera = this._scene.children.find((o) => o.isCamera) || null;
    }
    if (!this._worldMesh || this._worldMesh.parent !== this._scene) {
      this._worldMesh = this._scene.getObjectByName('voxelWorld') || null;
    }
    const grid = this._worldMesh?.userData?.grid || null;
    if (!grid || !this._camera) return null;
    return { grid, eye: this._camera.getWorldPosition(_eyeTmp) };
  }

  
  
  
  
  
  
  
  
  _paintConcealment(dt, view) {
    const v = this._view(view);
    const concealed = v
      ? isBodyConcealedFrom(v.grid, v.eye, this.group.position)
      : false;
    this._conceal = stepConcealment(this._conceal, concealed, dt * 1000);
    const draw = concealmentDraw(this._conceal);
    paint(this.halo, this._baseOpacity.halo * draw.haloOpacity);
    paint(this.ring, this._baseOpacity.ring * draw.ringOpacity);
    paint(this.nameplate, this._baseOpacity.nameplate * draw.nameplateOpacity);
    
    
    
    
    
    
    if (this.idlePivot) this.idlePivot.visible = draw.bodyVisible;
    else this.group.visible = draw.bodyVisible;   
  }

  
  
  
  
  
  
  
  setBodyScale(scale) {
    const s = Number.isFinite(scale) && scale > 0 ? scale : 1;
    if (Math.abs(s - this.bodyScale) < 1e-6) return;
    this.bodyScale = s;
    this.group.scale.setScalar(s);
    const counter = s < 1 ? 1 / s : 1;
    if (this.halo)      this.halo.scale.set(2.2 * counter, 2.6 * counter, 1);
    if (this.ring)      this.ring.scale.setScalar(counter);
    if (this.nameplate) this.nameplate.scale.set(1.4 * counter, 0.35 * counter, 1);
  }

  
  
  
  
  
  placeAt(pos, yaw) {
    if (!pos) return;
    const x = pos.x ?? pos[0], y = pos.y ?? pos[1], z = pos.z ?? pos[2];
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return;
    this.group.position.set(x, y, z);
    this._targetPos.set(x, y, z);
    if (Number.isFinite(yaw)) { this.group.rotation.y = yaw; this._targetYaw = yaw; }
    this._reveal();
  }

  setNet(pos, yaw, pitch, hp) {
    this._targetPos.fromArray(pos);
    this._targetYaw = yaw;
    this._targetPitch = pitch;
    this.hp = hp;
    
    
    if (!this._placed) {
      this.group.position.copy(this._targetPos);
      this.group.rotation.y = this._targetYaw;
      this._reveal();
    }
  }

  _reveal() {
    if (this._placed) return;
    this._placed = true;
    this.group.visible = true;
    
    
    
    
    
    this._lastPos.copy(this.group.position);
  }

  
  
  
  
  update(dt, view = null) {
    
    
    
    if (!this._placed) return;
    
    this.group.position.lerp(this._targetPos, Math.min(1, dt * 15));
    this.group.rotation.y += shortestAngleDelta(this.group.rotation.y, this._targetYaw) * Math.min(1, dt * 15);
    if (this.headBone) this.headBone.rotation.x = -this._targetPitch;

    
    
    
    
    
    
    
    
    
    if (this.idlePivot) {
      this._idleT += dt;
      
      
      
      
      
      
      
      
      
      
      
      const moved = this.group.position.distanceTo(this._lastPos);
      const inst = Math.min(moved / Math.max(dt, 1 / 240), 20);
      
      
      
      this._speed += (inst - this._speed) * Math.min(1, dt * 6);
      this._lastPos.copy(this.group.position);
      const pose = idlePose(this.character, this._idleT, this._idlePhase,
                            idleWeight(this._speed));
      this.idlePivot.scale.set(pose.scaleXZ, pose.scaleY, pose.scaleXZ);
      this.idlePivot.rotation.z = pose.rollRad;

      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      const dy = this.group.position.y - this._lastGaitY;
      this._lastGaitY = this.group.position.y;
      const vy = dy / Math.max(dt, 1 / 240);
      this._airborne = Math.abs(vy) > 1.6;

      this._gaitDist += Math.hypot(
        this.group.position.x - this._lastGaitX,
        this.group.position.z - this._lastGaitZ);
      this._lastGaitX = this.group.position.x;
      this._lastGaitZ = this.group.position.z;
      if (this._built && this._built.rig) {
        applyRig(this._built.rig, {
          distance: this._gaitDist,
          speed: this._speed,
          timeSec: this._idleT,
          airborne: this._airborne,
        });
      }
    }

    
    
    this._paintConcealment(dt, view);
  }

  
  
  
  
  setTeams(team, localTeam) {
    if (team === this.team && localTeam === this._localTeam) return;
    this.team = team ?? this.team;
    this._localTeam = localTeam ?? this._localTeam;
    const isEnemy = this._localTeam && this.team && this.team !== this._localTeam;
    const hex = OUTLINE_HEX[isEnemy ? 'red' : 'blue'];
    if (this.halo) this.halo.material.map = makeHaloTexture(hex);
    if (this.ring) this.ring.material.color.setHex(hex);
  }

  destroy(scene) { scene.remove(this.group); }
}



const _haloCache = new Map();
function makeHaloTexture(hex) {
  if (_haloCache.has(hex)) return _haloCache.get(hex);
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');
  const cx = 64, cy = 64;
  const r = 62;
  const rgb = [(hex >> 16) & 0xff, (hex >> 8) & 0xff, hex & 0xff];
  const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  
  
  
  
  
  
  
  
  
  
  
  grd.addColorStop(0.00, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.00)`);
  grd.addColorStop(0.62, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.00)`);
  grd.addColorStop(0.78, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.95)`);
  grd.addColorStop(0.88, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.80)`);
  grd.addColorStop(1.00, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.00)`);
  ctx.fillStyle = grd;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  _haloCache.set(hex, tex);
  return tex;
}




function paint(obj, opacity) {
  if (!obj) return;
  obj.material.opacity = opacity;
  obj.visible = opacity > 0;
}

function shortestAngleDelta(from, to) {
  let d = (to - from) % (Math.PI * 2);
  if (d >  Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}
