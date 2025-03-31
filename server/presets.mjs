import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createReadStream, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import tailwind from 'tailwindcss';
import resolveConfig from 'tailwindcss/resolveConfig.js';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import Yaml from 'yaml';
import { defaultPlugins, allPlugins } from './constants.mjs';
import { exec } from '@cloud-cli/exec';

const CWD = process.cwd();
const getPresetPath = (name) => join(CWD, 'systems', name + '.yml');
const each = (v) => (!v ? [] : Object.entries(v));

function expandRules(items) {
  return items.map((item) => (item ? item[0] + `{ @apply ${item[1]}; }\n` : '')).filter(Boolean);
}

function generateComponentRoot(name, classes) {
  return !classes ? [] : [[`.${name}`, classes]];
}

function generateComponentParts(name, def, separator) {
  return each(def).map(([part, c]) => [`.${name}${separator}${part}`, c]);
}

function generateShadowComponentParts(name, parts) {
  return each(parts).map(([part, c]) => [`${name}::part(${part})`, c]);
}

function generateShadowComponentStates(name, def) {
  return each(def).map(([part, c]) => [`${name}::part(component):${part}`, c]);
}

function generateShadowComponentVariants(name, variants) {
  return each(variants).map(([variant, c]) => [`${name}.${name}-${variant}::part(component)`, c]);
}

function generateShadowComponentRoot(name, classes) {
  return !classes ? [] : [[`${name}::part(component)`, classes]];
}

function defineComponent(name, def, useShadowDom) {
  const all = useShadowDom
    ? [
        generateShadowComponentRoot(name, def.apply),
        generateShadowComponentParts(name, def.parts),
        generateShadowComponentStates(name, def.states),
        generateShadowComponentVariants(name, def.variants, '-'),
      ]
    : [
        generateComponentRoot(name, def.apply),
        generateComponentParts(name, def.parts, '__'),
        generateComponentParts(name, def.modifiers, '--'),
        generateComponentParts(name, def.variants, '-'),
        generateComponentParts(name, def.states, ':'),
      ];

  return all.map(expandRules).flat(2).join('');
}

function generateCssSafelist(presets) {
  const classes = [];

  presets.forEach((next) => {
    if (!(next.components && typeof next.components === 'object')) return;

    Object.entries(next.components).forEach(([name, def]) => {
      classes.push(name);

      if (def.parts) {
        classes.push(...Object.keys(def.parts).map((key) => name + '__' + key));
      }

      if (def.modifiers) {
        classes.push(...Object.keys(def.modifiers).map((key) => name + '--' + key));
      }

      if (def.variants) {
        classes.push(...Object.keys(def.variants).map((key) => name + '-' + key));
      }
    });
  });

  return classes;
}

function mergePresetVariables(presets) {
  const variables = {};

  for (const next of presets) {
    if (next.variables) {
      Object.assign(variables, next.variables);
    }
  }

  return variables;
}

function generateCssTemplate(presets, useShadowDom) {
  const styles = [];
  const variables = {};
  const chain = presets.reduce((chain, next) => {
    if (next.theme) {
      chain.theme = Object.assign({}, chain.theme, next.theme);
    }

    if (next.variables) {
      chain.variables = Object.assign({}, chain.variables, next.variables);
    }

    if (next.components && typeof next.components === 'object') {
      Object.assign(chain, next.components);
    }

    if (next.styles) {
      styles.push(next.styles);
    }

    if (next.variables) {
      Object.assign(variables, next.variables);
    }

    return chain;
  }, {});

  const components = Object.entries(chain)
    .map(([name, def]) => defineComponent(name, def, useShadowDom))
    .join('');
  const allVariables = Object.entries(variables)
    .map(([key, value]) => `--${key}: ${value};`)
    .join('\n');
  const css = `:root{
  ${allVariables}
}
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
${components}
}

${styles.join('')}
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

  const allPresets = [...presetChain, input];
  const pluginChain = allPresets.flatMap((p) => transformPlugins(p.corePlugins)).filter(Boolean);
  const resolvedPlugins = [...new Set(pluginChain)];

  if (resolvedPlugins.length) {
    input.corePlugins = resolvedPlugins;
  }

  const tailwindConfig = input.resolve ? resolveConfig(input) : input;

  if (input.autoPurge) {
    tailwindConfig.purge = {
      enabled: true,
      content: ['*.xyz'],
      safelist: generateCssSafelist(allPresets),
    };
  }


  const variables = Object.entries(mergePresetVariables(allPresets))
  if (variables.length) {
    tailwindConfig.configViewer = {
      themeReplacements: Object.fromEntries(
        variables.map(([key, value]) => [`var(--${key})`, value]),
      ),
    };
  }

  const json = JSON.stringify(tailwindConfig, null, 2);
  const cssTemplate = generateCssTemplate(allPresets, input.shadowDom || input['shadow-dom']);
  const plugins = [tailwind(tailwindConfig), autoprefixer(), input.minify && cssnano()].filter(Boolean);
  const processor = postcss(...plugins);

  try {
    const output = await processor.process(cssTemplate, {
      from: '/web-design-system.css',
      to: '/index.css',
    });
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
  const mjsFile = basePath + '.mjs';
  const cssFile = basePath + '.css';

  await ensureFolder(dirname(basePath));
  await writeFile(mjsFile, 'export default ' + json);
  await writeFile(cssFile, css);
  const preview = await exec('npx', ['tailwind-config-viewer', 'export', '-c', mjsFile, basePath]);
  if (!preview.ok) {
    console.log(preview.stdout, preview.stderr);
  }
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
