







import { cloneSkinned, GLTFLoader, THREE } from '../vendor/three-vendor.js';
import { COSTUMES_3D } from './costumes3d.js';
import { solveRig } from './poseToRig.js';
import { applyRigPose, bindSkinnedToRig, captureRest, hasFullRig, resetRigPose } from './rig.js';

const BASE = new URL('../../models/costumes/', import.meta.url);




export function imgTextures(parser) {
  parser.textureLoader = new THREE.TextureLoader(parser.options.manager);
  return { name: 'mmm_img_textures' };
}

const cache = new Map();
function loadGlb(url) {
  let p = cache.get(url);
  if (!p) {
    p = new GLTFLoader()
      .register(imgTextures)
      .loadAsync(url)
      .then((g) => g.scene)
      .catch((e) => {
        console.warn(`Magic Mirror Moves: ${url} did not load (${e?.message ?? e}); stickers stay on.`);
        return null;
      });
    cache.set(url, p);
  }
  return p;
}

function hasSkin(o) {
  let found = false;
  o.traverse((n) => {
    if (n.isSkinnedMesh) found = true;
  });
  return found;
}

function recolour(root, colours) {
  root.traverse((n) => {
    if (!n.isMesh) return;
    const one = (m) => {
      const own = m.clone();
      const hex = colours[own.name];
      if (hex && own.color) own.color.set(hex);
      return own;
    };
    n.material = Array.isArray(n.material) ? n.material.map(one) : one(n.material);
    n.frustumCulled = false; 
  });
}

function disposeTree(root) {
  root.traverse((n) => {
    if (!n.isMesh) return;
    n.geometry?.dispose();
    for (const m of Array.isArray(n.material) ? n.material : [n.material]) m.dispose();
  });
}

export class CostumeOverlay {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(0, 1, 0, -1, -10000, 10000);
    
    this.scene.add(new THREE.HemisphereLight('#ffffff', '#4a4258', 1.4));
    const key = new THREE.DirectionalLight('#fff3e6', 2.2);
    key.position.set(0.4, 0.7, 1);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight('#d8e4ff', 0.9);
    rim.position.set(-0.6, 0.8, -0.5);
    this.scene.add(rim);
    this.holder = new THREE.Group();
    this.holder.visible = false;
    this.scene.add(this.holder);
    this.rest = null;
    this.pieces = [];
    this.costume = '';
    this.building = Promise.resolve();
    this.size = { w: 0, h: 0, pr: 0 };
  }

  
  ready(costume) {
    return this.costume === costume && this.rest !== null && this.pieces.length > 0;
  }

  
  setCostume(costume) {
    if (costume === this.wanted) return this.building;
    this.wanted = costume;
    this.building = this.building.then(() => this.build(costume));
    return this.building;
  }

  async build(costume) {
    const c = COSTUMES_3D[costume];
    
    const urls = c ? [new URL(c.mannequin, BASE), ...c.pieces.map((p) => new URL(`${costume}/${p.file}`, BASE))] : [];
    const loaded = await Promise.all(urls.map((u) => loadGlb(u.href)));
    if (costume !== this.wanted) return; 
    this.clear();
    const [mannequin, ...pieceFiles] = loaded;
    if (!c || !mannequin || !hasFullRig(mannequin)) return;
    const rig = cloneSkinned(mannequin);
    
    rig.traverse((n) => {
      if (!n.isMesh) return;
      n.material = new THREE.MeshBasicMaterial({ colorWrite: false });
      n.renderOrder = -1;
      n.frustumCulled = false;
    });
    this.holder.position.set(0, 0, 0);
    this.holder.scale.setScalar(1);
    this.holder.add(rig);
    this.holder.updateMatrixWorld(true);
    this.rest = captureRest(rig);
    c.pieces.forEach((p, i) => {
      const file = pieceFiles[i];
      if (!file || !hasSkin(file)) return;
      const copy = cloneSkinned(file);
      recolour(copy, p.colours ?? c.colours);
      rig.add(copy);
      if (bindSkinnedToRig(copy, this.rest.bones) > 0) this.pieces.push({ slot: p.slot, root: copy });
      else {
        rig.remove(copy);
        disposeTree(copy);
      }
    });
    this.costume = costume;
  }

  clear() {
    for (const c of [...this.holder.children]) {
      this.holder.remove(c);
      disposeTree(c);
    }
    this.pieces = [];
    this.rest = null;
    this.costume = '';
  }

  
  dispose() {
    this.clear();
    this.renderer.dispose();
  }

  




  render(pose, fw, fh, pixelRatio) {
    if (!this.rest) return false;
    const sol = solveRig(pose, this.rest.info);
    if (!sol) {
      this.holder.visible = false;
      return false;
    }
    const pr = Math.min(2, pixelRatio);
    if (this.size.w !== fw || this.size.h !== fh || this.size.pr !== pr) {
      this.size = { w: fw, h: fh, pr };
      this.renderer.setPixelRatio(pr);
      this.renderer.setSize(fw, fh, false);
      this.camera.left = 0;
      this.camera.right = fw;
      this.camera.top = 0;
      this.camera.bottom = -fh;
      this.camera.updateProjectionMatrix();
    }
    resetRigPose(this.rest);
    applyRigPose(this.rest, sol.rotations, sol.scales);
    this.holder.position.set(sol.root.x, -sol.root.y, 0);
    this.holder.scale.setScalar(sol.root.scale);
    const hidden = new Set(sol.hiddenPieces);
    for (const p of this.pieces) p.root.visible = !hidden.has(p.slot);
    this.holder.visible = true;
    this.renderer.render(this.scene, this.camera);
    return true;
  }

  
  visibleCount() {
    return this.holder.visible ? this.pieces.filter((p) => p.root.visible).length : 0;
  }
}
