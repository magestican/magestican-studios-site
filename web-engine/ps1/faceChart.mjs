


















































export function makeRowMap(rows) {
  if (!Array.isArray(rows) || rows.length < 2) {
    throw new Error('makeRowMap needs at least two rings');
  }
  for (let i = 1; i < rows.length; i += 1) {
    if (!(rows[i].z < rows[i - 1].z)) {
      
      
      
      throw new Error(`ring ${i} is not below ring ${i - 1} (${rows[i].z} vs ${rows[i - 1].z})`);
    }
  }

  const slope = (p, q) => (q.v - p.v) / (p.z - q.z);   

  return (z) => {
    const top = rows[0];
    if (z >= top.z) return top.v - (z - top.z) * slope(top, rows[1]);
    const bot = rows[rows.length - 1];
    if (z <= bot.z) {
      return bot.v + (bot.z - z) * slope(rows[rows.length - 2], bot);
    }
    for (let i = 0; i + 1 < rows.length; i += 1) {
      const p = rows[i]; const q = rows[i + 1];
      if (z <= p.z && z >= q.z) {
        return p.v + (q.v - p.v) * ((p.z - z) / (p.z - q.z));
      }
    }
    
    
    throw new Error(`no segment covers z ${z}`);
  };
}







export function twoPointRowMap(rows) {
  const a = rows[0];
  const b = rows[rows.length - 1];
  const px = (b.v - a.v) / (a.z - b.z);
  return (z) => a.v + (a.z - z) * px;
}
