





export function skittles(u, side, models = ['soda_can_red', 'soda_can_green', 'soda_can_blue']) {
  return [
    { model: models[0], u, side, along: 0 },
    { model: models[1], u, side: side - 0.045, along: 0.075 },
    { model: models[2], u, side: side + 0.045, along: 0.075 },
  ];
}



export function padRow(u, sides = [-0.4, 0, 0.4]) {
  
  const half = sides.length > 1 ? (sides[1] - sides[0]) / 2 : 0.3;
  return sides.map((side) => ({ u, side, half }));
}


export function canPair(u, side, models = ['soda_can_blue', 'soda_can_red']) {
  return [{ model: models[0], u, side: side - 0.06 }, { model: models[1], u, side: side + 0.06 }];
}


export function spill(model, u, side, n = 3) {
  return Array.from({ length: n }, (_, k) => ({ model, u, side: side + (k - (n - 1) / 2) * 0.12, along: k * 0.14 }));
}
