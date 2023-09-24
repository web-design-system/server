import { basename } from 'node:path';
import { readdir, writeFile } from 'node:fs/promises';

const commentSeparator = '//';
const definitionSeparator = ':';

async function main() {
  console.log('Started at ' + process.cwd());

  const systemsDir = process.cwd() + '/systems/';
  const systems = await readdir(systemsDir);

  for (const next of systems) {
    const definitions = await import(systemsDir + next);
    const name = basename(next).replace('.mjs', '');
    generatePreset(name, { ...definitions });
  }
}

function transformText(input) {
  if (!input) return undefined;

  return input
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [left, right] = line.split(definitionSeparator);
      const [value] = right.split(commentSeparator);
      return [left, value].map((s) => s.trim());
    })
    .reduce((all, next) => {
      all[next[0]] = next[1];
      return all;
    }, {});
}

function parseDefinitions(definitions) {
  const { sizes, shades, colors, gaps, devices, radius } = definitions;
  return {
    sizes: transformText(sizes),
    shades: transformText(shades),
    colors: transformText(colors),
    gaps: transformText(gaps),
    devices: transformText(devices),
    borderRadius: transformText(radius),
  };
}

function generatePreset(name, definitions) {
  const presetsDir = process.cwd() + '/presets/';
  const parsed = parseDefinitions(definitions);
  const { sizes, shades, colors, spacing, devices, borderRadius } = parsed;

  const source = {
    presets: [],
    theme: {
      screens: devices,
      colors: {
        transparent: 'transparent',
        current: 'currentColor',
        ...generateColors(colors, shades),
      },
      borderRadius,
      spacing,
    },
  };

  const preset = 'module.exports = ' + JSON.stringify(source, null, 2);
  const json = 'export default ' + JSON.stringify({ sizes, shades, colors, spacing, devices }, null, 2);

  writeFile(presetsDir + name + '.cjs', preset);
  writeFile(presetsDir + name + '.mjs', json);
}

function generateColors(definitions, shades) {}

function rgbToHsl(r, g, b) {
  (r /= 255), (g /= 255), (b /= 255);

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

  return [h, s, l];
}

main();
