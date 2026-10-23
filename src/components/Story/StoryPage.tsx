import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { STORY, type StoryChapter } from '../../data/story'
import st from './StoryPage.module.css'

/* #story — experimental: scroll through photos whose depth "expands".

   One fixed WebGL canvas sits behind the scrolling chapters. Each photo is
   a finely divided plane whose vertices are pushed toward/away from the
   viewer by its depth map: z = (depth − focus) · s · K, where s is the
   eased scroll progress through that chapter (0 = flat, 1 = full depth).
   The camera drifts a little (and follows the mouse) so the parallax reads
   on a flat screen. The last part of each chapter crossfades to the next.
   Photos + depth maps are listed in src/data/story.ts. */

const BASE = import.meta.env.BASE_URL
const SEC_VH = 240                 // chapter length, % of viewport height
const RAMP = 0.65                  // share of a chapter over which depth expands
const FADE = 0.82                  // crossfade to the next chapter starts here
const K = 0.55                     // max depth displacement (world units) at strength 1
const FOV = 35, DIST = 3, MARGIN = 1.14
const CONTAIN = 0.88               // split mode: the whole photo, with a little room round it
/* Sketch mode: each chapter starts as a line trace on a blueprint (the
   whole photo in frame) with its depth fully open and swaying — the
   trace hides any roughness in the depth — and one scroll resolves it into
   the full-definition photo as the depth settles flat: the flat, sharp
   photo is the resting view. SK_END = where that finishes (chapter
   progress); SK_SWAY = side-to-side camera swing at full depth. */
const SK_END = 0.6, SK_SWAY = 0.2
/* Trace style: 'detail' = every edge (photo + depth); 'outline' = only
   object outlines, bold (mostly depth edges, plus coarse photo edges). */
type Trace = 'detail' | 'outline'
/* Full layout: 'fill' = photo covers the page (cropped); 'fit' = the whole
   photo centred on the blueprint, as sketch mode always shows it. */
type Fit = 'fill' | 'fit'
/* Depth source: 'original' = the photo's own (camera / two eyes; else the
   gradient); 'ai' = the Depth Anything estimate, where one was made. */
type DepthSrc = 'original' | 'ai'
const DEPTH_SRC_KEY = 'mnth:storyDepthSrc'
/* Reverse: flips which way the depth goes with scroll (sketch: flat trace →
   photo in depth; normal: full depth → flat). */
const REVERSE_KEY = 'mnth:storyReverse'
const readReverse = () => { try { return localStorage.getItem(REVERSE_KEY) === '1' } catch { return false } }
const readDepthSrc = (): DepthSrc => { try { return localStorage.getItem(DEPTH_SRC_KEY) === 'ai' ? 'ai' : 'original' } catch { return 'original' } }
const FIT_KEY = 'mnth:storyFit'
const readFit = (): Fit => { try { return localStorage.getItem(FIT_KEY) === 'fit' ? 'fit' : 'fill' } catch { return 'fill' } }
const TRACE_KEY = 'mnth:storyTrace'
const readTrace = (): Trace => { try { return localStorage.getItem(TRACE_KEY) === 'outline' ? 'outline' : 'detail' } catch { return 'detail' } }
const SKETCH_KEY = 'mnth:storySketch'
const readSketch = () => { try { return localStorage.getItem(SKETCH_KEY) === '1' } catch { return false } }

/* full = photo covers the page; left/right = the whole photo (uncropped)
   in that half, captions in the other — for viewing from a distance. */
type Layout = 'full' | 'left' | 'right'
const LAYOUT_KEY = 'mnth:storyLayout'
const readLayout = (): Layout => {
  try { const v = localStorage.getItem(LAYOUT_KEY); return v === 'left' || v === 'right' ? v : 'full' } catch { return 'full' }
}

const VERT = /* glsl */ `
uniform sampler2D depthMap;
uniform float s, K, d0;
varying vec2 vUv;
void main() {
  vUv = uv;
  float d = texture2D(depthMap, uv).r;
  vec3 p = position;
  p.z += (d - d0) * s * K;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`
/* fidelity 0 = Mentheon line trace (ink edges on paper, from the photo's
   edges and, stronger, its depth edges, plus a hairline frame); 1 = the
   photo. The trace resolves near-first (depth-ordered reveal). */
