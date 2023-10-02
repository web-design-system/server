import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createReadStream, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import tailwind from 'tailwindcss';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import resolveConfig from 'tailwindcss/resolveConfig.js';
import Yaml from 'yaml';
import { defaultPlugins, allPlugins } from './constants.mjs';

const CWD = process.cwd();
const commentSeparator = '//';
const definitionSeparator = ':';
const getPresetPath = (name) => join(CWD, 'systems', name + '.yml');

function transformPlugins(list) {
  return !Array.isArray(list)
    ? []
    : list.flatMap((next) => {
        if (next.endsWith('*')) {
          const stem = next.slice(0, -1);
          return allPlugins.filter((p) => p.startsWith(stem));
        }

        return next;
      });
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

function parseDefinitions(definitions) {
  const { sizes, colors, spacing, devices } = definitions;

  return {
    ...definitions,
    sizes: transformText(sizes),
    colors: transformText(colors),
    spacing: transformText(spacing),
    devices: transformText(devices),
  };
}

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

function defineComponent(name, def) {
  return [
    def.variants ? '@variants ' + def.variants + ' {\n' : '',
    `.${name} {\n${(def.apply && '  @apply ' + def.apply + ';\n') || ''}}\n`,
    (def.parts &&
      Object.entries(def.parts).map(([part, classes]) => `.${name}__${part} {\n  @apply ${classes} ;\n}\n`)) ||
      [],
    def.variants ? '}' : '',
  ]
    .flat()
    .join('');
}

function generateCssTemplate(components) {
  const componentDefinitions = !components
    ? ''
    : Object.entries(components)
        .map(([name, def]) => defineComponent(name, def))
        .join('');

  const css = `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
${componentDefinitions}
}`;

  return css;
}

function combinePlugins(preset, stack = []) {
  if (preset.presets) {
    preset.presets.forEach((p) => combinePlugins(p, stack));
  }

  let plugins = preset.plugins || [];

  if (plugins === 'default') {
    plugins = defaultPlugins;
  }

  if (plugins === 'all') {
    plugins = ['*'];
  }

  stack.unshift(plugins);

  return [...new Set(stack.flat())].sort();
}

async function ensureFolder(folder) {
  return existsSync(folder) || (await mkdir(folder, { recursive: true }));
}

export function generateConfig(preset) {
  const { borderRadius, devices, spacing, presets, variants = null, theme = null } = preset;

  const screens = generateScreens(devices);
  const colors = generateColors(preset);
  const corePlugins = transformPlugins(combinePlugins(preset));
  const _ = (o) => o || {};

  const config = resolveConfig({
    ..._(corePlugins.length && { corePlugins }),
    ..._(Array.isArray(presets) && { presets: presets.map(generateConfig) }),
    ..._(variants && { variants }),
    theme: {
      extend: {
        ..._(screens && { screens }),
        ..._(colors && { colors }),
        ..._(borderRadius && { borderRadius }),
        ..._(spacing && { spacing }),
      },
      ..._(theme),
    },
  });

  delete config.presets;

  return config;
}

export async function generatePreset(definitions) {
  const parsed = parseDefinitions(definitions);
  const tailwindConfig = generateConfig(parsed);
  const json = JSON.stringify(tailwindConfig, null, 2);
  const input = generateCssTemplate(parsed.components);
  const plugins = [tailwind(tailwindConfig), autoprefixer(), definitions.minify && cssnano()].filter(Boolean);
  const processor = postcss(...plugins);

  try {
    const output = await processor.process(input, { from: '/web-design-system.css', to: '/index.css' });
    const { css } = output;

    return { error: null, css, json };
  } catch (error) {
    return { error, css: '', json };
  }
}

/**
 * @param {String} name
 * @returns {Promise<object|null>} preset
 */
export async function loadPreset(name) {
  const input = await readPreset(name);
  return (input && Yaml.parse(input)) || null;
}

export async function readPreset(name) {
  const path = getPresetPath(name);

  if (!existsSync(path)) {
    return '';
  }

  return await readFile(path, 'utf-8');
}

/**
 * @param {object} preset
 * @returns {Promise<object>} preset chain
 */
export async function loadChain(preset) {
  if (!preset.extend) {
    return preset;
  }

  const next = await loadPreset(preset.extend);
  preset.presets = [next, ...(preset.presets || [])].filter(Boolean);

  if (next?.extend) {
    await loadChain(next);
  }

  return preset;
}

export async function savePreset(name, preset) {
  const path = getPresetPath(name);
  await ensureFolder(dirname(path));
  await writeFile(path, preset, 'utf-8');
}

export async function savePresetAssets(name, preset) {
  const { json, css } = preset;
  const basePath = join(CWD, 'presets', name);
  await writeFile(basePath + '.mjs', 'export default ' + json);
  await writeFile(basePath + '.css', css);
}

export function loadPresetAsset(name) {
  const path = join(CWD, 'presets', name);

  if (existsSync(path)) {
    return createReadStream(path);
  }

  return null;
}