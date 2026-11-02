







const towers = [
  { id: 'mushroom', name: 'Mushroom', size: 'b4',
    colours: { s: '#efe3c8', r: '#d8402f', w: '#fff6e3' },
    floors: [
      ['....', '.ss.', '.ss.', '....'],
      ['....', '.ss.', '.ss.', '....'],
      ['rwrr', 'rrrr', 'rrrw', 'wrrr'],
      ['.rr.', 'rrwr', 'rrrr', '.rr.'],
    ] },
  { id: 'pine', name: 'Pine', size: 'b4',
    colours: { t: '#7a5230', g: '#2f8a4e', d: '#1f6b3b' },
    floors: [
      ['....', '.tt.', '.tt.', '....'],
      ['.gg.', 'gdgg', 'ggdg', '.gg.'],
      ['....', '.gd.', '.dg.', '....'],
      ['....', '.g..', '.gg.', '....'],
    ] },
  { id: 'mug', name: 'Mug', size: 'b4',
    colours: { c: '#e8ecf2', b: '#6b4226' },
    floors: [
      ['.cc.', 'cccc', 'cccc', '.cc.'],
      ['.cc.', 'c..c', 'c..c', '.cc.'],
      ['.cc.', 'c..c', 'cb.c', '.cc.'],
      ['.cc.', 'cb.c', 'c.bc', '.cc.'],
    ] },
  { id: 'duck', name: 'Duck', size: 'b5',
    colours: { y: '#f4c430', o: '#ee7a1f', k: '#20242c', w: '#ffe27a' },
    floors: [
      ['.....', '.yyy.', '.yyy.', '.yyy.', '.....'],
      ['.yyy.', 'yywyy', 'yyyyy', 'yywyy', '.yyy.'],
      ['.....', '.yyy.', '.y.y.', '.yyy.', '..y..'],
      ['..o..', '.kyk.', '.yyy.', '.....', '.....'],
      ['.....', '.yyy.', '..y..', '.....', '.....'],
    ] },
  { id: 'apple', name: 'Apple', size: 'b5',
    colours: { r: '#d9342b', p: '#f0574a', n: '#6a4323', g: '#4fa64a' },
    floors: [
      ['.....', '..r..', '.rrr.', '..r..', '.....'],
      ['.rpr.', 'rrrrr', 'rr.rr', 'rrrrr', '.rrr.'],
      ['.ppr.', 'prrrr', 'rr.rr', 'rrrrr', '.rrr.'],
      ['.....', '.rrr.', '.r.r.', '.rrr.', '.....'],
      ['.....', '.....', '..n..', '..ng.', '.....'],
    ] },
  { id: 'cat', name: 'Cat', size: 'b5',
    colours: { c: '#e69a3a', w: '#fff1dc', k: '#22252c', p: '#f08aa0' },
    floors: [
      ['ww.ww', 'c...c', 'c...c', 'ccccc', 'ccccc'],
      ['.....', 'ccccc', 'cc.cc', 'ccccc', '....c'],
      ['.ccc.', 'kcpck', 'ccccc', '.....', '....c'],
      ['.ccc.', 'ccccc', 'ccccc', '.....', '.....'],
      ['.c.c.', 'c...c', '.....', '.....', '.....'],
    ] },
  { id: 'lighthouse', name: 'Lighthouse', size: 'b6',
    colours: { r: '#c8352b', w: '#f2efe6', y: '#ffd76a', k: '#2c3038', g: '#6f7a86' },
    floors: [
      ['..gg..', '.gggg.', 'gg..gg', 'gg..gg', '.gggg.', '..gg..'],
      ['......', '..rr..', '.r..r.', '.r..r.', '..rr..', '......'],
      ['......', '..ww..', '.w..w.', '.w..w.', '..ww..', '......'],
      ['......', '..rr..', '.r..r.', '.r..r.', '..rr..', '......'],
      ['......', '..ww..', '.w..w.', '.w..w.', '..ww..', '......'],
      ['..kk..', '.kyyk.', 'ky..yk', 'ky..yk', '.kyyk.', '..kk..'],
    ] },
  { id: 'rocket', name: 'Rocket', size: 'b6',
    colours: { w: '#eef1f6', r: '#d93a30', b: '#2f6fd0', o: '#f59a23', g: '#9aa5b4' },
    floors: [
      ['..rr..', '......', 'r.oo.r', 'r.oo.r', '......', '..rr..'],
      ['..rr..', '.gggg.', 'rgoogr', 'rgoogr', '.gggg.', '..rr..'],
      ['......', '.wwww.', '.w..w.', '.w..w.', '.wwww.', '......'],
      ['......', '.wbbw.', '.b..b.', '.b..b.', '.wbbw.', '......'],
      ['......', '..rr..', '.rrrr.', '.rrrr.', '..rr..', '......'],
      ['......', '......', '..rr..', '..rr..', '......', '......'],
    ] },
  { id: 'castle', name: 'Castle', size: 'b6',
    colours: { s: '#b9bcc4', d: '#8d919b', r: '#b5392e', k: '#30343c', f: '#e7b53c' },
    floors: [
      ['ss..ss', 'sskkss', '.ssss.', '.ssss.', 'ssssss', 'ss..ss'],
      ['ss..ss', 's.kk.s', '.s..s.', '.s..s.', 's....s', 'ss..ss'],
      ['ss..ss', 'sdssds', '.d..d.', '.d..d.', 'sdssds', 'ss..ss'],
      ['rr..rr', 'rd..dr', '.dffd.', '.d..d.', 'rd..dr', 'rr..rr'],
      ['......', '......', '..f...', '......', '......', '......'],
      ['......', '......', '..ff..', '......', '......', '......'],
    ] },
];

export const BLOCKS = Object.freeze(towers.map((t) => Object.freeze(t)));

export const blocksOfSize = (size) => BLOCKS.filter((b) => b.size === size);
export const blockById = (id) => BLOCKS.find((b) => b.id === id) || null;
export const BLOCK_SIZES = Object.freeze(['b4', 'b5', 'b6']);
