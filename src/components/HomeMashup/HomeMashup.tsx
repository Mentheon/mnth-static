import { useCallback, useEffect, useState } from 'react'
import type { SceneDescriptor } from './types'
import Readout from './Readout'
import CarouselPills from './CarouselPills'
import HelixScene from './scenes/HelixScene'
import MoleculeScene from './scenes/MoleculeScene'
import CellScene from './scenes/CellScene'
import NeuralScene from './scenes/NeuralScene'
import MriScene from './scenes/MriScene'
import RingsScene from './scenes/RingsScene'
import PillsScene from './scenes/PillsScene'
import EhrScene from './scenes/EhrScene'
import DefibScene from './scenes/DefibScene'
import EcgScene from './scenes/EcgScene'
import styles from './HomeMashup.module.css'

/* ============================================================
   HomeMashup — orchestrator for the home-page healthtech
   carousel. Cycles through 10 vignette scenes on a per-scene
   timer; loops back to scene 0 after the final scene; pills
   beneath the canvas show progress and allow direct jumping.
   ============================================================ */

/* Per-scene durations are tuned so each scene's own animations play
   THROUGH at least once before the carousel advances. The longest
   intrinsic animations:
     · cell division — 5 generations × 380 ms + 200 ms init = 2.1 s
     · neural pulses — second pulse at 1.5 s + propagation ≈ 2.4 s
     · ecg          — draw 1.1 s + speed-up 0.7 s + flatline 0.5 s
                      + drop 0.9 s = 3.2 s
   Add ~50–60 % headroom on each so the visual lingers a moment
   after its motion settles before swapping out. */
const SCENES: SceneDescriptor[] = [
  { id: 'helix',    label: 'Sequencing',         duration: 4000, Component: HelixScene },
  { id: 'molecule', label: 'Molecular assembly', duration: 4000, Component: MoleculeScene },
  { id: 'cell',     label: 'Cell division',      duration: 4200, Component: CellScene },
  { id: 'neural',   label: 'Neural network',     duration: 4400, Component: NeuralScene },
  { id: 'mri',      label: 'MRI sweep',          duration: 3600, Component: MriScene },
  { id: 'rings',    label: 'Wearable rings',     duration: 3600, Component: RingsScene },
  { id: 'pills',    label: 'Pill cascade',       duration: 3200, Component: PillsScene },
  { id: 'ehr',      label: 'EHR terminal',       duration: 6000, Component: EhrScene },
  { id: 'defib',    label: 'Defibrillator',      duration: 3600, Component: DefibScene },
  { id: 'ecg',      label: 'Cardiac monitor',    duration: 4600, Component: EcgScene },
]

interface HomeMashupProps {
  /** Show the "Digital health is moving... fast" headline as an
   *  overlay on top of the carousel. Used by the ConceptView main
   *  view; left off on the home page where the carousel speaks for
   *  itself. */
  showHeadline?: boolean
}

export default function HomeMashup({ showHeadline = false }: HomeMashupProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [readout, setReadout] = useState<{ left: string; right: string }>({
    left: 'Mentheon',
    right: '--',
  })

  /* Auto-advance — when currentIndex changes, schedule the move to
     the next scene. Clearing the timer on unmount or pill-jump
     interrupt keeps the cycle in sync with the visible scene. */
  useEffect(() => {
    const scene = SCENES[currentIndex]
    const id = window.setTimeout(() => {
      setCurrentIndex(prev => (prev + 1) % SCENES.length)
    }, scene.duration)
    return () => clearTimeout(id)
  }, [currentIndex])

  const handleReadoutChange = useCallback((left: string, right: string) => {
    setReadout({ left, right })
  }, [])

  const handleSceneComplete = useCallback(() => {
    /* Reserved for future use — the orchestrator owns advance timing. */
  }, [])

  const ActiveScene = SCENES[currentIndex].Component

  return (
    <div className={styles.stage}>
      <Readout left={readout.left} right={readout.right} />

      {showHeadline && (
        <div className={styles.headlineTop} aria-hidden="true">
          Digital health is moving…&nbsp;<span className={styles.headlineFast}>fast</span>
        </div>
      )}

      {/* The scene's <svg> absolute-fills this wrapper. When the
          headline is shown above the canvas, canvasAreaInset reserves
          space at the top so scenes don't paint under the type. */}
      <div className={`${styles.canvasArea} ${showHeadline ? styles.canvasAreaInset : ''}`}>
        <ActiveScene
          key={SCENES[currentIndex].id}
          onReadoutChange={handleReadoutChange}
          onComplete={handleSceneComplete}
        />
      </div>

      <CarouselPills
        scenes={SCENES}
        activeIndex={currentIndex}
        onSelect={setCurrentIndex}
      />
    </div>
  )
}
