







export function noteMet(flags, n, region) {
  const id = n.kind === 'elder' ? 'elder' : n.kind === 'kumabo' ? 'kumabo' : n.id;
  const name = n.kind === 'elder' ? 'Elder Ojiji' : n.kind === 'kumabo' ? 'Kumabo' : n.name;
  if (!id || !name) return false;
  const met = flags.met || (flags.met = {});
  if (met[id]) return false;
  met[id] = { name, ...(typeof n.sp === 'number' ? { sp: n.sp } : {}), region };
  return true;
}



export function goodbyeOrder(met) {
  const ids = Object.keys(met || {});
  return [...ids.filter((id) => id !== 'kumabo'), ...ids.filter((id) => id === 'kumabo')];
}
