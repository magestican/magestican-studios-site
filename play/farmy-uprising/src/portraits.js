



















export const PORTRAIT_PNG = './assets/sprites/portraits.png';
export const PORTRAIT_JSON = './assets/sprites/portraits.json';






export async function loadPortraits() {
  const res = await fetch(PORTRAIT_JSON);
  if (!res.ok) throw new Error(`no portrait manifest (HTTP ${res.status})`);
  const manifest = await res.json();
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${PORTRAIT_PNG}`));
    img.src = PORTRAIT_PNG;
  });
  return { image, manifest };
}


export const portraitRow = (manifest, id) => (
  manifest && manifest.rows[id] ? manifest.rows[id].row : -1
);
