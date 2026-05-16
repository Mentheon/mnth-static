# `src/components/Helix3D/Helix3D.tsx`

## What this file is

A **standalone WebGL experience** built with **three.js**: a 3D Rod of Asclepius with a serpent (a tube following a helix curve) coiling around a metal staff, glowing strand "nodes", an animated SVG loader, a sound/silent "gate", a custom cursor, a marquee, a list-view toggle, light/dark theming, and page-transition sweep. It is a faithful React port of a standalone prototype: a single big `useEffect` runs all the imperative scene/loader logic, scoped to this component's root element so it can live on its own route without leaking into the rest of the site, and everything is torn down on unmount.

**This is the file to study for three.js fundamentals**: scene, camera, renderer, geometry, material, mesh, lights, the render loop, raycasting, resize handling, and disposal.

## Line-by-line / block walkthrough

### Imports & data

```tsx
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { animate } from 'animejs'
import './helix3d.css'
```

`import * as THREE` brings the whole three.js namespace. `animate` is anime.js v4 (used only for the 2D loader/DOM animations, not the 3D scene). `./helix3d.css` is a global stylesheet scoped under `.helix3d-root`.

```tsx
const STRANDS: Strand[] = [ { id:'vr-rt', name:'VR Reminiscence Therapy', ... icon:'rings' }, ... ]
const ICONS: Record<string,string> = { rings: '<circle .../>...', ... }
function iconSVG(key: string) { return `<svg viewBox="0 0 100 100">${ICONS[key] || ICONS.grid}</svg>` }
const LOADER_LOGO_SVG = `<svg id="loader-logo" ...>...</svg>`
```

`ICONS` stores **inline SVG markup as strings** (path/circle/rect fragments). They are injected via `innerHTML`/`dangerouslySetInnerHTML` rather than transcribed into JSX — pragmatic when you have ~30 hand-authored path nodes. `iconSVG` wraps a fragment in an `<svg viewBox="0 0 100 100">`; the `viewBox` gives those raw coordinates a 100×100 logical canvas. `LOADER_LOGO_SVG` is a full SVG with a `<clipPath>` and a `<rect id="wave-rect">` that the loader animates to create a "filling" wave.

### The component & the scoped helpers

```tsx
export default function Helix3D() {
  const rootRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const $  = <T extends Element = HTMLElement>(sel: string) => root.querySelector(sel) as T | null
    const $$ = (sel: string) => Array.from(root.querySelectorAll(sel)) as HTMLElement[]
    let destroyed = false
    const cleanups: Array<() => void> = []
```

`rootRef` is the React DOM ref to the component's root `<div>`. `$`/`$$` are tiny scoped query helpers that search **within `root`**, never `document` — so a second instance or a StrictMode double-mount cannot cross-talk and nothing leaks site-wide. `destroyed` is a flag every async callback checks before touching the (possibly torn-down) DOM. `cleanups` is an array of teardown closures pushed throughout setup and run on unmount — a clean pattern for "register your own undo as you go".

### Theme-aware colours

```tsx
function cssVar(name: string) { return getComputedStyle(root!).getPropertyValue(name).trim() }
function themeColours() {
  return { ink: new THREE.Color(cssVar('--ink')), crimson: new THREE.Color(cssVar('--crimson')), ... }
}
```

Reads CSS custom properties from the root element and converts them to **`THREE.Color`** objects. This bridges the CSS theme to the 3D materials: switching `data-theme` recolours the WebGL scene by re-reading the variables. `THREE.Color` accepts CSS colour strings.

### `HelixCurve` — a custom three.js curve

```tsx
class HelixCurve extends THREE.Curve<THREE.Vector3> {
  getPoint(t: number, target = new THREE.Vector3()) {
    const r = this.radius
    const y = this.height / 2 - this.height * t
    const angle = t * this.turns * Math.PI * 2
    const x = r * Math.cos(angle)
    const z = r * Math.sin(angle)
    return target.set(x, y, z)
  }
}
```

