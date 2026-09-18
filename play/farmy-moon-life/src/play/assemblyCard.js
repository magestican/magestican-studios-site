




















import { assemblyView } from 'moon/play/assembly.mjs';

const el = (tag, className, text) => {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text !== undefined) n.textContent = text;
  return n;
};

function button(className, label, fn, { aria = null } = {}) {
  const b = el('button', className, label);
  b.type = 'button';
  if (aria) b.setAttribute('aria-label', aria);
  b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); fn(); });
  return b;
}







export function createAssemblyCard({ el: root, onVote = () => null, onClose = () => {} }) {
  let open = false;
  let last = null;
  let result = null;
  const stats = { opens: 0, renders: 0, votes: 0 };

  
  
  
  root.addEventListener('pointerdown', (e) => e.stopPropagation());
  root.addEventListener('pointerup', (e) => e.stopPropagation());

  const card = {
    get isOpen() { return open; },
    stats,
    
    get result() { return result; },
    
    get view() { return last ? assemblyView(last.world, last.now, { poses: last.poses }) : null; },
    show() {
      if (open) return;
      open = true;
      result = null;
      stats.opens += 1;
      root.hidden = false;
      if (last) card.render(last);
    },
    hide() {
      if (!open) return;
      open = false;
      root.hidden = true;
      result = null;
      onClose();
    },

    





    render(s) {
      last = s;
      if (!open) return;
      stats.renders += 1;
      const view = assemblyView(s.world, s.now, { poses: s.poses || [] });
      
      
      if (!view && !result) { card.hide(); return; }

      const parts = [];
      const head = el('div', 'head');
      const title = el('div', 'title');
      title.append(el('b', undefined, 'The town assembly'));
      head.append(title, button('close', '×', () => card.hide(), { aria: 'Close' }));
      parts.push(head);

      if (result) {
        parts.push(...resultParts(result));
      } else {
        
        
        
        const who = view.here === view.of
          ? `Everyone is here - all ${view.of} of them.`
          : `${view.here} of ${view.of} here. Still coming: ${view.walking.join(', ')}.`;
        parts.push(el('p', 'who', who));

        const list = el('div', 'motions');
        for (const motion of view.motions) {
          const row = el('div', 'motion');
          row.setAttribute('data-motion', motion.id);
          const what = el('div', 'what');
          what.append(el('b', 'lab', motion.label));
          what.append(el('i', 'tally', `${motion.for} for, ${motion.against} against as it stands`));
          const vote = button('vote', 'Put it', () => {
            const out = onVote(motion.id);
            if (!out || out.why) return;
            stats.votes += 1;
            result = out;
            card.render(last);
          }, { aria: `Put "${motion.label}" to the vote` });
          vote.setAttribute('data-vote', motion.id);
          row.append(what, vote);
          list.append(row);
        }
        parts.push(list);
      }
      root.replaceChildren(...parts);
    },
  };

  function resultParts(out) {
    const parts = [];
    const box = el('div', 'result');
    box.setAttribute('data-carried', String(out.carried));
    box.append(el('b', undefined, out.carried ? 'Carried.' : 'Not carried.'));
    box.append(el('span', undefined, out.carried
      ? `${out.motion.label}. ${out.for} for, ${out.against} against - the town starts on it tomorrow.`
      : `${out.motion.label}. ${out.for} for, ${out.against} against. Another day, perhaps.`));
    parts.push(box);

    
    
    
    const votes = el('div', 'votes');
    for (const v of out.votes) {
      const row = el('div', 'vrow');
      row.setAttribute('data-voter', String(v.id));
      row.append(el('span', undefined, `${v.name} - ${v.because}`));
      row.append(el('span', v.yes ? 'yes' : 'no', v.yes ? 'for' : 'against'));
      votes.append(row);
    }
    parts.push(votes);
    parts.push(button('done', 'Back to the moon', () => card.hide(), { aria: 'Close the assembly' }));
    return parts;
  }

  card.hide();
  root.hidden = true;
  return card;
}
