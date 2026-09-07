









export const ANIM_SHEETS = Object.freeze({
  herd: { png: './assets/sprites/anim-herd.png', json: './assets/sprites/anim-herd.json' },
  yield: { png: './assets/sprites/anim-yield.png', json: './assets/sprites/anim-yield.json' },
});

async function loadOne(sheet) {
  const res = await fetch(sheet.json);
  if (!res.ok) throw new Error(`no animation manifest (HTTP ${res.status}) at ${sheet.json}`);
  const manifest = await res.json();
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${sheet.png}`));
    img.src = sheet.png;
  });
  return { image, manifest };
}






export async function loadAnimAtlases() {
  const [herd, yieldSheet] = await Promise.all([
    loadOne(ANIM_SHEETS.herd).catch(() => null),
    loadOne(ANIM_SHEETS.yield).catch(() => null),
  ]);
  return { herd, yield: yieldSheet };
}


export const animColumns = (manifest) => manifest.facings * manifest.slots;

export const animRowCount = (manifest) => Object.keys(manifest.rows).length * Object.keys(manifest.kinds).length;
