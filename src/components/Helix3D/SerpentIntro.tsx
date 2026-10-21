// @ts-nocheck — ported from the Logo Intro v4 prototype (Logo Intro v4.dc.html);
// typed loosely on purpose. See SerpentIntro at the bottom for the site wrapper.
// Prototype v4: as v3, but the serpent "skins" from wire prototype into a
// solid, anatomically plausible Aesculapian snake (scaled body with flat
// ventral plates against the staff, sculpted head, round-pupil eyes,
// nostrils, pink mouth lining) for the rear + hiss, then un-skins back to the
// sketch as the camera pulls out. A crimson seam ring marks the boundary.
// (v3 notes:) Prototype v3: the logo is first drafted in pencil on graph paper (frame,
// guides, outlines, dimensions), then inked into the real tile. From Release
// on it is identical to v2.
// (v2 notes:) logo tile → 3D serpent, which turns on the camera and hisses
// (rear back, strike, gape, tongue, sound rings) before the camera pulls out
// and the coil unwinds into the staff. Everything renders from the clock T.
import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import markSrc from './MentheonMark.tsx?raw'
import { HELIX_CATEGORIES, categoryById, outputsIn, pad2 } from '../../data/framework'
import { emblemImg, productMarksReady } from '../ProductMark'
import { skipIntroAlways, setSkipIntroAlways } from '../../lib/introGate'

/* Local copies of the easing/clamp helpers the prototype used. */
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const Easing = {
  easeOutQuart: (t: number) => 1 - Math.pow(1 - t, 4),
  easeInOutCubic: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  easeInOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
}

const W = 1920, H = 1080;
const PALETTE = {
  light: { bg: '#FFECE1', ink: '#2F0147', plum: '#3F0247', crimson: '#A30B37', grape: '#9C528B',
    quiet: 'rgba(47,1,71,0.55)', bp: 'rgba(47,1,71,0.06)', bpStrong: 'rgba(47,1,71,0.10)', fog: '255,236,225', chipBorder: '#3F0247' },
  dark: { bg: '#1A0226', ink: '#FFECE1', plum: '#2A0B3A', crimson: '#D63158', grape: '#C589B5',
    quiet: 'rgba(255,236,225,0.55)', bp: 'rgba(255,236,225,0.05)', bpStrong: 'rgba(255,236,225,0.09)', fog: '26,2,38', chipBorder: '#FFECE1' },
};
const TILE_INK = '#2F0147', TILE_MARK = '#FFECE1';
// The six staff sections, as on the live page: Plasmids at the head,
// then the five care-pathway categories.
const STAFF_CATS = [categoryById('plasmids'), ...HELIX_CATEGORIES];
const STRANDS = STAFF_CATS.map((c) => {
  const n = outputsIn(c.id).length;
  return { name: c.label, sub: `${c.id === 'plasmids' ? 'software' : c.verb.toLowerCase()} · ${pad2(n)} project${n === 1 ? '' : 's'}`, cat: c.id };
});
// Node t-range on the coil, matching Helix3D's SNAKE.tStart/tEnd, and the
// rotor's resting drop, so the intro lands on the live staff's layout.
const NODE_T = { start: 0.03, end: 0.84 }, ROTOR_DROP = 0.5;
/* Section cube faces (Strand Logos tile), as on the live page. */
const STRAND_SPLITS = { therapeutics: ['LENI', 'TUDO'], detection: ['AEV', 'ORIX'], monitoring: ['VIT', 'RIX'],
  forecasting: ['ACU', 'MENTRA'], perception: ['KIND', 'REON'], plasmids: ['PLAS', 'MIDS'] };
let _lctx = null;
const latoW = (t) => { if (!_lctx) _lctx = document.createElement('canvas').getContext('2d'); _lctx.font = '900 100px Lato, sans-serif'; return _lctx.measureText(t).width / 100; };
function strandTexture(cat, dark) {
  const S = 512, k = S / 195;
  const cv = document.createElement('canvas'); cv.width = cv.height = S;
  const g = cv.getContext('2d');
  const ground = dark ? '#FFECE1' : '#2F0147', ink = dark ? '#2F0147' : '#FFECE1';
  g.fillStyle = ground; g.fillRect(0, 0, S, S);
  if (emblemImg.complete && emblemImg.naturalWidth) {
    const t = document.createElement('canvas'); t.width = t.height = S;
    const tg = t.getContext('2d');
    tg.drawImage(emblemImg, 0, 0, S, S);
    tg.globalCompositeOperation = 'source-in'; tg.fillStyle = ink; tg.fillRect(0, 0, S, S);
    g.drawImage(t, 0, 0);
  }
  const split = STRAND_SPLITS[cat] || [cat.slice(0, 4).toUpperCase(), cat.slice(4).toUpperCase()];
  const size = Math.min(46, ...Object.values(STRAND_SPLITS).map(([a, b]) => Math.min(171 / (latoW(b) * 0.985), 120 / (latoW(a) * 0.985))));
  g.save(); g.scale(k, k); g.fillStyle = ink; g.font = `900 ${size}px Lato, sans-serif`;
  g.letterSpacing = `${-0.015 * size}px`;
  g.fillText(split[0], 12, 178 - size * 0.86); g.fillText(split[1], 12, 178);
  g.restore();
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return tex;
}

// ---- motion helpers: the only easing used in the piece ----
const prog = (T, s, e) => clamp((T - s) / (e - s), 0, 1);
const MOTION = {
  enter: (T, s, e) => Easing.easeOutQuart(prog(T, s, e)),      // entrances, reveals
  move: (T, s, e) => Easing.easeInOutCubic(prog(T, s, e)),     // camera-like moves, morphs
  fade: (T, s, e) => Easing.easeInOutSine(prog(T, s, e)),      // opacity crossfades
};
const lerp = (a, b, k) => a + (b - a) * k;
const smooth = (x) => { const c = clamp(x, 0, 1); return c * c * (3 - 2 * c); };

// ---- the logo artwork, verbatim from the repo's MentheonMark.tsx ----
let MARK = null;
const markReady = Promise.resolve(markSrc as string).then((src) => {
  const grab = (cls) => {
    const m = src.match(new RegExp('<g className="' + cls + '">([\\s\\S]*?)</g>'));
    return m ? m[1].replace(/\s\/>/g, '/>') : '';
  };
  MARK = { serpent: grab('serpent'), men: grab('word-men'), theon: grab('word-theon') };
  // Outline versions for the pencil pass: every shape normalised to
  // pathLength 1 so one dash offset draws it on, fills stripped.
  const outline = (h) => h.replace(/\sfill="[^"]*"/g, '').replace(/<(path|circle|ellipse|rect|polygon|polyline|line)\b/g, '<$1 pathLength="1"');
  MARK.sk = { serpent: outline(MARK.serpent), men: outline(MARK.men), theon: outline(MARK.theon) };
});
const threeReady = Promise.resolve();

// Emblem anchor in tile units (rod centre-line, middle of the coil).
const EMBLEM = { x: 140.4, y: 72 };
const TILE_PX = 380;                      // on-screen tile size during "Tile"
const EMBLEM_K = 4.6;                     // px per tile unit at hand-off
const PX_PER_UNIT = H / (2 * 8.5 * Math.tan((32 / 2) * Math.PI / 180)); // ≈221

// ---- 3D ----
const ROD = { radius: 0.05, knobR: 0.1 };
const BODY = { R: 0.085, segs: 220, rad: 8 };
const NODE = { orbR: 0.16, ring1: 0.22, ring2: 0.3 };

