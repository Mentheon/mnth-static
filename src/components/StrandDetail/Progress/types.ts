// Re-exports the progress-related types from the canonical Strand
// data module so the Progress folder stays self-contained — components
// inside Progress/ should import from this file, not from the data layer.
export type {
  Phase,
  PhaseId,
  PhaseStatus,
  ProgressOutput,
  OutputType,
  OutputBehaviour,
  StrandProgress,
} from '../../../data/strands'
