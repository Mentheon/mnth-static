import { OUTPUTS, type Output } from '../data/framework'
import './product-mark.css'

/* ---- Product marks — direction 3b (Strand Logos v3): the emblem
   unchanged; the name in mono capitals in the free band above it;
   a large lowercase initial bottom-left with the second letter beside
   it at sub size, on one baseline. Ground: grape by default (cream in
   dark), crimson when selected. Aufdröselung's "a" is its drawn glyph.
   All units are the 195 tile. */
export const PT = {
  lx: { e: 9, f: 6, s: 8, o: 9, r: 11, v: 7 } as Record<string, number>,
  BIG: 140, SUB: 64, INSET: 8, GAP: 9, HDR_TRACK: 0.16, GRAPE: '#9C528B',
}
export let aufPath = ''
const aufReady = fetch(`${import.meta.env.BASE_URL}aufdroselung-logo.svg`).then((r) => r.text()).then((t) => {
  const ds = [...t.matchAll(/<path d="([^"]*)"/g)].map((m) => m[1]); aufPath = ds[ds.length - 1] || ''
}).catch(() => {})
export const emblemImg = new Image()
const emblemReady = new Promise<void>((res) => { emblemImg.onload = () => res(); emblemImg.onerror = () => res() })
emblemImg.src = `${import.meta.env.BASE_URL}emblem-cream.svg`
const fontsReady = Promise.all([
  document.fonts?.load('900 100px Lato'), document.fonts?.load('500 100px "JetBrains Mono"'),
]).catch(() => {})
export const productMarksReady = Promise.all([aufReady, emblemReady, fontsReady])
let _mctx: CanvasRenderingContext2D | null = null
const measure = (s: string, font: string) => {
  if (!_mctx) _mctx = document.createElement('canvas').getContext('2d')
  _mctx!.font = font
  return _mctx!.measureText(s).width / 100
}
/* One header size for every product, so the band reads as a system. */
function hdrSize() {
  const names = OUTPUTS.map((o) => o.product).filter(Boolean) as string[]
  return Math.min(17, ...names.map((n) => 171 / (measure(n.toUpperCase(), '500 100px "JetBrains Mono", monospace') + PT.HDR_TRACK * n.length)))
}
export function layout3b(name: string) {
  const l = name[0].toLowerCase(), s = name[1].toLowerCase()
  const x0 = (PT.lx[l] ?? 10) + PT.INSET
  const k = PT.BIG / 107
  const isA = l === 'a' && !!aufPath
  const right = isA ? 12.35 + PT.INSET + (61.6 - 12.35) * k : x0 + measure(l, '900 100px Lato, sans-serif') * PT.BIG
  return { l, s, x0, k, isA, right, hdr: hdrSize() }
}
export function productTileHTML(o: Output, selected = false) {
  if (!o.product) {
    const [a, b] = o.code.split('-')
    return `<span class="logo-tile${selected ? ' is-selected' : ''}" aria-hidden="true"><span>${a}</span><span>${b}</span><i>✲</i></span>`
  }
  const L = layout3b(o.product)
  const big = L.isA
    ? `<path d="${aufPath}" class="pt-ink" transform="translate(${12.35 + PT.INSET - L.k * 12.35} ${178 - L.k * 178}) scale(${L.k})"/>`
    : `<text x="${L.x0}" y="178" class="pt-ink pt-initial" font-size="${PT.BIG}">${L.l}</text>`
  const sub = `<text x="${L.right + PT.GAP}" y="178" class="pt-ink pt-initial" font-size="${PT.SUB}">${L.s}</text>`
  const hdr = `<text x="12" y="${12 + L.hdr * 0.74}" class="pt-ink pt-plate" font-size="${L.hdr}" letter-spacing="${PT.HDR_TRACK * L.hdr}">${o.product.toUpperCase()}</text>`
  const mask = `url(${import.meta.env.BASE_URL}emblem-cream.svg)`
  return `<span class="ptile${selected ? ' is-selected' : ''}${o.category === 'advisory' ? ' is-advisory' : ''}" aria-hidden="true"><span class="ptile-emblem" style="-webkit-mask-image:${mask};mask-image:${mask}"></span>`
    + `<svg viewBox="0 0 195 195">${hdr}${big}${sub}</svg></span>`
}

export const AUF_ID = OUTPUTS.find((o) => o.product === 'Aufdröselung')?.id ?? 'pla-01'
export const essenIcon = (dark: boolean) => `${import.meta.env.BASE_URL}essen-icon-${dark ? 'cream' : 'plum'}.png`
