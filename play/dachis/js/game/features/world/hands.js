




import { SPECIES } from '../../data/species.js';

export const HANDY = SPECIES.filter((s) => s.stage >= 2 && s.look && s.look.plan === 'biped');
export const WORK_KINDS = ['washline', 'well', 'cookfire', 'fishrack', 'tools', 'crates', 'pots'];

export const HANDS = {
  
  shellhaven: { sp: 92, name: 'Dredge', lines: [
    'Hold this. No - the corner. ...You\'ve got hands! Real ones! Do you know how long I\'ve waited for somebody to hold the other corner?',
    'Up top they had shops, Grandmother says. Somebody else made the bowls. Can you imagine? I\'d sit down. I\'d sit down for a week.'] },
  
  'tomo-coast': { sp: 107, name: 'Gully', lines: [
    'That rack is mine. Twelve fish this morning. Thirteen if you count the one the gulls took, and I do count it.',
    'You climb? You\'ve got climbing feet. The good coconuts are up top. I\'d go, but, y\'know. Somebody\'s got to watch the rack.'] },
  
  'kazan-village': { sp: 35, name: 'Brindle', lines: [
    'I thatched every roof in this village. Every one leaks a little different. Wake me up in the middle of the night and I\'ll tell you which hut it is by the drip.',
    'The mountain grumbled last night. Everybody slept right through it. Me, I sat up with a bucket of water. One bucket. For a volcano. I know, I know.'] },
  
  'shrine-village': { sp: 71, name: 'Wick', lines: [
    'The priests pray. I light the lanterns they pray by. Then I put them out. Then I light them again. Very holy, that part.',
    'Don\'t tell the priests, but the blossoms don\'t taste like anything. I ate one. I had to know.'] },
  
  hollowroot: { sp: 38, name: 'Spindle', lines: [
    'Every rope in this tree, I tied. Every knot. If you fall, come tell me which knot it was. Don\'t just lie there groaning.',
    'Mother Bramble used to hum while I worked. Now it\'s just the boughs creaking. So I tie everything twice. Three times after dark.'] },
  
  vinegate: { sp: 36, name: 'Pole', lines: [
    'Those stilts under the huts? I sank every one. The river comes up a hand a year. My hand. I measured.',
    'Walk on the planks, don\'t bounce on \'em. The little ones bounce. Guess who mends what they bounce.'] },
  
  frostspine: { sp: 21, name: 'Rime', lines: [
    'I do the stilts. The ice moves, see? All night the lake shoves the huts around and every morning I\'m out there knocking the legs straight again. Nobody ever says thanks to a leg.',
    'The hot spring\'s mine too. Somebody\'s got to break the ice off it at dawn, and guess who. Go on, get in. Just wipe your feet after, the floor freezes.'] },
  
  'echo-lake': { sp: 93, name: 'Tack', lines: [
    'Every raft at every jetty, I lashed. Every one. You\'re welcome. And bring the pole back - last summer the river kept eleven.',
    'They call it still water out by the islands. It\'s not still. It\'s thinking. Lie flat on the logs and you can feel it think.'] },
  
  minehead: { sp: 20, name: 'Clinker', lines: [
    'Picks, lamps, buckets, hinges - these hands bent every one of \'em. The babies bang two rocks together and call it mining. Babies.',
    'Your bag. The stitches are all the same size. A machine did that? ...I\'d give a hand for a machine like that. I\'ve got two.'] },
};


export function workSpot(W) {
  for (const k of WORK_KINDS) { const o = W.objects.find((q) => q.kind === k); if (o) return { x: o.x, y: o.y, kind: k }; }
  return null;
}
