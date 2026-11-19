










const T = Symbol('text'), H = Symbol('hidden'), X = Symbol('transform'), D = Symbol('data');

export function setText(el, v) {
  if (el[T] === v) return;
  el[T] = v; el.textContent = v;
}

export function setHidden(el, v) {
  v = !!v;
  if (el[H] === v) return;
  el[H] = v; el.hidden = v;
}

export function setTransform(el, v) {
  if (el[X] === v) return;
  el[X] = v; el.style.transform = v;
}

export function setData(el, key, v) {
  const m = el[D] || (el[D] = {});
  if (m[key] === v) return;
  m[key] = v; el.dataset[key] = v;
}
