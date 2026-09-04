














import { COLORS, SIZES } from '../../../web-engine/words/style.js';
import { GAMES } from '../../../web-engine/words/puzzlePick.js';
import { describeHome } from '../../../web-engine/words/describe.js';
import { rectAt } from '../../../web-engine/words/layout.js';
import { progress, lift, sink, easeOut, DURATION } from '../../../web-engine/words/motion.js';
import * as paint from './paint.js';

export function create(app) {
  let cards = [];
  let hover = -1;
  let hoverAt = 0;
  let press = -1;
  let pressAt = 0;
  let cursor = 0;
  let box = { x: 0, y: 0, width: 0, height: 0 };
  const bornAt = app.now();

  function layout(area) {
    box = area;
    
    
    
    const cols = area.width >= 760 ? 2 : 1;
    const rows = Math.ceil(GAMES.length / cols);
    const gap = 14;
    const cardW = Math.floor((area.width - gap * (cols - 1)) / cols);
    const headH = 116;
    const footH = 52;
    const available = area.height - headH - footH;
    
    
    
    
    const cardH = Math.max(96, Math.min(240, Math.floor((available - gap * (rows - 1)) / rows)));
    const block = rows * cardH + gap * (rows - 1);
    
    
    
    const top = area.y + headH + Math.min(40, Math.max(0, Math.round((available - block) / 2)));
    cards = GAMES.map((g, i) => ({
      x: area.x + (i % cols) * (cardW + gap),
      y: top + Math.floor(i / cols) * (cardH + gap),
      w: cardW,
      h: cardH,
      game: g,
    }));
  }

  function draw(g, now) {
    const head = { x: box.x, y: box.y + 8, width: box.width, height: 52 };
    paint.text(g, 'Farmy Crosswords', head, { size: SIZES.h1, colour: COLORS.ink });
    paint.text(g, 'Four word games. Nothing is timed.',
      { x: box.x, y: box.y + 64, width: box.width, height: 32 },
      { size: SIZES.base, weight: 400, colour: COLORS.inkSoft });

    cards.forEach((c, i) => {
      
      
      
      
      const in_ = easeOut(progress(now, bornAt + i * 45, DURATION.fade, app.motion));
      const rise = (1 - in_) * 14;
      const isHover = i === hover;
      const isPress = i === press;
      const up = isHover ? lift(progress(now, hoverAt, DURATION.hover, app.motion), app.motion) : 0;
      const down = isPress ? sink(progress(now, pressAt, DURATION.press, app.motion), app.motion) : 0;
      paint.surface(g, { ...c, y: c.y + rise }, {
        offset: Math.max(0, SIZES.shadow + up - down), dy: down, alpha: in_,
      });

      const pad = 20;
      const numberBox = { x: c.x + pad, y: c.y + down + rise, w: 30, h: c.h };
      paint.text(g, String(i + 1), numberBox, { size: SIZES.h2, colour: COLORS.inkSoft });

      
      
      
      const art = Math.min(72, c.h - 28);
      paint.emblem(g, c.game.id, {
        x: c.x + pad + 34, y: c.y + down + rise + (c.h - art) / 2, w: art, h: art,
      });

      const textLeft = c.x + pad + 42 + art;
      const textW = c.w - pad * 2 - 42 - art;
      paint.text(g, c.game.name,
        { x: textLeft, y: c.y + down + rise + c.h / 2 - 26, w: textW, h: 32 },
        { size: SIZES.h2, colour: COLORS.ink, align: 'left', fit: true, maxWidth: textW });
      paint.text(g, c.game.blurb,
        { x: textLeft, y: c.y + down + rise + c.h / 2 + 8, w: textW, h: 26 },
        { size: SIZES.small, weight: 400, colour: COLORS.inkSoft, align: 'left', fit: true, maxWidth: textW });

      if (i === cursor && app.keyboardMode) paint.focusRing(g, { ...c, y: c.y + down });
    });

    const last = cards[cards.length - 1];
    const footY = (last ? last.y + last.h : box.y) + 14;
    
    
    paint.text(g, 'Press 1 to 4, or just start typing.',
      { x: box.x, y: footY, width: box.width, height: 28 },
      { size: SIZES.small, weight: 400, colour: COLORS.inkSoft });
  }

  function hoverAtPoint(pt) {
    const i = pt ? rectAt(cards, pt.x, pt.y) : -1;
    if (i !== hover) { hover = i; hoverAt = app.now(); app.invalidate(); }
    return i;
  }

  return {
    id: 'home',
    layout,
    rects: () => cards.map((c) => ({ id: `card:${c.game.id}`, x: c.x, y: c.y, w: c.w, h: c.h })),
    draw,
    cursorRect: () => cards[cursor],
    pointerMove: (pt) => { hoverAtPoint(pt); },
    pointerLeave: () => { hoverAtPoint(null); press = -1; },
    pointerDown: (pt) => {
      press = rectAt(cards, pt.x, pt.y);
      pressAt = app.now();
      if (press >= 0) app.sound('press');
      app.invalidate();
    },
    pointerUp: (pt) => {
      const i = rectAt(cards, pt.x, pt.y);
      const was = press;
      press = -1;
      app.invalidate();
      if (i >= 0 && i === was) app.openGame(cards[i].game.id);
    },
    key: (action) => {
      if (action.type === 'move') {
        const cols = box.width >= 760 ? 2 : 1;
        const next = cursor + (action.dy * cols) + action.dx;
        if (next >= 0 && next < cards.length) { cursor = next; app.invalidate(); }
        return true;
      }
      if (action.type === 'submit') { app.openGame(cards[cursor].game.id); return true; }
      return false;
    },
    describe: () => describeHome(GAMES),
    
    animating: (now) => app.motion && (
      now - hoverAt < DURATION.hover
      || now - pressAt < DURATION.press
      || now - bornAt < DURATION.fade + 45 * cards.length
    ),
    keys: 'Press 1 to 4 to choose a game, or type a letter to start Wordle. Arrow keys move, Enter opens.',
    
    
    easeOut,
  };
}
