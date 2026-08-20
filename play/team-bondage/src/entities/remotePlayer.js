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

    // Team-awareness halo: a slightly inflated inverted-hull "shell" behind
    // the character. Rendered flat-colour, back-side, additive-y blend so
    // it reads as a coloured RIM around the model, not a solid duplicate.
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(0.95, 20, 12),
      new THREE.MeshBasicMaterial({
        color: haloHex,
        side: THREE.BackSide,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      }),
    );
    halo.position.set(0, 1.0, 0);
    halo.scale.set(0.85, 1.35, 0.85);   // taller than wide, matches upright silhouette
    halo.renderOrder = -1;              // draw before the character
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

function shortestAngleDelta(from, to) {
  let d = (to - from) % (Math.PI * 2);
  if (d >  Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}
