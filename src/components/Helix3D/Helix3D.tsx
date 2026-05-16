import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { animate } from 'animejs'
import StrandPanel from '../StrandPanel'
import MarginaliaTab from '../MarginaliaTab'
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
     • LOADER_LOGO_SVG .......... the splash-screen wordmark SVG.
     • useEffect(() => {...}) ... ALL behaviour, in one mount block:
         - cssVar / themeColours .. bridge CSS tokens → 3D colours
         - HelixCurve ............. the spiral the coil follows
         - ROD / SERPENT / NODE ... geometry tuning dials
         - initThree + build* ..... scene construction
         - render / loop .......... the per-frame animation
         - runLoader / runGate .... the intro sequence
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

// The loader logo SVG is verbatim from the prototype; injected as
// markup so we don't hand-transcribe ~30 path nodes into JSX.
const LOADER_LOGO_SVG = `
  <svg id="loader-logo" viewBox="0 0 195 195" width="220" height="220">
    <defs>
      <clipPath id="wave-clip"><rect id="wave-rect" x="0" y="195" width="195" height="195"/></clipPath>
    </defs>
    <rect x="0" y="0" width="195" height="195" fill="none" stroke="#2F0147" stroke-width="1.5"/>
    <g clip-path="url(#wave-clip)">
      <rect width="195" height="195" fill="#2F0147"/>
      <g fill="#FFECE1">
        <path d="M124.097 48.7235C124.184 49.2881 124.28 49.916 124.392 50.6557C124.193 50.5651 123.976 50.5379 123.897 50.4202C123.631 50.0126 123.414 49.5748 123.179 49.1462C123.076 48.959 123.012 48.7114 122.852 48.5997C122.095 48.0563 121.998 46.6706 122.819 46.2751C124.936 45.2637 127.028 44.1225 129.501 44.2523C131.122 44.3399 132.589 44.8048 133.821 45.9007C135.798 47.6639 136.356 50.3991 135.249 52.9411C135.031 53.4422 134.802 53.9343 134.581 54.4354C133.826 56.1473 134.186 57.7866 135.702 58.8885C136.468 59.447 137.35 59.8848 138.237 60.238C140.77 61.2433 143.331 62.1792 145.879 63.1392C147.098 63.6011 148.194 64.2442 149.018 65.286C151.096 67.912 150.637 71.3446 147.907 73.4402C147.177 73.9986 146.582 74.2098 145.716 73.6482C145.048 73.2166 144.197 73.0684 143.436 72.7668C143.297 72.7122 143.128 72.5342 143.119 72.4016C143.104 72.1507 142.971 71.8705 143.366 71.6742C144.022 71.3537 144.695 71.0067 145.229 70.5237C146.431 69.446 146.364 67.858 145 67.0124C143.753 66.2428 142.391 65.6448 141.03 65.0865C138.983 64.2472 136.873 63.5619 134.835 62.7045C133.353 62.0795 131.961 61.2705 131.07 59.8274C129.793 57.7624 129.73 55.6612 130.823 53.5087C130.988 53.1796 131.164 52.8535 131.342 52.5305C131.9 51.5342 132.051 50.4866 131.828 49.3665C131.752 48.9922 131.759 48.6027 131.746 48.2193C131.735 47.839 131.746 47.4585 131.746 47.0449H130.986C130.904 47.6035 130.877 48.159 130.741 48.6873C130.439 49.8557 129.666 50.6768 128.649 51.2745C127.946 51.6881 127.242 52.1138 126.502 52.4519C125.648 52.8384 125.204 52.5909 124.923 51.6912C123.776 51.7637 122.75 52.929 122.753 53.8226C122.753 54.1909 122.832 54.5592 122.823 54.9245C122.819 55.0906 122.689 55.2566 122.62 55.4197C122.509 55.3019 122.348 55.2023 122.291 55.0634C122.119 54.6528 121.989 54.2241 121.847 53.8195C121.331 54.0218 120.809 54.2241 120.289 54.4264C120.25 54.363 120.208 54.2966 120.169 54.2332C120.528 53.889 120.887 53.5478 121.307 53.1463C120.893 53.095 120.531 53.0498 120.15 53.0044C120.172 52.8958 120.178 52.8143 120.202 52.7418C120.407 52.0625 120.407 52.0655 121.081 52.2618C121.714 52.4459 122.297 52.4157 122.837 51.9539C123.604 51.2957 124.495 50.9787 125.53 50.9606C125.941 50.9516 126.388 50.704 126.744 50.4564C127.493 49.9341 128.124 49.282 128.513 48.5363C127.076 48.5967 125.63 48.657 124.102 48.7205L124.097 48.7235Z"/>
        <path d="M137.758 65.8749C137.018 66.3033 136.302 66.6387 135.674 67.0976C134.503 67.9517 134.343 69.2049 135.285 70.3034C135.722 70.8136 136.272 71.3148 136.876 71.5839C138.367 72.2482 139.919 72.7701 141.444 73.359C143.267 74.0656 145.118 74.7052 146.896 75.5144C148.49 76.2392 149.595 77.4891 150.135 79.2038C151.087 82.2289 149.172 85.332 146.652 86.3798C144.858 87.1254 143.023 87.7689 141.244 88.5417C140.176 89.0065 139.143 89.583 138.156 90.2109C136.876 91.026 136.408 92.4027 136.857 93.7703C136.948 94.0453 137.18 94.2715 137.332 94.5315C137.443 94.7213 137.6 94.9208 137.613 95.1197C137.648 95.7873 137.624 96.46 137.624 97.1243C136.215 96.9735 134.129 95.4577 133.839 92.9942C133.525 90.3195 134.714 88.4358 136.864 87.0558C138.868 85.7701 141.063 84.8582 143.261 83.9677C144.306 83.5452 145.302 83.0713 145.827 81.9962C146.377 80.873 146.162 79.744 145.121 79.053C144.085 78.3647 142.977 77.7667 141.848 77.2415C140.365 76.5531 138.829 75.9824 137.323 75.3454C136.541 75.0165 135.774 74.6512 134.998 74.3067C134.911 74.2677 134.811 74.2196 134.723 74.2281C133.821 74.3373 133.199 73.7724 132.601 73.2654C129.398 70.5692 130.032 66.3702 133.072 64.1388C133.826 63.5864 134.397 63.5441 135.182 64.0121C135.891 64.4347 136.71 64.6732 137.468 65.0176C137.594 65.0748 137.709 65.2438 137.749 65.3829C137.797 65.561 137.76 65.7631 137.76 65.8717L137.758 65.8749Z"/>
        <path d="M160.581 54.5474C160.02 54.33 159.455 54.1096 158.933 53.9074C158.803 54.4085 158.688 54.8855 158.547 55.3534C158.516 55.4531 158.389 55.5255 158.308 55.61C158.241 55.5105 158.136 55.4199 158.118 55.3142C158.075 55.0636 158.06 54.804 158.063 54.5504C158.088 53.0288 157.472 52.1382 155.986 51.5948C155.947 51.7095 155.911 51.8242 155.865 51.9359C155.639 52.5005 155.129 52.8084 154.558 52.6092C152.955 52.0506 151.539 51.1812 150.48 49.8317C150.012 49.2369 149.831 48.5154 149.828 47.7546C149.828 47.4829 149.828 47.2112 149.828 46.9032C149.426 46.9304 149.009 47.0119 148.991 47.4829C148.94 48.7117 148.849 49.9524 148.985 51.1661C149.064 51.8755 149.483 52.579 149.855 53.222C150.74 54.7466 150.89 56.3709 150.47 58.0162C150.051 59.6676 149.058 60.9597 147.612 61.9198C147.068 62.279 146.672 62.3213 146.078 62.0103C145.218 61.5575 144.264 61.2858 143.361 60.9144C143.216 60.854 143.038 60.7001 143.01 60.5612C142.956 60.3077 143.053 60.1205 143.34 59.9574C144.115 59.5197 144.94 59.103 145.583 58.5053C146.742 57.4305 146.875 55.7882 146.171 54.2274C145.764 53.3277 145.32 52.4099 145.13 51.4529C144.523 48.4097 146.325 45.5598 149.275 44.6269C151.445 43.9416 153.52 44.2737 155.564 45.0858C156.219 45.3454 156.856 45.6534 157.487 45.9674C158.507 46.4746 158.785 47.3984 158.224 48.3796C157.867 49.0014 157.511 49.6233 157.119 50.2241C157.013 50.3842 156.774 50.4596 156.596 50.5713L156.463 50.4536C156.533 50.1487 156.593 49.8408 156.669 49.5358C156.744 49.2309 156.835 48.932 156.934 48.5667C155.392 48.7629 153.927 48.8777 152.487 48.4037C152.448 48.4399 152.409 48.4762 152.37 48.5094C152.671 48.9381 152.922 49.4211 153.293 49.7804C153.722 50.2 154.244 50.5291 154.755 50.8551C154.945 50.9759 155.226 51.0454 155.446 51.0091C156.367 50.8521 157.158 51.1781 157.783 51.7639C158.402 52.3435 159.039 52.4401 159.803 52.274C160.183 52.1895 160.578 52.1442 160.772 52.7028C160.364 52.7933 159.959 52.8839 159.476 52.9896C159.929 53.4606 160.334 53.8832 160.738 54.3058C160.687 54.3843 160.638 54.4629 160.587 54.5413L160.581 54.5474Z"/>
        <path d="M160.039 46.4611C160.267 47.3561 160.282 48.2181 160.011 49.083C159.984 49.1706 160.059 49.3184 160.132 49.403C160.349 49.6641 160.573 49.9198 160.797 50.1753C161.177 50.6082 161.555 51.0407 161.901 51.4982C164.15 54.4719 165.85 57.7203 166.795 61.3522C168.05 66.1733 168.056 70.9709 166.622 75.7556C165.566 79.2792 163.803 82.4311 161.548 85.3138C159.214 88.2967 156.258 90.5457 152.97 92.3663C151.639 93.1028 150.253 93.7554 148.747 94.0784C148.484 94.1324 148.37 94.2591 148.276 94.5308C148.153 94.8844 147.975 95.2185 147.796 95.5526C147.741 95.6547 147.686 95.7567 147.633 95.8594C147.578 95.9634 147.508 96.0583 147.431 96.1623C147.399 96.2059 147.366 96.252 147.331 96.3001C149.327 96.4906 154.948 93.9575 158.933 90.5912C164.636 85.7701 168.313 79.6653 169.379 72.2176C170.508 64.341 168.398 57.2011 163.878 50.7253C162.779 49.1498 161.604 47.6344 160.039 46.4611Z"/>
        <path d="M120.607 46.6949C120.644 47.2103 120.681 47.713 120.72 48.2325C120.747 48.5894 120.774 48.9542 120.803 49.3365C118.852 51.0091 117.415 53.2612 116.181 55.6704C113.219 61.4458 112.425 67.535 113.732 73.8627C114.701 78.5512 116.954 82.6273 120.135 86.2017C123.3 89.7552 127.137 92.3 131.59 93.9302C132.016 94.0875 132.335 94.25 132.462 94.7576C132.524 95.0118 132.689 95.2399 132.852 95.4674C132.918 95.5584 132.983 95.6494 133.042 95.7417C133.134 95.8841 133.232 96.0193 133.33 96.1558C133.379 96.2214 133.426 96.2877 133.473 96.3547L133.395 96.5022C133.147 96.4333 132.898 96.3709 132.647 96.3085C132.111 96.1746 131.575 96.0407 131.065 95.8412C127.535 94.4736 124.266 92.6711 121.419 90.1355C118.916 87.904 116.833 85.3385 115.1 82.4733C113.567 79.9344 112.495 77.2141 111.84 74.3307C110.807 69.7963 110.958 65.2736 112.132 60.7907C113.527 55.4621 116.265 50.9034 120.16 47.024C120.262 46.9213 120.374 46.8308 120.489 46.7432C120.534 46.707 120.6 46.6949 120.6 46.6949H120.607Z"/>
        <path d="M142.022 89.7C142.048 89.9808 142.092 90.2382 142.092 90.4982C142.098 94.0687 142.117 97.6365 142.085 101.207C142.07 102.924 142.386 104.582 142.876 106.223C143.04 106.776 143.056 107.252 142.831 107.84C142.401 108.954 142.158 110.137 141.899 111.301C141.531 112.96 141.228 114.629 140.88 116.293C140.829 116.536 140.697 116.767 140.605 117C140.541 117 140.478 117 140.415 117C140.327 116.796 140.2 116.598 140.153 116.385C139.754 114.574 139.365 112.756 138.98 110.941C138.72 109.708 138.534 108.46 137.854 107.34C137.771 107.201 137.793 106.965 137.854 106.8C138.809 104.154 138.793 101.434 138.704 98.6856C138.629 96.2975 138.723 93.9062 138.755 91.5181C138.755 91.3998 138.822 91.2223 138.916 91.1723C139.836 90.6874 140.77 90.2233 141.702 89.7559C141.772 89.7208 141.864 89.7267 142.019 89.7H142.022Z"/>
        <path d="M130.388 80.5805C130.434 78.9984 131.339 77.3955 132.958 76.1696C133.084 76.0727 133.223 75.9882 133.353 75.8946C134.029 75.4084 134.627 75.0191 135.467 75.7737C135.985 76.245 136.789 76.399 137.453 76.7162C137.601 76.7851 137.806 76.9633 137.797 77.0751C137.779 77.2987 137.688 77.5918 137.523 77.7153C136.97 78.1228 136.351 78.4426 135.79 78.8411C134.202 79.9584 134.141 81.7004 135.669 82.9049C136.194 83.3183 136.785 83.6537 137.374 83.9735C137.688 84.1425 137.74 84.3603 137.745 84.6684C137.749 84.97 137.604 85.085 137.353 85.2293C136.626 85.655 135.935 86.1471 135.225 86.6034C135.134 86.6606 134.995 86.7243 134.905 86.6937C132.565 85.9599 130.352 83.8526 130.388 80.574V80.5805Z"/>
        <path d="M156.255 43.2683C153.909 41.7102 151.442 40.4264 148.747 39.5852C146.039 38.7399 143.274 38.3353 140.445 38.3504C137.616 38.3655 134.86 38.8757 132.148 39.6486C129.446 40.4184 126.992 41.7317 124.504 43.0932C124.904 43.0516 125.298 43.0111 125.688 42.971C126.74 42.8629 127.76 42.758 128.779 42.6434C129.03 42.6132 129.283 42.5438 129.522 42.4502C131.352 41.7377 133.208 41.1219 135.149 40.8078C135.183 40.8025 135.216 40.7971 135.249 40.7918C136.332 40.6166 137.4 40.4439 138.325 39.7965C138.445 39.7138 138.6 39.6715 138.747 39.6315C138.755 39.6291 138.763 39.6268 138.772 39.6244C140.17 39.2471 141.498 39.4735 142.803 40.0501C143.34 40.2856 143.911 40.4607 144.481 40.5965C144.976 40.7145 145.476 40.8153 145.975 40.916C146.767 41.0757 147.559 41.2353 148.33 41.463C148.73 41.5806 149.126 41.7067 149.523 41.8325C150.896 42.2686 152.265 42.7033 153.734 42.7853C154.321 42.8185 154.901 42.9563 155.481 43.094C155.739 43.1551 155.997 43.2163 156.255 43.2683Z"/>
        <circle cx="123.173" cy="68.62" r="2.15"/>
        <circle cx="157.702" cy="68.62" r="2.15"/>
        <path d="M42.85 62.64V92.95H36.65V75.52C36.65 75.12 36.66 74.68 36.68 74.21C36.7 73.74 36.74 73.26 36.8 72.77L28.75 88.35C28.5 88.84 28.16 89.21 27.73 89.46C27.32 89.71 26.84 89.83 26.3 89.83H25.34C24.8 89.83 24.31 89.71 23.88 89.46C23.47 89.21 23.13 88.84 22.89 88.35L14.84 72.73C14.88 73.23 14.91 73.72 14.94 74.21C14.97 74.68 14.98 75.12 14.98 75.52V92.95H8.78V62.64H14.15C14.45 62.64 14.72 62.65 14.94 62.67C15.18 62.68 15.38 62.72 15.56 62.79C15.74 62.86 15.9 62.97 16.04 63.12C16.19 63.26 16.34 63.46 16.48 63.73L24.28 79.1C24.56 79.62 24.82 80.17 25.07 80.74C25.33 81.31 25.58 81.89 25.82 82.49C26.05 81.88 26.3 81.28 26.55 80.7C26.81 80.12 27.09 79.56 27.38 79.03L35.16 63.73C35.3 63.46 35.43 63.26 35.57 63.12C35.73 62.97 35.89 62.86 36.07 62.79C36.25 62.72 36.45 62.68 36.68 62.67C36.91 62.65 37.18 62.64 37.49 62.64H42.85ZM67.98 89.66L67.96 92.95H49.59V63.14H67.96V66.43H53.63V76.33H65.23V79.49H53.63V89.66H67.98ZM97.75 63.14V92.95H95.73C95.41 92.95 95.14 92.89 94.92 92.78C94.71 92.67 94.5 92.49 94.3 92.22L77.05 69.76C77.08 70.1 77.1 70.44 77.12 70.78C77.13 71.11 77.14 71.42 77.14 71.71V92.95H73.6V63.14H75.68C75.86 63.14 76.01 63.16 76.14 63.19C76.26 63.2 76.37 63.23 76.47 63.29C76.57 63.33 76.66 63.4 76.76 63.5C76.86 63.58 76.96 63.69 77.07 63.83L94.32 86.27C94.29 85.91 94.26 85.57 94.23 85.23C94.22 84.89 94.21 84.56 94.21 84.26V63.14H97.75Z"/>
        <path d="M68.56 108.42H59.49V133.9H53.89V108.42H44.82V103.82H68.56V108.42ZM97.1 104.09V133.9H93.06V120.34H76.99V133.9H72.95V104.09H76.99V117.39H93.06V104.09H97.1ZM123.11 130.61L123.09 133.9H104.72V104.09H123.09V107.38H108.75V117.28H120.36V120.44H108.75V130.61H123.11ZM155.62 119.01C155.62 121.24 155.26 123.29 154.56 125.16C153.85 127.02 152.85 128.62 151.56 129.97C150.27 131.31 148.72 132.36 146.9 133.11C145.1 133.85 143.1 134.21 140.91 134.21C138.72 134.21 136.72 133.85 134.92 133.11C133.12 132.36 131.57 131.31 130.28 129.97C128.99 128.62 127.99 127.02 127.29 125.16C126.58 123.29 126.23 121.24 126.23 119.01C126.23 116.77 126.58 114.73 127.29 112.87C127.99 111 128.99 109.39 130.28 108.05C131.57 106.69 133.12 105.63 134.92 104.88C136.72 104.13 138.72 103.76 140.91 103.76C143.1 103.76 145.1 104.13 146.9 104.88C148.72 105.63 150.27 106.69 151.56 108.05C152.85 109.39 153.85 111 154.56 112.87C155.26 114.73 155.62 116.77 155.62 119.01ZM151.48 119.01C151.48 117.18 151.23 115.53 150.73 114.08C150.23 112.62 149.52 111.39 148.61 110.4C147.69 109.38 146.58 108.61 145.28 108.07C143.98 107.53 142.52 107.26 140.91 107.26C139.32 107.26 137.87 107.53 136.57 108.07C135.26 108.61 134.15 109.38 133.22 110.4C132.3 111.39 131.59 112.62 131.1 114.08C130.6 115.53 130.35 117.18 130.35 119.01C130.35 120.84 130.6 122.48 131.1 123.94C131.59 125.38 132.3 126.61 133.22 127.62C134.15 128.62 135.26 129.39 136.57 129.93C137.87 130.45 139.32 130.72 140.91 130.72C142.52 130.72 143.98 130.45 145.28 129.93C146.58 129.39 147.69 128.62 148.61 127.62C149.52 126.61 150.23 125.38 150.73 123.94C151.23 122.48 151.48 120.84 151.48 119.01ZM185.54 104.09V133.9H183.52C183.2 133.9 182.93 133.85 182.71 133.73C182.5 133.62 182.3 133.43 182.09 133.17L164.84 110.71C164.87 111.05 164.89 111.39 164.91 111.73C164.92 112.06 164.93 112.37 164.93 112.66V133.9H161.39V104.09H163.47C163.65 104.09 163.8 104.11 163.93 104.13C164.05 104.15 164.16 104.18 164.26 104.24C164.36 104.28 164.45 104.35 164.55 104.45C164.65 104.53 164.75 104.64 164.86 104.78L182.11 127.22C182.08 126.86 182.05 126.52 182.02 126.18C182.01 125.84 182 125.51 182 125.21V104.09H185.54Z"/>
      </g>
    </g>
  </svg>
`

