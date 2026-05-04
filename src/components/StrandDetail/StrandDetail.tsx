import { useId } from 'react'
import type { StrandDetailProps } from './types'
import StrandDetailHeader from './Header/StrandDetailHeader'
import StrandMetaRow from './MetaRow/StrandMetaRow'
import ProgressBeacon from './Progress/ProgressBeacon'
import ProgressTimeline from './Progress/ProgressTimeline'
import AbstractSection from './Sections/AbstractSection'
import ObjectivesSection from './Sections/ObjectivesSection'
import ResearchQuestionsSection from './Sections/ResearchQuestionsSection'
import StrandCTARow from './CTAs/StrandCTARow'
import useDisclosure from './hooks/useDisclosure'
import styles from './StrandDetail.module.css'

// Composition only — no logic. State for disclosure lives in the
// hook; presentation lives in the children.
export default function StrandDetail({ strand, progress, onBack }: StrandDetailProps) {
  const disclosure = useDisclosure()
  const timelineId = useId()

  return (
    <>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        {onBack ? (
          <button type="button" onClick={onBack}>strands</button>
        ) : (
          <a href="#">strands</a>
        )}
        <span className={styles.sep}>/</span>
        <a href={strand.href}>{strand.id}</a>
        <span className={styles.sep}>/</span>
        <span>detail</span>
      </nav>
      <main className={styles.page}>
        <article className={styles.frame}>
          <span className={`${styles.cornerCrop} ${styles.cornerTL}`} aria-hidden="true" />
          <span className={`${styles.cornerCrop} ${styles.cornerTR}`} aria-hidden="true" />
          <span className={`${styles.cornerCrop} ${styles.cornerBL}`} aria-hidden="true" />
          <span className={`${styles.cornerCrop} ${styles.cornerBR}`} aria-hidden="true" />

          <StrandDetailHeader strand={strand}>
            <StrandMetaRow meta={strand.meta}>
              <ProgressBeacon
                progress={progress}
                expanded={disclosure.isOpen}
                onToggle={disclosure.toggle}
                ariaControls={timelineId}
              />
            </StrandMetaRow>
            <ProgressTimeline id={timelineId} progress={progress} expanded={disclosure.isOpen} />
          </StrandDetailHeader>

          <AbstractSection text={strand.abstract ?? ''} sectionNumber="01" />
          <ObjectivesSection items={strand.objectives ?? []} sectionNumber="02" />
          <ResearchQuestionsSection items={strand.researchQuestions ?? []} sectionNumber="03" />
          <StrandCTARow ctas={strand.ctas ?? []} />
        </article>
      </main>
    </>
  )
}
