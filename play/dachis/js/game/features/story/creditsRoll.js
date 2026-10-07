





const MAX_FRIENDS = 40;


export function creditRows({ name, friends }) {
  const seen = [...new Set(friends)];
  const shown = seen.slice(0, MAX_FRIENDS), more = seen.length - shown.length;
  return [
    { k: 'head', t: 'DACHIS' },
    { k: 'line', t: 'A Magestican Studios game' },
    { k: 'gap', t: '' },
    { k: 'head', t: 'Created by' },
    { k: 'line', t: 'Bryan Arbelo' },
    { k: 'gap', t: '' },
    { k: 'head', t: 'Music and sound' },
    { k: 'line', t: 'Magestican DJ' },
    { k: 'gap', t: '' },
    { k: 'head', t: 'Starring' },
    { k: 'line', t: name },
    { k: 'line', t: 'Hibone' },
    { k: 'line', t: 'Kumabo' },
    { k: 'line', t: 'Tomo, the First Friend' },
    { k: 'line', t: 'Elder Ojiji' },
    { k: 'gap', t: '' },
    ...(shown.length ? [{ k: 'head', t: 'And your friends' }, ...shown.map((t) => ({ k: 'line', t }))] : []),
    ...(more > 0 ? [{ k: 'line', t: `...and ${more} more` }] : []),
    { k: 'gap', t: '' },
    { k: 'end', t: 'Thanks for playing.' },
  ];
}