const FRAG = /* glsl */ `
uniform sampler2D photo, depthMap;
uniform float opacity, showDepth, fidelity, outlineOnly;
uniform vec2 texel;
uniform vec3 ink, paper;
varying vec2 vUv;
float lum(vec2 uv) { return dot(texture2D(photo, uv).rgb, vec3(0.299, 0.587, 0.114)); }
float dep(vec2 uv) { return texture2D(depthMap, uv).r; }
float sobelL(vec2 uv) {
  vec2 t = texel;
  float gx = -lum(uv + vec2(-t.x, -t.y)) - 2.0 * lum(uv + vec2(-t.x, 0.0)) - lum(uv + vec2(-t.x, t.y))
             + lum(uv + vec2(t.x, -t.y)) + 2.0 * lum(uv + vec2(t.x, 0.0)) + lum(uv + vec2(t.x, t.y));
  float gy = -lum(uv + vec2(-t.x, -t.y)) - 2.0 * lum(uv + vec2(0.0, -t.y)) - lum(uv + vec2(t.x, -t.y))
             + lum(uv + vec2(-t.x, t.y)) + 2.0 * lum(uv + vec2(0.0, t.y)) + lum(uv + vec2(t.x, t.y));
  return length(vec2(gx, gy));
}
float sobelD(vec2 uv) {
  vec2 t = texel * 1.5;
  float gx = dep(uv + vec2(t.x, 0.0)) - dep(uv - vec2(t.x, 0.0));
  float gy = dep(uv + vec2(0.0, t.y)) - dep(uv - vec2(0.0, t.y));
  return length(vec2(gx, gy));
}
/* Bold object outlines: depth edges sampled wide (thick, clean lines),
   plus photo edges at a coarse scale with a high threshold (shapes, not
   texture). */
float outlines(vec2 uv) {
  vec2 t = texel * 3.0;
  float g = 0.0;
  for (int k = 0; k < 8; k++) {
    float a = float(k) * 0.7853982;
    vec2 o = vec2(cos(a), sin(a)) * t;
    g = max(g, abs(dep(uv + o) - dep(uv - o)));
  }
  float dl = smoothstep(0.06, 0.14, g);
  float cl = 0.0;
  vec2 c4 = texel * 4.0;
  float gx = lum(uv + vec2(c4.x, 0.0)) - lum(uv - vec2(c4.x, 0.0));
  float gy = lum(uv + vec2(0.0, c4.y)) - lum(uv - vec2(0.0, c4.y));
  cl = smoothstep(0.3, 0.45, length(vec2(gx, gy)));
  return max(dl, cl * 0.6);
}
void main() {
  vec3 c = texture2D(photo, vUv).rgb;
  float d = dep(vUv);
  if (fidelity < 0.999) {
    float e = outlineOnly > 0.5 ? outlines(vUv)
      : max(smoothstep(0.22, 0.5, sobelL(vUv)) * 0.75, smoothstep(0.035, 0.1, sobelD(vUv)));
    vec2 fr = min(vUv, 1.0 - vUv) / texel;
    e = max(e, 1.0 - smoothstep(0.8, 1.6, min(fr.x, fr.y)));
    vec3 sketch = mix(paper, ink, e);
    float reveal = smoothstep(0.0, 1.0, clamp(fidelity * 1.7 - (1.0 - d) * 0.7, 0.0, 1.0));
    c = mix(sketch, c, reveal);
  }
  gl_FragColor = vec4(mix(c, vec3(d), showDepth), opacity);
  #include <colorspace_fragment>
}`

const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
const clamp01 = (x: number) => Math.min(1, Math.max(0, x))

/* ---- textures ---- */
type Tex = { photo: THREE.Texture; depth: THREE.Texture; aspect: number; note?: string }

function canvasTex(cv: HTMLCanvasElement, srgb: boolean) {
  const t = new THREE.CanvasTexture(cv)
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace
  t.minFilter = THREE.LinearFilter
  return t
}
/* No depth map given: far at the top, near at the bottom (most photos). */
function gradientDepth() {
  const cv = document.createElement('canvas'); cv.width = 8; cv.height = 256
  const g = cv.getContext('2d')!, gr = g.createLinearGradient(0, 0, 0, 256)
  gr.addColorStop(0, '#000'); gr.addColorStop(0.45, '#555'); gr.addColorStop(1, '#fff')
  g.fillStyle = gr; g.fillRect(0, 0, 8, 256)
  return canvasTex(cv, false)
}
/* Built-in test scene: layered hills, sun and a near monolith, with a
   depth map drawn from the same shapes. */
