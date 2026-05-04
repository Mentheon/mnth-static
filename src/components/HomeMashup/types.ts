import type { ComponentType } from 'react'

/* ============================================================
   types.ts — public contracts shared by HomeMashup, the pill
   indicator, and every individual scene component.
   ============================================================ */

export type SceneId =
  | 'helix'
  | 'molecule'
  | 'cell'
  | 'neural'
  | 'mri'
  | 'rings'
  | 'pills'
  | 'ehr'
  | 'defib'
  | 'ecg'

export interface SceneProps {
  /** Tells the parent what to display in the corner readout. */
  onReadoutChange: (left: string, right: string) => void
  /** Fired when the scene's animation has fully run its course. The
   *  parent uses this to advance the carousel. Scenes should still
   *  respect their own `duration` for visual timing — `onComplete` is
   *  the *signal*, not a polling hook. */
  onComplete: () => void
}

export interface SceneDescriptor {
  id: SceneId
  label: string
  duration: number
  Component: ComponentType<SceneProps>
}
