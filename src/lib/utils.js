export function lerp(a, b, t) {
  return (1 - t) * a + t * b;
}

export function* linspace(a, b, c) {
  for (let i = 0; i <= c; i++) {
    yield lerp(a, b, i / c);
  }
}

export function* map(gen, fn) {
  for (const v of gen) {
    yield fn(v);
  }
}

export function* filter(gen, pred) {
  for (const v of gen) {
    if (pred(v)) {
      yield v;
    }
  }
}

export function join(sep, gen) {
  let result = "";
  for (const v of gen) {
    if (result !== "") {
      result += sep;
    }
    result += v;
  }

  return result;
}

export function reduce(initial, fn, gen) {
  let result = initial;
  for (const v of gen) {
    result = fn(result, v);
  }

  return result;
}

export function clamp2D(min, max, xy) {
  return {
    x: clamp(min.x, max.x, xy.x),
    y: clamp(min.y, max.y, xy.y),
  };
}

export function clamp(min, max, v) {
  return Math.max(Math.min(v, max), min);
}

export function hslToHex(h, s, l) {
  h /= 360;
  s /= 100;
  l /= 100;
  let r, g, b;
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = (x) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
