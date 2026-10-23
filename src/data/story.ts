/* #story — experimental scroll-driven depth story (StoryPage).

   Each chapter is one photo plus its DEPTH MAP. As you scroll through a
   chapter its depth "expands" from flat to full, and the view drifts so
   the parallax reads on a flat screen.

   FROM IPHONE SPATIAL PHOTOS (.HEIC) — the easy way
     Put the HEICs in story-src/ and run  .venv/bin/python scripts/story_import.py
     (setup once: python3 -m venv .venv && .venv/bin/pip install opencv-contrib-python numpy pillow-heif)
     It splits each into its two eyes, measures real depth from the shift
     between them, writes public/story/<name>.jpg + <name>-depth.png (+ the
     HEIC for Vision Pro) and lists them in story.generated.ts (IMPORTED).

   ADDING A PHOTO BY HAND
   1. Put the photo in public/story/ (JPEG/PNG/WebP — not HEIC; browsers
      other than Safari can't decode it). For an iPhone spatial photo,
      `spatial export -i IMG.HEIC -o left.png -o right.png` and use one eye.
   2. Make a depth map of the SAME image: a greyscale PNG, white = near,
      black = far (e.g. Depth Anything V2,
      depth-anything/Depth-Anything-V2-Small-hf). Same aspect ratio as the
      photo; it can be smaller (1024 px wide is plenty).
   3. Add an entry below. `depth` is optional: without one the page uses a
      simple top-far/bottom-near gradient so you can still try the photo.

   Tuning per photo: `focus` (0–1) is the depth that stays on the screen
   plane (default 0.5); `strength` scales how far the depth expands
   (default 1; keep it modest, ~0.6–1.4, for comfort). */

import { IMPORTED } from './story.generated'

export interface StoryChapter {
  id: string
  title: string
  caption: string
  /** Path under public/, e.g. 'story/01.jpg'. Omit with `demo: true`. */
  photo?: string
  /** Greyscale depth map under public/ (white = near). */
  depth?: string
  /** AI-estimated depth map (story_import.py --ai); the page can use it instead. */
  aiDepth?: string
  /** Optional spatial HEIC under public/ (Vision Pro: long-press → View Spatial Photo). */
  heic?: string
  focus?: number
  strength?: number
  /** Built-in generated test scene (no files needed). */
  demo?: boolean
  /** Stage overlays painted onto the photo one after another as you scroll
      on (#story2): transparent PNGs under public/, covering the top
      `overlayTop` of the image (0–1 of its height; default all of it). */
  overlays?: { id: string; title: string; src: string }[]
  overlayTop?: number
}

/* Hand-listed chapters (below) come after the imported ones. The test
   scene shows only until something has been imported or listed. */
const MANUAL: StoryChapter[] = [
  // { id: 'ch1', title: 'Chapter one', caption: 'What happens here.', photo: 'story/01.jpg', depth: 'story/01-depth.png' },
]

const DEMO: StoryChapter[] = [
  {
    id: 'demo',
    title: 'Test scene',
    caption: 'A generated landscape with a matching depth map, so the effect can be tried before any photos are added. Scroll to let the depth expand.',
    demo: true,
  },
]

export const STORY: StoryChapter[] = IMPORTED.length || MANUAL.length ? [...IMPORTED, ...MANUAL] : DEMO

/* #story1 — a page of its own for one photo (IMG_0508), same controls. Falls
   back to the test scene if that photo hasn't been imported here. */
const ONE = [...IMPORTED, ...MANUAL].filter((c) => c.id === 'img-0508')
export const STORY1: StoryChapter[] = ONE.length ? ONE : DEMO

/* #story2 — IMG_0508 with the reminiscence-artefact stages (from the Claude
   Design schematic) painted onto the depth photo: as it is → depth opens →
   00 physical artefact → 01 digital representation → 02 data chunks →
   03 JSON schema. The overlays cover the photo's top 3024 × 2875 (of 4032). */
const ARTEFACT_STAGES = [
  { id: '00', title: 'Physical artefact', src: 'story/overlays/img-0508-00.png' },
  { id: '01', title: 'Physical → digital representation', src: 'story/overlays/img-0508-01.png' },
  { id: '02', title: 'Conversion to data chunks', src: 'story/overlays/img-0508-02.png' },
  { id: '03', title: 'Structured metadata schema (JSON)', src: 'story/overlays/img-0508-03.png' },
]
export const STORY2: StoryChapter[] = ONE.length ? ONE.map((c) => ({ ...c, overlays: ARTEFACT_STAGES, overlayTop: 2875 / 4032 })) : DEMO
