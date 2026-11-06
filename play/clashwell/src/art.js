





export const STAGE_URL = new URL('../art/woodblock/stage.webp', import.meta.url).href;

export const GEM_NAMES = ['red', 'blue', 'green', 'gold', 'stone'];



const gemAsset = (name) => (name === 'stone' ? 'stone' : `gem_${name}`);
export const gemUrl = (name) => new URL(`../art/gems/${gemAsset(name)}/${gemAsset(name)}.webp`, import.meta.url).href;

let picture = null;
const gems = new Map();

function load(makeImage, url, done) {
  const image = makeImage();
  image.onload = () => done(image);
  image.src = url;
}

export function loadArt(makeImage = () => new Image()) {
  load(makeImage, STAGE_URL, (image) => {
    picture = image;
  });
  for (const name of GEM_NAMES) {
    load(makeImage, gemUrl(name), (image) => gems.set(name, image));
  }
}

export const stagePicture = () => picture;
export const gemPicture = (name) => gems.get(name) ?? null;


export function coverCrop(imageW, imageH, boxW, boxH) {
  const scale = Math.max(boxW / imageW, boxH / imageH);
  const w = boxW / scale;
  const h = boxH / scale;
  return { sx: (imageW - w) / 2, sy: (imageH - h) / 2, sw: w, sh: h };
}


export function containBox(imageW, imageH, x, y, size) {
  const scale = size / Math.max(imageW, imageH);
  const w = imageW * scale;
  const h = imageH * scale;
  return { dx: x + (size - w) / 2, dy: y + (size - h) / 2, dw: w, dh: h };
}
