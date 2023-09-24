// @param {String} color  #0af or #00aaff
// @returns [h, s, l]
function rgbToHsl(color) {
  let [r, g, b] = fromColor(color);
  r /= 255;
  g /= 255;
  b /= 255;

  let max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;

  if (max == min) {
    h = s = 0;
  } else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }

  // h = Math.round(h * 100);
  // s = Math.round(s * 100);
  // l = Math.round(l * 100);

  return [h, s, l];
}

// @param {String} color  #0af or #00aaff
function fromColor(color) {
  color = color.slice(1);

  if (color.length === 3) {
    return color.split('').map((c) => parseInt(c + c, 16));
  }

  return [parseInt(color.slice(0, 2), 16), parseInt(color.slice(2, 4), 16), parseInt(color.slice(4, 6), 16)];
}