function buildScene(C, cubes, dark) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  // DPR capped at 1.5: ~44% fewer pixels than 2× on retina, visually the same here.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(W, H, false);
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, W / H, 0.1, 100);
  camera.position.set(0, 0, 8.5);
  camera.lookAt(0, 0, 0);
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(3, 4, 5); scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 0.5); fill.position.set(-4, 1, 3); scene.add(fill);
  scene.add(new THREE.HemisphereLight(0xfff1e6, 0x2f0147, 0.55));
  const rim = new THREE.DirectionalLight(0xffe6d0, 0.9); rim.position.set(-2, 3, -4); scene.add(rim);

  const rod = new THREE.Group();
  const shaftMat = new THREE.MeshBasicMaterial({ color: C.ink, wireframe: true, transparent: true });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(ROD.radius, ROD.radius, 1, 16, 24), shaftMat);
  const knobMat = new THREE.MeshStandardMaterial({ color: C.crimson, emissive: C.crimson, emissiveIntensity: 0.18, roughness: 0.4, metalness: 0.25, transparent: true });
  const knob = new THREE.Mesh(new THREE.SphereGeometry(ROD.knobR, 24, 16), knobMat);
  rod.add(shaft, knob);
  scene.add(rod);

  const rotor = new THREE.Group();
  scene.add(rotor);

  // Body: a tapered tube rebuilt on the CPU each frame; fixed topology so the
  // poly-trace line index is built once. Index is ordered head → tail so
  // setDrawRange traces the serpent on from the head.
  const nV = (BODY.segs + 1) * (BODY.rad + 1);
  const pos = new Float32Array(nV * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const idx = [];
  const v = (i, j) => i * (BODY.rad + 1) + j;
  for (let i = 0; i < BODY.segs; i++) for (let j = 0; j < BODY.rad; j++) {
    idx.push(v(i, j), v(i + 1, j), v(i, j), v(i, j + 1), v(i, j), v(i + 1, j + 1));
  }
  geo.setIndex(idx);
  const bodyMat = new THREE.LineBasicMaterial({ color: C.ink, transparent: true });
  const body = new THREE.LineSegments(geo, bodyMat);
  body.frustumCulled = false;
  rotor.add(body);

  // ---- v4: solid skinned body (same path, finer ring, shaped section) ----
  const RAD2 = 28;
  const nVS = (BODY.segs + 1) * (RAD2 + 1);
  const posS = new Float32Array(nVS * 3), uvS = new Float32Array(nVS * 2);
  for (let i = 0; i <= BODY.segs; i++) for (let j = 0; j <= RAD2; j++) {
    const kk = i * (RAD2 + 1) + j; uvS[kk * 2] = i / BODY.segs; uvS[kk * 2 + 1] = j / RAD2;
  }
  const idxS = [];
  for (let i = 0; i < BODY.segs; i++) for (let j = 0; j < RAD2; j++) {
    const a = i * (RAD2 + 1) + j, b = (i + 1) * (RAD2 + 1) + j, c = (i + 1) * (RAD2 + 1) + j + 1, d = i * (RAD2 + 1) + j + 1;
    idxS.push(a, b, d, b, c, d);
  }
  const geoS = new THREE.BufferGeometry();
  geoS.setAttribute('position', new THREE.BufferAttribute(posS, 3));
  geoS.setAttribute('uv', new THREE.BufferAttribute(uvS, 2));
  geoS.setIndex(idxS);
  const scaleTex = makeScaleTextures();
  const skinMat = new THREE.MeshPhysicalMaterial({ map: scaleTex.map, bumpMap: scaleTex.bump, bumpScale: 2.2,
    roughness: 0.5, clearcoat: 0.45, clearcoatRoughness: 0.4, side: THREE.DoubleSide });
  const solidBody = new THREE.Mesh(geoS, skinMat); solidBody.frustumCulled = false; rotor.add(solidBody);
  // Second wire view over the same buffers so wire can show on both sides of the skin.
  const geoA = new THREE.BufferGeometry(); geoA.setAttribute('position', geo.attributes.position); geoA.setIndex(geo.index);
  const bodyA = new THREE.LineSegments(geoA, bodyMat); bodyA.frustumCulled = false; rotor.add(bodyA);
  const seamMat = new THREE.MeshBasicMaterial({ color: C.crimson, transparent: true });
  const seams = [0, 1].map(() => { const sm = new THREE.Mesh(new THREE.TorusGeometry(1, 0.05, 6, 48), seamMat); sm.visible = false; rotor.add(sm); return sm; });

  // Head — the faceted Aesculapian skull from Helix3D.tsx, split at the
  // mouth line into an upper skull and a jaw, both hinged near the back
  // of the head so the mouth can gape. +Z = snout, +Y = up.
  const head = new THREE.Group();
  const R = BODY.R, L = R * 3.9, Wd = R * 1.45, Hd = R * 1.0;
  const shape = (g, lower) => {
    const sp = g.attributes.position;
    for (let i = 0; i < sp.count; i++) {
      let x = sp.getX(i), y = sp.getY(i), z = sp.getZ(i);
      const f = z > 0 ? 1 - 0.34 * z * z : 1 - 0.12 * z * z;
      x *= Wd * f; y *= Hd * f * (lower ? 0.62 : 1);
      if (!lower && z > 0.2) y *= 1 - 0.18 * (z - 0.2);
      z *= L * 0.5;
      sp.setXYZ(i, x, y, z);
    }
    return g;
  };
  const headMat = new THREE.LineBasicMaterial({ color: C.ink, transparent: true });
  const hingeZ = -L * 0.5 * 0.55;
  const upper = new THREE.Group(), jaw = new THREE.Group();
  upper.position.set(0, 0, L * 0.32 + hingeZ);
  jaw.position.copy(upper.position);
  const upperMesh = new THREE.LineSegments(new THREE.WireframeGeometry(shape(new THREE.SphereGeometry(1, 12, 5, 0, Math.PI * 2, 0, Math.PI / 2), false)), headMat);
  const jawMesh = new THREE.LineSegments(new THREE.WireframeGeometry(shape(new THREE.SphereGeometry(1, 12, 4, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), true)), headMat);
  upperMesh.position.z = -hingeZ; jawMesh.position.z = -hingeZ;
  upper.add(upperMesh); jaw.add(jawMesh);
  const eyeMat = new THREE.MeshStandardMaterial({ color: C.crimson, emissive: C.crimson, emissiveIntensity: 0.5, transparent: true });
  const e1 = new THREE.Mesh(new THREE.SphereGeometry(R * 0.2, 10, 8), eyeMat);
  e1.position.set(Wd * 0.72, Hd * 0.42, -hingeZ + L * 0.2);
  const e2 = e1.clone(); e2.position.x = -Wd * 0.72;
  upper.add(e1, e2);
  head.add(upper, jaw);

  // ---- v4: REAL head — same hinge/halves, sculpted + vertex-coloured ----
  const DORSAL = new THREE.Color('#3a3423'), SIDE = new THREE.Color('#5a5033'), BELLY = new THREE.Color('#ddc98c'), LIP = new THREE.Color('#e9dba8');
  const sculpt = (g, lower) => {
    const sp = g.attributes.position, col = [];
    for (let i = 0; i < sp.count; i++) {
      const xo = sp.getX(i), yo = sp.getY(i), zo = sp.getZ(i);
      const f = zo > 0 ? 1 - 0.34 * zo * zo : 1 - 0.12 * zo * zo;
      const x = xo * Wd * 0.78 * f * (1 + 0.12 * Math.exp(-((zo + 0.55) ** 2) / 0.05));    // narrower; jaw-angle bulge
      let y = yo * Hd * f * (lower ? 0.36 : 0.8);   // shallow lower jaw
      if (!lower && zo > 0.2) y *= 1 - 0.18 * (zo - 0.2);                          // brow → snout slope
      if (!lower) y += Hd * 0.12 * smooth((yo - 0.15) / 0.3) * Math.exp(-(((Math.abs(xo) - 0.62) ** 2) / 0.03 + ((zo - 0.3) ** 2) / 0.05)); // supraocular ridge
      sp.setXYZ(i, x, y, zo * L * 0.5);
      const c = lower ? LIP.clone().lerp(BELLY, smooth(-yo * 2))
        : DORSAL.clone().lerp(SIDE, smooth(1 - yo * 1.6)).lerp(LIP, smooth(1 - yo * 5));
      col.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  };
  const headSolidMat = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.42, clearcoat: 0.55, clearcoatRoughness: 0.35 });
  const mouthMat = new THREE.MeshStandardMaterial({ color: '#6e2a38', roughness: 0.65, side: THREE.BackSide });
  const uG = sculpt(new THREE.SphereGeometry(1, 40, 14, 0, Math.PI * 2, 0, Math.PI / 2), false);
  const lG = sculpt(new THREE.SphereGeometry(1, 40, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), true);
  const realHead = [];
  [[upper, uG], [jaw, lG]].forEach(([grp, g]) => {
    const outer = new THREE.Mesh(g, headSolidMat); outer.position.z = -hingeZ;
    const inner = new THREE.Mesh(g, mouthMat); inner.position.z = -hingeZ; inner.scale.setScalar(0.97);
    grp.add(outer, inner); realHead.push(outer, inner);
  });
  const realEyeMat = new THREE.MeshPhysicalMaterial({ map: makeEyeTexture(), roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.05 });
  const nosMat = new THREE.MeshStandardMaterial({ color: '#140d08', roughness: 0.8 });
  [-1, 1].forEach((side) => {
    const e = new THREE.Mesh(new THREE.SphereGeometry(R * 0.22, 24, 16), realEyeMat);
    e.position.set(side * Wd * 0.64, Hd * 0.32, -hingeZ + L * 0.2);
    e.rotation.y = side > 0 ? 0 : Math.PI;
    const n = new THREE.Mesh(new THREE.SphereGeometry(R * 0.07, 8, 6), nosMat);
    n.position.set(side * Wd * 0.14, Hd * 0.18, -hingeZ + L * 0.45);
    upper.add(e, n); realHead.push(e, n);
  });

  // Forked tongue on its own group so its length can flick (scale.z).
  const tongueMat = new THREE.MeshBasicMaterial({ color: C.crimson, transparent: true });
  const tongue = new THREE.Group();
  tongue.position.set(0, -Hd * 0.12, L * 0.32 + L * 0.36);
  const tR = R * 0.06, stemLen = R * 1.6, tineLen = R * 0.8;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(tR, tR, stemLen, 5), tongueMat);
  stem.rotation.x = Math.PI / 2; stem.position.z = stemLen / 2;
  tongue.add(stem);
  const tines = [-1, 1].map((side) => {
    const g = new THREE.Group(); g.position.z = stemLen;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(tR * 0.8, tR * 0.35, tineLen, 5), tongueMat);
    m.rotation.x = Math.PI / 2; m.position.z = tineLen / 2;
    g.add(m); g.userData.side = side; tongue.add(g);
    return g;
  });
  head.add(tongue);

  // Hiss "sound" rings — the node pulse-ring motif, emitted from the mouth.
  const hissRings = [0, 1, 2].map(() => {
    const ring = new THREE.Mesh(new THREE.RingGeometry(R * 1.16, R * 1.24, 64),
      new THREE.MeshBasicMaterial({ color: C.crimson, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
    scene.add(ring);
    return ring;
  });
  const mouthTip = new THREE.Object3D(); mouthTip.position.set(0, 0, L * 0.32 + L * 0.55); head.add(mouthTip);
  rotor.add(head);

  const cubeGeo = new THREE.BoxGeometry(1, 1, 1);
  const nodes = STRANDS.map((st) => {
    let orb;
    if (cubes) {
      // Section cube: lit sides, strand-logo face, drawn over the coil.
      const side = new THREE.MeshLambertMaterial({ color: dark ? 0xFFECE1 : 0x6A2A7E, transparent: true });
      side.emissive.copy(side.color).multiplyScalar(0.28);
      const face = new THREE.MeshBasicMaterial({ map: strandTexture(st.cat, dark), transparent: true });
      const mats = [side, side, side, side, face, face];
      mats.forEach((m) => { m.depthTest = false; });
      orb = new THREE.Mesh(cubeGeo, mats);
      orb.renderOrder = 10;
      orb.userData.cube = true;
    } else {
      const orbMat = new THREE.MeshStandardMaterial({ color: C.grape, roughness: 0.35, metalness: 0.45, wireframe: true, transparent: true });
      orb = new THREE.Mesh(new THREE.SphereGeometry(NODE.orbR, 24, 18), orbMat);
    }
    const ringMat = new THREE.MeshBasicMaterial({ color: C.crimson, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
    const ring1 = new THREE.Mesh(new THREE.RingGeometry(NODE.ring1 * 0.92, NODE.ring1, 48), ringMat);
    const ring2 = new THREE.Mesh(new THREE.RingGeometry(NODE.ring2 * 0.94, NODE.ring2, 48), ringMat.clone());
    rotor.add(orb, ring1, ring2);
    return { orb, ring1, ring2 };
  });
  return { renderer, scene, camera, rod, shaft, knob, rotor, body, geo, pos, head, nodes,
    upper, jaw, tongue, tines, hissRings, mouthTip,
    RAD2, posS, geoS, geoA, bodyA, solidBody, seams, realHead, wireHead: [upperMesh, jawMesh, e1, e2],
    solidMats: [skinMat, headSolidMat, mouthMat, realEyeMat, nosMat],
    mats: { shaftMat, knobMat, bodyMat, headMat, eyeMat, tongueMat, seamMat } };
}

// The morph: m = 0 is the flat emblem (helix squashed into the picture
// plane, short, ~1¼ turns); m = 1 is the production staff (0.8 × 3.6, 3 turns).
function coilParams(m, depth, pose) {
  pose = pose || {};
  return {
    depth,
    neckSpan: 0.08 + (pose.neck || 0),
    rearY: pose.rearY || 0,
    off: pose.off || null,
    turns: lerp(1.25, 3, m),
    height: lerp(1.02, 3.6, m),        // emblem coil spans ~49 tile units
    radius: lerp(0.21, 0.8, m),        // emblem serpents sit ~10 units off the rod
    neckLift: lerp(0.04, 0.16, m),
    tail: lerp(0.04, 0.17, m),
  };
}
function coilPoint(p, t, out) {
  let r = p.radius;
  // The neck stops winding past t = -0.06 so a long (reared) neck rises
  // and reaches out instead of wrapping further round the staff.
  const a = Math.max(t, -0.06) * p.turns * Math.PI * 2;
  let y = p.height / 2 - p.height * t;
  if (t < 0) {
    const s = -t / p.neckSpan;
    y += p.neckLift * s * s + p.rearY * Math.pow(s, 1.6);
    r *= 1 + 0.1 * s;
    out.set(r * Math.cos(a), y, p.depth * r * Math.sin(a));
    if (p.off) out.addScaledVector(p.off, s * s);
    return out;
  }
  if (t > 1) r = lerp(p.radius, ROD.radius + 0.07, smooth((t - 1) / p.tail));
  return out.set(r * Math.cos(a), y, p.depth * r * Math.sin(a));
}

function updateBody(S, p, reveal) {
  const n = BODY.segs, tA = -p.neckSpan, tB = 1 + p.tail;
  const P = [], Tn = [];
  for (let i = 0; i <= n; i++) P.push(coilPoint(p, lerp(tA, tB, i / n), new THREE.Vector3()));
  for (let i = 0; i <= n; i++) {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(n, i + 1)];
    Tn.push(b.clone().sub(a).normalize());
  }
  // Parallel-transport frame (no flips through the flat state).
  let N = new THREE.Vector3(0, 0, 1);
  if (Math.abs(N.dot(Tn[0])) > 0.9) N.set(1, 0, 0);
  const tmp = new THREE.Vector3(), B = new THREE.Vector3(), dir = new THREE.Vector3();
  const uCoil = p.neckSpan / (tB - tA), uTail = (1 + p.neckSpan) / (tB - tA);
  for (let i = 0; i <= n; i++) {
    const T0 = Tn[i];
    N.sub(tmp.copy(T0).multiplyScalar(N.dot(T0))).normalize();
    B.crossVectors(T0, N).normalize();
    const u = i / n;
    let r;
    if (u < uCoil) r = BODY.R * (0.78 + 0.22 * smooth(u / uCoil));
    else if (u < uTail - 0.04) r = BODY.R * (1 + 0.07 * Math.sin(Math.PI * (u - uCoil) / (uTail - uCoil)));
    else r = BODY.R * lerp(1, 0.05, smooth((u - (uTail - 0.04)) / (1 - (uTail - 0.04))));
    for (let j = 0; j <= BODY.rad; j++) {
      const ang = (j / BODY.rad) * Math.PI * 2;
      dir.copy(N).multiplyScalar(Math.cos(ang)).addScaledVector(B, Math.sin(ang));
      const k = (i * (BODY.rad + 1) + j) * 3;
      S.pos[k] = P[i].x + r * dir.x; S.pos[k + 1] = P[i].y + r * dir.y; S.pos[k + 2] = P[i].z + r * dir.z;
    }
  }
  S.geo.attributes.position.needsUpdate = true;
  // Skin range [a, b] (head → tail fractions) is solid; wire shows outside it.
  const sk = S.skin || { a: 0, b: 0 };
  const rw = BODY.rad * 6, rs = S.RAD2 * 6;
  const iA = Math.floor(sk.a * n), iB = Math.ceil(sk.b * n), iR = Math.ceil(reveal * n);
  S.geo.setDrawRange(Math.min(iB, iR) * rw, Math.max(0, iR - iB) * rw);
  S.geoA.setDrawRange(0, Math.min(iA, iR) * rw);
  const solidN = Math.max(0, Math.min(iB, iR) - iA);
  S.solidBody.visible = solidN > 0;
  if (solidN > 0) updateSolid(S, P, Tn, uCoil, uTail);
  S.geoS.setDrawRange(iA * rs, solidN * rs);
  [[sk.b, iB], [sk.a, iA]].forEach(([u, ii], q) => {
    const sm = S.seams[q], on = u > 0.004 && u < 0.996;
    sm.visible = on;
    if (!on) return;
    const i = Math.min(n, Math.max(0, ii));
    sm.position.copy(P[i]);
    sm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), Tn[i]);
    sm.scale.setScalar(radiusAt(i / n, uCoil, uTail) * 1.32);
  });
  // Head at the neck end; base pose faces outward along the neck.
  const fwd = Tn[0].clone().negate(); fwd.y = fwd.y * 0.2 - 0.12; fwd.normalize();
  S.headBaseQ = basisQ(fwd);
  S.head.position.copy(P[0]);
}
function radiusAt(u, uCoil, uTail) {
  if (u < uCoil) return BODY.R * (0.78 + 0.22 * smooth(u / uCoil));
  if (u < uTail - 0.04) return BODY.R * (1 + 0.07 * Math.sin(Math.PI * (u - uCoil) / (uTail - uCoil)));
  return BODY.R * lerp(1, 0.05, smooth((u - (uTail - 0.04)) / (1 - (uTail - 0.04))));
}
// Solid section: belly faces the staff (or down, along the neck). Dorsal
// half is a slightly flattened arch with a faint vertebral ridge; the
// ventral half is a flat, squared-off plate — a snake's loaf-shaped body.
function updateSolid(S, P, Tn, uCoil, uTail) {
  const n = BODY.segs, RAD2 = S.RAD2, pos = S.posS;
  const d = new THREE.Vector3(), l = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i <= n; i++) {
    const u = i / n, r = radiusAt(u, uCoil, uTail), Pi = P[i], T0 = Tn[i];
    const neck = u < uCoil ? 1 - smooth((u / uCoil) * 1.2) : 0;
    d.set(Pi.x, 0, Pi.z); if (d.lengthSq() < 1e-6) d.set(1, 0, 0);
    d.normalize().lerp(up, neck);
    d.addScaledVector(T0, -d.dot(T0)).normalize();
    l.crossVectors(T0, d).normalize();
    for (let j = 0; j <= RAD2; j++) {
      const th = (j / RAD2) * Math.PI * 2, c = Math.cos(th), sn = Math.sin(th);
      let xs, ys;
      if (sn >= 0) { xs = c * 1.06; ys = sn * 0.9 + 0.06 * Math.exp(-(c * c) / 0.02) * sn; }
      else { xs = Math.sign(c) * Math.pow(Math.abs(c), 0.8) * 1.06; ys = -0.64 * Math.pow(-sn, 0.45); }
      const k = (i * (RAD2 + 1) + j) * 3;
      pos[k] = Pi.x + r * (l.x * xs + d.x * ys);
      pos[k + 1] = Pi.y + r * (l.y * xs + d.y * ys);
      pos[k + 2] = Pi.z + r * (l.z * xs + d.z * ys);
    }
  }
  S.geoS.attributes.position.needsUpdate = true;
  S.geoS.computeVertexNormals();
}
// Body texture (x = along body, y = around). Belly band centred at v 0.75:
// transverse ventral plates; elsewhere staggered overlapping dorsal scales
// with pale flecks, olive-brown like an Aesculapian snake. Bump map matches.
function makeScaleTextures() {
  const S = 512;
  const mk = () => { const cv = document.createElement('canvas'); cv.width = cv.height = S; return cv; };
  const cv = mk(), bm = mk(), c = cv.getContext('2d'), b = bm.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, S);
  g.addColorStop(0, '#5a5033'); g.addColorStop(0.5, '#5a5033'); g.addColorStop(0.75, '#2f2a1c'); g.addColorStop(1, '#5a5033');
  c.fillStyle = g; c.fillRect(0, 0, S, S);
  b.fillStyle = '#404040'; b.fillRect(0, 0, S, S);
  const COLS = 16, ROWS = 17, cw = S / COLS, rh = (S * 0.76) / ROWS;
  const scale = (x, y) => {
    let gr = c.createRadialGradient(x - cw * 0.1, y, 1, x, y, cw * 0.6);
    gr.addColorStop(0, 'rgba(112,100,66,0.95)'); gr.addColorStop(1, 'rgba(46,41,26,0.95)');
    c.fillStyle = gr; c.beginPath(); c.ellipse(x, y, cw * 0.55, rh * 0.62, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(18,14,8,0.6)'; c.lineWidth = 1.4; c.stroke();
    gr = b.createRadialGradient(x - cw * 0.1, y, 1, x, y, cw * 0.6);
    gr.addColorStop(0, '#e6e6e6'); gr.addColorStop(1, '#2a2a2a');
    b.fillStyle = gr; b.beginPath(); b.ellipse(x, y, cw * 0.55, rh * 0.62, 0, 0, Math.PI * 2); b.fill();
  };
  for (let rr = 0; rr <= ROWS; rr++) for (let col = 0; col < COLS; col++) {
    const x = col * cw + (rr % 2 ? cw / 2 : 0), y = (195 + rr * rh) % S;
    for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) {
      const X = x + dx, Y = y + dy;
      if (X > -cw && X < S + cw && Y > -rh && Y < S + rh) scale(X, Y);
    }
  }
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  c.fillStyle = 'rgba(240,232,205,0.5)';
  for (let i = 0; i < 240; i++) c.fillRect(rnd() * S, (195 + rnd() * 389) % S, 2, 1.5);
  const by0 = 61, by1 = 195, PL = 8, pw = S / PL;
  for (let k = 0; k < PL; k++) {
    const gx = c.createLinearGradient(k * pw, 0, (k + 1) * pw, 0);
    gx.addColorStop(0, '#d8c78e'); gx.addColorStop(0.85, '#b5a065'); gx.addColorStop(1, '#7a6a3a');
    c.fillStyle = gx; c.fillRect(k * pw, by0, pw, by1 - by0);
    const bx = b.createLinearGradient(k * pw, 0, (k + 1) * pw, 0);
    bx.addColorStop(0, '#f0f0f0'); bx.addColorStop(0.85, '#909090'); bx.addColorStop(1, '#202020');
    b.fillStyle = bx; b.fillRect(k * pw, by0, pw, by1 - by0);
  }
  [[by0 - 8, by0, 0, 0.35], [by1, by1 + 8, 0.35, 0]].forEach(([y0, y1, a0, a1]) => {
    const e = c.createLinearGradient(0, y0, 0, y1);
    e.addColorStop(0, 'rgba(20,16,8,' + a0 + ')'); e.addColorStop(1, 'rgba(20,16,8,' + a1 + ')');
    c.fillStyle = e; c.fillRect(0, y0, S, y1 - y0);
  });
  const tex = (cvs, srgb) => {
    const t = new THREE.CanvasTexture(cvs);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(34, 1); t.anisotropy = 8;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  return { map: tex(cv, true), bump: tex(bm, false) };
}
// Eye: equirect map centred on +X — amber-brown iris, round pupil
// (Aesculapian snakes are non-venomous colubrids with round pupils).
function makeEyeTexture() {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128;
  const c = cv.getContext('2d');
  c.fillStyle = '#1e140a'; c.fillRect(0, 0, 256, 128);
  const g = c.createRadialGradient(128, 64, 4, 128, 64, 48);
  g.addColorStop(0, '#e2b04c'); g.addColorStop(0.55, '#a8701f'); g.addColorStop(1, '#2e1c0c');
  c.fillStyle = g; c.beginPath(); c.arc(128, 64, 48, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#050302'; c.beginPath(); c.arc(128, 64, 17, 0, Math.PI * 2); c.fill();
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function basisQ(fwd) {
  const xA = new THREE.Vector3(0, 1, 0).cross(fwd).normalize();
  const yA = fwd.clone().cross(xA);
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(xA, yA, fwd));
}

function LogoIntro({ T, CUES, theme, nodeStyle }) {
  const tw = { theme };
  const C = PALETTE[tw.theme === 'dark' ? 'dark' : 'light'];
  const [ready, setReady] = useState(!!(THREE && MARK));
  const holder = useRef(null);
  const S = useRef(null);

  useEffect(() => { Promise.all([threeReady, markReady, productMarksReady]).then(() => setReady(true)); }, []);
  useEffect(() => {
    if (!ready || !holder.current) return;
    S.current = buildScene(C, nodeStyle === 'embedded', tw.theme === 'dark');
    const cv = S.current.renderer.domElement;
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    holder.current.appendChild(cv);
    return () => { S.current.renderer.dispose(); cv.remove(); S.current = null; };
  }, [ready, tw.theme]);

  // ---- choreography (all from T) ----
  const t0 = CUES.Sketch, tI = CUES.Ink, tR = CUES.Release, tL = CUES.Lift, tRe = CUES.Rear, tH = CUES.Hiss, tC = CUES.Coil,
    tN = CUES.Nodes, tS = CUES.Settle, tO = CUES.Out;
  // ---- Sketch: pencil draft on graph paper ----
  const tileIn = MOTION.fade(T, t0, t0 + 0.15);
  const paper = MOTION.fade(T, t0, t0 + 0.5) * (1 - MOTION.fade(T, tI + 0.2, tI + 1.0));
  const frame1 = MOTION.enter(T, t0 + 0.15, t0 + 0.9);
  const frame2 = MOTION.enter(T, t0 + 0.35, t0 + 1.05);
  const guides = MOTION.move(T, t0 + 0.6, t0 + 1.3);
  const dims = MOTION.enter(T, t0 + 1.0, t0 + 1.5);
  const skSerp = MOTION.move(T, t0 + 0.9, t0 + 2.2);
  const skMen = MOTION.move(T, t0 + 1.5, t0 + 2.4);
  const skTheon = MOTION.move(T, t0 + 1.7, t0 + 2.6);
  const crops = MOTION.enter(T, t0 + 2.3, t0 + 2.7);
  // ---- Ink: the drawing is inked top-down into the real tile ----
  const inkWipe = MOTION.move(T, tI, tI + 0.7);
  const skOut = 1 - MOTION.fade(T, tI + 0.3, tI + 0.9);
  const notesOut = 1 - MOTION.fade(T, tI, tI + 0.4);
  const serpIn = T >= tI ? 1 : 0, menIn = serpIn, theonIn = serpIn;
  const boil = Math.floor(T * 8) % 4;
  const mono3 = "'JetBrains Mono', monospace";
  const menOut = MOTION.enter(T, tR, tR + 0.6);
  const theonOut = MOTION.enter(T, tR + 0.1, tR + 0.7);
  const toCircle = MOTION.move(T, tR + 0.2, tR + 1.0);
  const tileGone = MOTION.fade(T, tR + 0.85, tR + 1.4);
  const grow = MOTION.move(T, tR + 0.3, tL);
  const svgOut = MOTION.fade(T, tL + 0.25, tL + 0.85);
  const glIn = MOTION.fade(T, tL - 0.1, tL + 0.3);
  const reveal = MOTION.enter(T, tL - 0.1, tL + 0.7);
  // Coil shape: a little growth while lifting, the rest after the hiss.
  const depth = MOTION.move(T, tL + 0.5, tL + 1.4);
  const m = 0.3 * MOTION.move(T, tL + 0.5, tRe) + 0.7 * MOTION.move(T, tC + 0.3, tN + 0.2);
  // Hiss beat — anticipation (rear back, mouth parts), strike (fast lunge,
  // gape, tongue), hold, then release back onto the coil.
  const face = MOTION.move(T, tL + 0.9, tRe + 0.4) * (1 - MOTION.move(T, tC, tC + 0.9));
  const rear = MOTION.move(T, tRe, tH);
  const lunge = MOTION.enter(T, tH, tH + 0.22);
  const release = MOTION.move(T, tH + 1.0, tC + 0.7);
  const live = 1 - release;
  const pose = {
    neck: 0.1 * Math.max(rear, lunge) * live,
    rearY: 0.3 * rear * (1 - 0.6 * lunge) * live,
    fwd: (-0.1 * rear + 0.6 * lunge) * live,
    pitch: (0.4 * rear - 0.22 * lunge) * live,
    jaw: (0.14 * rear + 0.52 * lunge + 0.05 * Math.sin(T * 38) * lunge) * live,
  };
  const tongueAmt = MOTION.enter(T, tRe + 0.45, tRe + 0.75) * live;
  const shake = lunge * (1 - MOTION.fade(T, tH + 0.2, tH + 0.8));
  const camClose = MOTION.move(T, tL + 0.85, tRe + 0.6);
  const camOut = MOTION.move(T, tC, tC + 1.9);
  // v4 skinning: wire → solid from the head down as the camera closes in;
  // solid → wire, again head first, as it pulls out after the hiss.
  const skin = MOTION.move(T, tL + 0.75, tRe + 0.4);
  const deskin = MOTION.move(T, tC + 0.15, tC + 1.8);
  const allOut = MOTION.fade(T, tO, tO + 0.55);

  // Tile/emblem placement: point P (tile units) sits at screen point (sx, sy), scale k.
  const k0 = TILE_PX / 195;
  const k = lerp(k0, EMBLEM_K, grow);
  const px = lerp(97.5, EMBLEM.x, grow), py = lerp(97.5, EMBLEM.y, grow);
  const sx = W / 2, sy = H / 2 + lerp((1 - tileIn) * 18, 0, grow);
  const markCol = tw.theme === 'dark' ? TILE_MARK : (tileGone > 0.5 ? C.ink : TILE_MARK);
  // Ink square → circle hugging the emblem, then dissolves.
  const circR = 34;
  const bx = lerp(0, EMBLEM.x - circR, toCircle), by = lerp(0, EMBLEM.y - circR, toCircle);
  const bs = lerp(195, circR * 2, toCircle);
  const brad = lerp(2 / k0, circR, toCircle);

  // 3D state for this frame.
  let labels = [];
  if (S.current) {
    const s = S.current;
    // Rotor: turn the neck to face the camera, then spin with the uncoil.
    const aHead = -0.06 * lerp(1.25, 3, m) * Math.PI * 2;
    const phiF = aHead - Math.PI / 2;
    const spin = phiF * MOTION.move(T, tL + 0.9, tRe + 0.3)
      + Easing.easeInOutCubic(MOTION.move(T, tC, tN + 0.2)) * 2.4 + 0.05 * Math.max(0, T - tN);
    // World +Z (toward camera) and +X (camera's side) in rotor space; the
    // neck reaches out to the side so the head clears the staff's knob.
    const toCam = new THREE.Vector3(-Math.sin(spin), 0, Math.cos(spin));
    const toSide = new THREE.Vector3(Math.cos(spin), 0, Math.sin(spin));
    const off = toCam.clone().multiplyScalar(pose.fwd + 0.12 * face).addScaledVector(toSide, 0.26 * face);
    const p = coilParams(m, depth, { neck: pose.neck + 0.05 * face, rearY: pose.rearY, off });
    const rodH = lerp(78 * EMBLEM_K / PX_PER_UNIT, 5.2, m);
    s.shaft.scale.y = rodH;
    s.knob.position.y = rodH / 2 + ROD.knobR * 0.6;
    s.rotor.rotation.y = spin;
    s.rotor.updateMatrixWorld(true);
    s.skin = { a: deskin, b: skin };
    updateBody(s, p, reveal);

    // Camera: push in on the head's rest position, recoil on the strike,
    // then swing out and down the coil to the wide staff view.
    // Anchor = the head's pose without the strike, so the camera follows
    // the rear-up but the lunge still comes at the lens.
    const anchorP = coilParams(m, depth, { neck: pose.neck + 0.05 * face, rearY: pose.rearY,
      off: toCam.clone().multiplyScalar(0.12 * face).addScaledVector(toSide, 0.26 * face) });
    const anchor = coilPoint(anchorP, -anchorP.neckSpan, new THREE.Vector3()).applyMatrix4(s.rotor.matrixWorld);
    const k = camClose * (1 - camOut);
    const look = new THREE.Vector3().lerpVectors(new THREE.Vector3(0, 0, 0), anchor.clone().add(new THREE.Vector3(-0.05, -0.08, 0)), k);
    const cpos = new THREE.Vector3().lerpVectors(new THREE.Vector3(0, 0, 8.5), anchor.clone().add(new THREE.Vector3(0.95, 0.12, 1.75)), k);
    cpos.x += Math.sin(Math.PI * camOut) * 1.3;
    cpos.y -= Math.sin(Math.PI * camOut) * 0.6;
    cpos.z += 0.22 * lunge * live;
    cpos.x += Math.sin(T * 53) * 0.012 * shake; cpos.y += Math.sin(T * 71) * 0.012 * shake;
    s.camera.position.copy(cpos);
    s.camera.lookAt(look);
    s.camera.updateMatrixWorld();

    // Head pose: blend the along-neck pose toward facing the camera, then pitch.
    s.head.updateMatrixWorld(true);
    const hw = s.head.getWorldPosition(new THREE.Vector3());
    const toC = cpos.clone().sub(hw).applyAxisAngle(new THREE.Vector3(0, 1, 0), -spin).normalize();
    const q = s.headBaseQ.clone().slerp(basisQ(toC), face * 0.4);   // ¾ view so the gape reads
    q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -pose.pitch));
    s.head.quaternion.copy(q);
    s.upper.rotation.x = -pose.jaw * 0.35;
    s.jaw.rotation.x = pose.jaw;
    const flick = 0.55 + 0.45 * Math.sin(T * Math.PI * 2 * 5.5);
    const tLen = tongueAmt * (lunge > 0.5 ? lerp(flick, 1, 0.6) : flick);
    s.tongue.visible = tLen > 0.02;
    s.tongue.scale.set(1, 1, Math.max(0.001, tLen));
    s.tines.forEach((g) => { g.rotation.y = g.userData.side * (0.3 + 0.25 * flick); });
    s.mats.eyeMat.emissiveIntensity = 0.5 + 1.3 * lunge * live;
    const realHeadOn = skin > 0.02 && deskin < 0.01;
    s.realHead.forEach((o) => { o.visible = realHeadOn; });
    s.wireHead.forEach((o) => { o.visible = !realHeadOn; });
    s.mats.tongueMat.color.set(realHeadOn ? '#3a0a14' : C.crimson);
    s.head.updateMatrixWorld(true);
    const mouth = s.mouthTip.getWorldPosition(new THREE.Vector3());
    s.hissRings.forEach((ring, i) => {
      const ph = clamp((T - tH - 0.05 - i * 0.2) / 0.75, 0, 1);
      ring.position.copy(mouth);
      ring.lookAt(cpos);
      ring.scale.setScalar(0.8 + ph * 2.6);
      ring.material.opacity = ph > 0 && ph < 1 ? (1 - ph) * 0.6 : 0;
    });
    const op = glIn * (1 - allOut);
    Object.values(s.mats).forEach((mt) => { mt.opacity = op; });
    s.solidMats.forEach((mt) => { const tr = op < 0.999; if (mt.transparent !== tr) { mt.transparent = tr; mt.needsUpdate = true; } mt.opacity = op; });
    s.mats.knobMat.opacity = op * MOTION.fade(T, tL + 0.3, tL + 1.0);
    const phase = (T * 0.25) % 1, phase2 = (T * 0.25 + 0.35) % 1;
    s.rotor.position.y = -ROTOR_DROP * MOTION.move(T, tC, tN + 0.3);
    s.rotor.updateMatrixWorld(true);
    const rotInv = s.rotor.getWorldQuaternion(new THREE.Quaternion()).invert();
    s.nodes.forEach((n, i) => {
      const t = NODE_T.start + (NODE_T.end - NODE_T.start) * (i / (STRANDS.length - 1));
      const c = coilPoint(p, t, new THREE.Vector3());
      const rd = new THREE.Vector3(c.x, 0, c.z);
      if (rd.lengthSq() > 1e-6) rd.normalize();
      if (!n.orb.userData.cube) c.addScaledVector(rd, BODY.R * 1.1);        // cubes sit centred in the body
      const pop = MOTION.enter(T, tN + i * 0.17, tN + i * 0.17 + 0.45);
      [n.orb, n.ring1, n.ring2].forEach((o) => o.position.copy(c));
      if (n.orb.userData.cube) {
        // Pops in with a quarter-turn settle into the live ¾ view.
        n.orb.scale.setScalar(Math.max(0.001, pop * 0.2));    // ≈ the live section-cube size at this camera distance
        const twist = (1 - pop) * Math.PI * 0.5;
        const q = s.camera.quaternion.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0.3, -0.55 + twist, 0)));
        n.orb.quaternion.copy(rotInv).multiply(q);
        n.orb.material.forEach((m) => { m.opacity = op; });
        n.ring1.visible = n.ring2.visible = false;
      } else {
        n.orb.scale.setScalar(Math.max(0.001, pop));
        n.orb.material.opacity = op;
      }
      n.ring1.scale.setScalar(Math.max(0.001, pop * (1 + phase * 0.6)));
      n.ring2.scale.setScalar(Math.max(0.001, pop * (1 + phase2 * 0.6)));
      n.ring1.material.opacity = 0.7 * (1 - phase) * 0.18 * pop * op;
      n.ring2.material.opacity = 0.55 * (1 - phase2) * 0.18 * pop * op;
      n.ring1.lookAt(s.camera.position); n.ring2.lookAt(s.camera.position);
      const w = n.orb.getWorldPosition(new THREE.Vector3()).project(s.camera);
      const lx = (w.x * 0.5 + 0.5) * W, ly = (-w.y * 0.5 + 0.5) * H;
      labels.push({ x: lx, y: ly, left: lx <= W / 2, o: MOTION.enter(T, tN + i * 0.17 + 0.15, tN + i * 0.17 + 0.6) * (1 - allOut) });
    });
  }
  useLayoutEffect(() => { if (S.current) S.current.renderer.render(S.current.scene, S.current.camera); });

  // Headline.
  const kick = MOTION.enter(T, tS, tS + 0.5) * (1 - allOut);
  const head1 = MOTION.enter(T, tS + 0.15, tS + 0.7) * (1 - allOut);
  const accent = 'Digital Health';
  const typed = accent.slice(0, Math.round(prog(T, tS + 0.65, tS + 1.5) * accent.length));
  const caretOn = T > tS + 0.6 && Math.floor(T * 2) % 2 === 0;

  const mono = "'JetBrains Mono', monospace";
  return (
    <div data-screen-label={'logo intro v4 · ' + T.toFixed(1) + 's'} style={{
      position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Lato', sans-serif", color: C.ink,
      backgroundColor: C.bg,
      backgroundImage: `linear-gradient(${C.bp} 1px, transparent 1px), linear-gradient(90deg, ${C.bp} 1px, transparent 1px), linear-gradient(${C.bpStrong} 1px, transparent 1px), linear-gradient(90deg, ${C.bpStrong} 1px, transparent 1px)`,
      backgroundSize: '28px 28px, 28px 28px, 140px 140px, 140px 140px', backgroundPosition: '-1px -1px',
    }}>
      <div ref={holder} style={{ position: 'absolute', inset: 0 }}></div>

      {/* Graph paper under the draft: grape hairlines, 19px minor / 95px major,
          aligned so the tile edges land on major lines. */}
      {paper > 0 && (
        <div style={{ position: 'absolute', left: W / 2, top: H / 2, width: 950, height: 950, transform: 'translate(-50%, -50%)', opacity: paper,
          backgroundImage: `linear-gradient(${C.grape}55 1px, transparent 1px), linear-gradient(90deg, ${C.grape}55 1px, transparent 1px), linear-gradient(${C.grape}26 1px, transparent 1px), linear-gradient(90deg, ${C.grape}26 1px, transparent 1px)`,
          backgroundSize: '95px 95px, 95px 95px, 19px 19px, 19px 19px', backgroundPosition: '0 0',
          WebkitMaskImage: 'radial-gradient(closest-side, #000 55%, transparent 100%)', maskImage: 'radial-gradient(closest-side, #000 55%, transparent 100%)' }}></div>
      )}

      {MARK && (
        <svg viewBox="0 0 195 195" width="195" height="195" style={{
          position: 'absolute', left: 0, top: 0, overflow: 'visible', transformOrigin: '0 0',
          transform: `translate(${sx - px * k}px, ${sy - py * k}px) scale(${k})`,
          opacity: tileIn * (1 - svgOut),
        }}>
          <defs>
            <clipPath id="inkWipe3"><rect x="-60" y="-60" width="320" height={inkWipe * 320}></rect></clipPath>
            <filter id="pencil3" x="-10%" y="-10%" width="120%" height="120%">
              <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed={boil + 1}></feTurbulence>
              <feDisplacementMap in="SourceGraphic" scale="1.3"></feDisplacementMap>
            </filter>
          </defs>
          <g clipPath="url(#inkWipe3)">
          <rect x={bx} y={by} width={bs} height={bs} rx={brad} fill={TILE_INK} opacity={1 - tileGone}></rect>
          <g fill={markCol} opacity={serpIn} dangerouslySetInnerHTML={{ __html: MARK.serpent }}></g>
          <g fill={TILE_MARK} opacity={menIn * (1 - menOut)} transform={`translate(${-menOut * 18} ${-menOut * 6})`} dangerouslySetInnerHTML={{ __html: MARK.men }}></g>
          <g fill={TILE_MARK} opacity={theonIn * (1 - theonOut)} transform={`translate(0 ${theonOut * 16})`} dangerouslySetInnerHTML={{ __html: MARK.theon }}></g>
          </g>
          {skOut > 0 && T < tR && (
            <g filter="url(#pencil3)" opacity={skOut} fill="none" stroke={C.ink} strokeLinecap="round" strokeLinejoin="round">
              <g strokeWidth="0.6" strokeDasharray="1" strokeDashoffset={1 - frame1}>
                <path pathLength="1" d="M-9 0H204"></path><path pathLength="1" d="M195 -9V204"></path>
                <path pathLength="1" d="M204 195H-9"></path><path pathLength="1" d="M0 204V-9"></path>
              </g>
              <g strokeWidth="0.4" opacity="0.6" strokeDasharray="1" strokeDashoffset={1 - frame2}>
                <path pathLength="1" d="M-6 0.8L201 -0.6"></path><path pathLength="1" d="M194.2 -6L195.6 201"></path>
                <path pathLength="1" d="M200 194.4L-5 195.7"></path><path pathLength="1" d="M0.7 199L-0.5 -4"></path>
              </g>
              <g strokeWidth="0.35" opacity="0.5" strokeDasharray="1" strokeDashoffset={1 - guides}>
                <path pathLength="1" d="M96 72H186"></path><path pathLength="1" d="M140.4 26V118"></path>
                <circle pathLength="1" cx="140.4" cy="72" r="34"></circle>
                <path pathLength="1" d="M0 97.5H195"></path>
              </g>
              <g strokeWidth="0.55" strokeDasharray="1" strokeDashoffset={1 - skSerp} dangerouslySetInnerHTML={{ __html: MARK.sk.serpent }}></g>
              <g strokeWidth="0.55" strokeDasharray="1" strokeDashoffset={1 - skMen} dangerouslySetInnerHTML={{ __html: MARK.sk.men }}></g>
              <g strokeWidth="0.55" strokeDasharray="1" strokeDashoffset={1 - skTheon} dangerouslySetInnerHTML={{ __html: MARK.sk.theon }}></g>
            </g>
          )}
          {T < tR && (
            <g opacity={dims * notesOut} fill="none" stroke={C.grape} strokeWidth="0.35">
              <path d="M0 -14H195M0 -17V-11M195 -17V-11"></path>
              <path d="M-14 0V195M-17 0H-11M-17 195H-11"></path>
              <path d="M164.4 48L186 26H200"></path>
              <g stroke="none" fill={C.grape} style={{ fontFamily: mono3, fontSize: 5.2, letterSpacing: '0.22em', textTransform: 'uppercase' }}>
                <text x="97.5" y="-17.5" textAnchor="middle">195</text>
                <text x="-17.5" y="97.5" textAnchor="middle" transform="rotate(-90 -17.5 97.5)">195</text>
                <text x="187" y="23.5">r 34</text>
                <text x="0" y="214">mentheon · mark · sketch 01</text>
                <text x="195" y="214" textAnchor="end">1 : 1</text>
              </g>
            </g>
          )}
          {T < tR && (
            <g opacity={crops * notesOut} fill="none" stroke={C.crimson} strokeWidth="1.1">
              <path d="M-6 6V-6H6"></path><path d="M189 -6H201V6"></path>
              <path d="M201 189V201H189"></path><path d="M6 201H-6V189"></path>
            </g>
          )}
        </svg>
      )}

      {nodeStyle !== 'embedded' && labels.map((l, i) => (
        <div key={i} style={{ position: 'absolute', left: 0, top: 0, width: 10, height: 10, opacity: l.o,
          transform: `translate(${l.x}px, ${l.y}px) translate(-50%, -50%)` }}>
          {nodeStyle !== 'embedded' && <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: C.ink, boxShadow: `0 0 0 4px ${C.bg}` }}></div>}
          <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', maxWidth: 260,
            ...(l.left ? { right: '100%', marginRight: nodeStyle === 'embedded' ? 48 : 22, textAlign: 'right' } : { left: '100%', marginLeft: nodeStyle === 'embedded' ? 48 : 22, textAlign: 'left' }) }}>
            <span style={{ fontWeight: 700, fontSize: 17, lineHeight: 1.15, letterSpacing: '-0.005em', padding: '4px 10px',
              background: `rgba(${C.fog},0.85)`, border: `1px solid ${C.chipBorder}`, borderRadius: 2, display: 'inline-block', whiteSpace: 'nowrap' }}>{STRANDS[i].name}</span>
            <span style={{ display: 'block', fontFamily: mono, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.quiet, padding: '0 10px', marginTop: 3 }}>{STRANDS[i].sub}</span>
          </div>
        </div>
      ))}

      <div style={{ position: 'absolute', top: '50%', left: 64, transform: 'translateY(-50%)', maxWidth: 560 }}>
        <p style={{ fontFamily: mono, fontSize: 14, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.crimson, fontWeight: 700, margin: '0 0 10px',
          opacity: kick, transform: `translateY(${(1 - kick) * 12}px)` }}>research programme · 2024–26</p>
        <h1 style={{ fontWeight: 900, fontSize: 52, letterSpacing: '-0.01em', lineHeight: 1.1, margin: 0,
          opacity: head1, transform: `translateY(${(1 - head1) * 16}px)` }}>
          A new era of <br></br><span style={{ color: C.crimson }}>{typed}</span>
          <span style={{ display: 'inline-block', width: '0.6em', height: '0.92em', marginLeft: '0.08em', verticalAlign: '-0.1em', background: C.crimson, opacity: caretOn ? 1 : 0 }}></span>
        </h1>
      </div>

      {[['tl', { top: 24, left: 24, borderTop: 1, borderLeft: 1 }], ['tr', { top: 24, right: 24, borderTop: 1, borderRight: 1 }],
        ['bl', { bottom: 24, left: 24, borderBottom: 1, borderLeft: 1 }], ['br', { bottom: 24, right: 24, borderBottom: 1, borderRight: 1 }]].map(([id, s]) => {
        const st = { position: 'absolute', width: 24, height: 24, opacity: MOTION.fade(T, t0, t0 + 0.5) * (1 - allOut) };
        Object.keys(s).forEach((kk) => { st[kk] = kk.startsWith('border') ? `2px solid ${C.crimson}` : s[kk]; });
        return <div key={id} style={st}></div>;
      })}



    </div>
  );
}

