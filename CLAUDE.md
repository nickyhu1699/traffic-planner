# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

胡氏清念宗祠重光庆典交通规划系统 — a single-file HTML/CSS/JS web app for planning parking and traffic management for a village celebration event (~1000 guests, ~150 cars). The app provides interactive map annotation with specialized parking lot and traffic management tools.

## Architecture

**Single-file app**: `annotator.html` contains all HTML, CSS, and JavaScript (~900 lines). No build step, no dependencies.

**Layout**: Header bar → left canvas area (satellite map) + right sidebar (tools, stats, parking lot list).

**Core data model**:
- `history[]` — array of annotation objects stored in `localStorage` (key: `traffic_planner_v2`)
- Each item has a `type` field: `draw`, `eraser`, `text`, `arrow`, `rect`, `circle`, `parking`, `traffic`, `guard`
- `parking` items carry `name`, `cap` (capacity), `current` (parked count), `color`, and position
- `guard` items carry `name` and position
- All mutations call `saveHistory()` → `localStorage.setItem()` + `updateStats()`

**Key rendering pipeline**:
- `loadImage()` loads the satellite image (`map.png`) and fits it to the canvas
- `redraw()` clears canvas, draws background with brightness filter, then iterates `history[]` calling `drawItem()` for each
- `drawItem()` dispatches by `type` to specialized renderers (`drawParking`, `drawTrafficArrow`, `drawGuard`, `drawArrow`, etc.)
- Selection uses `drawSelectionBox()` with blue dashed outline

**Interaction flow**:
- `onDown/onMove/onUp` handle all tools via mouse/touch events
- Tools like `parking` and `guard` use a popup input overlay (not `prompt()`) for name/capacity entry
- The `move` tool uses `hitTest()` → `getBBox()` for click detection on all annotation types
- `updateStats()` refreshes the sidebar statistics panel and parking lot list with +/- buttons

## Development

Open `annotator.html` directly in a browser. No server required (uses `file://` protocol). The image `map.png` must be in the same directory.

## Image Assets

- `map.png` — current satellite map used as canvas background
- `全景.png` — original satellite image (backup)
- `annotator_副本.html` — previous version backup

## Key Constants

- Parking target: 150 cars (hardcoded in `updateStats`)
- Parking lot colors cycle through `LOT_COLORS` array (8 colors)
- Brightness default: 140%
- localStorage key: `traffic_planner_v2` (changing this will reset all saved annotations)
