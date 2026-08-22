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

    // A ring on the ground at their feet, in the same colour. This is the
    // convention every team shooter uses and it earns its place for a reason
    // the halo alone cannot cover: a halo behind a body is competing with
    // whatever is behind the body, but a ring is drawn flat on the snow, which
    // is the most uniform surface in the game, so it survives at any distance
    // and from any angle — including when the enemy is behind cover and only
    // their feet show.
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.52, 0.72, 28),
      new THREE.MeshBasicMaterial({
        color: haloHex, transparent: true, opacity: 0.85,
        side: THREE.DoubleSide, depthWrite: false,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.06;             // just off the ground, no z-fighting
    this.group.add(ring);
    this.ring = ring;
    this.team = team;
    this._localTeam = localTeam;

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
    this.nameplate = sprite;
    this.bodyScale = 1;

    // Interpolation buffers
    this._targetPos = new THREE.Vector3();
    this._targetYaw = 0;
    this._targetPitch = 0;
  }

  // Power-up size, arriving on every STATE packet as `sc` (1 / 2 / 0.2).
  //
  // The BODY scales; the awareness furniture does not shrink with it. A halo,
  // a ground ring and a nameplate at 0.2x on a knee-high enemy would take the
  // one feature that exists so you can find people and make it invisible
  // exactly when you most need it. So they counter-scale on the way DOWN and
  // ride along on the way UP: a giant should have a giant's halo.
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

  // Recolour the aura when teams change. Team balance reassigns players AFTER
  // their RemotePlayer exists, so a halo baked once at construction can end up
  // telling you an enemy is a team-mate — the most expensive possible thing
  // for this feature to get wrong.
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
  // Transparent core (so the character reads through the halo) with a bright
  // coloured rim.
  //
  // The first cut peaked at 0.55 alpha and faded from 0.75 of the radius,
  // which measured fine as a swatch and was INVISIBLE in the game: this map is
  // a bright snow field under a pale sky, and a soft half-alpha gradient over
  // pale ground has almost no contrast left to spend. Bryan reported the aura
  // as simply missing. It is now near-opaque at the rim and the band is
  // narrower, so it reads as a defined edge around the body rather than a
  // haze — the same lesson as the ground pass, where a step that looked
  // obviously too strong on the canvas was the one that survived the render.
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

function shortestAngleDelta(from, to) {
  let d = (to - from) % (Math.PI * 2);
  if (d >  Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}
