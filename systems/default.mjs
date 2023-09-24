export const unit = '10px';
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

export const gaps = `
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

export const components = {
  btn: {
    apply: 'px-4 py-2 mb-4 flex border rounded-lg',
    parts: {
      icon: 'w-16 h-16',
      label: 'px-2',
    },
  },
};