function demoTex(): Tex {
  const W = 1600, H = 1000
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c }
  const pc = mk(), dc = mk(), p = pc.getContext('2d')!, d = dc.getContext('2d')!
  const sky = p.createLinearGradient(0, 0, 0, H)
  sky.addColorStop(0, '#FFECE1'); sky.addColorStop(1, '#F2B49C')
  p.fillStyle = sky; p.fillRect(0, 0, W, H)
  const dsky = d.createLinearGradient(0, 0, 0, H)
  dsky.addColorStop(0, '#000'); dsky.addColorStop(1, '#151515')
  d.fillStyle = dsky; d.fillRect(0, 0, W, H)
  const disc = (ctx: CanvasRenderingContext2D, fill: string) => { ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(1150, 330, 110, 0, Math.PI * 2); ctx.fill() }
  disc(p, '#E0A526'); disc(d, '#141414')
  const hill = (ctx: CanvasRenderingContext2D, fill: string, base: number, amp: number, f: number, ph: number) => {
    ctx.fillStyle = fill; ctx.beginPath(); ctx.moveTo(0, H)
    for (let x = 0; x <= W; x += 8) ctx.lineTo(x, base + amp * Math.sin(x * f + ph) + amp * 0.35 * Math.sin(x * f * 2.7 + ph * 1.9))
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill()
  }
  ;([['#C589B5', '#5a5a5a', 560, 60, 0.004, 0.4], ['#9C528B', '#999', 690, 70, 0.0055, 2.1], ['#2F0147', '#d6d6d6', 830, 55, 0.007, 4.0]] as const)
    .forEach(([pf, df, b, a, f, ph]) => { hill(p, pf, b, a, f, ph); hill(d, df, b, a, f, ph) })
  p.fillStyle = '#A30B37'; p.fillRect(300, 470, 120, 530)
  d.fillStyle = '#fff'; d.fillRect(300, 470, 120, 530)
  return { photo: canvasTex(pc, true), depth: canvasTex(dc, false), aspect: W / H }
}
function loadTex(ch: StoryChapter, src: DepthSrc, onReady: () => void): Tex {
  if (ch.demo) { const t = demoTex(); queueMicrotask(onReady); return t }
  const depthPath = src === 'ai' ? ch.aiDepth ?? ch.depth : ch.depth
  const out: Tex = { photo: new THREE.Texture(), depth: depthPath ? new THREE.Texture() : gradientDepth(), aspect: 1.5 }
  if (!depthPath) out.note = 'no depth map: using a top-far gradient'
  else if (src === 'ai' && !ch.aiDepth) out.note = 'no ai depth for this photo (run the import with --ai): showing its original'
  const loader = new THREE.TextureLoader()
  out.photo = loader.load(BASE + ch.photo, (t) => {
    out.aspect = (t.image as HTMLImageElement).width / (t.image as HTMLImageElement).height
    onReady()
  }, undefined, () => { out.note = `photo not found: public/${ch.photo}`; onReady() })
  out.photo.colorSpace = THREE.SRGBColorSpace
  if (depthPath) {
    out.depth = loader.load(BASE + depthPath, () => onReady(), undefined, () => {
      out.depth = gradientDepth(); out.note = `depth map not found: public/${depthPath}`; onReady()
    })
    out.depth.colorSpace = THREE.NoColorSpace
  }
  return out
}

/* `chapters`: which photos this page tells (default: the whole STORY);
   `title`: its intro heading. #story1 etc. pass their own. */
