



export const STAGE_URL = new URL('../art/woodblock/stage.webp', import.meta.url).href;

let picture = null;

export function loadArt(makeImage = () => new Image()) {
  const image = makeImage();
  image.onload = () => {
    picture = image;
  };
  image.src = STAGE_URL;
}

export const stagePicture = () => picture;


export function coverCrop(imageW, imageH, boxW, boxH) {
  const scale = Math.max(boxW / imageW, boxH / imageH);
  const w = boxW / scale;
  const h = boxH / scale;
  return { sx: (imageW - w) / 2, sy: (imageH - h) / 2, sw: w, sh: h };
}
