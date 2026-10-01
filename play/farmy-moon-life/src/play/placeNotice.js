


















import { flightsHome, ringView } from 'moon/world/planets.mjs';












export const ARRIVE_SECONDS = 6;
const MAX_FRAME_S = 0.1;

export function createPlaceNotice({ place, where, ring, arrive, systemSeed, count }) {
  let ringSig = null;
  let showing = 0; 

  






  function arriveOn(id, { name, home, card = null } = {}) {
    
    
    
    
    place.hidden = home;
    where.hidden = home;
    ring.hidden = home;
    where.textContent = name;
    if (!home) drawRing(id);
    if (card && !home) showCard(id, { name, card });
    else hide();
  }

  function drawRing(id) {
    const view = ringView(id, systemSeed, count);
    const sig = view.map((r) => `${r.id}${r.here ? '*' : ''}${r.home ? 'h' : ''}`).join(',');
    if (sig === ringSig) return;
    ringSig = sig;
    ring.setAttribute('aria-label', `world ${view.findIndex((r) => r.here) + 1} of ${view.length}`);
    ring.replaceChildren(...view.map((r) => {
      const dot = document.createElement('span');
      dot.className = `dot${r.home ? ' home' : ''}${r.here ? ' here' : ''}`;
      dot.dataset.planet = String(r.id);
      dot.title = r.here ? `${r.name} - you are here` : `${r.name} - ${r.flightsOn} flights on`;
      return dot;
    }));
  }

  function showCard(id, { name, card }) {
    const flights = flightsHome(id, count);
    const big = document.createElement('b');
    big.className = 'name';
    big.textContent = name;
    const kind = document.createElement('span');
    kind.className = 'kind';
    kind.textContent = card.kind || '';
    const here = document.createElement('span');
    here.className = 'here';
    here.textContent = card.here || '';
    const way = document.createElement('span');
    way.className = 'way';
    
    
    
    way.textContent = flights === 0
      ? 'You are home.'
      : `Hold Jump to fly home - ${flights} ${flights === 1 ? 'flight' : 'flights'} the long way round.`;
    arrive.replaceChildren(big, kind, ...(card.here ? [here] : []), way);
    arrive.hidden = false;
    showing = 1e-6; 
  }

  function hide() {
    arrive.hidden = true;
    showing = 0;
  }

  arrive.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); hide(); });

  return {
    arriveOn,
    
    tick(dt) {
      if (!showing) return;
      showing += Math.min(dt, MAX_FRAME_S);
      if (showing >= ARRIVE_SECONDS) hide();
    },
    hide,
    get stats() {
      return {
        name: where.hidden ? null : where.textContent,
        dots: ring.childElementCount,
        here: ring.hidden ? null : [...ring.children].findIndex((d) => d.classList.contains('here')),
        
        
        
        card: arrive.hidden ? null : [...arrive.children].map((c) => c.textContent).join(' / '),
      };
    },
  };
}
