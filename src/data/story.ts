/* #story — experimental scroll-driven depth story (StoryPage).

   Each chapter is one photo plus its DEPTH MAP. As you scroll through a
   chapter its depth "expands" from flat to full, and the view drifts so
   the parallax reads on a flat screen.

   ADDING A PHOTO
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

export interface StoryChapter {
  id: string
  title: string
  caption: string
  /** Path under public/, e.g. 'story/01.jpg'. Omit with `demo: true`. */
  photo?: string
  /** Greyscale depth map under public/ (white = near). */
  depth?: string
  /** Optional spatial HEIC under public/ (Vision Pro: long-press → View Spatial Photo). */
  heic?: string
  focus?: number
  strength?: number
  /** Built-in generated test scene (no files needed). */
  demo?: boolean
}

export const STORY: StoryChapter[] = [
  {
    id: 'demo',
    title: 'Test scene',
    caption: 'A generated landscape with a matching depth map, so the effect can be tried before any photos are added. Scroll to let the depth expand.',
    demo: true,
  },
  // { id: 'ch1', title: 'Chapter one', caption: 'What happens here.', photo: 'story/01.jpg', depth: 'story/01-depth.png' },
  // { id: 'ch2', title: 'Chapter two', caption: '…', photo: 'story/02.jpg', depth: 'story/02-depth.png', heic: 'story/02.heic' },
]
