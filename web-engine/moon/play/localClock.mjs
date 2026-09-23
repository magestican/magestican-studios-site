











const DAY_MS = 24 * 60 * 60 * 1000;


function localMs(nowMs, tzOffsetMin) {
  return nowMs - tzOffsetMin * 60000;
}


export function localHour(nowMs, tzOffsetMin = 0) {
  const m = ((localMs(nowMs, tzOffsetMin) % DAY_MS) + DAY_MS) % DAY_MS;
  return (m / DAY_MS) * 24;
}


export function localDay(nowMs, tzOffsetMin = 0) {
  return Math.floor(localMs(nowMs, tzOffsetMin) / DAY_MS);
}






export function econStartAt(nowMs, tzOffsetMin = 0, hour = 0) {
  return Math.round(localDay(nowMs, tzOffsetMin) * DAY_MS + tzOffsetMin * 60000 + hour * 3_600_000);
}
