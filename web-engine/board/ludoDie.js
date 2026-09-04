





























































































export const CHAIN_LENGTH = 2048;







export function hash32(text) {
  let h = 2166136261;
  const s = String(text);
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const hex8 = (n) => (n >>> 0).toString(16).padStart(8, '0');









export function hashLink(link) {
  const s = String(link);
  return hex8(hash32(`a:${s}`)) + hex8(hash32(`b:${s}`));
}









export function buildChain(secret, length = CHAIN_LENGTH) {
  const chain = new Array(length + 1);
  chain[length] = hashLink(`seed:${secret}`);
  for (let k = length; k > 0; k -= 1) chain[k - 1] = hashLink(chain[k]);
  return chain;
}


export function linkFor(chain, n) {
  return (n >= 0 && n + 1 < chain.length) ? chain[n + 1] : null;
}









export function verifyLink(link, previous) {
  return typeof link === 'string' && link.length > 0 && hashLink(link) === previous;
}













export function dieFrom(link) {
  return (hash32(`d:${link}`) % 6) + 1;
}











export function mixSeed(ids, nonce) {
  const parts = [...ids].filter(Boolean).map(String).sort();
  return hashLink(`${parts.join('|')}#${nonce}`);
}


export function randomSecret(random = Math.random) {
  return `${Math.floor(random() * 2 ** 32)}-${Math.floor(random() * 2 ** 32)}`;
}









export function facesOf(chain, count = chain.length - 1) {
  const out = [];
  for (let n = 0; n < count; n += 1) {
    const link = linkFor(chain, n);
    if (link === null) break;
    out.push(dieFrom(link));
  }
  return out;
}
