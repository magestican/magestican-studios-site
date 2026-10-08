








export const FORMS = {
  frost: { code: 1, variant: 'f', word: 'Frost form', regions: ['frostspine', 'frost-glacier', 'frost-summit'] },
  ash: { code: 2, variant: 'a', word: 'Ash form', regions: ['ember-tube', 'winding-path', 'kazan-heart', 'kazan-galleries', 'kazan-pyre'] },
  moss: { code: 3, variant: 'm', word: 'Moss form', regions: ['hollowroot', 'thornfield', 'mother-hollow', 'vinegate', 'canopy-walk', 'fig-terraces'] },
  salt: { code: 4, variant: 's', word: 'Salt form', regions: ['tomo-coast', 'shellhaven', 'kelp-maze', 'drowned-temple', 'echo-lake'] },
  
  crystal: { code: 5, variant: 'k', word: 'Crystal form', regions: ['geode-galleries', 'minehead', 'lantern-shaft', 'deep-seam'] },
  gale: { code: 6, variant: 'y', word: 'Gale form', regions: ['gale-ledges', 'ruin-steps'] },
  dusk: { code: 7, variant: 'd', word: 'Dusk form', regions: ['obsidian-court'] },
};
export const FORM_IDS =  (Object.keys(FORMS));

export const FORM_SHARE = 0.3;


export const formOfRegion = (region) => FORM_IDS.find((f) => FORMS[f].regions.includes(region)) || null;


export function rollForm(region, rand) {
  const f = formOfRegion(region);
  return f && rand() < FORM_SHARE ? f : null;
}

export const formOf = (form) => (form && Object.prototype.hasOwnProperty.call(FORMS, form) ? FORMS[ (form)] : null);


export const formVariant = (form) => { const f = formOf(form); return f ? f.variant : null; };


export const formCode = (variant) => { const f = FORM_IDS.find((k) => FORMS[k].variant === variant); return f ? FORMS[f].code : 0; };


export function formBadge(d) {
  const f = formOf(d && d.form);
  return f ? `<span class="formTag ${d && d.form}">${f.word}</span>` : '';
}


export function noteForm(dex, d) {
  if (!formOf(d.form)) return false;
  const forms = dex.forms || (dex.forms = {}), row = forms[ (d.form)] || (forms[ (d.form)] = {});
  if (row[d.sp]) return false;
  row[d.sp] = 1; return true;
}

export const formsBefriended = (dex) => Object.values((dex && dex.forms) || {}).reduce((n, row) => n + Object.keys(row).length, 0);


export function formDots(dex, sp) {
  const have = FORM_IDS.filter((f) => dex && dex.forms && dex.forms[f] && dex.forms[f][sp]);
  const dots = have.map((f) => '<i class="formDot ' + f + '" title="' + FORMS[f].word + '"></i>').join('');
  return have.length ? '<span class="formDots">' + dots + '</span>' : '';
}


export const formKinds = (dex) => FORM_IDS.filter((f) => dex && dex.forms && dex.forms[f] && Object.keys(dex.forms[f]).length).length;
