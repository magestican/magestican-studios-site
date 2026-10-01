




















import * as THREE from 'three';

import { poseAt } from 'arbelo/emotes';
import { sampleAt } from 'arbelo/trackPath';
import { characterById } from 'arbelo/kartTuning';
import { surface, paintedSurface, applyShadows } from './materials.js';
import { loadDriver } from './kartMesh.js';
import { PALETTE } from '../palette.js';
import { ceremonyFraming } from '../../../../web-engine/kart/ceremonyFraming.js';


const SLOT_X = [0, -1.7, 1.7];
const STEP_H = [0.95, 0.62, 0.4];


const YOU_MARKER_LIFT = 1.5;





















function buildYouMarker() {
  const g = new THREE.Group();
  g.name = 'youMarker';
  
  
  
  const bar = new THREE.BoxGeometry(0.5, 0.13, 0.13);
  const mat = new THREE.MeshBasicMaterial({ color: PALETTE.gold, toneMapped: false });
  for (const sign of [-1, 1]) {
    const arm = new THREE.Mesh(bar, mat);
    arm.position.x = sign * 0.17;
    arm.rotation.z = sign * -0.7;
    g.add(arm);
  }
  return g;
}

function buildStep(place, width = 1.45) {
  const h = STEP_H[place - 1] ?? 0.4;
  const g = new THREE.Group();
  const block = new THREE.Mesh(
    new THREE.BoxGeometry(width, h, width),
    paintedSurface({ color: place === 1 ? PALETTE.gold : PALETTE.line, flatShading: true }),
  );
  block.position.y = h / 2;
  g.add(block);
  const trim = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.12, 0.08, width + 0.12),
    surface({ color: PALETTE.night, flatShading: true }),
  );
  trim.position.y = h;
  g.add(trim);
  g.userData.height = h;
  return g;
}







function buildFigure(characterId) {
  const character = characterById(characterId);
  const root = new THREE.Group();
  const pivot = new THREE.Group();
  root.add(pivot);
  const placeholder = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.8, 0.55),
    paintedSurface({ color: character.tint, flatShading: true }),
  );
  placeholder.position.y = 0.4;
  placeholder.userData.baseScale = 1;
  pivot.add(placeholder);
  root.userData.pivot = pivot;
  root.userData.body = placeholder;

  loadDriver(character.species).then((scene) => {
    if (!scene) return;
    const body = scene.clone(true);
    const bbox = new THREE.Box3().setFromObject(body);
    const height = bbox.max.y - bbox.min.y || 1;
    const fit = 1.3 / height;
    body.userData.baseScale = fit;
    body.scale.setScalar(fit);
    body.position.y = -bbox.min.y * fit;
    body.userData.sharedDriver = true;
    pivot.remove(placeholder);
    pivot.add(body);
    root.userData.body = body;
  });
  return root;
}














export function buildCeremony({ path, steps }) {
  const group = new THREE.Group();
  group.name = 'ceremony';

  
  
  
  
  
  
  
  
  
  
  
  
  const p = sampleAt(path, path.length - 26);
  
  const off = (p.width ?? 40) / 2 + 7.5;
  const cx = p.x + p.nx * off;
  const cz = p.z + p.nz * off;
  
  
  const yaw = Math.atan2(p.x - cx, p.z - cz);
  group.position.set(cx, p.y ?? 0, cz);
  group.rotation.y = yaw;

  const slots = [];
  const top = steps.slice(0, 3);
  top.forEach((s, i) => {
    const step = buildStep(s.place);
    step.position.x = SLOT_X[i] ?? 0;
    group.add(step);
    const fig = buildFigure(s.character);
    
    
    
    
    
    
    
    fig.rotation.y = Math.PI;
    fig.position.set(SLOT_X[i] ?? 0, step.userData.height, 0);
    group.add(fig);
    let marker = null;
    if (s.isPlayer) {
      marker = buildYouMarker();
      group.add(marker);
    }
    slots.push({ fig, marker, isPlayer: !!s.isPlayer, emote: null, emoteStart: 0 });
  });

  applyShadows(group, 'ceremony');

  return {
    group,
    
    





    cameraFor(aspect) {
      const f = ceremonyFraming(aspect);
      return {
        pos: new THREE.Vector3(
          cx + Math.sin(yaw) * f.dist + p.nx * f.side,
          (p.y ?? 0) + 2.0,
          cz + Math.cos(yaw) * f.dist + p.nz * f.side,
        ),
        look: new THREE.Vector3(
          cx - p.nx * f.lookBias,
          (p.y ?? 0) + 0.55,
          cz - p.nz * f.lookBias,
        ),
      };
    },
    camera: {
      pos: new THREE.Vector3(
        cx + Math.sin(yaw) * 7.5 + p.nx * -1.2,
        (p.y ?? 0) + 2.0,
        cz + Math.cos(yaw) * 7.5 + p.nz * -1.2,
      ),
      
      
      
      
      
      look: new THREE.Vector3(
        cx - p.nx * 5.5,
        (p.y ?? 0) + 0.55,
        cz - p.nz * 5.5,
      ),
    },
    
    emote(id, now) {
      const mine = slots.find((s) => s.isPlayer);
      if (!mine) return false;
      mine.emote = id;
      mine.emoteStart = now;
      return true;
    },
    
    update(now) {
      slots.forEach((s, i) => {
        const pose = poseAt({
          emote: s.emote, emoteStart: s.emoteStart, time: now, seed: i,
        });
        const pivot = s.fig.userData.pivot;
        const body = s.fig.userData.body;
        s.fig.position.x = (SLOT_X[i] ?? 0) + pose.sway;
        s.fig.position.y = (STEP_H[top[i].place - 1] ?? 0.4) + pose.bob;
        if (pivot) pivot.rotation.set(pose.tilt, pose.turn, pose.roll);
        if (body) {
          const base = body.userData.baseScale ?? 1;
          body.scale.set(pose.stretch * base, pose.squash * base, pose.stretch * base);
        }
        
        
        
        
        
        if (s.marker) {
          s.marker.position.set(
            s.fig.position.x,
            s.fig.position.y + YOU_MARKER_LIFT + Math.sin(now * 2.2) * 0.09,
            s.fig.position.z,
          );
          s.marker.rotation.y = now * 1.1;
        }
      });
    },
  };
}
