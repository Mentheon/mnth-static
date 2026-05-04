import { useEffect, useRef } from 'react'
import { animate } from 'animejs'
import type { SceneProps } from '../types'
import styles from './Scene.module.css'

/* ============================================================
   VrPoseScene — pose-tracking splash.
   Sensor-noise dots scatter, joints fly in & snap to anatomy,
   confidence ticks up to 0.99, bones connect the joints, then
   a PLAY button materialises over the head (replacing the demo's
   headset) and a HAPPY FACE bobs in beside it.
   ============================================================ */

const SVG_NS = 'http://www.w3.org/2000/svg'

/* Compact upper-body skeleton — fits inside the 800x520 viewBox. */
const SKELETON = {
  head:      { x: 400, y: 135 },
  neck:      { x: 400, y: 175 },
  lShoulder: { x: 360, y: 195 },
  rShoulder: { x: 440, y: 195 },
  lElbow:    { x: 335, y: 240 },
  rElbow:    { x: 465, y: 240 },
  lWrist:    { x: 320, y: 280 },
  rWrist:    { x: 480, y: 280 },
  spine:     { x: 400, y: 270 },
  lHip:      { x: 380, y: 310 },
  rHip:      { x: 420, y: 310 },
  lKnee:     { x: 376, y: 360 },
  rKnee:     { x: 424, y: 360 },
  lAnkle:    { x: 372, y: 410 },
  rAnkle:    { x: 428, y: 410 },
} as const
type JointKey = keyof typeof SKELETON

const BONES: [JointKey, JointKey][] = [
  ['head', 'neck'], ['neck', 'lShoulder'], ['neck', 'rShoulder'], ['neck', 'spine'],
  ['lShoulder', 'lElbow'], ['lElbow', 'lWrist'],
  ['rShoulder', 'rElbow'], ['rElbow', 'rWrist'],
  ['spine', 'lHip'], ['spine', 'rHip'],
  ['lHip', 'lKnee'], ['lKnee', 'lAnkle'],
  ['rHip', 'rKnee'], ['rKnee', 'rAnkle'],
]

const FLOOR_LINES: Array<[string, string, string, string, string, string]> = [
  ['240', '430', '560', '430', '1',   '0.3'],
  ['270', '412', '530', '412', '0.5', '0.2'],
  ['300', '395', '500', '395', '0.5', '0.15'],
  ['240', '430', '270', '412', '0.5', '0.2'],
  ['560', '430', '530', '412', '0.5', '0.2'],
]

