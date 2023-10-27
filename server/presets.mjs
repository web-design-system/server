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
const getPresetPath = (name) => join(CWD, 'systems', name + '.yml');

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

function generateCssTemplate(presets) {
  const chain = presets.reduce((chain, next) => {
    if (next.components && typeof next.components === 'object') {
      Object.assign(chain, next.components);
    }

    return chain;
  }, {});

  const components = Object.entries(chain).map(([name, def]) => defineComponent(name, def)).join('');
  const css = `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
${components}
}

${presets[0].styles || ''}
`;

  return css;
}

async function ensureFolder(folder) {
  return existsSync(folder) || (await mkdir(folder, { recursive: true }));
}

export async function generatePreset(input) {
  const presetChain = await loadPresetChain(input);

  if (presetChain.length) {
    input.presets = presetChain;
  }

  const pluginChain = [input, ...presetChain].flatMap(p => transformPlugins(p.corePlugins)).filter(Boolean);
  const resolvedPlugins = [...new Set(pluginChain)];

  if (resolvedPlugins.length) {
    input.corePlugins = resolvedPlugins;
  }

  const tailwindConfig = input.resolve ? resolveConfig(input) : input;
  const json = JSON.stringify(tailwindConfig, null, 2);
  const cssTemplate = generateCssTemplate([input, ...presetChain]);
  const plugins = [tailwind(tailwindConfig), autoprefixer(), input.minify && cssnano()].filter(Boolean);
  const processor = postcss(...plugins);

  try {
    const output = await processor.process(cssTemplate, { from: '/web-design-system.css', to: '/index.css' });
    const { css } = output;

    return { error: null, css, json };
  } catch (error) {
    return { error, css: '', json };
  }
}

export async function readPreset(name) {
  const path = getPresetPath(name);

  if (!existsSync(path)) {
    return '';
  }

  return await readFile(path, 'utf-8');
}

/**
 * @param {String} name
 * @returns {Promise<object|null>} preset
 */
export async function loadPreset(name) {
  const input = await readPreset(name);
  return (input && Yaml.parse(input)) || null;
}

/**
 * @param {object} preset
 * @returns {Promise<object>} preset chain
 */
export async function loadPresetChain(nameOrPreset, presets = []) {
  let preset = nameOrPreset;

  if (typeof nameOrPreset === 'string') {
    preset = await loadPreset(nameOrPreset);
  }

  if (!preset) {
    return null;
  }

  if (preset.extends) {
    const extensions = typeof preset.extends === 'string' ? [preset.extends] : preset.extends || [];

    for (const extension of extensions.reverse()) {
      const next = await loadPreset(extension);
      presets.unshift(next);

      if (next?.extends) {
        await loadPresetChain(next, presets);
      }
    }
  }

  return presets.filter(Boolean);
}

export async function savePreset(name, preset) {
  const path = getPresetPath(name);
  await ensureFolder(dirname(path));
  await writeFile(path, preset, 'utf-8');
}

export async function savePresetAssets(name, preset) {
  const { json, css } = preset;
  const basePath = join(CWD, 'presets', name);
  await ensureFolder(dirname(basePath));
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

/**
 * @returns {string[]} plugins after transforming the keywords
 */
export function transformPlugins(plugins) {
  if (plugins === 'all') {
    return allPlugins;
  }

  if (plugins === 'none') {
    return [];
  }

  if (plugins === 'default') {
    plugins = defaultPlugins;
  }

  if (!Array.isArray(plugins)) {
    return [];
  }

  return plugins.flatMap((next) => {
    if (next.endsWith('*')) {
      const stem = next.slice(0, -1);
      return allPlugins.filter((p) => p.startsWith(stem));
    }

    return next;
  });
}
