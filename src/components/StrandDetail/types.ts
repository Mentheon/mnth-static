import type { Strand, StrandProgress } from '../../data/strands'

export interface StrandDetailProps {
  strand: Strand
  progress: StrandProgress
  onBack?: () => void   // optional — drives breadcrumb back-link if present
}

// Re-export the canonical Strand for convenience inside this folder.
export type { Strand, StrandProgress }