export default function StoryPage({ chapters = STORY, title = 'Depth, as you scroll' }: { chapters?: StoryChapter[]; title?: string } = {}) {
  const STORY = chapters
  const holder = useRef<HTMLDivElement>(null)
  const chaptersRef = useRef<HTMLDivElement>(null)
  const meterRef = useRef<HTMLSpanElement>(null)
  const [strength, setStrength] = useState(1)
  const [showDepth, setShowDepth] = useState(false)
  const [layout, setLayoutState] = useState<Layout>(readLayout)
  const [sketch, setSketchState] = useState(readSketch)
  const [trace, setTraceState] = useState<Trace>(readTrace)
  const [fit, setFitState] = useState<Fit>(readFit)
  const [depthSrc, setDepthSrcState] = useState<DepthSrc>(readDepthSrc)
  const setDepthSrc = (d: DepthSrc) => { setDepthSrcState(d); setNotes({}); try { localStorage.setItem(DEPTH_SRC_KEY, d) } catch { /* storage unavailable */ } }
  const hasAi = STORY.some((c) => c.aiDepth)
  const [reverse, setReverseState] = useState(readReverse)
  const setReverse = (on: boolean) => { setReverseState(on); try { localStorage.setItem(REVERSE_KEY, on ? '1' : '0') } catch { /* storage unavailable */ } }
  const setFit = (f: Fit) => { setFitState(f); try { localStorage.setItem(FIT_KEY, f) } catch { /* storage unavailable */ } }
  // Contained (whole photo in frame): fit, sketch, or a split half.
  const contained = fit === 'fit' || sketch || layout !== 'full'
  const setTrace = (t: Trace) => { setTraceState(t); try { localStorage.setItem(TRACE_KEY, t) } catch { /* storage unavailable */ } }
  const setSketch = (on: boolean) => { setSketchState(on); try { localStorage.setItem(SKETCH_KEY, on ? '1' : '0') } catch { /* storage unavailable */ } }
  // Sketch mode steps: each scroll lands on the next stage (trace → photo → zoom).
  useEffect(() => {
    const el = document.documentElement
    el.style.scrollSnapType = sketch ? 'y mandatory' : ''
    return () => { el.style.scrollSnapType = '' }
  }, [sketch])
  const setLayout = (l: Layout) => { setLayoutState(l); try { localStorage.setItem(LAYOUT_KEY, l) } catch { /* storage unavailable */ } }
  const [active, setActive] = useState(0)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const settings = useRef({ strength, showDepth, layout, sketch, trace, contained, depthSrc, reverse })
  settings.current = { strength, showDepth, layout, sketch, trace, contained, depthSrc, reverse }

  useEffect(() => {
    const el = holder.current, chaptersEl = chaptersRef.current
    if (!el || !chaptersEl) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setClearColor(0x000000, 0)
    el.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 50)
    const geo = new THREE.PlaneGeometry(1, 1, 256, 256)
    const mkMesh = (order: number, depthTest: boolean) => {
      const mat = new THREE.ShaderMaterial({
        vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthTest,
        uniforms: {
          photo: { value: null }, depthMap: { value: null }, s: { value: 0 }, K: { value: K }, d0: { value: 0.5 }, opacity: { value: 1 }, showDepth: { value: 0 },
          fidelity: { value: 1 }, outlineOnly: { value: 0 }, texel: { value: new THREE.Vector2(1 / 900, 1 / 900) }, ink: { value: new THREE.Color() }, paper: { value: new THREE.Color() },
        },
      })
      const m = new THREE.Mesh(geo, mat); m.renderOrder = order; scene.add(m); return m
    }
    const cur = mkMesh(0, true), next = mkMesh(1, false)   // next paints over during the crossfade

    const cache = new Map<string, Tex>()
    const tex = (i: number) => {
      const src = settings.current.depthSrc, key = `${i}:${src}`
      if (!cache.has(key)) {
        const t = loadTex(STORY[i], src, () => { if (t.note && settings.current.depthSrc === src) setNotes((n) => ({ ...n, [STORY[i].id]: t.note! })) })
        cache.set(key, t)
        if (t.note) queueMicrotask(() => setNotes((n) => ({ ...n, [STORY[i].id]: t.note! })))
      }
      return cache.get(key)!
    }
    const fit = (m: THREE.Mesh, aspect: number) => {
      const vh = 2 * DIST * Math.tan(THREE.MathUtils.degToRad(FOV / 2)), va = camera.aspect
      let h: number
      if (!settings.current.contained) h = aspect > va ? vh * MARGIN : (vh * va * MARGIN) / aspect   // cover
      else h = aspect > va ? (vh * va * CONTAIN) / aspect : vh * CONTAIN                                    // contain
      m.scale.set(h * aspect, h, 1)
    }
    // Trace colours follow the site theme (ink on paper), like the blueprint.
    const colours = { ink: new THREE.Color('#2F0147'), paper: new THREE.Color('#FFECE1') }
    const readColours = () => {
      const cs = getComputedStyle(document.documentElement)
      colours.ink.set(cs.getPropertyValue('--ink').trim() || '#2F0147')
      colours.paper.set(cs.getPropertyValue('--bg').trim() || '#FFECE1')
    }
    readColours()
    const onTheme = () => requestAnimationFrame(readColours)
    window.addEventListener('mnth:theme', onTheme)
    const apply = (m: THREE.Mesh, i: number, s: number, opacity: number, fidelity = 1) => {
      const t = tex(i), ch = STORY[i], u = (m.material as THREE.ShaderMaterial).uniforms
      u.fidelity.value = fidelity
      u.outlineOnly.value = settings.current.trace === 'outline' ? 1 : 0
      u.texel.value.set(1 / 900, t.aspect / 900)
      u.ink.value.copy(colours.ink); u.paper.value.copy(colours.paper)
      u.photo.value = t.photo; u.depthMap.value = t.depth
      u.s.value = s; u.K.value = K * (ch.strength ?? 1) * settings.current.strength
      u.d0.value = ch.focus ?? 0.5; u.opacity.value = opacity
      u.showDepth.value = settings.current.showDepth ? 1 : 0
      fit(m, t.aspect)
    }

    const resize = () => renderer.setSize(window.innerWidth, window.innerHeight)
    /* Draw into the whole page or one half of it. */
    let viewKey = ''
    const setView = () => {
      const W = window.innerWidth, H = window.innerHeight, l = settings.current.layout
      const x = l === 'right' ? W / 2 : 0, w = l === 'full' ? W : W / 2
      const key = `${l}:${W}x${H}`
      if (key === viewKey) return
      viewKey = key
      renderer.setViewport(x, 0, w, H)
      camera.aspect = w / H
      camera.updateProjectionMatrix()
    }
    resize()
    window.addEventListener('resize', resize)
    const ptr = { x: 0, y: 0, sx: 0, sy: 0 }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      ptr.x = (e.clientX / window.innerWidth) * 2 - 1; ptr.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onMove)

    let raf = 0, last = -1
    const t0 = performance.now()
    const frame = () => {
      raf = requestAnimationFrame(frame)
      setView()
      const secH = (window.innerHeight * SEC_VH) / 100
      const y = -chaptersEl.getBoundingClientRect().top
      const i = Math.min(STORY.length - 1, Math.max(0, Math.floor(y / secH)))
      const p = y < 0 ? 0 : clamp01((y - i * secH) / secH)
      const sk = settings.current.sketch
      const fade = i < STORY.length - 1 && p > FADE ? ease((p - FADE) / (1 - FADE)) : 0
      // Sketch: trace + open depth → full-definition flat photo, in one
      // scroll (reverse: flat trace → photo in depth). Normal: depth grows
      // (reverse: full depth flattens).
      const rev = settings.current.reverse
      const sp = ease(clamp01(p / SK_END))
      const fid = sk ? sp : 1
      const grow = sk ? sp : ease(clamp01(p / RAMP))
      const s = (sk ? !rev : rev) ? 1 - grow : grow
      const s0 = (sk ? !rev : rev) ? 1 : 0             // a chapter's opening depth
      apply(cur, i, s, 1, fid)
      next.visible = fade > 0
      if (fade > 0) apply(next, i + 1, s0, fade, sk ? 0 : 1)   // next chapter's opening state
      if (i + 1 < STORY.length) tex(i + 1)               // preload the next chapter
      if (i !== last) { last = i; setActive(i) }
      if (meterRef.current) meterRef.current.style.setProperty('--s', s.toFixed(3))
      // Camera: a slow drift plus the mouse, both growing with the depth.
      const t = (performance.now() - t0) / 1000
      ptr.sx += (ptr.x - ptr.sx) * 0.06; ptr.sy += (ptr.y - ptr.sy) * 0.06
      const amt = 0.25 + s
      // Sketch: a wider sway so the opened-up depth reads as perspective.
      const drift = reduce ? 0 : Math.sin(t * 0.45) * (sk ? SK_SWAY : 0.07) * s
      camera.position.set(drift + ptr.sx * 0.11 * amt, -ptr.sy * 0.07 * amt + (reduce ? 0 : (p - 0.5) * 0.1 * s), DIST)
      camera.lookAt(0, 0, 0)
      renderer.render(scene, camera)
    }
    frame()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('mnth:theme', onTheme)
      cache.forEach((t) => { t.photo.dispose(); t.depth.dispose() })
      geo.dispose(); (cur.material as THREE.Material).dispose(); (next.material as THREE.Material).dispose()
      renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove()
    }
  }, [])

  return (
    <div className={st.page} data-layout={layout} data-contained={contained ? 'on' : undefined}>
      <div ref={holder} className={st.stage} aria-hidden="true" />

      <section className={st.intro}>
        <div className={st.card}>
          <p className={st.kick}>story <span className={st.star}>✲</span> experimental</p>
          <h1 className={st.title}>{title}</h1>
          <p className={st.lede}>
            Each photo starts flat and gains depth as you move through it, then hands over to the next.
            Built from a photo and its depth map; add your own in <code>src/data/story.ts</code>.
          </p>
          <p className={st.hint}>scroll <span aria-hidden="true">↓</span></p>
        </div>
      </section>

      <div ref={chaptersRef}>
        {STORY.map((ch, i) => (
          <section key={ch.id} className={st.chapter} style={{ height: `${SEC_VH}vh` }}>
            {/* Sketch mode stops: trace in depth, then the flat photo. */}
            {sketch && [0, SK_END].map((f) => <span key={f} className={st.snap} style={{ top: `${f * 100}%` }} aria-hidden="true" />)}
            <div className={st.capWrap}>
              <article className={st.card}>
                <p className={st.kick}>{String(i + 1).padStart(2, '0')} / {String(STORY.length).padStart(2, '0')}</p>
                <h2 className={st.chTitle}>{ch.title}</h2>
                <p className={st.lede}>{ch.caption}</p>
                {notes[ch.id] && <p className={st.note}>{notes[ch.id]}</p>}
                {ch.heic && (
                  <a className={st.heic} href={BASE + ch.heic}>spatial photo (Vision Pro) <span aria-hidden="true">↦</span></a>
                )}
              </article>
            </div>
          </section>
        ))}
      </div>

      <section className={st.outro}>
        <div className={st.card}>
          <p className={st.kick}>end <span className={st.star}>✲</span> story</p>
          <p className={st.lede}>That's the sequence. Photos and depth maps go in <code>public/story/</code>.</p>
        </div>
      </section>

      <aside className={st.panel} aria-label="Depth controls">
        <span className={st.count}>{String(active + 1).padStart(2, '0')} / {String(STORY.length).padStart(2, '0')}</span>
        <span className={st.meter} ref={meterRef} title="Depth (scroll progress)"><i /></span>
        <span className={st.seg} role="group" aria-label="Layout">
          {(['full', 'left', 'right'] as const).map((l) => (
            <button key={l} type="button" aria-pressed={layout === l} onClick={() => setLayout(l)}>{l}</button>
          ))}
        </span>
        <label className={st.ctl}>
          depth
          <input type="range" min={0} max={2} step={0.05} value={strength} onChange={(e) => setStrength(Number(e.target.value))} />
        </label>
        {layout === 'full' && (
          <span className={st.seg} role="group" aria-label="Photo fit" title={sketch ? 'Sketch mode always fits the whole photo' : undefined}>
            {(['fill', 'fit'] as const).map((f) => (
              <button key={f} type="button" aria-pressed={(sketch ? 'fit' : fit) === f} disabled={sketch} onClick={() => setFit(f)}>{f}</button>
            ))}
          </span>
        )}
        {hasAi && (
          <span className={st.seg} role="group" aria-label="Depth source" title="original: the photo's own depth · ai: Depth Anything's estimate">
            {(['original', 'ai'] as const).map((d) => (
              <button key={d} type="button" aria-pressed={depthSrc === d} onClick={() => setDepthSrc(d)}>{d}</button>
            ))}
          </span>
        )}
        <label className={st.ctl} title="Each photo starts as a line trace in open depth on a blueprint; one scroll resolves it into the full photo as the depth settles flat">
          <input type="checkbox" checked={sketch} onChange={(e) => setSketch(e.target.checked)} />
          sketch
        </label>
        {sketch && (
          <span className={st.seg} role="group" aria-label="Trace style">
            {(['detail', 'outline'] as const).map((t) => (
              <button key={t} type="button" aria-pressed={trace === t} onClick={() => setTrace(t)}>{t}</button>
            ))}
          </span>
        )}
        <label className={st.ctl} title={sketch ? 'Start as a flat trace and open into depth' : 'Start in full depth and flatten as you scroll'}>
          <input type="checkbox" checked={reverse} onChange={(e) => setReverse(e.target.checked)} />
          reverse
        </label>
        <label className={st.ctl}>
          <input type="checkbox" checked={showDepth} onChange={(e) => setShowDepth(e.target.checked)} />
          show depth map
        </label>
      </aside>
    </div>
  )
}
