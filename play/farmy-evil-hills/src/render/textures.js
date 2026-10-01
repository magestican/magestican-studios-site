




















import * as THREE from 'three';



































export function bindSheet(sheet, { repeat = true, flipY = false } = {}) {
  if (!sheet || !sheet.data || !sheet.width || !sheet.height
      || sheet.data.length !== sheet.width * sheet.height * 4) {
    throw new Error('bindSheet: expected a painted sheet { width, height, data: RGBA bytes }');
  }
  const bytes = sheet.data instanceof Uint8Array
    ? sheet.data
    : new Uint8Array(sheet.data.buffer, sheet.data.byteOffset, sheet.data.byteLength);
  const t = new THREE.DataTexture(bytes, sheet.width, sheet.height, THREE.RGBAFormat, THREE.UnsignedByteType);
  t.flipY = flipY;
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.wrapS = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  t.wrapT = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  t.needsUpdate = true;
  t.userData = { sheet: { width: sheet.width, height: sheet.height } };
  return t;
}
