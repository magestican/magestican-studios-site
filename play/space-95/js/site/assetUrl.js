




let table;


export function v(url) {
  if (table === undefined) {
    const el = typeof document === 'undefined' ? null : document.getElementById('asset-v');
    try {
      table = el ? JSON.parse(el.textContent ?? '{}') : {};
    } catch {
      table = {};
    }
  }
  const h = table[url] ?? (url.includes('/sfx/') ? table['@sfx'] : url.includes('/music/') ? table['@music'] : undefined);
  return h ? `${url}?v=${h}` : url;
}