Subclassing **`THREE.Curve`** and implementing `getPoint(t)` (for `t ∈ [0,1]`) defines an arbitrary 3D path. Here it is a helix: `y` descends linearly, `x`/`z` orbit a circle of `radius` as `angle` sweeps `turns` full revolutions. three.js can then sample this curve to build geometry along it (the serpent tube) and to place nodes on it. Same parametric idea as `helixScene.ts`'s 2D `strandPointAt`, now in real 3D.

### `initThree()` — the core three.js setup

```tsx
renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(container.clientWidth, container.clientHeight)
renderer.setClearColor(0x000000, 0)
container.appendChild(renderer.domElement)
```

The four pillars of any three.js app, starting with the **renderer**: `WebGLRenderer` owns the WebGL context and the `<canvas>`. `antialias` smooths edges; `alpha: true` + `setClearColor(0x000000, 0)` (alpha 0) makes the canvas transparent so the CSS background shows through. `setPixelRatio(min(devicePixelRatio, 2))` renders crisp on HiDPI screens but caps at 2× to avoid quadrupling the pixel work on 3× phones. `renderer.domElement` is the canvas; it is appended into the scoped container.

```tsx
scene = new THREE.Scene()
camera = new THREE.PerspectiveCamera(32, container.clientWidth / container.clientHeight, 0.1, 100)
camera.position.set(0, 0, 8.5)
camera.lookAt(0, 0, 0)
```

The **scene** is the container/graph of everything to render. The **camera** is the viewpoint: `PerspectiveCamera(fov, aspect, near, far)` — 32° field of view, aspect = width/height (must match the canvas or things stretch), and the near/far clip planes (0.1–100) bound the visible depth range. The camera is moved back along +Z and aimed at the origin with `lookAt`.

```tsx
scene.add(new THREE.AmbientLight(0xffffff, 0.35))
const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(3, 4, 5); scene.add(key)
const fill = new THREE.DirectionalLight(0xffffff, 0.5); fill.position.set(-4, 1, 3); scene.add(fill)
const rim = new THREE.DirectionalLight(0xffd4b8, 0.4); rim.position.set(0, -2, -4); scene.add(rim)
activeNodePointLight = new THREE.PointLight(C.crimson, 0, 1.8, 2); scene.add(activeNodePointLight)
```

**Lighting**, the classic three-point setup plus extras. `MeshStandardMaterial` (used below) is physically-based and *invisible without lights*. `AmbientLight` lifts the shadows uniformly; `DirectionalLight` is sun-like parallel light (key = main, fill = soften shadows, rim = back-light edge glow); `PointLight` radiates from a position with falloff (`intensity` starts at 0, raised when a node is active). Learn this: PBR materials need lights; ambient + directional + accent is the standard rig.

```tsx
rotor = new THREE.Group(); scene.add(rotor)
raycaster = new THREE.Raycaster()
buildRod(); buildSerpent(); buildNodes(); buildLabels()
window.addEventListener('resize', onResize)
dom.addEventListener('pointermove', onPointerMove); dom.addEventListener('click', onClick)
cleanups.push(() => { window.removeEventListener('resize', onResize); ... })
```

`THREE.Group` is an empty transform node — rotating `rotor` rotates everything added to it (the whole serpent assembly spins as one). `Raycaster` is for picking (mouse → 3D object hit-testing). Every listener added gets a matching remover pushed to `cleanups`.

### Building meshes — geometry + material = mesh

```tsx
const shaft = new THREE.Mesh(
  new THREE.CylinderGeometry(ROD.radius, ROD.radius, ROD.height, 24),
  new THREE.MeshStandardMaterial({ color: C.ink, roughness: 0.55, metalness: 0.25 }),
)
```

**The fundamental three.js triad**: a **Geometry** (the vertices/shape — here a `CylinderGeometry(radiusTop, radiusBottom, height, radialSegments)`), a **Material** (how the surface responds to light — `MeshStandardMaterial` is PBR with `roughness`/`metalness`/`color`/`emissive`), combined into a **Mesh** (a renderable object you `scene.add(...)` or add to a group). `bandBot = bandTop.clone()` shows meshes are cloneable. `rod.userData.knob = knob` stashes references on the object's free-form `userData` bag for later recolour/animation — the three.js idiom for "attach my own metadata to a scene object".

