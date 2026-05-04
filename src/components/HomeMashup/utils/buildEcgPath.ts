/* ============================================================
   buildEcgPath — generates a PQRST cardiac trace as an SVG path
   string. Used by the Defib finishing flourish (implicitly, via
   the shockwave) and explicitly by the Ecg scene's intro/speedup/
   flatline transitions.

   `amp`   scales the complex height (R-spike size).
   `beats` is how many full PQRST cycles span the strip.
   ============================================================ */

export function buildEcgPath(
  amp: number,
  beats: number,
  w = 800,
  midY = 65,
): string {
  let d = `M 0 ${midY}`
  const beatW = w / beats
  for (let i = 0; i < beats; i++) {
    const x0 = i * beatW
    d += ` L ${x0 + beatW * 0.10} ${midY}`
    d += ` Q ${x0 + beatW * 0.14} ${midY + 6 * amp} ${x0 + beatW * 0.18} ${midY}`
    d += ` L ${x0 + beatW * 0.32} ${midY}`
    d += ` L ${x0 + beatW * 0.36} ${midY + 4 * amp}`
    d += ` L ${x0 + beatW * 0.40} ${midY - 44 * amp}`
    d += ` L ${x0 + beatW * 0.44} ${midY + 18 * amp}`
    d += ` L ${x0 + beatW * 0.48} ${midY - 2 * amp}`
    d += ` L ${x0 + beatW * 0.62} ${midY}`
    d += ` Q ${x0 + beatW * 0.72} ${midY - 12 * amp} ${x0 + beatW * 0.82} ${midY}`
    d += ` L ${x0 + beatW} ${midY}`
  }
  return d
}
