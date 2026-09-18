






import { GOODS } from '../economy/tables.mjs';



const TABLE = Object.freeze({
  apple: ['apples', 'an apple', 'apples'],
  peach: ['peaches', 'a peach', 'peaches'],
  cherry: ['cherries', 'a cherry', 'cherries'],
  appleSeed: ['apple seeds', 'an apple seed', 'apple seeds'],
  peachSeed: ['peach seeds', 'a peach seed', 'peach seeds'],
  cherrySeed: ['cherry seeds', 'a cherry seed', 'cherry seeds'],
  sugar: ['sugar', 'a bag of sugar', 'bags of sugar'],
  goldenApple: ['golden apples', 'a golden apple', 'golden apples'],
  moonRock: ['moon rocks', 'a moon rock', 'moon rocks'],
  gem: ['gems', 'a gem', 'gems'],
  
  
  mushroom: ['mushrooms', 'a mushroom', 'mushrooms'],
  carrot: ['carrots', 'a carrot', 'carrots'],
  potato: ['potatoes', 'a potato', 'potatoes'],
  
  truffle: ['truffles', 'a truffle', 'truffles'],
});

const words = (good) => good.replace(/([A-Z])/g, ' $1').toLowerCase();

function entry(good) {
  if (TABLE[good]) return TABLE[good];
  const plain = words(good);
  const kind = GOODS[good] && GOODS[good].kind;
  if (kind === 'jam') return [plain, `a jar of ${plain}`, `jars of ${plain}`];
  if (kind === 'drink') return [plain, `a bottle of ${plain}`, `bottles of ${plain}`];
  return [plain, `a ${plain}`, plain];
}


export function nameOf(good, count) {
  const [plain, one, many] = entry(good);
  if (count === undefined) return plain;
  return count === 1 ? one : `${count} ${many}`;
}


export function listOf(items) {
  const parts = items.map(({ good, n }) => nameOf(good, n));
  if (parts.length <= 1) return parts.join('');
  return `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`;
}
