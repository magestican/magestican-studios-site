









































export const LORE_CHAPTERS = Object.freeze([
  {
    id: 'ch1',
    title: 'MEMO - YIELD PROGRAMME NINE',
    text: 'From the desk of Regional Operations. Head office has approved '
      + 'Programme Nine for the Hesper-4 stock decks, effective this rotation. '
      + 'The supplement is added at the feed line and requires no change to '
      + 'handling procedure. Growth figures from the trial deck are attached '
      + 'and are, frankly, remarkable. Staff are reminded that the trial deck '
      + 'remains closed for cleaning. Questions about Programme Nine should be '
      + 'directed to the Agency liaison, in writing, and not raised at muster.',
  },
  {
    id: 'ch2',
    title: 'FEED INVOICE - PERIOD FOURTEEN',
    text: 'Consolidated Agricultural Supply, invoice for period fourteen. '
      + 'Standard pellet, forty pallets. Electrolyte mix, six drums. Line 11: '
      + 'Additive P9, four drums, supplied at nil cost under the retained '
      + 'agreement, to be handled with issued gloves only. Line 12: '
      + 'replacement gloves, eighteen pairs, expedited. Note from stores: feed '
      + 'consumption on the livestock deck is running ahead of headcount, and '
      + 'has been for three periods. Please confirm the headcount. Second '
      + 'request.',
  },
  {
    id: 'ch3',
    title: 'SAFETY CIRCULAR 31',
    text: 'Effective immediately, hand contact with stock is not permitted on '
      + 'any deck. This replaces Circular 28, which permitted contact with '
      + 'issued gloves, and Circular 26, which staff should disregard. Feeding '
      + 'is by line only. Pens are to be approached in pairs, and not within '
      + 'two hours of the feed cycle. A pen that has gone quiet is to be '
      + 'logged and left. This circular is not to be posted where visiting '
      + 'inspectors may read it.',
  },
  {
    id: 'ch4',
    title: 'INCIDENT REPORT 44-C',
    text: 'Handler Aldous reports an injury to the left hand, sustained during '
      + 'the feed cycle on stock deck two. The injury is consistent with '
      + 'equipment, and equipment has been recorded as the cause. Handler '
      + 'Aldous has been reminded that descriptions of stock in incident '
      + 'paperwork are to use approved terminology, and that the word he used '
      + 'is not approved. Form nine has been filed for the animal. Form nine '
      + 'does not currently have a box for what was found in the pen, so the '
      + 'margin has been used.',
  },
  {
    id: 'ch5',
    title: 'MEMO - MEDICAL BAY',
    text: 'The medical bay is unstaffed this rotation and will remain '
      + 'unstaffed. Nurse Okafor\'s contract was not renewed following her '
      + 'report of period fifteen, which head office has reviewed and found to '
      + 'contain speculation. Minor injuries are to be self-treated from the '
      + 'wall kits, which are restocked monthly. Injuries arising from stock '
      + 'are no longer classed as workplace injuries, as stock behaviour is '
      + 'governed by Programme Nine, which is proprietary. Affected staff '
      + 'should consult the Agency, not a doctor.',
  },
  {
    id: 'ch6',
    title: 'NOTICE OF ROTATION',
    text: 'All administrative staff are rotated to the surface office '
      + 'effective the next lift cycle, per the continuity plan. This is a '
      + 'scheduled rotation and not an evacuation, and it is to be described '
      + 'as scheduled in all correspondence. Pass cards are to be surrendered '
      + 'at the lift. Mr Doyle is thanked for his service. One maintenance '
      + 'contractor is retained on station to oversee the feed line, the '
      + 'lifts, and the pens, and will be collected when collection is '
      + 'practical.',
  },
]);











export function chapterFor(level) {
  const n = LORE_CHAPTERS.length;
  const lv = Number.isFinite(level) ? Math.floor(level) : 1;
  return LORE_CHAPTERS[(((lv - 1) % n) + n) % n];
}
