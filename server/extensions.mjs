import { defaultPlugins, allPlugins } from './constants.mjs';

const commentSeparator = '//';
const definitionSeparator = ':';

function generateScreens(devices) {
  if (!devices) {
    return;
  }

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

function generateColors({ colors }) {
  if (!colors) {
    return;
  }

  const entries = Object.entries(colors).map(([key, DEFAULT]) => [key, { DEFAULT }]);

  return {
    transparent: 'transparent',
    current: 'currentColor',
    ...Object.fromEntries(entries),
  };
}

function combinePlugins(preset, stack = []) {
  if (preset.presets) {
    preset.presets.forEach((p) => combinePlugins(p, stack));
  }

  let plugins = preset.corePlugins || [];

  if (plugins === 'default') {
    plugins = defaultPlugins;
  }

  if (plugins === 'all') {
    plugins = ['*'];
  }

  if (plugins === 'none') {
    plugins = [];
  }

  stack.unshift(plugins);

  return [...new Set(stack.flat())].sort();
}

function combinePresets(preset, stack = []) {
  if (preset.presets) {
    preset.presets.forEach((p) => combinePresets(p, stack));
    stack.unshift(preset.presets);
  }

  return stack.flat().filter(Boolean);
}

function transformText(input) {
  if (!input) {
    return undefined;
  }

  const source =
    typeof input === 'string'
      ? input
          .trim()
          .split('\n')
          .filter(Boolean)
          .map((line) => {
            const [left, right] = line.split(definitionSeparator);
            const [value] = right.split(commentSeparator);
            return [left, value];
          })
      : Object.entries(input);

  return source.reduce((all, next) => {
    all[String(next[0]).trim()] = String(next[1]).trim();
    return all;
  }, {});
}
