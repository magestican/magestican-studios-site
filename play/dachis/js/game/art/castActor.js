






import * as THREE from 'three';
import { requestJob, material, geometries } from './dachiActor.js';
import { seeActorMaterial } from '../../engine/iso/seeThrough.js';
import { CAST_UNIT, KID_RIG, kidKey } from './kidModel.js';
import { KID_HEIGHT, KID_WORLD_H, ELDER_HEIGHT, ELDER_WORLD_H, WALK } from './humanRig.js';

const ARM_K = WALK.arm / WALK.leg; 
import { ELDER_KEY } from './elderModel.js';
import { aerowingKey } from './aerowingModel.js';
import { bossKey, bossById } from './bossModel.js';






const f3 = (v) => v.toFixed(4);
const A = KID_RIG.armLine, KH = KID_RIG.hh;
const POSE_GLSL =  `
uniform float uSwing;
uniform float uShout;
uniform vec2 uGait; // G13: cos(walk phase) eased, moving 0..1
attribute float rigTag;
vec3 kidHinge( vec3 v, float a, float py, float pz ) { // a turn about the X axis through (0, py, pz)
  float c = cos( a ), s = sin( a );
  vec3 q = v - vec3( 0.0, py, pz );
  return vec3( q.x, c * q.y - s * q.z, s * q.y + c * q.z ) + vec3( 0.0, py, pz );
}
vec3 kidPose( vec3 v, vec3 pos, float isPoint ) {
  float side = pos.x < 0.0 ? 1.0 : -1.0;
  vec2 q = vec2( abs( pos.x ) - ${f3(A.sx)}, pos.y - ${f3(A.sy)} );
  float along = dot( q, vec2( ${f3(A.dx)}, ${f3(A.dy)} ) ), t = dot( q, vec2( ${f3(-A.dy)}, ${f3(A.dx)} ) );
  float r = mix( ${f3(A.rTop)}, ${f3(A.rBot)}, clamp( along / ${f3(A.len)}, 0.0, 1.0 ) );
  float region = smoothstep( -r - ${f3(A.band)}, -r, t ) * step( ${f3(KID_RIG.armLow)}, pos.y ) * ( 1.0 - smoothstep( ${f3(A.sy + 0.25 * KH)}, ${f3(A.sy + 0.45 * KH)}, pos.y ) );
  float isArm = step( 0.5, rigTag ) * step( rigTag, 1.5 ), isBody = step( 1.5, rigTag );
  float armW = isArm + ( 1.0 - isArm - isBody ) * region;
  float foreW = armW * smoothstep( ${f3(KID_RIG.upperArm - 0.12 * KH)}, ${f3(KID_RIG.upperArm + 0.06 * KH)}, along );
  float legW = ( 1.0 - smoothstep( ${f3(KID_RIG.hip - KID_RIG.legBlend)}, ${f3(KID_RIG.hip)}, pos.y ) ) * ( 1.0 - armW ) * ( 1.0 - isBody );
  float shinW = legW * ( 1.0 - smoothstep( ${f3(KID_RIG.knee - KID_RIG.kneeBlend)}, ${f3(KID_RIG.knee + KID_RIG.kneeBlend)}, pos.y ) );
  float legA = uSwing * side; // + = the leg swings back
  // the knee folds (shin back) while its leg swings FORWARD; the elbow lifts the forearm at the front
  // (peak flex a little before mid-swing, straight at heel strike: -cos(w + 0.4) from cos w and sin w)
  float kc = uGait.x * 0.921 - uSwing / ${f3(WALK.leg)} * 0.389;
  float knee = uGait.y * ( ${f3(WALK.kneeRest)} + ${f3(WALK.knee)} * max( 0.0, -kc * side ) );
  float elbow = -uGait.y * ( ${f3(WALK.elbowRest)} + ${f3(WALK.elbow)} * max( 0.0, legA ) / ${f3(WALK.leg)} );
  v = kidHinge( v, elbow * foreW, ${f3(KID_RIG.elbow[1])} * isPoint, ${f3(KID_RIG.elbow[2])} * isPoint );
  v = kidHinge( v, ( -legA * ${ARM_K.toFixed(3)} + ( pos.x > 0.0 ? -2.3 * uShout : 0.0 ) ) * armW, ${f3(KID_RIG.shoulder)} * isPoint, 0.0 );
  v = kidHinge( v, knee * shinW, ${f3(KID_RIG.knee)} * isPoint, ${f3(0.05 * KH)} * isPoint );
  return kidHinge( v, legA * legW, ${f3(KID_RIG.hip)} * isPoint, 0.0 );
}
`;


function poseMaterial(id, uniforms) {
  const base = material('n', id, '#ffffff');
  const m = base.clone(); 
  m.defaultAttributeValues = base.defaultAttributeValues; m.userData = base.userData;
  m.customProgramCacheKey = () => base.customProgramCacheKey() + '|kidpose';
  m.onBeforeCompile = (sh, r) => {
    base.onBeforeCompile(sh, r);
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\n' + POSE_GLSL)
      .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\n\tobjectNormal = kidPose( objectNormal, position, 0.0 );')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n\ttransformed = kidPose( transformed, position, 1.0 );');
  };
  return m;
}




