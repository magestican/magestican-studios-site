




export function board(rows, me) {
  const sorted = [...rows].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  const i = sorted.findIndex((r) => r.id === me);
  return { top: sorted.slice(0, 5), me: i >= 5 ? sorted[i] : null, myRank: i + 1 };
}
