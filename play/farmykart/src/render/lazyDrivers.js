



















export function driversToLoad(shown, n, neighboursReady) {
  const want = new Set();
  for (const i of shown) {
    want.add(i);
    if (neighboursReady && n > 0) {
      want.add((i - 1 + n) % n);
      want.add((i + 1) % n);
    }
  }
  return [...want].sort((a, b) => a - b);
}
