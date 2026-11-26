import { buildHub } from './hub.js';
import { buildW1, buildW2, buildW3, buildW4 } from './worlds1.js';
import { buildW5, buildW6, buildW7, buildFinale } from './worlds2.js';

export const LEVELS = {
  hub: buildHub,
  w1: buildW1,
  w2: buildW2,
  w3: buildW3,
  w4: buildW4,
  w5: buildW5,
  w6: buildW6,
  w7: buildW7,
  finale: buildFinale,
};
