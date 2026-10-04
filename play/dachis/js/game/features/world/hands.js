




import { SPECIES } from '../../data/species.js';

export const HANDY = SPECIES.filter((s) => s.stage >= 2 && s.look && s.look.plan === 'biped');
export const WORK_KINDS = ['washline', 'well', 'cookfire', 'fishrack', 'tools', 'crates', 'pots'];

export const HANDS = {
  
  shellhaven: { sp: 92, name: 'Dredge', lines: [
    'Hold this. No - by the corner. ...You have hands! Proper ones! Do you know how long I have waited for somebody to hold the other corner?',
    'Up top they had shops, Grandmother says. Somebody else made the bowls. Imagine. I would sit down. I would sit down for a week.'] },
  
  'tomo-coast': { sp: 107, name: 'Gully', lines: [
    'That rack is mine. Twelve fish this morning. Thirteen if you count the one the gulls took, and I do count it.',
    'You climb? Your feet look like they climb. The good coconuts are up top. I would go, but somebody has to watch the rack.'] },
  
  'kazan-village': { sp: 35, name: 'Brindle', lines: [
    'I thatched every roof in this village. Every one leaks a little different. Wake me in the night and I can tell you which hut by the drip.',
    'The mountain grumbled last night. Everyone slept. I sat up with a bucket of water. One bucket. For a volcano. I know.'] },
  
  'shrine-village': { sp: 71, name: 'Wick', lines: [
    'The priests pray. I light the lanterns they pray by. Then I put them out. Then I light them again. Very holy, that part.',
    'Do not tell the priests, but the blossoms taste of nothing. I ate one. I had to know.'] },
  
  hollowroot: { sp: 38, name: 'Spindle', lines: [
    'I tie every rope in this tree. Every knot. If you fall, come and tell me which knot it was. Do not just lie there.',
    'Mother Bramble used to hum while I worked. Now the boughs creak instead. I tie everything twice now. Three times after dark.'] },
  
  vinegate: { sp: 36, name: 'Pole', lines: [
    'Those stilts under the huts? I sank every one. The river comes up a hand a year. My hand. I measured.',
    'Walk the planks, do not bounce on them. The little ones bounce. I mend what they bounce.'] },
  
  'echo-lake': { sp: 93, name: 'Tack', lines: [
    'Every raft at every jetty, I lashed. Every one. You are welcome. Bring the pole back. Last summer the river kept eleven.',
    'They call the islands still water. It is not still. It is thinking. You can feel it think under the logs if you lie flat.'] },
  
  minehead: { sp: 20, name: 'Clinker', lines: [
    'Picks, lamps, buckets, hinges. These hands bent every one. The babies bang two rocks together and call it mining.',
    'Your bag. The stitches are all the same size. A machine did that? ...I would give a hand for a machine like that. I have two.'] },
};


export function workSpot(W) {
  for (const k of WORK_KINDS) { const o = W.objects.find((q) => q.kind === k); if (o) return { x: o.x, y: o.y, kind: k }; }
  return null;
}
