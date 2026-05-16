import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import StrandPanel from '../StrandPanel'
import MarginaliaTab from '../MarginaliaTab'
import { HelixIntroMarkup, runLoader, runGate } from './HelixIntro'
import { adjustTextScale, TEXT_STEP } from '../../lib/textScale'
import type { Strand as DataStrand } from '../../data/strands'
import './helix3d.css'

/* =================================================================
   Mentheon — Helix3D · click-to-panel variant (Rod of Asclepius)

   IN-BETWEEN VARIANT. Scroll/swipe traverses the spiral node by
   node (snap + camera dolly in) WITHOUT opening anything; the
   focused (or hovered) node shows a "view more" bubble. Clicking
   the bubble or the node opens the real StrandPanel as a centre
   modal (concept data adapted via toDataStrand). Scrolling past
   the first node (up) or last node (down) returns to the DEFAULT
   view: wide camera, gentle idle spin, nothing selected. The
   scroll-LOCKED variant (auto-opens, clamps at ends) is the frozen
   sibling ScrollLockView.tsx — change behaviour here, not there.

   Faithful React port of the standalone v5 WebGL prototype. The
   imperative scene/loader logic lives in a single mount effect and
   is scoped to this component's root element (not `document` /
   `:root`) so it can live on its own route without taking over the
   rest of the site. Everything is torn down on unmount.

   ── FILE MAP (where to change things) ───────────────────────────
     • STRANDS / ICONS .......... the six research strands + list
                                  glyphs. Edit these for content.
     • ./HelixIntro ............. loader splash + sound/silent gate
                                  (markup, SVG, runLoader/runGate).
     • useEffect(() => {...}) ... ALL behaviour, in one mount block:
         - cssVar / themeColours .. bridge CSS tokens → 3D colours
         - HelixCurve ............. the spiral the coil follows
         - ROD / SERPENT / NODE ... geometry tuning dials
         - initThree + build* ..... scene construction
         - render / loop .......... the per-frame animation
         - BOOT ................... awaits ./HelixIntro then starts
         - return () => {...} ..... teardown (dispose + listeners)
     • return ( <div .../> ) .... the DOM/markup + all static text.

   Styling lives entirely in ./helix3d.css (scoped under
   `.helix3d-root`). This file owns structure + behaviour only.
   ================================================================= */

/* One research strand. Every field is surfaced in the UI:
     id        — internal handle (raycast hits, label data-id);
                 currently NOT used for navigation, just identity.
     name      — bold label by the orb + list-view title.
     subsidiary/tag — combined into the peek card kicker and the
                 list-view sub-line ("Aevorix · ageing technology").
     synopsis  — body copy shown in the peek card on hover.
     icon      — key into ICONS, drawn in the list view. */
interface Strand {
  id: string
  name: string
  subsidiary: string
  tag: string
  synopsis: string
  icon: string
}

/* The canonical content. The 3D scene reads STRANDS[i] for i in
   0..NODE.count-1, so if you change the number of entries here you
   MUST also change NODE.count (below) to match, or nodes/strands
   will misalign. This is intentionally self-contained concept data,
   separate from src/data/strands.ts. */
const STRANDS: Strand[] = [
  { id: 'vr-rt',       name: 'VR Reminiscence Therapy',     subsidiary: 'Aevorix',   tag: 'ageing technology',   synopsis: 'Personalised, low-stimulation virtual environments as a digital therapeutic for people living with dementia.', icon: 'rings' },
  { id: 'attraction',  name: 'Subjective Attraction',       subsidiary: 'Kindreon',  tag: 'caregiving research', synopsis: 'How attractiveness perception forms and shifts in informal caregiving contexts — moving beyond dating-app framings.', icon: 'spark' },
  { id: 'analytics',   name: 'Health Analytics',            subsidiary: 'Vitrix',    tag: 'measurement',         synopsis: 'Multimodal signal analysis (ECG, motion, sleep) for real-world health states. Instrumenting what people actually do, not what they self-report.', icon: 'wave' },
  { id: 'cognition',   name: 'Cognitive Decline Modelling', subsidiary: 'Acumentra', tag: 'cognitive research',  synopsis: 'Longitudinal cognition modelling — trajectories, not snapshots. Building tools that respect heterogeneity in ageing minds.', icon: 'brain' },
  { id: 'biomarkers',  name: 'Behavioural Biomarkers',      subsidiary: 'Aevorix',   tag: 'ageing technology',   synopsis: 'Subtle interaction signatures (gait, typing cadence, voice prosody) as early indicators of change — non-invasive and continuous.', icon: 'pulse' },
  { id: 'platform',    name: 'Research Platform',           subsidiary: 'Mentheon',  tag: 'infrastructure',      synopsis: 'The shared backbone — recruitment, instrumentation, data pipelines and SaMD-compliant deployment that every strand draws on.', icon: 'grid' },
]

/* Raw inner-SVG markup for each list-view glyph, keyed by the
   strand's `icon` field. To add a new glyph, add a key here and
   reference it from a strand; viewBox is fixed at 0 0 100 100. */
const ICONS: Record<string, string> = {
  rings: '<circle cx="50" cy="50" r="28" /><circle cx="35" cy="50" r="14"/><circle cx="65" cy="50" r="14"/>',
  spark: '<path d="M50 20 L55 45 L80 50 L55 55 L50 80 L45 55 L20 50 L45 45 Z"/>',
  wave:  '<path d="M15 50 L30 50 L36 30 L44 70 L52 25 L60 65 L66 50 L85 50"/>',
  brain: '<path d="M35 30 Q22 35 25 50 Q20 65 35 70 Q40 80 50 75"/><path d="M65 30 Q78 35 75 50 Q80 65 65 70 Q60 80 50 75"/><path d="M50 30 V 75"/>',
  pulse: '<circle cx="50" cy="50" r="8"/><circle cx="50" cy="50" r="18" stroke-dasharray="4 4"/><circle cx="50" cy="50" r="30" stroke-dasharray="2 8"/>',
  grid:  '<rect x="25" y="25" width="20" height="20"/><rect x="55" y="25" width="20" height="20"/><rect x="25" y="55" width="20" height="20"/><rect x="55" y="55" width="20" height="20"/>',
}
/* Wrap an ICONS entry in an <svg>; falls back to the grid glyph
   for an unknown key. Used by buildList(). */
function iconSVG(key: string) { return `<svg viewBox="0 0 100 100">${ICONS[key] || ICONS.grid}</svg>` }

/* Adapt a concept Strand into the shape the pre-existing
   StrandPanel expects (src/data/strands `Strand`). StrandPanel only
   renders id/label/tagline/themes, so we map: name→label,
   subsidiary·tag→tagline, and surface the synopsis as a single
   theme card. Concept nodes deliberately don't carry the real
   strands' progress/objectives — this keeps all six nodes with
   their concept copy rather than collapsing to the 3 real strands. */
function toDataStrand(s: Strand): DataStrand {
  return {
    id: s.id,
    label: s.name,
    tagline: `${s.subsidiary} · ${s.tag}`,
    href: '#',
    themes: [{ title: s.tag, description: s.synopsis }],
  }
}

