










import { blastAt } from './blast.js';
import { groundBeside } from './terrain.js';

const CELL = 256;


export const SET_PIECES = {
  
  fuel_barge: { sheet: 'fuel-barge', side: 15, base: 186 },
};




export const setPiecesOf = (events) =>  (events.filter((e) => e.do === 'prop'));


export const setPiecesAt = (pieces, dist) => pieces.filter((p) => dist >= p.at && dist < p.until);


export function setPiecePos(stage, p) {
  const { pos, tangent } = stage.rail.at(p.anchor);
  return blastAt(pos, tangent, p.place, groundBeside(stage, p.anchor + p.place.ahead, p.place.side));
}


export const setPieceLift = (s) => (s.side * (s.base - CELL / 2)) / CELL;


export function setPieceFiles(events) {
  return [...new Set(setPiecesOf(events).map((p) => `sprites/${SET_PIECES[p.kind].sheet}/sheet.png`))];
}
