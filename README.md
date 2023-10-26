# Design Systems as a Service

## Introduction

This service provides a way to create TailwindCSS configurations to generate design systems.

Additionally, it's possible to create component definitions reusing the same CSS classes created by Tailwind definitions.

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
name: design-system
description: This is a design system for our website
minify: true
resolve: true

# See all configuration options at https://v2.tailwindcss.com/docs/configuration

theme:
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

# Core Plugins
# Explicitly enable Tailwind features using plugins
# See plugins reference at https://v2.tailwindcss.com/docs/configuration#core-plugins

# Special values here:
# 'default' for a minimal set
# 'none' to skip all plugins
# 'border*' to include all plugins that start with 'border' (use any other plugin name)
corePlugins: default

presets:
  - 'import: @acme/internal-styles'

variantOrder: []
variants:
  fill: []

```
