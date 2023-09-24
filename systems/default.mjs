export const devices = `
phone: 640px
tablet: 768px
laptop: 1024px
desktop: 1280px
`;

export const sizes = `
xs: 25%
sm: 50%
md: 100%
lg: 150%
xl: 200%
`;

export const shades = `
darkest:    -75%
dark:       -25%
DEFAULT:    100%
light:      25%
lightest:   75%
`;

export const colors = `
white:      #fff
black:      #000
gray:       #333
primary:    #0af
secondary:  #f98
danger:     #ee4444
warning:    #fbbf24
info:       #60a5fa
success:    #10b981
`;

export const spacing = `
0:    0
1:    0.25rem
2:    0.5rem
sm:   0.5rem
3:    0.75rem
4:    1rem
md:   1rem
5:    1.25rem
6:    1.5rem
lg:   2rem
`;

export const radius = `
none:     0
sm:       0.125rem
DEFAULT:  0.25rem
md:       0.375rem
lg:       0.5rem
full:     9999px
`;

export const plugins = [
  'preflight',
  'container',
  'alignContent',
  'alignItems',
  'alignSelf',
  'animation',
  'backgroundColor',
  'blur',
  'borderColor',
  'borderRadius',
  'borderStyle',
  'borderWidth',
  'boxShadow',
  'display',
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
  'gridColumn',
  'gridColumnEnd',
  'gridColumnStart',
  'gridRow',
  'gridRowEnd',
  'gridRowStart',
  'gridTemplateColumns',
  'gridTemplateRows',
  'height',
  'justifyContent',
  'justifyItems',
  'justifySelf',
  'lineHeight',
  'margin',
  'minHeight',
  'minWidth',
  'overflow',
  'padding',
  'position',
  'ringColor',
  'ringOffsetColor',
  'ringOffsetWidth',
  'ringOpacity',
  'ringWidth',
  'textAlign',
  'textColor',
  'textDecoration',
  'textOverflow',
  'visibility',
  'whitespace',
  'width',
  'zIndex',
];

export const components = {
  'btn-primary': {
    apply: 'flex border rounded-lg',
    variants: ['responsive', 'hover'],
    parts: {
      icon: 'w-16 h-16',
      label: 'p-2',
    },
  },
};