export default function VrPoseScene({ onReadoutChange }: SceneProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    onReadoutChange('Pose tracking', '0.00')
    const svg = svgRef.current
    if (!svg) return

    const animations: ReturnType<typeof animate>[] = []
    const timers: number[] = []

    /* Floor grid (vanishing-point trapezoid). */
    const floor = document.createElementNS(SVG_NS, 'g')
    floor.setAttribute('opacity', '0')
    FLOOR_LINES.forEach(([x1, y1, x2, y2, w, op]) => {
      const ln = document.createElementNS(SVG_NS, 'line')
      ln.setAttribute('x1', x1); ln.setAttribute('y1', y1)
      ln.setAttribute('x2', x2); ln.setAttribute('y2', y2)
      ln.setAttribute('stroke', 'var(--ink)')
      ln.setAttribute('stroke-width', w)
      ln.setAttribute('opacity', op)
      floor.appendChild(ln)
    })
    svg.appendChild(floor)

    /* Sensor-noise dots — scatter & dissolve to sell the pre-lock moment. */
    for (let i = 0; i < 50; i++) {
      const x = 200 + Math.random() * 400
      const y = 100 + Math.random() * 320
      const j = document.createElementNS(SVG_NS, 'circle')
      j.setAttribute('cx', String(x)); j.setAttribute('cy', String(y))
      j.setAttribute('r', '1.5')
      j.setAttribute('fill', 'var(--ink)')
      j.setAttribute('opacity', String(0.3 + Math.random() * 0.4))
      svg.appendChild(j)
      animations.push(
        animate(j, {
          cx: x + (Math.random() * 40 - 20),
          cy: y + (Math.random() * 40 - 20),
          opacity: [0.4, 0],
          duration: 600 + Math.random() * 400,
          ease: 'outQuad',
        }),
      )
    }
    animations.push(animate(floor, { opacity: [0, 1], duration: 500, ease: 'outQuad' }))

    /* 600 ms in: joints fly to anatomy, confidence ticks up. */
    const jointsG = document.createElementNS(SVG_NS, 'g')
    const bonesG = document.createElementNS(SVG_NS, 'g')
    svg.appendChild(bonesG)
    svg.appendChild(jointsG)

    timers.push(window.setTimeout(() => {
      const keys = Object.keys(SKELETON) as JointKey[]
      keys.forEach((key, i) => {
        const target = SKELETON[key]
        const startX = target.x + (Math.random() * 180 - 90)
        const startY = target.y + (Math.random() * 180 - 90)
        const j = document.createElementNS(SVG_NS, 'circle')
        j.setAttribute('cx', String(startX)); j.setAttribute('cy', String(startY))
        j.setAttribute('r', '4.5')
        j.setAttribute('fill', 'var(--bg)')
        j.setAttribute('stroke', 'var(--crimson)')
        j.setAttribute('stroke-width', '1.8')
        j.setAttribute('opacity', '0')
        jointsG.appendChild(j)
        animations.push(
          animate(j, {
            cx: target.x, cy: target.y,
            opacity: [0, 1],
            duration: 600,
            delay: i * 35,
            ease: 'outBack',
          }),
        )
      })

      animations.push(
        animate({ v: 0 }, {
          v: 0.99,
          duration: 1100,
          ease: 'outQuad',
          onUpdate: (anim) => {
            const v = (anim.targets[0] as { v: number }).v
            onReadoutChange('Pose tracking', v.toFixed(2))
          },
        }),
      )

      /* Bones connect at 700 ms. */
      timers.push(window.setTimeout(() => {
        BONES.forEach((bone, i) => {
          const a = SKELETON[bone[0]]
          const b = SKELETON[bone[1]]
          const line = document.createElementNS(SVG_NS, 'line')
          line.setAttribute('x1', String(a.x)); line.setAttribute('y1', String(a.y))
          line.setAttribute('x2', String(a.x)); line.setAttribute('y2', String(a.y))
          line.setAttribute('stroke', 'var(--ink)')
          line.setAttribute('stroke-width', '2')
          line.setAttribute('opacity', '0.7')
          bonesG.appendChild(line)
          animations.push(
            animate(line, {
              x2: b.x, y2: b.y,
              duration: 250,
              delay: i * 30,
              ease: 'outQuad',
            }),
          )
        })
      }, 700))

      /* 1500 ms: VR headset materialises on the head — same shape as
         the demo (visor rect, lens rect, two top straps). */
      const headX = SKELETON.head.x
      const headY = SKELETON.head.y

      timers.push(window.setTimeout(() => {
        const headsetG = document.createElementNS(SVG_NS, 'g')
        headsetG.setAttribute('opacity', '0')
        headsetG.setAttribute('transform-origin', `${headX}px ${headY}px`)

        const visor = document.createElementNS(SVG_NS, 'rect')
        visor.setAttribute('x', String(headX - 28)); visor.setAttribute('y', String(headY - 15))
        visor.setAttribute('width', '56'); visor.setAttribute('height', '28')
        visor.setAttribute('rx', '5')
        visor.setAttribute('fill', 'var(--ink)')
        headsetG.appendChild(visor)

        const lens = document.createElementNS(SVG_NS, 'rect')
        lens.setAttribute('x', String(headX - 20)); lens.setAttribute('y', String(headY - 9))
        lens.setAttribute('width', '40'); lens.setAttribute('height', '16')
        lens.setAttribute('rx', '2.5')
        lens.setAttribute('fill', 'var(--crimson)')
        lens.setAttribute('opacity', '0.75')
        headsetG.appendChild(lens)

        const lStrap = document.createElementNS(SVG_NS, 'line')
        lStrap.setAttribute('x1', String(headX - 28)); lStrap.setAttribute('y1', String(headY - 15))
        lStrap.setAttribute('x2', String(headX - 35)); lStrap.setAttribute('y2', String(headY - 29))
        lStrap.setAttribute('stroke', 'var(--ink)'); lStrap.setAttribute('stroke-width', '2')
        lStrap.setAttribute('stroke-linecap', 'round')
        headsetG.appendChild(lStrap)

        const rStrap = document.createElementNS(SVG_NS, 'line')
        rStrap.setAttribute('x1', String(headX + 28)); rStrap.setAttribute('y1', String(headY - 15))
        rStrap.setAttribute('x2', String(headX + 35)); rStrap.setAttribute('y2', String(headY - 29))
        rStrap.setAttribute('stroke', 'var(--ink)'); rStrap.setAttribute('stroke-width', '2')
        rStrap.setAttribute('stroke-linecap', 'round')
        headsetG.appendChild(rStrap)

        svg.appendChild(headsetG)
        animations.push(animate(headsetG, { opacity: [0, 1], duration: 400, ease: 'outQuad' }))
      }, 1500))

      /* 2100 ms: play button appears below the figure — clearly a UI
         control, not part of the body. Crimson disc + cream triangle. */
      const PLAY_X = 400, PLAY_Y = 470, PLAY_R = 26
      const playG = document.createElementNS(SVG_NS, 'g')
      playG.setAttribute('opacity', '0')
      playG.setAttribute('transform-origin', `${PLAY_X}px ${PLAY_Y}px`)

      const playDisc = document.createElementNS(SVG_NS, 'circle')
      playDisc.setAttribute('cx', String(PLAY_X)); playDisc.setAttribute('cy', String(PLAY_Y))
      playDisc.setAttribute('r', String(PLAY_R))
      playDisc.setAttribute('fill', 'var(--crimson)')
      playG.appendChild(playDisc)

      const playTri = document.createElementNS(SVG_NS, 'path')
      playTri.setAttribute(
        'd',
        `M ${PLAY_X - 7} ${PLAY_Y - 11} L ${PLAY_X - 7} ${PLAY_Y + 11} L ${PLAY_X + 12} ${PLAY_Y} Z`,
      )
      playTri.setAttribute('fill', 'var(--bg)')
      playG.appendChild(playTri)
      svg.appendChild(playG)

      timers.push(window.setTimeout(() => {
        animations.push(animate(playG, { opacity: [0, 1], duration: 350, ease: 'outQuad' }))
      }, 2100))

      /* 2700 ms: virtual cursor (a small ink disc) glides in from the
         lower-right corner toward the play button, "presses" it with a
         brief scale-down, ripple expands, then the cursor fades out. */
      timers.push(window.setTimeout(() => {
        const cursor = document.createElementNS(SVG_NS, 'circle')
        cursor.setAttribute('cx', '720'); cursor.setAttribute('cy', '500')
        cursor.setAttribute('r', '7')
        cursor.setAttribute('fill', 'var(--ink)')
        cursor.setAttribute('opacity', '0')
        svg.appendChild(cursor)

        animations.push(
          animate(cursor, {
            opacity: [0, 1],
            duration: 200,
            ease: 'outQuad',
          }),
        )
        animations.push(
          animate(cursor, {
            cx: PLAY_X + 6,
            cy: PLAY_Y + 4,
            duration: 600,
            ease: 'inOutCubic',
          }),
        )

        /* Press the button — quick depress + recoil. */
        timers.push(window.setTimeout(() => {
          animations.push(
            animate(playG, {
              scale: [1, 0.82, 1.06, 1],
              duration: 460,
              ease: 'outQuad',
            }),
          )

          /* Click ripple from the button. */
          const ripple = document.createElementNS(SVG_NS, 'circle')
          ripple.setAttribute('cx', String(PLAY_X)); ripple.setAttribute('cy', String(PLAY_Y))
          ripple.setAttribute('r', String(PLAY_R))
          ripple.setAttribute('fill', 'none')
          ripple.setAttribute('stroke', 'var(--crimson)')
          ripple.setAttribute('stroke-width', '2')
          ripple.setAttribute('opacity', '0.7')
          svg.appendChild(ripple)
          animations.push(
            animate(ripple, {
              r: [PLAY_R, PLAY_R + 30],
              opacity: [0.7, 0],
              duration: 600,
              ease: 'outQuad',
            }),
          )

          animations.push(
            animate(cursor, {
              opacity: [1, 0],
              duration: 400,
              delay: 120,
              ease: 'outQuad',
            }),
          )
        }, 600))
      }, 2700))

      /* 3500 ms: play has been "hit" — happy face pops in next to the
         headset and idle-bobs alongside it. */
      timers.push(window.setTimeout(() => {
        const faceG = document.createElementNS(SVG_NS, 'g')
        faceG.setAttribute('opacity', '0')
        faceG.setAttribute('transform', `translate(${headX + 70} ${headY - 5})`)

        const face = document.createElementNS(SVG_NS, 'circle')
        face.setAttribute('r', '18')
        face.setAttribute('fill', 'var(--bg)')
        face.setAttribute('stroke', 'var(--ink)')
        face.setAttribute('stroke-width', '1.8')
        faceG.appendChild(face)

        const lEye = document.createElementNS(SVG_NS, 'circle')
        lEye.setAttribute('cx', '-6'); lEye.setAttribute('cy', '-3')
        lEye.setAttribute('r', '2'); lEye.setAttribute('fill', 'var(--ink)')
        faceG.appendChild(lEye)

        const rEye = document.createElementNS(SVG_NS, 'circle')
        rEye.setAttribute('cx', '6'); rEye.setAttribute('cy', '-3')
        rEye.setAttribute('r', '2'); rEye.setAttribute('fill', 'var(--ink)')
        faceG.appendChild(rEye)

        const smile = document.createElementNS(SVG_NS, 'path')
        smile.setAttribute('d', 'M -6 4 Q 0 11 6 4')
        smile.setAttribute('fill', 'none')
        smile.setAttribute('stroke', 'var(--ink)')
        smile.setAttribute('stroke-width', '1.8')
        smile.setAttribute('stroke-linecap', 'round')
        faceG.appendChild(smile)

        svg.appendChild(faceG)
        animations.push(
          animate(faceG, {
            opacity: [0, 1],
            scale: [0.4, 1],
            duration: 500,
            ease: 'outBack',
          }),
        )
        animations.push(
          animate(faceG, {
            translateY: [-4, 4],
            duration: 1400,
            delay: 600,
            loop: true,
            alternate: true,
            ease: 'inOutSine',
          }),
        )
      }, 3500))
    }, 600))

    return () => {
      timers.forEach(id => clearTimeout(id))
      animations.forEach(a => a.pause())
      while (svg.firstChild) svg.removeChild(svg.firstChild)
    }
  }, [onReadoutChange])

  return (
    <svg
      ref={svgRef}
      className={styles.canvas}
      viewBox="0 0 800 520"
      preserveAspectRatio="xMidYMid meet"
    />
  )
}
