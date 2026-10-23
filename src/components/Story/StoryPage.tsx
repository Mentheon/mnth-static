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
const FRAG = /* glsl */ `
uniform sampler2D photo, depthMap;
uniform float opacity, showDepth;
varying vec2 vUv;
void main() {
  vec3 c = texture2D(photo, vUv).rgb;
  vec3 dm = vec3(texture2D(depthMap, vUv).r);
  gl_FragColor = vec4(mix(c, dm, showDepth), opacity);
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
function loadTex(ch: StoryChapter, onReady: () => void): Tex {
  if (ch.demo) { const t = demoTex(); queueMicrotask(onReady); return t }
  const out: Tex = { photo: new THREE.Texture(), depth: ch.depth ? new THREE.Texture() : gradientDepth(), aspect: 1.5 }
  if (!ch.depth) out.note = 'no depth map: using a top-far gradient'
  const loader = new THREE.TextureLoader()
  out.photo = loader.load(BASE + ch.photo, (t) => {
    out.aspect = (t.image as HTMLImageElement).width / (t.image as HTMLImageElement).height
    onReady()
  }, undefined, () => { out.note = `photo not found: public/${ch.photo}`; onReady() })
  out.photo.colorSpace = THREE.SRGBColorSpace
  if (ch.depth) {
    out.depth = loader.load(BASE + ch.depth, () => onReady(), undefined, () => {
      out.depth = gradientDepth(); out.note = `depth map not found: public/${ch.depth}`; onReady()
    })
    out.depth.colorSpace = THREE.NoColorSpace
  }
  return out
}

export default function StoryPage() {
  const holder = useRef<HTMLDivElement>(null)
  const chaptersRef = useRef<HTMLDivElement>(null)
  const meterRef = useRef<HTMLSpanElement>(null)
  const [strength, setStrength] = useState(1)
  const [showDepth, setShowDepth] = useState(false)
  const [active, setActive] = useState(0)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const settings = useRef({ strength, showDepth })
  settings.current = { strength, showDepth }

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
        uniforms: { photo: { value: null }, depthMap: { value: null }, s: { value: 0 }, K: { value: K }, d0: { value: 0.5 }, opacity: { value: 1 }, showDepth: { value: 0 } },
      })
      const m = new THREE.Mesh(geo, mat); m.renderOrder = order; scene.add(m); return m
    }
    const cur = mkMesh(0, true), next = mkMesh(1, false)   // next paints over during the crossfade

    const cache = new Map<number, Tex>()
    const tex = (i: number) => {
      if (!cache.has(i)) cache.set(i, loadTex(STORY[i], () => {
        const t = cache.get(i)
        if (t?.note) setNotes((n) => ({ ...n, [STORY[i].id]: t.note! }))
      }))
      return cache.get(i)!
    }
    const fit = (m: THREE.Mesh, aspect: number) => {
      const vh = 2 * DIST * Math.tan(THREE.MathUtils.degToRad(FOV / 2)), va = camera.aspect
      const h = aspect > va ? vh * MARGIN : (vh * va * MARGIN) / aspect
      m.scale.set(h * aspect, h, 1)
    }
    const apply = (m: THREE.Mesh, i: number, s: number, opacity: number) => {
      const t = tex(i), ch = STORY[i], u = (m.material as THREE.ShaderMaterial).uniforms
      u.photo.value = t.photo; u.depthMap.value = t.depth
      u.s.value = s; u.K.value = K * (ch.strength ?? 1) * settings.current.strength
      u.d0.value = ch.focus ?? 0.5; u.opacity.value = opacity
      u.showDepth.value = settings.current.showDepth ? 1 : 0
      fit(m, t.aspect)
    }

    const resize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight)
      camera.aspect = window.innerWidth / window.innerHeight
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
      const secH = (window.innerHeight * SEC_VH) / 100
      const y = -chaptersEl.getBoundingClientRect().top
      const i = Math.min(STORY.length - 1, Math.max(0, Math.floor(y / secH)))
      const p = y < 0 ? 0 : clamp01((y - i * secH) / secH)
      const s = ease(clamp01(p / RAMP))
      const fade = i < STORY.length - 1 && p > FADE ? ease((p - FADE) / (1 - FADE)) : 0
      apply(cur, i, s, 1)
      next.visible = fade > 0
      if (fade > 0) apply(next, i + 1, 0, fade)
      if (i + 1 < STORY.length) tex(i + 1)               // preload the next chapter
      if (i !== last) { last = i; setActive(i) }
      if (meterRef.current) meterRef.current.style.setProperty('--s', s.toFixed(3))
      // Camera: a slow drift plus the mouse, both growing with the depth.
      const t = (performance.now() - t0) / 1000
      ptr.sx += (ptr.x - ptr.sx) * 0.06; ptr.sy += (ptr.y - ptr.sy) * 0.06
      const amt = 0.25 + s
      const drift = reduce ? 0 : Math.sin(t * 0.45) * 0.07 * s
      camera.position.set(drift + ptr.sx * 0.11 * amt, -ptr.sy * 0.07 * amt + (reduce ? 0 : (p - 0.5) * 0.1 * s), DIST)
      camera.lookAt(0, 0, 0)
      renderer.render(scene, camera)
    }
    frame()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      cache.forEach((t) => { t.photo.dispose(); t.depth.dispose() })
      geo.dispose(); (cur.material as THREE.Material).dispose(); (next.material as THREE.Material).dispose()
      renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove()
    }
  }, [])

  return (
    <div className={st.page}>
      <div ref={holder} className={st.stage} aria-hidden="true" />

      <section className={st.intro}>
        <div className={st.card}>
          <p className={st.kick}>story <span className={st.star}>✲</span> experimental</p>
          <h1 className={st.title}>Depth, as you scroll</h1>
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
        <label className={st.ctl}>
          depth
          <input type="range" min={0} max={2} step={0.05} value={strength} onChange={(e) => setStrength(Number(e.target.value))} />
        </label>
        <label className={st.ctl}>
          <input type="checkbox" checked={showDepth} onChange={(e) => setShowDepth(e.target.checked)} />
          show depth map
        </label>
      </aside>
    </div>
  )
}
