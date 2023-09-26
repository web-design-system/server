# Design System as a Service

## API

### `GET /presets/:name.{css,conf.js,mjs,css.map}`

Get a precompiled CSS or the configurations used to generate it

### `POST /generate`

Generate a design system (CSS and definitions) from a JSON input

### `POST /compile`

Compile a previously created design system

### `POST /update/:name`

Store a YAML definition file for a design system

## Device breakpoints

```js
export const devices = `
phone: 640px
tablet: 768px
laptop: 1024px
desktop: 1280px
`;
```

## Color pallete

```js
export const colors = `
white: #fff
black: #000
gray: #333
primary: #0af
primary-dark: #09e
secondary: #f98
danger: #ee4444
warning: #fbbf24
info: #60a5fa
success: #10b981
`;
```

## Spacing

Define spacing values used across padding/margin/gaps

```js
export const spacing = `
0: 0
1: 0.25rem
2: 0.5rem
sm: 0.5rem
3: 0.75rem
4: 1rem
md: 1rem
5: 1.25rem
6: 1.5rem
lg: 2rem
`;
```

## Components

Create components to reuse common definitions of styles

```js
export const components = {
  btn: {
    apply: 'px-4 py-2 bg-primary-dark hover:bg-gray',
    variants: ['hover', 'responsive'],
    parts: {
      icon: 'mr-4',
    },
  },
};
```

## Plugins

Explicitly enable features per plugin.
See [plugin reference](https://v2.tailwindcss.com/docs/configuration#core-plugins)

```js
export const plugins = [
  'preflight',
  'container',
  'accessibility',
  'alignContent',
  'alignItems',
  'alignSelf',
  'animation',
  'appearance',
  'backdropBlur',
  'backdropBrightness',
  'backdropContrast',
  'backdropFilter',
  'backdropGrayscale',
  'backdropHueRotate',
  'backdropInvert',
  'backdropOpacity',
  'backdropSaturate',
  'backdropSepia',
  'backgroundAttachment',
  'backgroundBlendMode',
  'backgroundClip',
  'backgroundColor',
  'backgroundImage',
  'backgroundOpacity',
  'backgroundOrigin',
  'backgroundPosition',
  'backgroundRepeat',
  'backgroundSize',
  'blur',
  'borderCollapse',
  'borderColor',
  'borderOpacity',
  'borderRadius',
  'borderStyle',
  'borderWidth',
  'boxDecorationBreak',
  'boxShadow',
  'boxSizing',
  'brightness',
  'caretColor',
  'clear',
  'content',
  'contrast',
  'cursor',
  'display',
  'divideColor',
  'divideOpacity',
  'divideStyle',
  'divideWidth',
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
  'fontSmoothing',
  'fontStyle',
  'fontVariantNumeric',
  'fontWeight',
  'gap',
  'gradientColorStops',
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
  'hueRotate',
  'inset',
  'invert',
  'isolation',
  'justifyContent',
  'justifyItems',
  'justifySelf',
  'letterSpacing',
  'lineHeight',
  'listStylePosition',
  'listStyleType',
  'margin',
  'maxHeight',
  'maxWidth',
  'minHeight',
  'minWidth',
  'mixBlendMode',
  'objectFit',
  'objectPosition',
  'opacity',
  'order',
  'outline',
  'overflow',
  'overscrollBehavior',
  'padding',
  'placeContent',
  'placeholderColor',
  'placeholderOpacity',
  'placeItems',
  'placeSelf',
  'pointerEvents',
  'position',
  'resize',
  'ringColor',
  'ringOffsetColor',
  'ringOffsetWidth',
  'ringOpacity',
  'ringWidth',
  'rotate',
  'saturate',
  'scale',
  'sepia',
  'skew',
  'space',
  'stroke',
  'strokeWidth',
  'tableLayout',
  'textAlign',
  'textColor',
  'textDecoration',
  'textOpacity',
  'textOverflow',
  'textTransform',
  'transform',
  'transformOrigin',
  'transitionDelay',
  'transitionDuration',
  'transitionProperty',
  'transitionTimingFunction',
  'translate',
  'userSelect',
  'verticalAlign',
  'visibility',
  'whitespace',
  'width',
  'wordBreak',
  'zIndex',
];
```
