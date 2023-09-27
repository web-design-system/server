# Design System as a Service

## API

### `GET /assets/:name.{css,conf.js,mjs,css.map}`

Get a precompiled CSS or the configurations used to generate it

### `POST /generate`

Transform a design system (CSS and definitions) from a JSON input

### `POST /compile/:name`

Transform a design system to a final CSS

### `POST /preset/:name`

Store a YAML definition for a design system

### `GET /preset/:name`

Retrieve the YAML definition for a design system

## Design System Definitions

```yaml
# Device breakpoints
# From smallest to largest screen

devices:
  phone: 640px
  tablet: 768px
  laptop: 1024px
  desktop: 1280px

# Color pallete
# Defines all color variants used by text-*, bg-* and other color utilities
colors: |
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

# Spacing
# Define spacing values used across padding/margin/gaps, like px-* or mt-*
# This examples defines p-0, p-1 and p-sm as valid paddings
spacing:
  0: 0
  sm: 0.5rem
  md: 1rem
  lg: 2rem

# Components
# Create components to reuse common definitions of styles
# This examples generates `btn`, `btn__icon`
components:
  btn:
    apply: px-4 py-2 bg-primary-dark hover:bg-gray
    parts:
      icon: mr-4

# Plugins
# Explicitly enable Tailwind features using plugins
# See plugins reference at https://v2.tailwindcss.com/docs/configuration#core-plugins
# This list includes ALL plugins
plugins:
  - preflight
  - container
  - accessibility
  - alignContent
  - alignItems
  - alignSelf
  - animation
  - appearance
  - backdropBlur
  - backdropBrightness
  - backdropContrast
  - backdropFilter
  - backdropGrayscale
  - backdropHueRotate
  - backdropInvert
  - backdropOpacity
  - backdropSaturate
  - backdropSepia
  - backgroundAttachment
  - backgroundBlendMode
  - backgroundClip
  - backgroundColor
  - backgroundImage
  - backgroundOpacity
  - backgroundOrigin
  - backgroundPosition
  - backgroundRepeat
  - backgroundSize
  - blur
  - borderCollapse
  - borderColor
  - borderOpacity
  - borderRadius
  - borderStyle
  - borderWidth
  - boxDecorationBreak
  - boxShadow
  - boxSizing
  - brightness
  - caretColor
  - clear
  - content
  - contrast
  - cursor
  - display
  - divideColor
  - divideOpacity
  - divideStyle
  - divideWidth
  - dropShadow
  - fill
  - filter
  - flex
  - flexDirection
  - flexGrow
  - flexShrink
  - flexWrap
  - float
  - fontFamily
  - fontSize
  - fontSmoothing
  - fontStyle
  - fontVariantNumeric
  - fontWeight
  - gap
  - gradientColorStops
  - grayscale
  - gridAutoColumns
  - gridAutoFlow
  - gridAutoRows
  - gridColumn
  - gridColumnEnd
  - gridColumnStart
  - gridRow
  - gridRowEnd
  - gridRowStart
  - gridTemplateColumns
  - gridTemplateRows
  - height
  - hueRotate
  - inset
  - invert
  - isolation
  - justifyContent
  - justifyItems
  - justifySelf
  - letterSpacing
  - lineHeight
  - listStylePosition
  - listStyleType
  - margin
  - maxHeight
  - maxWidth
  - minHeight
  - minWidth
  - mixBlendMode
  - objectFit
  - objectPosition
  - opacity
  - order
  - outline
  - overflow
  - overscrollBehavior
  - padding
  - placeContent
  - placeholderColor
  - placeholderOpacity
  - placeItems
  - placeSelf
  - pointerEvents
  - position
  - resize
  - ringColor
  - ringOffsetColor
  - ringOffsetWidth
  - ringOpacity
  - ringWidth
  - rotate
  - saturate
  - scale
  - sepia
  - skew
  - space
  - stroke
  - strokeWidth
  - tableLayout
  - textAlign
  - textColor
  - textDecoration
  - textOpacity
  - textOverflow
  - textTransform
  - transform
  - transformOrigin
  - transitionDelay
  - transitionDuration
  - transitionProperty
  - transitionTimingFunction
  - translate
  - userSelect
  - verticalAlign
  - visibility
  - whitespace
  - width
  - wordBreak
  - zIndex
```