function poseDepthMaterial(uniforms) {
  const m = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
  m.customProgramCacheKey = () => 'kidpose-depth';
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\n' + POSE_GLSL)
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n\ttransformed = kidPose( transformed, position, 1.0 );');
  };
  return m;
}

const FACE_CAMERA = Math.PI / 4; 

export class CastActor {
  
  constructor(scene, kind, opts = {}) {
    this.scene = scene; this.kind = kind;
    this.root = new THREE.Group(); this.root.name = kind;
    this.body = new THREE.Group(); this.root.add(this.body);
    
    
    
    
    
    this.worldK = opts.world ?? 1;
    this.see = !!opts.see && kind !== 'kid'; 
    this.body.scale.setScalar(this.worldK * (kind === 'kid' ? KID_WORLD_H / KID_HEIGHT : kind === 'elder' ? ELDER_WORLD_H / ELDER_HEIGHT : kind === 'boss' ? bossById(opts.boss).scale : CAST_UNIT * 1.36));
    scene.add(this.root);
    this.yaw = this.targetYaw = FACE_CAMERA; this.last = performance.now(); this.phase = Math.random() * 6;
    this.uniforms = { uSwing: { value: 0 }, uShout: { value: 0 }, uGait: { value: new THREE.Vector2(0, 0) } };
    this.gaitC = 0; this.gaitM = 0;
    this.swing = 0; this.shout = 0; this.moving = false; this.walk = 0; this.wantShout = false;
    this.key = null; this.disposed = false;
    this.setLook(opts);
  }
  setLook(opts = {}) {
    const key = this.kind === 'kid' ? kidKey(opts) : this.kind === 'aerowing' ? aerowingKey(opts.frame ?? 1) : this.kind === 'boss' ? bossKey(opts.boss) : ELDER_KEY;
    if (key === this.key) return;
    this.key = key;
    requestJob({ key, kind: this.kind, opts: { gender: opts.gender, frame: opts.frame ?? 1, boss: opts.boss } }, (arr) => {
      if (this.disposed || this.key !== key) return;
      this.body.clear();
      for (const { geo, id } of geometries(key, arr)) {
        const mesh = new THREE.Mesh(geo, this.kind === 'kid' ? poseMaterial(id, this.uniforms) : this.mat(material(this.kind === 'boss' ? (id === 'fur' ? 'b' : 'n') : 'n', id, '#ffffff')));
        mesh.castShadow = id !== 'lamp-glow'; mesh.receiveShadow = true;
        if (this.kind === 'kid') mesh.customDepthMaterial = this.depthMat ??= poseDepthMaterial(this.uniforms);
        this.body.add(mesh);
      }
    });
  }
  mat(m) { return this.see ? seeActorMaterial(m) : m; }
  
  faceDir(dx, dy) { if (dx || dy) this.targetYaw = Math.atan2(dx, dy); }
  faceCamera() { this.targetYaw = FACE_CAMERA; }
  pose({ moving = false, walk = 0, shout = false } = {}) { this.moving = moving; this.walk = walk; this.wantShout = shout; }
  place(x, y, ground, lift = 0) {
    const now = performance.now(), dt = Math.min(0.1, (now - this.last) / 1000); this.last = now;
    let d = this.targetYaw - this.yaw;
    d = Math.atan2(Math.sin(d), Math.cos(d)); 
    this.yaw += d * Math.min(1, dt * 12);
    const target = this.moving ? Math.sin(this.walk) * WALK.leg : 0; 
    this.swing += (target - this.swing) * Math.min(1, dt * 14);
    this.shout += ((this.wantShout ? 1 : 0) - this.shout) * Math.min(1, dt * 10);
    this.gaitC += ((this.moving ? Math.cos(this.walk) : 0) - this.gaitC) * Math.min(1, dt * 14);
    this.gaitM += ((this.moving ? 1 : 0) - this.gaitM) * Math.min(1, dt * 8);
    this.uniforms.uSwing.value = this.swing; this.uniforms.uShout.value = this.shout; this.uniforms.uGait.value.set(this.gaitC, this.gaitM);
    
    
    const bob = this.kind === 'kid' ? -this.gaitM * Math.abs(Math.sin(this.walk)) * 0.07 * this.worldK : 0;
    this.root.position.set(x, ground + lift + bob, y);
    this.root.rotation.y = this.yaw;
    const breathe = 1 + Math.sin(now / 1000 * 2.2 + this.phase) * 0.012;
    this.root.scale.set(2 - breathe, breathe, 2 - breathe);
  }
  setVisible(v) { this.root.visible = v; }
  dispose(scene) { this.disposed = true; (scene || this.scene).remove(this.root); }
}
