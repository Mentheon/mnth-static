/* Where each strand sits on the coil (t: 0 = head end, 1 = tail), shared
   by Helix3D and the intro (so the intro lands on the live layout).
   Advisory (index 0) sits right up at the head, with extra room above
   Plasmids: about opposite it round the staff and well clear vertically,
   so their cubes can't meet. The rest are evenly spaced below. */
export const NODE_T = { head: 0.01, start: 0.175, end: 0.84 }

export function nodeT(i: number, count: number): number {
  if (i === 0) return NODE_T.head
  return NODE_T.start + (NODE_T.end - NODE_T.start) * ((i - 1) / Math.max(1, count - 2))
}
