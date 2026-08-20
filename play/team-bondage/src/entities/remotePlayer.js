// Renders another peer's character with interpolation.

import * as THREE from 'three';
import { buildCharacter } from './character.js';

const TEAM_HEX = { red: 0xd0503e, blue: 0x4f8adb };
// Vivid outline colour per team — used for the halo behind each remote
// player so Bryan can instantly tell friend from foe at range.
// docs/features/team-outline.md.
const OUTLINE_HEX = { red: 0xff2a1a, blue: 0x2a7cff };

export class RemotePlayer {
  constructor(scene, peerId, { character, team, name, localTeam }) {
    this.peerId = peerId;
    this.team = team;
    this.name = name;
    this.character = character;
    // Colour of MY awareness halo for this player: red if they're on the
    // opposing team, blue if they're an ally. If localTeam is unknown we
    // fall back to the player's own team tint.
    const isEnemy = localTeam && team && team !== localTeam;
    const haloTeam = isEnemy ? 'red' : (localTeam ? 'blue' : team);
    const haloHex = OUTLINE_HEX[haloTeam] || OUTLINE_HEX.red;

    const built = buildCharacter(character, TEAM_HEX[team] || 0xffffff);
    this.group = built.group;
    this.headBone = built.headBone;
    scene.add(this.group);

    // Team-awareness halo — a camera-facing SPRITE that sits ON the
    // character, not a big offset shell that read as "detached square".
    // Bryan 2026-08-21: "floating red and blue squares … seem to be
    // detached, fix that". A sprite with a radial-gradient texture always
    // faces the camera + is centred on the character's body, so it can't
    // separate visually. Larger + fainter → reads as a soft rim.
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeHaloTexture(haloHex),
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    }));
    halo.position.set(0, 0.85, 0);      // over the body/torso, on-model
    halo.scale.set(2.2, 2.6, 1);        // covers head + body silhouette
    halo.renderOrder = -1;              // draw BEFORE the character
    this.group.add(halo);
    this.halo = halo;

    // Nameplate: sprite billboard with the player's name.
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
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    sprite.scale.set(1.4, 0.35, 1);
    sprite.position.y = 2.0;
    this.group.add(sprite);

    // Interpolation buffers
    this._targetPos = new THREE.Vector3();
    this._targetYaw = 0;
    this._targetPitch = 0;
  }

  setNet(pos, yaw, pitch, hp) {
    this._targetPos.fromArray(pos);
    this._targetYaw = yaw;
    this._targetPitch = pitch;
    this.hp = hp;
  }

  update(dt) {
    // Smooth toward target
    this.group.position.lerp(this._targetPos, Math.min(1, dt * 15));
    this.group.rotation.y += shortestAngleDelta(this.group.rotation.y, this._targetYaw) * Math.min(1, dt * 15);
    if (this.headBone) this.headBone.rotation.x = -this._targetPitch;
  }

  destroy(scene) { scene.remove(this.group); }
}

// Build a radial-gradient halo texture in the given team colour. Cached
// per colour so N remote players share the same 128×128 canvas.
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
  // Transparent core (so the character reads through the halo) with a
  // bright coloured rim that fades to fully transparent at the edge.
  grd.addColorStop(0.00, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.00)`);
  grd.addColorStop(0.55, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.00)`);
  grd.addColorStop(0.75, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.55)`);
  grd.addColorStop(0.90, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.35)`);
  grd.addColorStop(1.00, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.00)`);
  ctx.fillStyle = grd;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  _haloCache.set(hex, tex);
  return tex;
}

function shortestAngleDelta(from, to) {
  let d = (to - from) % (Math.PI * 2);
  if (d >  Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}
