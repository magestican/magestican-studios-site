




import { PICTURES, pictureById, picturesOfSize } from './pictures.js';
import { BLOCKS, BLOCK_SIZES, blockById, blocksOfSize } from './blocks.js';

export const TOWERS = Object.freeze([...PICTURES, ...BLOCKS]);

export const towerById = (id) => pictureById(id) ?? blockById(id);

export const isBlock = (tower) => Array.isArray(tower?.floors);


export const groupOf = (tower) => (isBlock(tower) ? tower.size : tower.lines.length);

export const towersOfGroup = (group) => (BLOCK_SIZES.includes(group) ? blocksOfSize(group) : picturesOfSize(group));


export const blockSide = (group) => (BLOCK_SIZES.includes(group) ? Number(group.slice(1)) : null);
