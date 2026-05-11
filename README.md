# Aether

A Figma-inspired infinite canvas design tool built as a TurboRepo monorepo. Aether is engineered from first principles — no canvas libraries, no off-the-shelf diagram frameworks. Every interaction (pan, zoom, resize, inspect) is implemented directly against the DOM and browser event APIs.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
- [Architecture](#architecture)
  - [Coordinate System](#coordinate-system)
  - [Canvas Engine](#canvas-engine)
  - [State Management](#state-management)
  - [Transformer (Resize)](#transformer-resize)
  - [Inspector Panel](#inspector-panel)
  - [Layers Panel](#layers-panel)
- [Data Model](#data-model)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Interaction Reference](#interaction-reference)
- [Package Reference](#package-reference)
- [Development Guide](#development-guide)
  - [Adding a New Shape Type](#adding-a-new-shape-type)
  - [Adding a New Tool](#adding-a-new-tool)
  - [Adding a New Inspector Field](#adding-a-new-inspector-field)
- [Roadmap](#roadmap)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Monorepo | [TurboRepo](https://turbo.build) v2 |
| Package manager | [pnpm](https://pnpm.io) v9 workspaces |
| Framework | [Next.js](https://nextjs.org) 15 (App Router, Turbopack) |
| Language | TypeScript 5 — strict mode throughout |
| Styling | Tailwind CSS 3 + global CSS for browser primitives |
| Animation | [Framer Motion](https://www.framer.com/motion) 11 |
| State | [Zustand](https://zustand-demo.pmnd.rs) 5 |
| Icons | [Lucide React](https://lucide.dev) |
| Rendering | Plain HTML `div` elements transformed via CSS — no `<canvas>`, no SVG scene graph |

---

## Repository Structure

```
aether/
├── turbo.json                    # Task pipeline (build, dev, lint, type-check)
├── pnpm-workspace.yaml           # Workspace globs
├── package.json                  # Root devDependencies (turbo, typescript)
│
├── packages/
│   ├── types/                    # @aether/types — shared TypeScript interfaces
│   │   └── src/index.ts
│   └── ui/                       # @aether/ui — shared React components
│       └── src/
│           ├── GlassCard.tsx
│           └── index.ts
│
└── apps/
    └── web/                      # @aether/web — the design tool
        ├── next.config.ts
        ├── tailwind.config.ts
        ├── postcss.config.js
        ├── tsconfig.json
        └── src/
            ├── app/
            │   ├── layout.tsx
            │   ├── page.tsx         # Three-column workspace layout
            │   └── globals.css
            ├── store/
            │   └── canvasStore.ts   # Zustand store
            └── components/
                ├── Canvas/
                │   ├── InfiniteCanvas.tsx   # Viewport, pan, zoom, placement
                │   ├── CanvasElement.tsx    # Single element renderer
                │   └── Transformer.tsx      # Selection bounding box + resize handles
                ├── Toolbar/
                │   └── Toolbar.tsx          # Floating tool switcher
                ├── TopBar/
                │   └── TopBar.tsx           # App header with layer count
                ├── Inspector/
                │   └── InspectorPanel.tsx   # Right sidebar — properties editor
                └── Layers/
                    └── LayersPanel.tsx      # Left sidebar — layer list
```

---

## Getting Started

**Prerequisites:** Node ≥ 20, pnpm ≥ 9 (install via `brew install pnpm`).

```bash
# Clone and install
git clone <repo-url> aether
cd aether
pnpm install

# Start the dev server (http://localhost:3000)
pnpm dev

# Type-check all packages
pnpm type-check

# Build for production
pnpm build
```

The `pnpm dev` command uses TurboRepo to run `next dev --turbopack` inside `apps/web`. Hot reload is active on all source files including workspace packages (`@aether/types`, `@aether/ui`), because Next.js is configured with `transpilePackages`.

---

## Architecture

### Coordinate System

Aether uses two coordinate spaces throughout:

```
Canvas space    — the logical coordinate system shapes live in (x, y, width, height in SceneNode)
Screen space    — pixels relative to the top-left corner of the canvas container div
```

The relationship between them is the **viewport transform** `{ x: panX, y: panY, scale }`:

```
screenX = canvasX * scale + panX
screenY = canvasY * scale + panY

canvasX = (screenX - panX) / scale
canvasY = (screenY - panY) / scale
```

The transform is applied as a single CSS transform on the canvas root `div`:

```css
transform: translate(panX px, panY px) scale(scale);
transform-origin: 0 0;
```

Because `transform-origin` is `0 0`, scale and translate compose without any origin offset math — the formula above is exact at all zoom levels.

---

### Canvas Engine

**File:** `apps/web/src/components/Canvas/InfiniteCanvas.tsx`

The engine owns three responsibilities:

#### 1. Panning — Spacebar + Drag

`isSpaceDown` is tracked via `window` keydown/keyup. When space is held, the next `mousedown` starts a pan by recording the start mouse position and start viewport offset in a `dragRef`. Global `window.mousemove` updates the viewport each frame:

```
viewport.x = startViewportX + (currentMouseX - startMouseX)
viewport.y = startViewportY + (currentMouseY - startMouseY)
```

#### 2. Zooming — Cmd + Scroll

A non-passive `wheel` listener on the canvas container fires on `Cmd+Wheel` (or trackpad pinch). Zoom is **exponential** to feel linear at all scales:

```
factor   = Math.exp(-deltaY * ZOOM_SENSITIVITY * 3)
newScale = clamp(currentScale * factor, MIN_SCALE, MAX_SCALE)
```

The viewport offsets are adjusted to keep the point under the cursor stationary:

```
viewport.x = mouseX - (mouseX - viewport.x) * (newScale / currentScale)
viewport.y = mouseY - (mouseY - viewport.y) * (newScale / currentScale)
```

#### 3. Shape Placement — Tool Click

When an active drawing tool (`rect`, `circle`) is set and the user clicks on the canvas, `screenToCanvas` converts the click coordinates to canvas space and `addElement` writes to the Zustand store. The tool automatically resets to `select` after placement.

#### Stale-closure prevention

All `window` event listeners are registered **once** (empty `useEffect` dependency array). Mutable values that must be read inside those listeners — `viewport`, `activeTool`, `elements` — are mirrored into `useRef` objects that update on every render. The listener reads from the ref, never from a captured closure value.

```typescript
// Wrong — captures stale `viewport` at registration time:
window.addEventListener('mousemove', (e) => {
  doSomethingWith(viewport); // stale!
});

// Correct — reads from ref, always fresh:
const viewportRef = useRef(viewport);
useEffect(() => { viewportRef.current = viewport; }, [viewport]);

window.addEventListener('mousemove', (e) => {
  doSomethingWith(viewportRef.current); // always current
});
```

#### DOM structure

The canvas uses a two-div structure so the Transformer SVG overlay is never clipped:

```
<div>                              ← outer wrapper (no overflow restriction)
  <div overflow:hidden>            ← clips canvas content; owns mouse/wheel events
    dot-grid div
    <div transform>                ← canvas-space transform root
      <CanvasElement /> × N
    </div>
    zoom % badge
  </div>
  <AnimatePresence>
    <Transformer />                ← SVG outside overflow:hidden; handles never clip
  </AnimatePresence>
</div>
```

---

### State Management

**File:** `apps/web/src/store/canvasStore.ts`

A single flat Zustand store. No slices, no middleware.

```typescript
interface CanvasState {
  elements:         SceneNode[];       // ordered array; last = topmost z-order
  selectedElementId: string | null;
  activeTool:       ToolType;          // 'select' | 'rect' | 'circle'

  addElement:    (element: SceneNode) => void;
  updateElement: (id: string, update: Partial<SceneNode>) => void;
  removeElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  setActiveTool: (tool: ToolType) => void;
}
```

`updateElement` uses an immutable map — only the target element object is replaced, so React bailouts on unchanged elements work correctly. Multiple properties can be batched into one call:

```typescript
updateElement(id, { x: 120, y: 80, width: 200 }); // single store write
```

Components that only care about a subset of state should use **selector subscriptions** to avoid re-rendering on unrelated changes:

```typescript
// Re-renders only when selectedElementId changes
const selectedId = useCanvasStore((s) => s.selectedElementId);
```

---

### Transformer (Resize)

**File:** `apps/web/src/components/Canvas/Transformer.tsx`

The Transformer is an SVG overlay that renders a bounding box and 8 resize handles around the selected element. Coordinates are computed in screen space (relative to the canvas container):

```
screenX = element.x * viewport.scale + viewport.x
screenY = element.y * viewport.scale + viewport.y
screenW = element.width  * viewport.scale
screenH = element.height * viewport.scale
```

#### Resize handle math

Each of the 8 handles has a config table that encodes which axes it controls:

```
Handle    xFactor  yFactor  wFactor  hFactor  Meaning
──────────────────────────────────────────────────────────────
tl           1        1       -1       -1      Top-left corner
t            0        1        0       -1      Top edge
tr           0        1       +1       -1      Top-right corner
r            0        0       +1        0      Right edge
br           0        0       +1       +1      Bottom-right corner
b            0        0        0       +1      Bottom edge
bl           1        0       -1       +1      Bottom-left corner
l            1        0       -1        0      Left edge
```

On each `mousemove` during resize:

```typescript
const dx = (e.clientX - startMouseX) / viewport.scale; // canvas units
const dy = (e.clientY - startMouseY) / viewport.scale;

newX = startX + cfg.xFactor * dx;  // non-zero only for left-edge handles
newY = startY + cfg.yFactor * dy;
newW = startW + cfg.wFactor * dx;  // -1: left shrinks; +1: right grows
newH = startH + cfg.hFactor * dy;
```

This keeps the **opposing edge pinned** at all times. For example, dragging the `tl` handle right increases `x` and decreases `width` by exactly the same amount, so the right edge stays fixed.

Minimum dimension clamping also adjusts the origin to maintain the opposing edge:

```typescript
if (newW < MIN_DIM) {
  if (cfg.xFactor !== 0) newX = startX + startW - MIN_DIM; // pin right edge
  newW = MIN_DIM;
}
```

#### Why `useEffect([], [])` with refs

The window mousemove/mouseup handlers are registered once (empty dependency array). All values they need — `viewport`, `onResize`, `element.id` — are written into refs (`viewportRef`, `onResizeRef`, `elementIdRef`) that stay current without causing listener re-registration. This eliminates a class of double-firing bugs that appear when listeners are torn down and re-attached during an active drag.

---

### Inspector Panel

**File:** `apps/web/src/components/Inspector/InspectorPanel.tsx`

The inspector provides **two-way data binding** between the canvas and the form inputs.

#### `NumberInput` component

The core challenge: a controlled `<input type="number">` that reflects canvas drag updates live, but doesn't fight the user while they're typing.

Solution — track `focused` state:

```typescript
const [local, setLocal]   = useState(value.toFixed(precision));
const [focused, setFocused] = useState(false);

// Sync from store only while the input is not focused
useEffect(() => {
  if (!focused) setLocal(value.toFixed(precision));
}, [value, focused, precision]);
```

When `focused` is `false` (user is not typing), any store update (e.g., from a canvas drag) flows immediately into the input. When `focused` is `true`, the user's keystrokes update `local` state and call `onChange` live so the canvas responds in real-time. On `blur`, the final value is committed.

#### Fill color input

Two controls share the same underlying value:

- A `<input type="color">` hidden behind a styled div swatch — provides a native OS color picker on click
- A hex `<input type="text">` — validated against `/^#[0-9a-fA-F]{6}$/` before committing

#### Opacity

Stored as `0–1` in `SceneNode`, displayed as `0–100%` in the UI. The range slider and number input are kept in sync by both deriving from `element.opacity`.

---

### Layers Panel

**File:** `apps/web/src/components/Layers/LayersPanel.tsx`

The layer list displays elements in **reverse array order** so the topmost z-order layer appears at the top of the panel (matching Figma convention):

```typescript
const displayed = [...elements].reverse();
// displayed[0] = last element added = highest z-order = "Layer 1"
```

Framer Motion `AnimatePresence` wraps each layer item, providing smooth enter/exit animations when elements are added or deleted. The `layoutId="layer-accent"` prop on the selection indicator causes it to animate between layers when selection changes rather than instantly jumping.

Right-clicking a layer item calls `removeElement`, providing a quick delete without keyboard access.

---

## Data Model

### `SceneNode` — `@aether/types`

```typescript
interface SceneNode {
  id:      string;          // crypto.randomUUID() at creation
  type:    'rect' | 'circle';
  x:       number;          // canvas-space top-left X
  y:       number;          // canvas-space top-left Y
  width:   number;          // canvas-space width  (always >= 10)
  height:  number;          // canvas-space height (always >= 10)
  fill:    string;          // CSS hex color e.g. "#6366f1"
  opacity: number;          // 0–1, maps to CSS opacity
}
```

### `ToolType` — `@aether/types`

```typescript
type ToolType = 'select' | 'rect' | 'circle';
```

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `V` | Switch to Select tool |
| `R` | Switch to Rectangle tool |
| `C` | Switch to Circle tool |
| `Esc` | Return to Select tool, clear selection |
| `Backspace` / `Delete` | Delete selected element |
| `Space + Drag` | Pan the canvas |
| `Cmd + Scroll` | Zoom in / out toward cursor |

---

## Interaction Reference

### Canvas

| Interaction | Behaviour |
|---|---|
| Click empty canvas | Deselect current element |
| Click element (Select tool) | Select element |
| Drag element (Select tool) | Move element |
| Click canvas (Rect tool) | Place 100×100 rectangle centered on cursor, return to Select |
| Click canvas (Circle tool) | Place 100×100 circle centered on cursor, return to Select |
| Space + Mousedown + Drag | Pan viewport |
| Cmd + Scroll | Exponential zoom toward cursor (5%–2000%) |

### Transformer

| Interaction | Behaviour |
|---|---|
| Drag corner handle | Resize on both axes; opposing corner stays pinned |
| Drag edge handle | Resize on one axis only |
| Drag element body | Move element (handled by CanvasElement, not Transformer) |

### Inspector

| Field | Behaviour |
|---|---|
| X / Y inputs | Live canvas update while typing; commits on blur / Enter |
| W / H inputs | Live canvas update; minimum value 1 |
| Color swatch | Opens native OS color picker; canvas updates in real-time |
| Hex input | Validates full 6-digit hex before updating; resets to current on blur if invalid |
| Opacity slider | Live 0–100% mapped to 0–1 in store |

### Layers Panel

| Interaction | Behaviour |
|---|---|
| Click layer | Select / deselect element on canvas |
| Right-click layer | Delete element |

---

## Package Reference

### `@aether/types`

Pure TypeScript — no build step. Exports `SceneNode` and `ToolType`. Consumed directly as source by `apps/web` via `transpilePackages` in `next.config.ts`.

### `@aether/ui`

Shared React component library. Currently exports `GlassCard` — a glassmorphic container primitive. No build step; transpiled by the consumer.

### `@aether/web`

The Next.js application. Dependencies:

| Package | Purpose |
|---|---|
| `next` 15 | App Router, Turbopack bundler |
| `react` 19 | UI runtime |
| `zustand` 5 | Canvas state store |
| `framer-motion` 11 | Transformer fade, layer list animations, toolbar transitions |
| `lucide-react` | Tool and panel icons |
| `tailwindcss` 3 | Utility-class styling |

---

## Development Guide

### Adding a New Shape Type

**1. Extend the union type** in `packages/types/src/index.ts`:

```typescript
export interface SceneNode {
  type: 'rect' | 'circle' | 'triangle'; // add here
  // ...
}
```

**2. Add a tool** in `ToolType`:

```typescript
export type ToolType = 'select' | 'rect' | 'circle' | 'triangle';
```

**3. Render the shape** in `CanvasElement.tsx`:

```typescript
// Inside the style object:
borderRadius:
  type === 'circle'   ? '50%' :
  type === 'triangle' ? '0'   : '6px',

// Or use clip-path for non-rectangular shapes:
clipPath: type === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : undefined,
```

**4. Wire the tool** in `InfiniteCanvas.tsx` — the placement handler already supports any `ToolType` that isn't `'select'`:

```typescript
if (tool === 'rect' || tool === 'circle' || tool === 'triangle') {
  addElement({ ..., type: tool, fill: '#10b981', opacity: 1 });
}
```

**5. Add a toolbar button** in `Toolbar.tsx` and a Layers icon in `LayersPanel.tsx`.

---

### Adding a New Tool

Tools that don't place elements (e.g., a text tool, hand tool) follow this pattern:

1. Add the value to `ToolType` in `@aether/types`
2. Add a keyboard shortcut in the `onKeyDown` handler in `InfiniteCanvas.tsx`
3. Add a toolbar button in `Toolbar.tsx`
4. Handle the tool's mousedown behaviour in `handleCanvasMouseDown` in `InfiniteCanvas.tsx`

---

### Adding a New Inspector Field

To add a new property (e.g., `cornerRadius`) to the inspector:

1. Add the field to `SceneNode` in `@aether/types/src/index.ts`
2. Update `CanvasElement.tsx` to apply it as a CSS property
3. Add a `<NumberInput>` (or appropriate input) to `ElementInspector` in `InspectorPanel.tsx`:

```tsx
<Section title="Corner Radius">
  <NumberInput
    label="R"
    value={element.cornerRadius ?? 0}
    min={0}
    onChange={(v) => update({ cornerRadius: v })}
    precision={1}
  />
</Section>
```

4. Make sure new elements are created with a default value in `handleCanvasMouseDown`.

---

## Roadmap

| Phase | Status | Description |
|---|---|---|
| **Phase 1** | Complete | Infinite canvas, pan, zoom, rect/circle placement, drag to move, glassmorphic UI |
| **Phase 2** | Complete | Transformer with 8 resize handles, Inspector panel (position, size, fill, opacity), Layers panel |
| **Phase 3** | Planned | Multi-select (rubber-band selection, shift-click), group/ungroup, z-order reordering via drag in Layers panel |
| **Phase 4** | Planned | Text tool, corner radius, stroke width/color |
| **Phase 5** | Planned | Export to PNG/SVG, local file save/load (JSON scene format) |
| **Phase 6** | Planned | Real-time multiplayer via WebSockets (Yjs or Liveblocks) |