```tsx
const geo = new THREE.TubeGeometry(serpentCurve, SERPENT.tubeSegs, SERPENT.bodyR, SERPENT.radialSegs, false)
serpentMesh = new THREE.Mesh(geo, mat)
rotor.add(serpentMesh)
const head = buildSerpentHead(C)
head.position.copy(serpentCurve.getPoint(0))
head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), serpentCurve.getTangent(0))
```

`TubeGeometry(curve, tubularSegments, radius, radialSegments, closed)` extrudes a circular cross-section *along the custom `HelixCurve`* — that is how a flat parametric curve becomes a solid 3D snake body. The head sphere is placed at the curve start (`getPoint(0)`) and **oriented along the curve's tangent** with a quaternion: `setFromUnitVectors(from, to)` builds the rotation that turns the model's up-axis `(0,1,0)` into the curve's tangent direction. Quaternions are how three.js represents rotations without gimbal lock; `setFromUnitVectors` is the easy "point this at that" helper.

```tsx
const ring1 = new THREE.Mesh(new THREE.RingGeometry(NODE.ringR1*0.92, NODE.ringR1, 48),
  new THREE.MeshBasicMaterial({ color: C.crimson, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }))
```

Nodes are glowing pulse rings. `RingGeometry(inner, outer, segments)` is a flat annulus. `MeshBasicMaterial` is **unlit** (constant colour — good for glows/UI). `transparent: true` + `opacity` enables fading; `side: THREE.DoubleSide` renders both faces; `depthWrite: false` stops the transparent ring from occluding things behind it in the depth buffer (a common transparency fix).

### Resize handling

```tsx
function onResize() {
  const w = container.clientWidth, h = container.clientHeight
  renderer.setSize(w, h)
  camera.aspect = w / h
  camera.updateProjectionMatrix()
}
```

The mandatory resize trio: re-size the renderer, update `camera.aspect`, and call `camera.updateProjectionMatrix()` (the camera caches its projection; you must tell it to recompute). Skip any of these and the scene stretches or clips after a window resize.

### Pointer → 3D picking (raycasting)

```tsx
function onPointerMove(e: PointerEvent) {
  const rect = renderer.domElement.getBoundingClientRect()
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
}
...
raycaster.setFromCamera(pointer, camera)
const hits = raycaster.intersectObjects(nodePickables, false)
if (hits.length) { const id = hits[0].object.userData.strandId; if (id !== hoveredId) activate(id) }
```

**Raycasting** is mouse-picking in 3D. The pointer is converted to **Normalized Device Coordinates** (`-1..1` on both axes, Y flipped because screen Y grows downward). `raycaster.setFromCamera(ndc, camera)` shoots a ray from the camera through that pixel; `intersectObjects(list, recursive)` returns hits sorted nearest-first. `hits[0].object.userData.strandId` recovers the metadata stashed earlier. This NDC-conversion + raycast recipe is *the* way to do 3D hover/click.

### The render loop

```tsx
let lastT = performance.now(), startT = lastT
function loop(t: number) {
  if (destroyed) return
  const dt = Math.min(0.05, (t - lastT) / 1000)
  const elapsed = (t - startT) / 1000
  lastT = t
  if (animationActive) render(dt, elapsed)
  rafId = requestAnimationFrame(loop)
}
function startScene() { animationActive = true; lastT = performance.now(); startT = lastT; rafId = requestAnimationFrame(loop) }
```

The **render loop** driven by `requestAnimationFrame`: each frame computes `dt` (seconds since last frame, clamped to 0.05 so a stall does not jump the animation) and `elapsed` (seconds since start), then calls `render`. `if (destroyed) return` stops the loop after unmount even if a frame was already scheduled. Delta-time-based animation is frame-rate independent — the same lesson as `helixScene.ts`'s drift loop.

Inside `render(dt, elapsed)`:

```tsx
rotor.rotation.y = rotorAngle                       // spin the whole assembly
n.ring1.scale.setScalar(1 + phase * 0.6)            // pulse the rings
;(n.ring1.material as THREE.MeshBasicMaterial).opacity = (0.6 * (1 - phase)) * activeMul
n.ring1.lookAt(camera.position)                     // billboard the ring toward the camera
activeNodePointLight.intensity += (1.8 - activeNodePointLight.intensity) * Math.min(1, dt * 8)
renderer.render(scene, camera)
```