/* ---- Site wrapper ----
   Plays the intro once on its own clock, cover-scaled from the 1920×1080
   composition to the viewport. Ends as the nodes settle (the live page
   types its own headline), calling onDone so Helix3D starts the scene
   underneath, then fades out over 600ms and calls onGone to unmount.
   Skip: the button, Esc or Enter. */
const SCENES: [string, number][] = [
  ['Sketch', 2.8], ['Ink', 1.1], ['Hold', 0.5], ['Release', 1.8], ['Lift', 2.2], ['Rear', 1.1],
  ['Hiss', 1.5], ['Coil', 2.6], ['Nodes', 1.8], ['Settle', 2.2], ['Out', 0.6],
]
const CUES: Record<string, number> = {}
SCENES.reduce((acc, [n, d]) => { CUES[n] = acc; return acc + d }, 0)
const END = CUES.Settle + 0.2
// Cube layout: hand over to the live page as soon as the section cubes
// have landed, so its own labels + project cubes fade in with it.
const END_CUBES = CUES.Nodes + 1.35

export default function SerpentIntro({ theme, onDone, onGone, nodeStyle = 'classic' }: { theme: 'light' | 'dark'; onDone: () => void; onGone: () => void; nodeStyle?: 'classic' | 'embedded' }) {
  const endAt = nodeStyle === 'embedded' ? END_CUBES : END
  const [T, setT] = useState(0)
  const [fading, setFading] = useState(false)
  const [scale, setScale] = useState(1)
  const doneRef = useRef(false)
  const finish = () => {
    if (doneRef.current) return
    doneRef.current = true
    onDone()
    setFading(true)
    window.setTimeout(onGone, 650)
  }
  useEffect(() => {
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      if (doneRef.current) return
      const t = (now - t0) / 1000
      setT(Math.min(t, endAt))
      if (t >= endAt) { finish(); return }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); finish() } }
    window.addEventListener('keydown', onKey)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey) }
  }, [])
  useLayoutEffect(() => {
    const fit = () => setScale(Math.max(window.innerWidth / W, window.innerHeight / H))
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])
  const [skipHover, setSkipHover] = useState(false)
  const [skipAlways, setSkipAlways] = useState(skipIntroAlways)
  const C = PALETTE[theme === 'dark' ? 'dark' : 'light']
  const bg = C.bg
  return (
    <div className="serpent-intro" aria-label="Mentheon intro" style={{
      position: 'fixed', inset: 0, zIndex: 2000, overflow: 'hidden', background: bg,
      opacity: fading ? 0 : 1, pointerEvents: fading ? 'none' : 'auto',
      transition: 'opacity 600ms cubic-bezier(0.65,0,0.35,1)',
    }}>
      <div style={{ position: 'absolute', left: '50%', top: '50%', width: W, height: H, transform: `translate(-50%, -50%) scale(${scale})` }}>
        <LogoIntro T={T} CUES={CUES} theme={theme} nodeStyle={nodeStyle}></LogoIntro>
      </div>
      {/* Skip intro — pinned to the viewport's bottom-right, outside the
          cover-scaled 1920×1080 stage. Inside the stage it was cropped
          off-screen on any non-16:9 window. Offsets and size still follow
          `scale` so it reads the same as the stage at 16:9. Jumps to the
          settled staff; hidden once that point is reached. */}
      {T < CUES.Settle && (
        <button type="button"
          onClick={finish}
          onPointerEnter={(e) => { if (e.pointerType === 'mouse') setSkipHover(true) }} onPointerLeave={() => setSkipHover(false)}
          style={{ position: 'absolute', right: 64 * scale, bottom: 56 * scale, transform: `scale(${scale})`, transformOrigin: 'bottom right',
            display: 'flex', whiteSpace: 'nowrap', width: 'max-content', alignItems: 'center', gap: skipHover ? 20 : 14,
            fontFamily: "'JetBrains Mono', monospace", fontSize: 19, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase',
            color: skipHover ? C.crimson : C.ink, background: 'transparent', cursor: 'pointer',
            border: `1px solid ${skipHover ? C.crimson : C.quiet}`, borderRadius: 2, padding: '16px 26px',
            opacity: MOTION.fade(T, CUES.Sketch + 0.4, CUES.Sketch + 0.9) * (1 - MOTION.fade(T, CUES.Settle - 0.4, CUES.Settle)),
            transition: 'color 200ms cubic-bezier(0.22,1,0.36,1), border-color 200ms cubic-bezier(0.22,1,0.36,1), gap 200ms cubic-bezier(0.22,1,0.36,1)' }}>
          <span>skip intro</span><span aria-hidden="true">↦</span>
        </button>
      )}
      {/* "skip always" — sits above the skip button, same scaling and fade.
          Saved per browser (introGate); Helix3D won't mount the intro again. */}
      {T < CUES.Settle && (
        <label style={{ position: 'absolute', right: 64 * scale, bottom: (56 + 78) * scale, transform: `scale(${scale})`, transformOrigin: 'bottom right',
          display: 'flex', alignItems: 'center', gap: 12, whiteSpace: 'nowrap', cursor: 'pointer',
          fontFamily: "'JetBrains Mono', monospace", fontSize: 16, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.ink,
          opacity: MOTION.fade(T, CUES.Sketch + 0.4, CUES.Sketch + 0.9) * (1 - MOTION.fade(T, CUES.Settle - 0.4, CUES.Settle)) }}>
          <input type="checkbox" checked={skipAlways}
            onChange={(e) => { setSkipAlways(e.target.checked); setSkipIntroAlways(e.target.checked) }}
            style={{ width: 22, height: 22, margin: 0, accentColor: C.crimson, cursor: 'pointer' }} />
          skip always
        </label>
      )}
    </div>
  )
}
