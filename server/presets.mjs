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
    const name = next.replace('.mjs', '');
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
  const { sizes, colors, gaps, devices, radius } = definitions;
  return {
    sizes: transformText(sizes),
    colors: transformText(colors),
    gaps: transformText(gaps),
    devices: transformText(devices),
    borderRadius: transformText(radius),
  };
}

function generatePreset(name, definitions) {
  const presetsDir = process.cwd() + '/presets/';
  const parsed = parseDefinitions(definitions);
  const { borderRadius, colors, devices, sizes, spacing } = parsed;

  const source = {
    presets: [],
    theme: {
      screens: generateScreens(devices),
      colors: {
        transparent: 'transparent',
        current: 'currentColor',
        ...generateColors(colors),
      },
      borderRadius,
      spacing,
    },
  };

  const preset = 'module.exports = ' + JSON.stringify(source, null, 2);
  const json = 'export default ' + JSON.stringify({ sizes, colors, spacing, devices }, null, 2);

  writeFile(presetsDir + name + '.cjs', preset);
  writeFile(presetsDir + name + '.mjs', json);
}

function generateScreens(devices) {
  if (!devices) return;

  const entries = Object.entries(devices).map(([device, string]) => [
    device,
    string.startsWith('raw:') ? { raw: string.slice(4) } : string,
  ]);

  return {
    portrait: { raw: '(orientation: portrait)' },
    landscape: { raw: '(orientation: landscape)' },
    ...Object.fromEntries(entries),
  };
}

function generateColors(colors) {
  const entries = Object.entries(colors).map(([key, DEFAULT]) => [key, { DEFAULT }]);

  return Object.fromEntries(entries);
}

main();
