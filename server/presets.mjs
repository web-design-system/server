import tailwind from 'tailwindcss';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';

const commentSeparator = '//';
const definitionSeparator = ':';
const defaultPlugins = [
  'preflight',
  'container',
  'accessibility',
  'alignContent',
  'alignItems',
  'alignSelf',
  'animation',
  'backgroundAttachment',
  'backgroundColor',
  'backgroundImage',
  'backgroundPosition',
  'backgroundRepeat',
  'backgroundSize',
  'blur',
  'borderCollapse',
  'borderColor',
  'borderRadius',
  'borderStyle',
  'borderWidth',
  'boxShadow',
  'content',
  'display',
  'dropShadow',
  'fill',
  'filter',
  'flex',
  'flexDirection',
  'flexGrow',
  'flexShrink',
  'flexWrap',
  'float',
  'fontFamily',
  'fontSize',
  'fontStyle',
  'fontWeight',
  'gap',
  'grayscale',
  'gridAutoColumns',
  'gridAutoFlow',
  'gridAutoRows',
  'gridColumn',
  'gridColumnEnd',
  'gridColumnStart',
  'gridRow',
  'gridRowEnd',
  'gridRowStart',
  'gridTemplateColumns',
  'gridTemplateRows',
  'height',
  'inset',
  'justifyContent',
  'justifyItems',
  'justifySelf',
  'lineHeight',
  'listStylePosition',
  'listStyleType',
  'margin',
  'maxHeight',
  'maxWidth',
  'minHeight',
  'minWidth',
  'opacity',
  'order',
  'outline',
  'overflow',
  'padding',
  'position',
  'resize',
  'ringColor',
  'ringOffsetColor',
  'ringOffsetWidth',
  'ringOpacity',
  'ringWidth',
  'rotate',
  'scale',
  'stroke',
  'strokeWidth',
  'tableLayout',
  'textAlign',
  'textColor',
  'textDecoration',
  'textOverflow',
  'transform',
  'visibility',
  'whitespace',
  'width',
  'zIndex',
];

function transformText(input) {
  if (!input) return undefined;

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
    all[next[0].trim()] = next[1].trim();
    return all;
  }, {});
}

function parseDefinitions(definitions) {
  const { sizes, colors, spacing, devices, radius } = definitions;

  return {
    ...definitions,
    sizes: transformText(sizes),
    colors: transformText(colors),
    spacing: transformText(spacing),
    devices: transformText(devices),
    borderRadius: transformText(radius),
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

function generateColors(colors) {
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

export function generateConfig(definitions) {
  const { borderRadius, colors, devices, spacing, plugins, extend = {} } = definitions;

  return {
    corePlugins: plugins || defaultPlugins,
    theme: {
      screens: generateScreens(devices),
      colors: generateColors(colors),
      borderRadius,
      spacing,
      extend,
    },
  };
}

export async function generatePreset(definitions) {
  const parsed = parseDefinitions(definitions);
  const tailwindConfig = generateConfig(parsed);
  const { sizes, components, colors, spacing, devices } = parsed;

  const config = 'module.exports = ' + JSON.stringify(tailwindConfig, null, 2);
  const json = 'export default ' + JSON.stringify({ sizes, colors, spacing, devices }, null, 2);
  const css = generateCssTemplate(components);
  const plugins = [tailwind(tailwindConfig), autoprefixer(), definitions.minify && cssnano()].filter(Boolean);
  const processor = postcss(...plugins);
  try {
    const output = await processor.process(css, { from: `web-design-system.css`, to: `index.css` });

    return {
      error: null,
      css: output.css,
      map: output.map?.toString() || '',
      config,
      definitions: json,
    };
  } catch (error) {
    return { error };
  }
}
