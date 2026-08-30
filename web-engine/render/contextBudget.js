





































export function createContextBudget() {
  const holders = new Map();
  return {
    




    acquire(id, release) {
      holders.set(id, release);
      return id;
    },
    





    release(id) {
      const fn = holders.get(id);
      if (!fn) return false;
      holders.delete(id);
      fn();
      return true;
    },
    








    enterExclusive(id) {
      const victims = [...holders.keys()].filter((k) => k !== id);
      const freed = [];
      for (const k of victims) {
        const fn = holders.get(k);
        holders.delete(k);
        freed.push(k);
        fn();
      }
      return freed;
    },
    has: (id) => holders.has(id),
    live: () => [...holders.keys()],
    count: () => holders.size,
  };
}









export const pageContexts = createContextBudget();