export default function Helix3D() {
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
      count: 6, orbR: 0.16, ringR1: 0.22, ringR2: 0.30, pulseSpeed: 1.4,
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
    let sketchMode = false
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
      serpentLine.visible = sketchMode
      serpentMesh.visible = !sketchMode
      rotor.add(serpentLine)

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
        ;(n.ring1.material as THREE.MeshBasicMaterial).opacity = (0.6 * (1 - phase)) * activeMul
        ;(n.ring2.material as THREE.MeshBasicMaterial).opacity = (0.45 * (1 - phase2)) * activeMul

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
      ;(rod.userData.shaft.material as THREE.MeshStandardMaterial).color.copy(C.ink)
      ;(rod.userData.bands as THREE.Mesh[]).forEach((b) =>
        (b.material as THREE.MeshStandardMaterial).color.copy(C.ink))
      ;(rod.userData.knob.material as THREE.MeshStandardMaterial).color.copy(C.crimson)
      ;(rod.userData.knob.material as THREE.MeshStandardMaterial).emissive.copy(C.crimson)
      ;(serpentMesh.material as THREE.MeshStandardMaterial).color.copy(C.ink)
      ;(serpentLine.material as THREE.LineBasicMaterial).color.copy(C.ink)
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

    /* ---- SKETCH TOGGLE — solid coil ↔ 3D line trace ----
       Swaps only the serpent body's visibility. Button label shows
       the action (says "sketch" while solid, "solid" while sketched)
       and carries .is-active + aria-pressed for styling/a11y. */
    const renderToggle = $('#render-toggle')!
    const nodeToggle = $('#node-toggle')!
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
      serpentLine.visible = on
      serpentMesh.visible = !on
      setNodeWire()
      renderToggle.classList.toggle('is-active', on)
      renderToggle.setAttribute('aria-pressed', String(on))
      renderToggle.textContent = on ? 'solid' : 'sketch'
    }
    const onRenderToggle = () => applySketchMode(!sketchMode)
    renderToggle.addEventListener('click', onRenderToggle)
    cleanups.push(() => renderToggle.removeEventListener('click', onRenderToggle))

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
       runLoader: anime.js drives `state.y` 195 → -5 over 2.4s; each
       tick reshapes the SVG clip rect so the wordmark "fills" and
       updates the % caption. "skip" or completion calls finish()
       once (idempotent), fades the loader, and resolves.
       runGate: shows the sound/silent splash and resolves on either
       choice (sound preference itself isn't wired to anything yet).
       To skip the intro entirely, replace the entry() body (BOOT)
       with a bare startScene(). */
    function runLoader() {
      return new Promise<void>((resolve) => {
        const waveRect = $('#wave-rect') as unknown as SVGRectElement
        const welcome  = $('#loader-welcome')!
        const caption  = $('#loader-caption')!
        const skipBtn  = $('#loader-skip')!
        const logo     = $('#loader-logo')!

        welcome.style.opacity = '0'
        caption.style.opacity = '0'
        waveRect.setAttribute('y', '195')
        waveRect.setAttribute('height', '0')

        let skipped = false
        skipBtn.addEventListener('click', () => { skipped = true; finish() })
        const skipTimer = setTimeout(() => skipBtn.classList.add('is-visible'), 600)
        cleanups.push(() => clearTimeout(skipTimer))

        animate(welcome, { opacity: [0, 1], translateY: [-8, 0], duration: 500, ease: 'outQuad' })
        animate(caption, { opacity: [0, 0.7], duration: 400, delay: 200 })

        const state = { y: 195 }
        animate(state, {
          y: -5,
          duration: 2400,
          ease: 'inOutQuad',
          delay: 250,
          onUpdate: () => {
            if (skipped) return
            const hh = 195 - state.y
            waveRect.setAttribute('y', String(state.y))
            waveRect.setAttribute('height', String(hh + 10))
            const pct = Math.round(Math.min(100, (hh / 195) * 100))
            caption.textContent = `filling · ${pct}%`
          },
          onComplete: () => {
            if (skipped) return
            animate(logo, { scale: [1, 1.04, 1], duration: 600, ease: 'inOutQuad' })
            animate(caption, { opacity: [0.7, 0], duration: 400, delay: 400 })
            const t = setTimeout(finish, 1100)
            cleanups.push(() => clearTimeout(t))
          },
        })

        function finish() {
          if ((finish as { _done?: boolean })._done || destroyed) return
          ;(finish as { _done?: boolean })._done = true
          const loader = $('#loader')!
          loader.classList.add('is-hidden')
          const t = setTimeout(resolve, 600)
          cleanups.push(() => clearTimeout(t))
        }
      })
    }

    function runGate() {
      return new Promise<void>((resolve) => {
        const gate    = $('#gate')!
        const choices = $('#gate-choices')!
        gate.classList.add('is-visible')
        const onChoice = (e: Event) => {
          const btn = (e.target as HTMLElement).closest('button[data-enter]')
          if (!btn) return
          gate.classList.remove('is-visible')
          gate.classList.add('is-hidden')
          const t = setTimeout(resolve, 600)
          cleanups.push(() => clearTimeout(t))
        }
        choices.addEventListener('click', onChoice)
      })
    }

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
      await runLoader()
      if (destroyed) return
      await runGate()
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
      {/* LOADER — splash (z 2000). Fills via the SVG clip; #wave-rect
          is animated, #loader-caption shows the %. Topmost so it
          covers the booting scene. */}
      <div className="loader" id="loader">
        <span className="loader-corner loader-corner--tl" />
        <span className="loader-corner loader-corner--tr" />
        <span className="loader-corner loader-corner--bl" />
        <span className="loader-corner loader-corner--br" />
        <div className="loader-welcome" id="loader-welcome">Welcome to Mentheon</div>
        <div className="loader-stage" dangerouslySetInnerHTML={{ __html: LOADER_LOGO_SVG }} />
        <div className="loader-caption" id="loader-caption">filling · 0%</div>
        <button className="loader-skip" id="loader-skip">skip ↦</button>
      </div>

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

      {/* GATE — sound/silent splash (z 1000). Either button resolves
          runGate(); the choice isn't persisted/used yet. */}
      <div className="gate" id="gate">
        <div className="gate-mark">mentheon<span className="star">✲</span></div>
        <p className="gate-tag">Research and technology group · London · est. September 2024 · six strands across ageing, attraction, health and cognition</p>
        <div className="gate-choices" id="gate-choices">
          <button className="gate-btn" data-enter="sound">
            <svg className="gate-btn-icon" viewBox="0 0 24 24"><path d="M3 10v4h4l5 4V6L7 10H3z" /><path d="M16 8a5 5 0 0 1 0 8" /><path d="M19 5a9 9 0 0 1 0 14" /></svg>
            enter with sound
          </button>
          <button className="gate-btn" data-enter="silent">
            <svg className="gate-btn-icon" viewBox="0 0 24 24"><path d="M3 10v4h4l5 4V6L7 10H3z" /><path d="M18 9l4 6M22 9l-4 6" /></svg>
            enter without sound
          </button>
        </div>
      </div>

      {/* MARQUEE — track is filled by buildMarquee(); edit phrases there */}
      <div className="marquee">
        <div className="marquee-track" id="marquee-track" />
      </div>

      {/* NAV — wordmark + view toggle (#view-toggle) + theme button
          (#theme-switch) + menu button (#menu-open). All wired in the
          effect by id. */}
      <nav className="nav">
        <a href="#" className="nav-mark">mentheon<span className="star">✲</span></a>
        <div className="nav-controls">
          <div className="view-toggle" id="view-toggle" role="tablist" aria-label="View mode">
            <button className="is-active" data-view="helix" role="tab" aria-selected="true">staff</button>
            <button data-view="list" role="tab" aria-selected="false">list</button>
          </div>
          <button className="render-toggle" id="render-toggle" type="button" aria-pressed="false" aria-label="Toggle sketch render">sketch</button>
          <button className="render-toggle" id="node-toggle" type="button" aria-pressed="false" aria-label="Toggle solid nodes">solid nodes</button>
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
          <h1 className="title">Six strands<br />around one <span className="accent">arc</span>.</h1>
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