export default function Helix3D({ skipIntro = false }: { skipIntro?: boolean } = {}) {
  /* The single React-managed DOM node. All imperative DOM access
     and the Three.js canvas live inside it; nothing escapes it. */
  const rootRef = useRef<HTMLDivElement>(null)

  /* StrandPanel modal lives in React state (the imperative scene
     can't render JSX). The effect opens it via setPanelStrand;
     `closePanelRef` lets the React close handler call back into the
     effect (resume spin, pull the camera out). */
  const [panelStrand, setPanelStrand] = useState<DataStrand | null>(null)
  const closePanelRef = useRef<() => void>(() => {})
  const handlePanelClose = () => {
    setPanelStrand(null)
    closePanelRef.current()
  }

  /* One mount effect owns the entire lifecycle. Empty dep array =>
     runs once after first paint (twice in StrictMode dev, but the
     teardown below makes that safe). All scene/loader state is
     declared as closures here so it's GC'd on unmount. */
  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    /* Scoped DOM helpers — everything queries within this component's
       root rather than `document`, so a second instance / StrictMode
       remount can't cross-talk and nothing leaks to the wider site. */
    const $ = <T extends Element = HTMLElement>(sel: string) =>
      root.querySelector(sel) as T | null
    const $$ = (sel: string) =>
      Array.from(root.querySelectorAll(sel)) as HTMLElement[]

    /* `destroyed` is checked by async continuations and the RAF loop
       so a fast unmount (or StrictMode's immediate re-run) can't keep
       animating a dead scene. `cleanups` collects teardown closures
       (timeouts, listeners) flushed by the effect's return fn. */
    let destroyed = false
    const cleanups: Array<() => void> = []

    /* ---- THEME-AWARE COLOUR HELPERS (read from root, not :root) ----
       The 3D materials don't know about CSS. This bridge reads the
       resolved CSS custom properties off the root element (which
       carries data-theme), so editing a colour token in helix3d.css
       — or toggling the theme — re-tints the whole scene via
       refreshSceneColours(). Read on the root, never document, so
       light/dark stays scoped to this route. */
    function cssVar(name: string) {
      return getComputedStyle(root!).getPropertyValue(name).trim()
    }
    /* Snapshot the current palette as THREE.Color instances.
       Called any time geometry is (re)coloured. */
    function themeColours() {
      return {
        ink:     new THREE.Color(cssVar('--ink')),
        crimson: new THREE.Color(cssVar('--crimson')),
        grape:   new THREE.Color(cssVar('--grape')),
        plum:    new THREE.Color(cssVar('--plum')),
        bg:      new THREE.Color(cssVar('--bg')),
      }
    }

    /* Rod material colour. Solid: --ink (its normal colour). Trace:
       the INVERSE of the background so it stays visible — the cream
       --white in dark mode, and dark (--ink, i.e. plum) only when
       light mode is on. */
    function rodColour() {
      if (!rodTrace) return new THREE.Color(cssVar('--ink'))
      const isLight = root!.getAttribute('data-theme') !== 'dark'
      return new THREE.Color(isLight ? cssVar('--ink') : (cssVar('--white') || '#FFECE1'))
    }

    /* ---- HELIX CURVE — single serpent winding around the rod ----
       The single source of truth for the spiral's shape. Both the
       TubeGeometry (the serpent body) and the node placement sample
       this curve, so changing getPoint() reshapes everything
       consistently. */
    class HelixCurve extends THREE.Curve<THREE.Vector3> {
      radius: number
      height: number
      turns: number
      constructor(radius: number, height: number, turns: number) {
        super()
        this.radius = radius
        this.height = height
        this.turns = turns
      }
      /* t ∈ [0,1] → world point. y descends from +height/2 (top,
         t=0, where the head sits) to -height/2 (bottom). The angle
         sweeps `turns` full revolutions; x/z trace the circle of
         radius r. Make r a function of t here for a cone/taper. */
      getPoint(t: number, target = new THREE.Vector3()) {
        const r = this.radius
        const y = this.height / 2 - this.height * t
        const angle = t * this.turns * Math.PI * 2
        const x = r * Math.cos(angle)
        const z = r * Math.sin(angle)
        return target.set(x, y, z)
      }
    }

    /* ---- SCENE CONFIG — the main tuning dials ----
       All units are Three.js world units. The camera (see initThree)
       shows roughly ±2.44 vertically at the default distance, so keep
       geometry inside that to avoid clipping at narrow aspect ratios. */

    /* The central staff. `height` deliberately exceeds the visible
       frame so the rod runs off top & bottom; `knobR` is the crimson
       sphere capping the top. */
    const ROD = { radius: 0.05, height: 5.2, knobR: 0.10 }

    /* The coil. radius = how far it wraps out from the rod;
       turns = revolutions over its height (more turns / less height
       = tighter pitch); bodyR = tube thickness; tubeSegs/radialSegs =
       mesh smoothness vs. cost. Kept tight (0.8 × 3.6) so all six
       nodes stay on-screen across aspect ratios. */
    const SERPENT = {
      radius: 0.8, height: 3.6, turns: 3,
      bodyR: 0.085, tubeSegs: 220, radialSegs: 14,
    }

    /* The glowing strand markers. count MUST equal STRANDS.length;
       orbR = orb size; ringR1/ringR2 = the two pulse-ring radii;
       pulseSpeed = pulses per second. */
    const NODE = {
      count: 6, orbR: 0.16, ringR1: 0.22, ringR2: 0.30, pulseSpeed: 0.25,
    }

    /* ---- Scene-graph handles & interaction state ----
       `rotor` is the spinning group that holds the serpent + nodes;
       the rod is added to the scene directly so it stays still.
       `nodes` pairs each strand with its meshes + rotor-local
       position; `nodePickables` is the raycast target list. */
    const container = $('#helix3d') as HTMLDivElement
    let renderer: THREE.WebGLRenderer
    let scene: THREE.Scene
    let camera: THREE.PerspectiveCamera
    let rotor: THREE.Group
    let rod: THREE.Group
    let serpentMesh: THREE.Mesh & { userData: { head?: THREE.Group } }
    /* Sketch-mode alternative for the coil: the external sketch of
       the tube — only longitudinal lines along the helix (no cross
       rings), LineSegments, theme --ink. Built next to serpentMesh;
       exactly one of the two is visible — see applySketchMode. */
    let serpentLine: THREE.Line
    /* Second sketch style: the tube's triangulated edges
       (WireframeGeometry) — a faceted "polygon trace". */
    let serpentPoly: THREE.Line
    let sketchMode = false
    /* Sketch style while sketchMode: false = longitudinal line
       trace (serpentLine), true = polygon wireframe (serpentPoly).
       Driven by its own nav button. */
    let polyMode = false
    /* Render the central rod as a --bg-coloured wireframe trace
       (own nav button) so it reads as a faint outline. */
    let rodTrace = false
    /* Independent override: when true the node orbs render solid &
       opaque even in sketch mode (own nav toggle). */
    let nodeSolid = false
    let serpentCurve: HelixCurve
    interface NodeRec {
      strand: Strand
      t: number
      orb: THREE.Mesh
      ring1: THREE.Mesh
      ring2: THREE.Mesh
      orbPos: THREE.Vector3
    }
    const nodes: NodeRec[] = []
    const nodePickables: THREE.Mesh[] = []
    let activeNodePointLight: THREE.PointLight

    let raycaster: THREE.Raycaster
    const pointer = new THREE.Vector2(-9999, -9999)
    let hoveredId: string | null = null
    let animationActive = false
    let rafId = 0

    /* Rotation model: scroll-driven, no auto-spin. `rotorAngle` is
       the live Y rotation; `rotorTarget` (when non-null) is the
       angle being eased toward — set by focusByIndex() when a
       scroll/swipe steps to a node, and by the click snap. The coil
       rests on the focused node when idle. */
    let rotorAngle = 0
    let rotorTarget: number | null = null

    /* Scroll navigation + camera dolly. `focusIndex` is the node the
       coil is parked on. Each frame the camera eases toward
       camPosTarget while looking at camLookCurrent (itself eased
       toward camLookTarget); a focused node is framed CAM_DOLLY
       units away (vs the ~8.5 resting distance). */
    /* focusIndex tracks scroll traversal across the range
       -1 .. NODE.count. The two extremes (-1 and NODE.count) are the
       DEFAULT view (wide camera, gentle idle spin, nothing
       selected). 0..count-1 mean the coil is parked + zoomed on
       that node, showing its "view more" bubble. Starts default. */
    let focusIndex = -1
    const isFocused = () => focusIndex >= 0 && focusIndex < NODE.count
    /* Gentle idle auto-spin (rad/sec) — default view only (not while
       focused, hovering, or paneled). */
    const ROTOR_FREE_SPEED = 0.05
    /* True while the StrandPanel modal is open: freezes the spin. */
    let panelOpen = false
    const CAM_DOLLY = 3.2
    const camPosTarget   = new THREE.Vector3(0, 0, 8.5)
    const camLookTarget  = new THREE.Vector3(0, 0, 0)
    const camLookCurrent = new THREE.Vector3(0, 0, 0)

    /* Build the renderer, camera, lights and all geometry, and wire
       canvas pointer/resize listeners. Called once from BOOT. */
    function initThree() {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(container.clientWidth, container.clientHeight)
      renderer.setClearColor(0x000000, 0)
      container.appendChild(renderer.domElement)

      scene = new THREE.Scene()
      /* FOV 32° + z=8.5 frames the staff. Lower FOV or larger z to
         "zoom out"; this pair is the easiest reframing knob. */
      camera = new THREE.PerspectiveCamera(32, container.clientWidth / container.clientHeight, 0.1, 100)
      camera.position.set(0, 0, 8.5)
      camera.lookAt(0, 0, 0)

      /* Three-point-ish rig: soft ambient base, a strong key from
         front-right, a gentler fill from the left, and a warm rim
         from below-behind for edge separation. */
      scene.add(new THREE.AmbientLight(0xffffff, 0.35))

      const key = new THREE.DirectionalLight(0xffffff, 1.1)
      key.position.set(3, 4, 5)
      scene.add(key)

      const fill = new THREE.DirectionalLight(0xffffff, 0.5)
      fill.position.set(-4, 1, 3)
      scene.add(fill)

      const rim = new THREE.DirectionalLight(0xffd4b8, 0.4)
      rim.position.set(0, -2, -4)
      scene.add(rim)

      /* Crimson point light that fades in and tracks the hovered orb
         (see render()) — gives the active node a local glow. Starts
         at intensity 0. */
      const C = themeColours()
      activeNodePointLight = new THREE.PointLight(C.crimson, 0, 1.8, 2)
      scene.add(activeNodePointLight)

      /* Everything that rotates goes in `rotor`; the rod is added to
         `scene` separately so it stays fixed. */
      rotor = new THREE.Group()
      scene.add(rotor)

      raycaster = new THREE.Raycaster()

      buildRod()
      buildSerpent()
      buildNodes()
      buildLabels()

      window.addEventListener('resize', onResize)
      const dom = renderer.domElement
      const onLeave = () => { pointer.x = -9999; pointer.y = -9999; setLabelHover(null) }
      dom.addEventListener('pointermove', onPointerMove)
      dom.addEventListener('pointerleave', onLeave)
      dom.addEventListener('click', onClick)
      cleanups.push(() => {
        window.removeEventListener('resize', onResize)
        dom.removeEventListener('pointermove', onPointerMove)
        dom.removeEventListener('pointerleave', onLeave)
        dom.removeEventListener('click', onClick)
      })
    }

    /* Central staff: a thin cylinder shaft, two slightly fatter
       "knot" bands near each end, and a crimson sphere knob on top.
       Mesh refs are stashed on userData so refreshSceneColours()
       can recolour them on theme change. */
    function buildRod() {
      const C = themeColours()
      const group = new THREE.Group()
      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(ROD.radius, ROD.radius, ROD.height, 24),
        new THREE.MeshStandardMaterial({ color: C.ink, roughness: 0.55, metalness: 0.25 }),
      )
      const bandTop = new THREE.Mesh(
        new THREE.CylinderGeometry(ROD.radius * 1.25, ROD.radius * 1.25, 0.04, 24),
        new THREE.MeshStandardMaterial({ color: C.ink, roughness: 0.55, metalness: 0.3 }),
      )
      bandTop.position.y = ROD.height / 2 - 0.15
      const bandBot = bandTop.clone()
      bandBot.position.y = -ROD.height / 2 + 0.15

      const knob = new THREE.Mesh(
        new THREE.SphereGeometry(ROD.knobR, 24, 16),
        new THREE.MeshStandardMaterial({
          color: C.crimson, roughness: 0.4, metalness: 0.25,
          emissive: C.crimson, emissiveIntensity: 0.18,
        }),
      )
      knob.position.y = ROD.height / 2 + ROD.knobR * 0.6

      group.add(shaft, bandTop, bandBot, knob)
      rod = group
      rod.userData.knob = knob
      rod.userData.shaft = shaft
      rod.userData.bands = [bandTop, bandBot]
      scene.add(rod)
    }

    /* The coil itself: a TubeGeometry swept along serpentCurve, plus
       a small head group placed at t=0 (the top) and oriented along
       the curve's tangent there. Both go in `rotor` so they spin. */
    function buildSerpent() {
      const C = themeColours()
      serpentCurve = new HelixCurve(SERPENT.radius, SERPENT.height, SERPENT.turns)

      const geo = new THREE.TubeGeometry(
        serpentCurve, SERPENT.tubeSegs, SERPENT.bodyR, SERPENT.radialSegs, false,
      )
      const mat = new THREE.MeshStandardMaterial({ color: C.ink, roughness: 0.42, metalness: 0.32 })
      serpentMesh = new THREE.Mesh(geo, mat) as typeof serpentMesh
      rotor.add(serpentMesh)

      // Sketch alternative: the external sketch of the tube —
      // ONLY the longitudinal lines running along the helix (no
      // per-segment cross rings, no triangle diagonals). Sampled
      // from a throwaway TubeGeometry's parametric grid so the
      // lines hug the strand's actual girth. (TubeGeometry lays
      // vertices out as index = i*(radial+1)+j, i = tubular ring,
      // j = around.)
      const WIRE_RADIAL = 8          // longitudinal lines around the tube
      const wireTube = new THREE.TubeGeometry(
        serpentCurve, SERPENT.tubeSegs, SERPENT.bodyR, WIRE_RADIAL, false,
      )
      const wp = wireTube.attributes.position
      const vIdx = (i: number, j: number) => i * (WIRE_RADIAL + 1) + j
      const segPts: number[] = []
      const pushV = (k: number) => segPts.push(wp.getX(k), wp.getY(k), wp.getZ(k))
      for (let j = 0; j <= WIRE_RADIAL; j++) {
        for (let i = 0; i < SERPENT.tubeSegs; i++) { pushV(vIdx(i, j)); pushV(vIdx(i + 1, j)) }
      }
      wireTube.dispose()
      const lineGeo = new THREE.BufferGeometry()
      lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(segPts, 3))
      const lineMat = new THREE.LineBasicMaterial({ color: C.ink })
      serpentLine = new THREE.LineSegments(lineGeo, lineMat)
      rotor.add(serpentLine)

      // Polygon trace: the tube's full triangulated edges (incl.
      // diagonals) from a coarser tube, so it reads as a faceted
      // polygon wireframe rather than clean longitudinal lines.
      // WireframeGeometry copies positions, so the source tube can
      // be disposed straight away.
      const polySrc = new THREE.TubeGeometry(serpentCurve, 160, SERPENT.bodyR, 8, false)
      const polyMat = new THREE.LineBasicMaterial({ color: C.ink })
      serpentPoly = new THREE.LineSegments(new THREE.WireframeGeometry(polySrc), polyMat)
      polySrc.dispose()
      rotor.add(serpentPoly)

      applyStrandRender()   // sets which of mesh/line/poly is visible

      const head = buildSerpentHead(C)
      const headPos = serpentCurve.getPoint(0)
      const headTan = serpentCurve.getTangent(0)
      head.position.copy(headPos)
      head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), headTan)
      rotor.add(head)
      serpentMesh.userData.head = head
    }

    /* Serpent head: an elongated sphere (child index 0) plus two
       small crimson emissive eyes (indices 1,2). The index order
       matters — refreshSceneColours() recolours by index. */
    function buildSerpentHead(C: ReturnType<typeof themeColours>) {
      const group = new THREE.Group()
      const headMat = new THREE.MeshStandardMaterial({ color: C.ink, roughness: 0.4, metalness: 0.35 })
      const head = new THREE.Mesh(new THREE.SphereGeometry(SERPENT.bodyR * 1.6, 16, 12), headMat)
      head.scale.set(1.1, 1.6, 1.1)
      head.position.y = SERPENT.bodyR * 1.2
      group.add(head)

      const eyeMat = new THREE.MeshStandardMaterial({
        color: C.crimson, emissive: C.crimson, emissiveIntensity: 0.5,
        roughness: 0.3, metalness: 0.4,
      })
      const eyeR = SERPENT.bodyR * 0.18
      const e1 = new THREE.Mesh(new THREE.SphereGeometry(eyeR, 10, 8), eyeMat)
      e1.position.set(SERPENT.bodyR * 0.85, SERPENT.bodyR * 1.6, SERPENT.bodyR * 0.65)
      const e2 = e1.clone()
      e2.position.x = -SERPENT.bodyR * 0.85
      group.add(e1, e2)

      return group
    }

    /* One orb + two pulse rings per strand, evenly spaced along the
       coil at t = i/(count-1) (so the first and last sit exactly at
       the curve ends). Orbs are nudged radially outward off the tube
       surface so they read as sitting on the coil, not buried in it. */
    function buildNodes() {
      const C = themeColours()
      for (let i = 0; i < NODE.count; i++) {
        const t = i / (NODE.count - 1)
        const pos = serpentCurve.getPoint(t)

        // Outward = away from the rod's Y axis (ignore the y term).
        const radialDir = new THREE.Vector3(pos.x, 0, pos.z).normalize()
        const orbPos = pos.clone().add(radialDir.clone().multiplyScalar(SERPENT.bodyR * 1.1))

        // Nodes: grape (the lighter purple accent). `wireframe`
        // tracks sketch mode (set here + in applySketchMode), so
        // solid mode = solid grape orbs, sketch mode = grape wire
        // spheres. Opaque either way (no transparency). Hover/focus
        // still flips them crimson via activate/deactivate.
        const orbMat = new THREE.MeshStandardMaterial({
          color: C.grape, roughness: 0.35, metalness: 0.45,
          emissive: new THREE.Color(0x000000), emissiveIntensity: 0,
          wireframe: sketchMode && !nodeSolid,
        })
        const orb = new THREE.Mesh(new THREE.SphereGeometry(NODE.orbR, 24, 18), orbMat)
        orb.position.copy(orbPos)
        orb.userData.strandId = STRANDS[i].id
        orb.userData.baseColor = C.grape.clone()
        orb.userData.t = t

        const ringMat1 = new THREE.MeshBasicMaterial({
          color: C.crimson, transparent: true, opacity: 0,
          side: THREE.DoubleSide, depthWrite: false,
        })
        const ringMat2 = ringMat1.clone()

        // Two thin rings; their scale/opacity are animated each frame
        // in render(). baseR is stored for that pulse maths.
        const ring1 = new THREE.Mesh(new THREE.RingGeometry(NODE.ringR1 * 0.92, NODE.ringR1, 48), ringMat1)
        const ring2 = new THREE.Mesh(new THREE.RingGeometry(NODE.ringR2 * 0.94, NODE.ringR2, 48), ringMat2)
        ring1.position.copy(orbPos)
        ring2.position.copy(orbPos)
        ring1.userData.baseR = NODE.ringR1
        ring2.userData.baseR = NODE.ringR2

        rotor.add(orb, ring1, ring2)

        nodes.push({ strand: STRANDS[i], t, orb, ring1, ring2, orbPos: orbPos.clone() })
        nodePickables.push(orb)
      }
    }

    /* HTML labels (not 3D text) — one per node, absolutely
       positioned every frame by updateLabels() to track its orb.
       Hover/click on the label mirrors hover/click on the orb. */
    function buildLabels() {
      const labelsEl = $('#node-labels')!
      nodes.forEach((n) => {
        const label = document.createElement('div')
        label.className = 'node-label'
        label.dataset.id = n.strand.id
        label.innerHTML = `
          <div class="node-label-pip"></div>
          <span class="node-label-name">${n.strand.name}</span>
          <span class="node-label-sub">${n.strand.subsidiary}</span>
        `
        label.addEventListener('mouseenter', () => { activate(n.strand.id); setLabelHover(n.strand.id) })
        label.addEventListener('mouseleave', () => { deactivate(); setLabelHover(null) })
        label.addEventListener('click', (e) => {
          e.preventDefault()
          const idx = nodes.indexOf(n)
          if (idx >= 0) onNodeClick(idx)
        })
        labelsEl.appendChild(label)
      })
    }

    /* Keep renderer + camera in sync with the container size. */
    function onResize() {
      if (!renderer) return
      const w = container.clientWidth
      const h = container.clientHeight
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }

    /* Convert mouse position to normalised device coords (-1..1)
       for the raycaster. Off-canvas is parked at -9999 (see onLeave)
       so render() can cheaply skip raycasting. */
    function onPointerMove(e: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    }

    /* Two-step: a first click only FOCUSES the node (zoom/snap +
       bubble, like scrolling to it). Clicking the already-focused
       node again opens the StrandPanel. (The "view more" bubble is
       the explicit one-click shortcut to open.) */
    function onNodeClick(idx: number) {
      if (focusIndex === idx) openPanel(idx)
      else focusByIndex(idx)
    }

    /* Canvas click → focus / open the hovered node (see onNodeClick). */
    function onClick() {
      if (!hoveredId) return
      const idx = nodes.findIndex((x) => x.strand.id === hoveredId)
      if (idx >= 0) onNodeClick(idx)
    }

    /* Compute the rotor Y-rotation that brings node `id` to front.
       alpha is the node's angle around the rod; subtracting π/2
       rotates it to face +Z (the camera). The while-loops pick the
       shortest signed path so the snap never spins the long way. */
    function snapRotorTo(id: string) {
      const n = nodes.find((x) => x.strand.id === id)
      if (!n) return
      const alpha = Math.atan2(n.orbPos.z, n.orbPos.x)
      rotorTarget = alpha - Math.PI / 2
      while (rotorTarget - rotorAngle > Math.PI) rotorTarget -= Math.PI * 2
      while (rotorTarget - rotorAngle < -Math.PI) rotorTarget += Math.PI * 2
    }

    /* Park the coil on node `i` (clamped). Eases the rotor so the
       node faces the camera AND dollies the camera in: after the
       snap the node sits at world ≈ (0, y, rHoriz), so we look
       there and pull back CAM_DOLLY units. `instant` jumps with no
       animation (unused now, kept for flexibility). Also lights the
       node. Called by traverse() (scroll) and openPanel() (click). */
    function focusByIndex(i: number, instant = false) {
      focusIndex = THREE.MathUtils.clamp(i, 0, NODE.count - 1)
      const n = nodes[focusIndex]
      if (!n) return
      snapRotorTo(n.strand.id)                       // sets rotorTarget
      const rHoriz = Math.hypot(n.orbPos.x, n.orbPos.z)
      camLookTarget.set(0, n.orbPos.y, rHoriz)
      camPosTarget.set(0, n.orbPos.y, rHoriz + CAM_DOLLY)
      if (instant) {
        if (rotorTarget !== null) { rotorAngle = rotorTarget; rotorTarget = null }
        camera.position.copy(camPosTarget)
        camLookCurrent.copy(camLookTarget)
        camera.lookAt(camLookCurrent)
      }
      activate(n.strand.id)
    }

    /* Reset the camera framing to the wide resting view (used when
       the panel closes). The render loop eases back to it. */
    function resetCamera() {
      camPosTarget.set(0, 0, 8.5)
      camLookTarget.set(0, 0, 0)
    }

    /* Open the StrandPanel for node `i`: zoom in (focusByIndex) and
       hand the adapted strand to React state. `panelOpen` freezes
       the idle spin while the card is up. */
    function openPanel(i: number) {
      focusByIndex(i)
      panelOpen = true
      const n = nodes[focusIndex]
      if (n) setPanelStrand(toDataStrand(n.strand))
    }

    /* Invoked from the React close handler via closePanelRef (close
       button / backdrop / Esc). Returns to wherever you were: the
       focused node (re-framed) if one is selected, else the wide
       default. The React side clears panelStrand itself. */
    function closePanel() {
      panelOpen = false
      if (isFocused()) focusByIndex(focusIndex)
      else resetCamera()
    }
    closePanelRef.current = closePanel

    /* Esc → fully zoom back OUT to the default wide view (closing
       the panel too if it's open). Distinct from the panel's × /
       backdrop, which return to the focused node; Esc always exits
       all the way to default. */
    function exitToDefault() {
      if (panelOpen) { panelOpen = false; setPanelStrand(null) }
      focusIndex = -1
      resetCamera()
      setLabelHover(null)
      deactivate()        // focusIndex is -1 → clears the lit orb
    }
    const onEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') exitToDefault()
    }
    window.addEventListener('keydown', onEscKey)
    cleanups.push(() => window.removeEventListener('keydown', onEscKey))

    /* Step the traversal by `dir` (±1). focusIndex is either -1
       (DEFAULT view) or 0..count-1 (a node).
       • From default: scroll DOWN enters the spiral at the FIRST
         node, scroll UP enters at the LAST node — symmetric, just
         from opposite ends.
       • On the spiral: step ±1; stepping off either end returns to
         the default view. */
    function traverse(dir: number) {
      if (!isFocused()) {
        focusByIndex(dir > 0 ? 0 : NODE.count - 1)
        return
      }
      const next = focusIndex + dir
      if (next < 0 || next >= NODE.count) {
        focusIndex = -1            // off either end → default
        resetCamera()
        deactivate()
        return
      }
      focusByIndex(next)           // snap + dolly + light + bubble
    }

    /* Wheel / swipe drives traverse(), one node per gesture, with a
       cooldown so a trackpad flick can't skip several. Ignored
       while the panel is open or the list view is up. */
    function initScrollNav() {
      let locked = false
      const step = (dir: number) => {
        if (locked || panelOpen) return
        const prev = focusIndex
        traverse(dir)
        if (focusIndex === prev) return        // safety: no state change
        locked = true
        const tm = setTimeout(() => { locked = false }, 700)
        cleanups.push(() => clearTimeout(tm))
      }
      const onWheel = (e: WheelEvent) => {
        if (panelOpen || listview.classList.contains('is-visible')) return
        e.preventDefault()
        if (Math.abs(e.deltaY) < 6) return
        step(e.deltaY > 0 ? 1 : -1)
      }
      let touchY = 0
      const onTouchStart = (e: TouchEvent) => { touchY = e.touches[0]?.clientY ?? 0 }
      const onTouchEnd = (e: TouchEvent) => {
        if (panelOpen || listview.classList.contains('is-visible')) return
        const dy = (e.changedTouches[0]?.clientY ?? touchY) - touchY
        if (Math.abs(dy) < 40) return
        step(dy < 0 ? 1 : -1)                  // swipe up → next
      }
      root!.addEventListener('wheel', onWheel, { passive: false })
      root!.addEventListener('touchstart', onTouchStart, { passive: true })
      root!.addEventListener('touchend', onTouchEnd, { passive: true })
      cleanups.push(() => {
        root!.removeEventListener('wheel', onWheel)
        root!.removeEventListener('touchstart', onTouchStart)
        root!.removeEventListener('touchend', onTouchEnd)
      })
    }

    /* Light up a strand's ORB (crimson + emissive) + drive the
       bubble. Called by both pointer hover and scroll-focus. NOTE:
       the HTML label highlight is deliberately NOT done here — see
       setLabelHover (pointer-hover only). */
    function activate(id: string) {
      if (hoveredId === id) return
      hoveredId = id
      const C = themeColours()
      nodes.forEach((n) => {
        const isActive = n.strand.id === id
        const m = n.orb.material as THREE.MeshStandardMaterial
        m.color.copy(isActive ? C.crimson : (n.orb.userData.baseColor as THREE.Color))
        m.emissive.copy(isActive ? C.crimson : new THREE.Color(0x000000))
        m.emissiveIntensity = isActive ? 0.55 : 0
      })
    }
    /* Hover-off: if a node is scroll-focused, keep its orb lit (fall
       back to it so its bubble stays). Otherwise reset every orb. */
    function deactivate() {
      const fid = isFocused() ? nodes[focusIndex]?.strand.id : undefined
      if (fid) {
        if (hoveredId !== fid) { hoveredId = null; activate(fid) }
        return
      }
      if (hoveredId === null) return
      hoveredId = null
      nodes.forEach((n) => {
        const m = n.orb.material as THREE.MeshStandardMaterial
        m.color.copy(n.orb.userData.baseColor as THREE.Color)
        m.emissive.set(0x000000)
        m.emissiveIntensity = 0
      })
    }

    /* HTML-label highlight = genuine pointer hover ONLY (never
       scroll-focus). Pass the hovered node id, or null to clear.
       Every tag stays visible + neutral; only the node the cursor
       is actually over gets the red pip/name. */
    function setLabelHover(id: string | null) {
      $$('.node-label').forEach((l) => {
        l.classList.toggle('is-active', id !== null && l.dataset.id === id)
      })
    }

    /* The per-frame heartbeat. dt = seconds since last frame (for
       framerate-independent motion); elapsed = seconds since start
       (for the pulse phase). Order: spin → pulse rings → glow light
       → raycast hover → reposition labels → draw. */
    function render(dt: number, elapsed: number) {
      // 1. Rotor: ease toward the traverse/click target; else
      //    gently auto-spin ONLY in the default view (paused while
      //    focused on a node, hovering one, or paneled).
      if (rotorTarget !== null) {
        const diff = rotorTarget - rotorAngle
        if (Math.abs(diff) < 0.005) {
          rotorAngle = rotorTarget
          rotorTarget = null
        } else {
          rotorAngle += diff * Math.min(1, dt * 6)
        }
      } else if (!panelOpen && !isFocused() && !hoveredId) {
        rotorAngle += ROTOR_FREE_SPEED * dt
      }
      rotor.rotation.y = rotorAngle

      // 1b. Camera dolly: glide position + lookAt toward the framing
      //     focusByIndex picked for the focused node (exp. smoothing,
      //     frame-rate safe). Done before the rings billboard so they
      //     face the updated camera.
      camera.position.lerp(camPosTarget, Math.min(1, dt * 4))
      camLookCurrent.lerp(camLookTarget, Math.min(1, dt * 4))
      camera.lookAt(camLookCurrent)

      // 2. Pulse rings: two offset sawtooth phases drive an
      //    expanding-and-fading ring; inactive nodes pulse faintly
      //    (activeMul 0.18), the hovered one fully. Rings billboard
      //    to face the camera each frame.
      const phase = (elapsed * NODE.pulseSpeed) % 1
      const phase2 = ((elapsed * NODE.pulseSpeed) + 0.35) % 1
      nodes.forEach((n) => {
        const isActive = hoveredId === n.strand.id
        const activeMul = isActive ? 1 : 0.18
        n.ring1.scale.setScalar(1 + phase * 0.6)
        n.ring2.scale.setScalar(1 + phase2 * 0.6)
        ;(n.ring1.material as THREE.MeshBasicMaterial).opacity = (0.7 * (1 - phase)) * activeMul
        ;(n.ring2.material as THREE.MeshBasicMaterial).opacity = (0.55 * (1 - phase2)) * activeMul

        n.ring1.lookAt(camera.position)
        n.ring2.lookAt(camera.position)
      })

      // 3. Glow light: park it on the hovered orb's world position
      //    and ease intensity toward 1.8; ease back to 0 otherwise.
      //    (Lerp factor dt*k = exponential smoothing, frame-rate safe.)
      if (hoveredId) {
        const n = nodes.find((x) => x.strand.id === hoveredId)
        if (n) {
          const worldP = n.orb.getWorldPosition(new THREE.Vector3())
          activeNodePointLight.position.copy(worldP)
          activeNodePointLight.intensity += (1.8 - activeNodePointLight.intensity) * Math.min(1, dt * 8)
        }
      } else {
        activeNodePointLight.intensity += (0 - activeNodePointLight.intensity) * Math.min(1, dt * 6)
      }

      // 4. Hover detection: raycast the orbs unless the pointer is
      //    parked off-canvas (x left at -9999).
      if (pointer.x > -2) {
        raycaster.setFromCamera(pointer, camera)
        const hits = raycaster.intersectObjects(nodePickables, false)
        if (hits.length) {
          const id = hits[0].object.userData.strandId as string
          if (id !== hoveredId) activate(id)
          setLabelHover(id)
        } else {
          if (hoveredId !== null) deactivate()
          setLabelHover(null)
        }
      }

      // 5 & 6. Sync the HTML labels, then draw the frame.
      updateLabels()
      renderer.render(scene, camera)
    }

    /* Project each orb's 3D world position to screen pixels and
       place its HTML label there, flipped to the orb's outward
       side. Tags are CONSTANTLY visible — no depth/behind fade,
       opacity is always 1 — so every strand is readable at all
       times; only positioning tracks the 3D motion. */
    function updateLabels() {
      const labelsEl = $('#node-labels')!
      const w = labelsEl.clientWidth
      const h = labelsEl.clientHeight

      nodes.forEach((n) => {
        const worldP = n.orb.getWorldPosition(new THREE.Vector3())
        // project() → normalised device coords (-1..1); remap to px.
        const projP = worldP.clone().project(camera)
        const px = (projP.x * 0.5 + 0.5) * w
        const py = (-projP.y * 0.5 + 0.5) * h
        const label = $(`.node-label[data-id="${n.strand.id}"]`)
        if (!label) return
        const isLeft = px <= w / 2
        const nudge = isLeft ? -18 : 18
        label.style.transform =
          `translate(${px + nudge}px, ${py}px) translate(${isLeft ? '-100%' : '0'}, -50%)`
        label.style.opacity = '1'
      })

      // "view more" bubble — pinned just below the active (focused
      // or hovered) node; hidden in the default view / when paneled.
      if (hoveredId && !panelOpen) {
        const n = nodes.find((x) => x.strand.id === hoveredId)
        if (n) {
          const bp = n.orb.getWorldPosition(new THREE.Vector3()).project(camera)
          const bx = (bp.x * 0.5 + 0.5) * w
          const by = (-bp.y * 0.5 + 0.5) * h
          bubbleEl.style.transform = `translate(${bx}px, ${by}px) translate(-50%, 28px)`
          bubbleEl.classList.add('is-visible')
        }
      } else {
        bubbleEl.classList.remove('is-visible')
      }
    }

    /* RAF driver. dt is clamped to 50ms so a backgrounded tab that
       resumes doesn't jump the animation. `destroyed` stops the
       loop dead on unmount; `animationActive` gates rendering until
       the loader+gate finish (startScene flips it on). */
    let lastT = performance.now()
    let startT = lastT
    function loop(t: number) {
      if (destroyed) return
      const dt = Math.min(0.05, (t - lastT) / 1000)
      const elapsed = (t - startT) / 1000
      lastT = t
      if (animationActive) render(dt, elapsed)
      rafId = requestAnimationFrame(loop)
    }

    /* Called after the intro finishes — resets the clocks (so the
       pulse phase starts at 0) and begins rendering. */
    function startScene() {
      if (destroyed) return
      animationActive = true
      lastT = performance.now()
      startT = lastT
      rafId = requestAnimationFrame(loop)
    }

    /* Re-apply the current palette to every material. Called after
       the theme toggle flips data-theme on the root (which changes
       what cssVar() resolves). Note the head children are recoloured
       by index — keep buildSerpentHead's add order (body, eye, eye). */
    function refreshSceneColours() {
      const C = themeColours()
      const rodCol = rodColour()
      ;(rod.userData.shaft.material as THREE.MeshStandardMaterial).color.copy(rodCol)
      ;(rod.userData.bands as THREE.Mesh[]).forEach((b) =>
        (b.material as THREE.MeshStandardMaterial).color.copy(rodCol))
      ;(rod.userData.knob.material as THREE.MeshStandardMaterial).color.copy(C.crimson)
      ;(rod.userData.knob.material as THREE.MeshStandardMaterial).emissive.copy(C.crimson)
      ;(serpentMesh.material as THREE.MeshStandardMaterial).color.copy(C.ink)
      ;(serpentLine.material as THREE.LineBasicMaterial).color.copy(C.ink)
      ;(serpentPoly.material as THREE.LineBasicMaterial).color.copy(C.ink)
      serpentMesh.userData.head!.children.forEach((child, idx) => {
        const mesh = child as THREE.Mesh
        const m = mesh.material as THREE.MeshStandardMaterial
        if (idx === 0) m.color.copy(C.ink)
        else { m.color.copy(C.crimson); m.emissive.copy(C.crimson) }
      })
      nodes.forEach((n) => {
        n.orb.userData.baseColor = C.grape.clone()
        const m = n.orb.material as THREE.MeshStandardMaterial
        if (n.strand.id !== hoveredId) {
          m.color.copy(C.grape)
        } else {
          m.color.copy(C.crimson)
          m.emissive.copy(C.crimson)
        }
        ;(n.ring1.material as THREE.MeshBasicMaterial).color.copy(C.crimson)
        ;(n.ring2.material as THREE.MeshBasicMaterial).color.copy(C.crimson)
      })
      activeNodePointLight.color.copy(C.crimson)
    }

    /* ---- (PEEK removed) ----
       The lightweight hover synopsis card is gone in this variant;
       the full StrandPanel modal (opened on click) replaces it. */

    /* ---- LIST VIEW — the "list" toggle's alternate layout ----
       Built once from STRANDS as innerHTML. Clicks just play the
       transition sweep (same placeholder behaviour as the orbs).
       Generated inside .helix3d-root, so the scoped CSS still
       applies even though these classes are plain strings. */
    function buildList() {
      const inner = $('#listview-inner')!
      inner.innerHTML = STRANDS.map((s, i) => `
        <a class="list-item" href="#" data-id="${s.id}">
          <span class="list-num">${String(i + 1).padStart(2, '0')}</span>
          <div class="list-disc">${iconSVG(s.icon)}</div>
          <div class="list-meta">
            <div class="list-title">${s.name}</div>
            <div class="list-tag">${s.subsidiary} · ${s.tag}</div>
          </div>
          <span class="list-arrow">→</span>
        </a>
      `).join('')
      inner.querySelectorAll('.list-item').forEach((a) => {
        a.addEventListener('click', (e) => {
          e.preventDefault()
          const id = (a as HTMLElement).dataset.id
          const idx = nodes.findIndex((x) => x.strand.id === id)
          if (idx >= 0) openPanel(idx)
        })
      })
    }

    /* ---- VIEW TOGGLE — "staff" (3D) vs "list" ----
       setView() shows/hides the canvas + its overlays vs. the list
       by toggling CSS classes/inline styles. The 3D loop keeps
       running underneath; it's just visually hidden in list mode. */
    const helix3dEl   = $('#helix3d')!
    const helixFog    = $('#helix-fog')!
    const helixCenter = $('#helix-center-label')!
    const nodeLabelsEl = $('#node-labels')!
    const bubbleEl    = $('#node-bubble') as HTMLButtonElement
    const listview    = $('#listview')!
    const toggle      = $('#view-toggle')!

    /* "view more" bubble → open the active node's StrandPanel.
       Positioned each frame in updateLabels(). */
    const onBubbleClick = () => {
      if (!hoveredId) return
      const idx = nodes.findIndex((x) => x.strand.id === hoveredId)
      if (idx >= 0) openPanel(idx)
    }
    bubbleEl.addEventListener('click', onBubbleClick)
    cleanups.push(() => bubbleEl.removeEventListener('click', onBubbleClick))

    const onToggleClick = (e: Event) => {
      const btn = (e.target as HTMLElement).closest('button')
      if (!btn) return
      setView(btn.dataset.view as string)
    }
    toggle.addEventListener('click', onToggleClick)
    function setView(view: string) {
      toggle.querySelectorAll('button').forEach((b) => {
        const active = (b as HTMLElement).dataset.view === view
        b.classList.toggle('is-active', active)
        b.setAttribute('aria-selected', String(active))
      })
      const isHelix = view === 'helix'
      ;[helix3dEl, helixFog, helixCenter, nodeLabelsEl].forEach((el) => {
        el.classList.toggle('is-hidden', !isHelix)
        el.style.opacity = isHelix ? '' : '0'
        el.style.pointerEvents = isHelix ? '' : 'none'
      })
      listview.classList.toggle('is-visible', !isHelix)
    }

    /* ---- THEME (scoped to root element) ----
       data-theme is set on THIS root, never document, so the rest of
       the site is unaffected. Default follows the OS; the button
       flips it and triggers a one-shot scene recolour. To force a
       theme, drop the matchMedia line and set data-theme in the JSX. */
    const themeBtn = $('#theme-switch')!
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      root.setAttribute('data-theme', 'dark')
    }
    const onThemeClick = () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
      root.setAttribute('data-theme', next)
      requestAnimationFrame(() => refreshSceneColours())
    }
    themeBtn.addEventListener('click', onThemeClick)

    /* ---- TEXT SIZE — global rem scale (whole site, persisted).
       Lives next to the theme switch; see ../../lib/textScale. */
    const onTextDec = () => adjustTextScale(-TEXT_STEP)
    const onTextInc = () => adjustTextScale(TEXT_STEP)
    const textDec = $('#text-dec')!
    const textInc = $('#text-inc')!
    textDec.addEventListener('click', onTextDec)
    textInc.addEventListener('click', onTextInc)
    cleanups.push(() => {
      textDec.removeEventListener('click', onTextDec)
      textInc.removeEventListener('click', onTextInc)
    })

    /* ---- SKETCH TOGGLE — solid coil ↔ 3D line trace ----
       Swaps only the serpent body's visibility. Button label shows
       the action (says "sketch" while solid, "solid" while sketched)
       and carries .is-active + aria-pressed for styling/a11y. */
    const renderToggle = $('#render-toggle')!
    const nodeToggle = $('#node-toggle')!
    const polyToggle = $('#poly-toggle')!
    const rodToggle = $('#rod-toggle')!

    /* Exactly one strand representation visible: solid mesh (not
       sketch), else line trace or polygon wireframe per polyMode. */
    function applyStrandRender() {
      serpentMesh.visible = !sketchMode
      serpentLine.visible = sketchMode && !polyMode
      serpentPoly.visible = sketchMode && polyMode
    }
    /* Orb wireframe = sketch mode AND not overridden solid. Shared
       by both toggles so they compose correctly. */
    function setNodeWire() {
      const wire = sketchMode && !nodeSolid
      nodes.forEach((n) => {
        ;(n.orb.material as THREE.MeshStandardMaterial).wireframe = wire
      })
    }
    function applySketchMode(on: boolean) {
      sketchMode = on
      applyStrandRender()
      setNodeWire()
      renderToggle.classList.toggle('is-active', on)
      renderToggle.setAttribute('aria-pressed', String(on))
      renderToggle.textContent = on ? 'solid' : 'sketch'
    }
    const onRenderToggle = () => applySketchMode(!sketchMode)
    renderToggle.addEventListener('click', onRenderToggle)
    cleanups.push(() => renderToggle.removeEventListener('click', onRenderToggle))

    /* ---- POLY TOGGLE — sketch style: longitudinal line trace vs
       faceted polygon wireframe. Only visible while in sketch mode,
       but the state is independent so it composes either way. */
    function applyPolyMode(on: boolean) {
      polyMode = on
      applyStrandRender()
      polyToggle.classList.toggle('is-active', on)
      polyToggle.setAttribute('aria-pressed', String(on))
      polyToggle.textContent = on ? 'lines' : 'poly'
    }
    const onPolyToggle = () => applyPolyMode(!polyMode)
    polyToggle.addEventListener('click', onPolyToggle)
    cleanups.push(() => polyToggle.removeEventListener('click', onPolyToggle))

    /* ---- ROD TOGGLE — trace the central rod as a --bg-coloured
       wireframe (shaft + bands) so it reads as a faint outline.
       Knob keeps its crimson accent. */
    function applyRodTrace(on: boolean) {
      rodTrace = on
      const col = rodColour()
      const shaft = rod.userData.shaft.material as THREE.MeshStandardMaterial
      shaft.wireframe = on
      shaft.color.copy(col)
      ;(rod.userData.bands as THREE.Mesh[]).forEach((b) => {
        const m = b.material as THREE.MeshStandardMaterial
        m.wireframe = on
        m.color.copy(col)
      })
      rodToggle.classList.toggle('is-active', on)
      rodToggle.setAttribute('aria-pressed', String(on))
      rodToggle.textContent = on ? 'rod solid' : 'rod trace'
    }
    const onRodToggle = () => applyRodTrace(!rodTrace)
    rodToggle.addEventListener('click', onRodToggle)
    cleanups.push(() => rodToggle.removeEventListener('click', onRodToggle))

    /* ---- NODE TOGGLE — keep the orbs solid/opaque in sketch mode.
       Independent of the coil toggle; when active the grape orbs
       stay filled even while the strand is wireframed. */
    function applyNodeSolid(on: boolean) {
      nodeSolid = on
      setNodeWire()
      nodeToggle.classList.toggle('is-active', on)
      nodeToggle.setAttribute('aria-pressed', String(on))
      nodeToggle.textContent = on ? 'wire nodes' : 'solid nodes'
    }
    const onNodeToggle = () => applyNodeSolid(!nodeSolid)
    nodeToggle.addEventListener('click', onNodeToggle)
    cleanups.push(() => nodeToggle.removeEventListener('click', onNodeToggle))

    /* ---- MARQUEE — the scrolling top strip ----
       The strip text is NOT in the JSX — edit this `phrases` array.
       The block is duplicated (block + block) so the CSS
       translateX(-50%) loop is seamless. '✲' renders as the accent
       star; anything else as a plain segment. */
    function buildMarquee() {
      const track = $('#marquee-track')!
      const phrases = [
        'research programme · 2024–26', '✲',
        'mentheon · kindreon · aevorix · vitrix · acumentra', '✲',
        'six strands · one staff', '✲',
        'rendered with three.js · r184', '✲',
      ]
      const block = phrases.map((p) =>
        p === '✲' ? `<span class="star">${p}</span>` : `<span>${p}</span>`).join('')
      track.innerHTML = block + block
    }

    /* ---- CURSOR — custom dot + trailing ring ----
       The dot tracks the mouse 1:1; the ring lerps toward it for a
       lag effect, and grows (.is-active) over interactive elements.
       The native cursor is hidden via CSS (restored under 720px).
       Its own RAF is cancelled in cleanup. */
    function initCursor() {
      const dot  = $('#cursor-dot')
      const ring = $('#cursor-ring')
      if (!dot || !ring) return
      let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0
      const onMove = (e: MouseEvent) => {
        mouseX = e.clientX; mouseY = e.clientY
        dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`
      }
      window.addEventListener('mousemove', onMove)
      let cursorRaf = 0
      function lerp() {
        ringX += (mouseX - ringX) * 0.18
        ringY += (mouseY - ringY) * 0.18
        ring!.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`
        cursorRaf = requestAnimationFrame(lerp)
      }
      cursorRaf = requestAnimationFrame(lerp)

      const interactiveSel = 'a, button, .node-label, .list-item, canvas'
      const onOver = (e: Event) => {
        if ((e.target as HTMLElement).closest(interactiveSel)) ring.classList.add('is-active')
      }
      const onOut = (e: Event) => {
        if ((e.target as HTMLElement).closest(interactiveSel)) ring.classList.remove('is-active')
      }
      root!.addEventListener('mouseover', onOver)
      root!.addEventListener('mouseout', onOut)
      cleanups.push(() => {
        window.removeEventListener('mousemove', onMove)
        cancelAnimationFrame(cursorRaf)
        root!.removeEventListener('mouseover', onOver)
        root!.removeEventListener('mouseout', onOut)
      })
    }

    /* ---- MENU ----
       Full-screen overlay toggled by .is-open. (The old page-sweep
       transition was dropped in this variant — clicking a node
       opens the StrandPanel modal instead.) */
    const menuOverlay = $('#menu-overlay')!
    const onMenuOpen = () => {
      menuOverlay.classList.add('is-open')
      menuOverlay.setAttribute('aria-hidden', 'false')
    }
    const onMenuClose = () => {
      menuOverlay.classList.remove('is-open')
      menuOverlay.setAttribute('aria-hidden', 'true')
    }
    $('#menu-open')!.addEventListener('click', onMenuOpen)
    $('#menu-close')!.addEventListener('click', onMenuClose)

    /* ---- LOADER + GATE — the intro sequence ----
       Implementation lives in ./HelixIntro (HelixIntroMarkup +
       runLoader / runGate). BOOT below awaits them, passing the
       scoped query `$`, a cleanup registrar and a destroyed-flag
       getter so the intro hooks into this effect's teardown. To
       skip the intro, see the `skipIntro` branch in entry(). */

    /* ---- BOOT ----
       Build the static bits and the scene immediately (so it's ready
       behind the loader), then run the intro gates in sequence before
       starting the render loop. The `destroyed` guards bail if the
       component unmounts mid-intro. */
    buildMarquee()
    buildList()
    initThree()
    initCursor()
    initScrollNav()   // wheel/swipe traversal; starts in default view

    ;(async function entry() {
      if (skipIntro) {
        // Dev re-render: jump straight to the scene — hide the
        // loader (the gate stays hidden by default since runGate
        // never runs) and start rendering immediately.
        $('#loader')?.classList.add('is-hidden')
        startScene()
        return
      }
      const reg = (fn: () => void) => { cleanups.push(fn) }
      await runLoader($, reg, () => destroyed)
      if (destroyed) return
      await runGate($, reg)
      if (destroyed) return
      startScene()
    })()

    /* ---- TEARDOWN ----
       Effect cleanup: stop the loop, flush every collected cleanup
       (timeouts + listeners), remove the directly-bound listeners,
       and dispose all GPU resources so navigating away doesn't leak
       a WebGL context. Runs on unmount AND between StrictMode's
       double-invoke in dev. */
    return () => {
      destroyed = true
      animationActive = false
      cancelAnimationFrame(rafId)
      cleanups.forEach((fn) => { try { fn() } catch { /* noop */ } })
      toggle.removeEventListener('click', onToggleClick)
      themeBtn.removeEventListener('click', onThemeClick)
      $('#menu-open')?.removeEventListener('click', onMenuOpen)
      $('#menu-close')?.removeEventListener('click', onMenuClose)
      try {
        scene?.traverse((obj) => {
          const mesh = obj as THREE.Mesh
          if (mesh.geometry) mesh.geometry.dispose()
          const mat = mesh.material as THREE.Material | THREE.Material[] | undefined
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
          else mat?.dispose()
        })
        renderer?.dispose()
        renderer?.domElement?.remove()
      } catch { /* noop */ }
    }
  }, [])

  /* (Esc handling lives in the scene effect — exitToDefault — so it
     works whether or not the panel is open: it always zooms out.) */

  /* ---- MARKUP ----
     Full-viewport takeover (no shared site Header on this route).
     Every element is fixed/absolute and stacked by z-index in
     helix3d.css — back→front: canvas → fog → labels → headline →
     readout → list → footer → corners → nav → marquee → menu →
     gate → loader, with the StrandPanel modal (z 600) above all.

     EDITING TEXT: all static copy is literal here, EXCEPT the
     marquee (buildMarquee `phrases`) and the list view (buildList
     from STRANDS). The clicked card is the real StrandPanel, fed
     adapted concept data via toDataStrand.
     MOVING THINGS: change the element's rule in helix3d.css — don't
     reorder JSX (positioning is absolute, not flow).
     The id="…" hooks are a contract with the effect's $('#…')
     queries; rename in both places or neither. */
  return (
    <div className="helix3d-root" data-theme="light" ref={rootRef}>
      {/* INTRO — loader splash (z 2000) + sound/silent gate (z 1000).
          Markup + sequence live in ./HelixIntro. */}
      <HelixIntroMarkup />

      {/* CURSOR — custom pointer (hidden ≤720px); driven by initCursor */}
      <div className="cursor-ring" id="cursor-ring" />
      <div className="cursor-dot" id="cursor-dot" />

      {/* CORNER CROPS — decorative crimson L-marks framing the scene.
          Their offsets clear the marquee (top) and footer (bottom);
          tweak in helix3d.css `.corner-crop--*`. */}
      <span className="corner-crop corner-crop--tl" />
      <span className="corner-crop corner-crop--tr" />
      <span className="corner-crop corner-crop--bl" />
      <span className="corner-crop corner-crop--br" />

      {/* MARQUEE — track is filled by buildMarquee(); edit phrases there */}
      <div className="marquee">
        <div className="marquee-track" id="marquee-track" />
      </div>

      {/* NAV — wordmark + view toggle (#view-toggle) + theme button
          (#theme-switch) + menu button (#menu-open). All wired in the
          effect by id. */}
      <nav className="nav">
        {/* Nav brand mark — swap public/helix-logo.svg for your own
            (keep the filename, or change the src below). */}
        <a href="#" className="nav-mark" aria-label="Mentheon">
          <img
            className="nav-mark-logo"
            src={`${import.meta.env.BASE_URL}favvectorprint.svg`}
            alt="Mentheon"
          />
        </a>
        <div className="nav-controls">
          <div className="view-toggle" id="view-toggle" role="tablist" aria-label="View mode">
            <button className="is-active" data-view="helix" role="tab" aria-selected="true">staff</button>
            <button data-view="list" role="tab" aria-selected="false">list</button>
          </div>
          <button className="render-toggle" id="render-toggle" type="button" aria-pressed="false" aria-label="Toggle sketch render">sketch</button>
          <button className="render-toggle" id="poly-toggle" type="button" aria-pressed="false" aria-label="Toggle polygon trace">poly</button>
          <button className="render-toggle" id="rod-toggle" type="button" aria-pressed="false" aria-label="Toggle rod trace">rod trace</button>
          <button className="render-toggle" id="node-toggle" type="button" aria-pressed="false" aria-label="Toggle solid nodes">solid nodes</button>
          {/* Global text size — scales rem across the whole site */}
          <div className="text-size" role="group" aria-label="Text size">
            <button id="text-dec" type="button" aria-label="Decrease text size">A−</button>
            <button id="text-inc" type="button" aria-label="Increase text size">A+</button>
          </div>
          <button className="theme-switch" id="theme-switch" aria-label="Toggle theme">
            <svg className="icon-moon" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" /></svg>
            <svg className="icon-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg>
          </button>
          <button className="menu-btn" id="menu-open" aria-label="Open menu">
            menu
            <span className="menu-btn-lines"><span /><span /></span>
          </button>
        </div>
      </nav>

      {/* STAGE — the scene area. #helix3d is where the WebGL canvas
          is appended; the rest are HTML overlays on top of it.
          #node-labels is populated by buildLabels(); #listview-inner
          by buildList(). Clicking a node opens the StrandPanel
          modal (rendered below, outside .stage). */}
      <main className="stage">
        <div className="stage-readout">
          <div>programme<strong>research · 2024–26</strong></div>
          <div>strands<strong>06</strong></div>
          <div>geometry<strong>rod · coil · nodes</strong></div>
        </div>

        <div className="helix3d" id="helix3d" />{/* ← WebGL canvas mounts here */}
        <div className="helix-fog" id="helix-fog" />{/* edge vignette over canvas */}

        {/* The big editorial headline. `.accent` is the crimson word. */}
        <div className="helix-center-label" id="helix-center-label">
          <p className="kicker">research programme · 2024–26</p>
          <h1 className="title">A new <br />era of <span className="accent">Digital <br/> Health</span>.</h1>
        </div>

        <div className="node-labels" id="node-labels" />

        {/* "view more" bubble — shown for the active node (scroll-
            focused or hovered), positioned every frame by
            updateLabels(); click opens its StrandPanel. */}
        <button className="node-bubble" id="node-bubble" type="button">
          view more <span aria-hidden="true">→</span>
        </button>

        {/* (Peek card removed — the StrandPanel modal below replaces
            it; opened via the bubble, the node, or a list row.) */}

        {/* List view — inner is filled by buildList(); shown when the
            nav toggle switches to "list". */}
        <div className="listview" id="listview">
          <div className="listview-inner" id="listview-inner" />
        </div>
      </main>

      {/* FOOTER — static company strip (z 20) */}
      <div className="footer-strip">
        <span>mentheon ltd · <strong>15974246</strong></span>
        <span>london · est <strong>09.2024</strong></span>
        <span><strong>mnth ✲</strong></span>
      </div>

      {/* MENU — full-screen overlay (z 200), toggled via .is-open by
          #menu-open / #menu-close. Links are placeholders. */}
      <div className="menu-overlay" id="menu-overlay" aria-hidden="true">
        <div className="menu-top">
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.7rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gate-fg-quiet)' }}>index ✲ mentheon</span>
          <button className="menu-close" id="menu-close">close <span className="menu-close-x" /></button>
        </div>
        <div className="menu-items">
          <a className="menu-item" href="#"><span className="menu-item-num">01</span>research</a>
          <a className="menu-item" href="#"><span className="menu-item-num">02</span>subsidiaries</a>
          <a className="menu-item" href="#"><span className="menu-item-num">03</span>publications</a>
          <a className="menu-item" href="#"><span className="menu-item-num">04</span>about</a>
          <a className="menu-item" href="#"><span className="menu-item-num">05</span>contact</a>
        </div>
        <div className="menu-bottom">
          <span>mentheon ltd · companies house 15974246</span>
          <span><a href="#">linkedin</a><a href="#">github</a><a href="#">contact</a></span>
        </div>
      </div>

      {/* STRAND PANEL MODAL (z 600) — mounted only while a node is
          selected. Backdrop click / Esc / the panel's own × all
          route through handlePanelClose, which clears React state
          AND calls back into the scene (closePanelRef) to drop the
          zoom and resume the idle spin. */}
      {panelStrand && (
        <div
          className="strand-modal"
          role="dialog"
          aria-modal="true"
          onClick={handlePanelClose}
        >
          <div className="strand-modal-inner" onClick={(e) => e.stopPropagation()}>
            <StrandPanel strand={panelStrand} isOpen onClose={handlePanelClose} />
          </div>
        </div>
      )}

      {/* Marginalia right-margin tab — only on this view. Child of
          .helix3d-root so it themes with data-theme and stacks
          correctly among the scene layers (above nav/marquee,
          below the modal/gate/loader). */}
      <MarginaliaTab />
    </div>
  )
}