Every visible behaviour is recomputed per frame: rotor spin (with smooth easing toward `rotorTarget` via the `diff * min(1, dt*6)` lerp — exponential approach), ring scale/opacity pulse from a phase, `lookAt(camera.position)` to keep flat rings facing the viewer (billboarding), and a smoothed point-light intensity. The frame ends with the one mandatory call: **`renderer.render(scene, camera)`** — nothing appears without it.

### Projecting 3D → 2D for HTML labels

```tsx
const worldP = n.orb.getWorldPosition(new THREE.Vector3())
const projP = worldP.clone().project(camera)
const px = (projP.x * 0.5 + 0.5) * w
const py = (-projP.y * 0.5 + 0.5) * h
label.style.transform = `translate(${px + nudge}px, ${py}px) translate(${isLeft ? '-100%' : '0'}, -50%)`
```

HTML labels are positioned over the canvas by **projecting** each node's world position through the camera (`vector.project(camera)` → NDC), then mapping NDC back to pixel coordinates (inverse of the pointer math). `ndcZ` and `worldP.z` drive a depth-based opacity so labels behind the rod fade. This "project 3D point, position a DOM element on top" technique is how you overlay crisp HTML/text on a WebGL scene.

### anime.js for the 2D loader

```tsx
animate(welcome, { opacity: [0, 1], translateY: [-8, 0], duration: 500, ease: 'outQuad' })
const state = { y: 195 }
animate(state, { y: -5, duration: 2400, ease: 'inOutQuad', delay: 250,
  onUpdate: () => { waveRect.setAttribute('y', String(state.y)); ... },
  onComplete: () => { animate(logo, { scale: [1, 1.04, 1], duration: 600 }); ... } })
```

The loader uses anime.js on DOM/SVG, not three.js. Notable: `animate(state, { y: -5, onUpdate })` animates a **plain JS object's property** and uses `onUpdate` to push the tweened value into an SVG attribute each frame — anime.js can tween *anything*, not just DOM nodes. This drives the `<rect id="wave-rect">` "filling" wave inside the clipPath.

### Promise-sequenced boot & teardown

```tsx
;(async function entry() {
  await runLoader(); if (destroyed) return
  await runGate();   if (destroyed) return
  startScene()
})()

return () => {
  destroyed = true
  animationActive = false
  cancelAnimationFrame(rafId)
  cleanups.forEach(fn => { try { fn() } catch {} })
  ...
  scene?.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (mesh.geometry) mesh.geometry.dispose()
    const mat = mesh.material as ...
    if (Array.isArray(mat)) mat.forEach(m => m.dispose()); else mat?.dispose()
  })
  renderer?.dispose()
  renderer?.domElement?.remove()
}
```

`runLoader`/`runGate` return Promises that resolve on completion/user choice; the async `entry()` sequences loader → gate → scene start. The effect's returned function is the **teardown** and is the single most important three.js lesson:

- Set `destroyed`, stop the RAF loop (`cancelAnimationFrame`).
- Run every registered cleanup (listeners, sub-RAFs, timers).
- **`scene.traverse(...)` and call `.dispose()` on every `geometry` and `material`** — three.js allocates GPU memory (buffers, textures) that JavaScript garbage collection does **not** free. Forgetting `dispose()` leaks VRAM; on a SPA that mounts/unmounts this repeatedly the tab eventually crashes.
- `renderer.dispose()` frees the WebGL context; `renderer.domElement.remove()` removes the canvas.

This runs on every unmount **and** on React StrictMode's deliberate dev double-mount — without it you would stack duplicate scenes/loops.

### The JSX

The returned JSX is a large static DOM skeleton: `<div className="helix3d-root" data-theme="light" ref={rootRef}>` containing the loader, custom cursor elements, gate, marquee, nav (with view-toggle and a theme switch holding two inline `<svg>` icons), the `<main className="stage">` with `<div id="helix3d">` (the WebGL mount point) and `<div id="node-labels">`, the peek panel, list view, footer, menu overlay, and transition overlay. The loader logo is injected with `dangerouslySetInnerHTML={{ __html: LOADER_LOGO_SVG }}` (React's escape hatch for raw HTML — named "dangerous" because it bypasses XSS protection; safe here only because the string is a hard-coded constant). Everything is empty/static markup the `useEffect` then animates and fills imperatively — the same "React provides mount points, library owns the subtree" pattern as `Helix.tsx`.

## Libraries & APIs used

- **three.js** — `WebGLRenderer`, `Scene`, `PerspectiveCamera`, `Group`, `Mesh`, `CylinderGeometry`/`SphereGeometry`/`TubeGeometry`/`RingGeometry`, `MeshStandardMaterial`/`MeshBasicMaterial`, `AmbientLight`/`DirectionalLight`/`PointLight`, `Curve`, `Raycaster`, `Vector2`/`Vector3`, `Color`, `Quaternion` helpers, `MathUtils`. Docs: <https://threejs.org/docs/>; the "Creating a scene" guide: <https://threejs.org/manual/>
- **anime.js v4** — `animate` (DOM/SVG/object tweening). <https://animejs.com/documentation/>
- **React 18** — `useEffect`, `useRef`. <https://react.dev/reference/react>
- **DOM/SVG APIs** — `requestAnimationFrame`/`cancelAnimationFrame`, `performance.now()`, `getComputedStyle`, `getBoundingClientRect`, `querySelector`, `dangerouslySetInnerHTML`, `matchMedia`, `<clipPath>`/`<rect>` SVG.

## Concepts to learn here

- The three.js pillars: renderer (+ canvas, pixel ratio, alpha), scene graph, camera (fov/aspect/near/far), and the geometry + material → mesh triad.
- Lighting for PBR materials (ambient + directional key/fill/rim + accent point light).
- Custom `THREE.Curve` and building geometry along it (`TubeGeometry`).
- Orienting an object along a tangent with `quaternion.setFromUnitVectors`.
- The render loop: `requestAnimationFrame`, delta time clamping, `renderer.render(scene, camera)`.
- Resize handling: renderer size + `camera.aspect` + `updateProjectionMatrix()`.
- Raycasting for hover/click: pointer → NDC → `raycaster.setFromCamera` → `intersectObjects`.
- Projecting 3D → screen pixels to overlay HTML labels (billboarding with `lookAt`).
- **GPU resource disposal** (`geometry.dispose()`, `material.dispose()`, `renderer.dispose()`) — JS GC does not free WebGL memory.
- Scoping an imperative experience to a root element + a `cleanups` array + a `destroyed` flag for StrictMode safety.
- anime.js tweening a plain object via `onUpdate` to drive an SVG attribute; Promise-sequenced boot.

## How to edit it safely

- **Recolour**: edit the `--ink`/`--crimson`/etc. variables in `helix3d.css`. The scene re-reads them via `themeColours()` on theme toggle (`refreshSceneColours()` is called after `data-theme` flips).
- **Change strands/nodes**: edit the `STRANDS` array (and `ICONS` if you add an icon key). `NODE.count` must stay ≤ `STRANDS.length`.
- **Tune the serpent/rod**: the `ROD`, `SERPENT`, `NODE` config objects (radius, height, turns, segment counts). Higher `tubeSegs`/`radialSegs` = smoother but heavier.
- **Change camera framing**: `new THREE.PerspectiveCamera(32, ...)` fov and `camera.position.set(0,0,8.5)`.
- **Gotcha — every new geometry/material must be disposed.** If you add meshes outside the scene graph (so `scene.traverse` misses them), dispose them explicitly in the teardown, or you leak VRAM on every remount.
- **Gotcha — every `addEventListener`/`requestAnimationFrame`/`setTimeout`/`setInterval` you add must push a remover into `cleanups`** (or be cancelled in the teardown). The `destroyed` guard must be checked in any async callback that touches the DOM/scene.
- **Gotcha — after any camera-affecting change at runtime, call `camera.updateProjectionMatrix()`** (already done in `onResize`).
- **Gotcha — `dangerouslySetInnerHTML`** is only safe here because `LOADER_LOGO_SVG` is a constant. Never feed it user input.
- Paired stylesheet: **`helix3d.css`** — all visual styling and theming for this component's DOM; see that doc. The `data-theme` attribute set here is what those CSS rules switch on.
