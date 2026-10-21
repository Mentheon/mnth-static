import { useEffect, useRef, useState } from 'react'
import { PEOPLE } from '../data/people'
import PersonAvatar from './PersonAvatar'
import PersonWindow from './PersonWindow'
import { PageShell, Section, styles as s, HOME_HREF } from './Framework/shared'
import styles from './WhoPage.module.css'

const star = <span className={s.star} aria-hidden="true">✲</span>

/* #who — the people page, in the same framed shell as the framework /
   category pages. Each person is a circular profile; clicking one
   opens their PersonWindow (the strand-window chrome). */
export default function WhoPage() {
  // `#who?person=<id>` (e.g. a project's contact link) opens that profile.
  const [openId, setOpenId] = useState<string | null>(() => {
    const id = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('person')
    return PEOPLE.some((p) => p.id === id) ? id : null
  })
  const profileRefs = useRef(new Map<string, HTMLLIElement>())
  const trackRef = useRef<HTMLUListElement>(null)

  /* Phones: the team is a swipe carousel (CSS). Start with the first
     person centred, neighbours just peeking in on both sides. */
  useEffect(() => {
    const track = trackRef.current, first = profileRefs.current.get(PEOPLE[0].id)
    if (!track || !first || !window.matchMedia('(max-width: 720px)').matches) return
    track.scrollLeft = first.offsetLeft - (track.clientWidth - first.offsetWidth) / 2
  }, [])

  /* Esc steps out one level: open window → page → helix. This runs in
     the capture phase and swallows the key, so PageShell's useEscBack
     (bubble) only fires once the window is closed. */
  useEffect(() => {
    if (!openId) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopImmediatePropagation()
      setOpenId(null)
    }
    window.addEventListener('keydown', onKey, { capture: true })
    return () => window.removeEventListener('keydown', onKey, { capture: true })
  }, [openId])

  const openIdx = PEOPLE.findIndex((p) => p.id === openId)
  const openPerson = openIdx >= 0 ? PEOPLE[openIdx] : null

  return (
    <PageShell
      back={{ label: 'pathway', href: HOME_HREF }}
      crumbs={[{ label: 'pathway', href: HOME_HREF }, { label: 'who' }]}
      kicker={<>who {star} people</>}
      title="The people behind the work."
      tagline="A small team spanning research, clinical practice and engineering."
    >
      <Section num="01" title="Team">
        <ul className={styles.grid} ref={trackRef}>
          {PEOPLE.map((person, i) => {
            const isOpen = openId === person.id
            const role = person.role
            return (
              <li
                key={person.id}
                ref={(el) => { if (el) profileRefs.current.set(person.id, el); else profileRefs.current.delete(person.id) }}
                className={`${styles.person} ${isOpen ? styles.isOpen : ''} ${openId && !isOpen ? styles.isDim : ''}`}>
                <button
                  type="button"
                  className={styles.disc}
                  onClick={() => setOpenId((prev) => (prev === person.id ? null : person.id))}
                  aria-expanded={isOpen}
                  aria-haspopup="dialog"
                  aria-label={`${person.name} — open profile`}
                >
                  <PersonAvatar
                    person={person}
                    color={isOpen ? 'var(--crimson)' : 'var(--grape)'}
                    className={styles.avatar}
                  />
                </button>
                <span className={styles.num}>{String(i + 1).padStart(2, '0')}</span>
                <span className={styles.name}>{person.name}</span>
                <span className={styles.role}>{role}</span>
                <span className={styles.creds}>{person.credentials}</span>
              </li>
            )
          })}
        </ul>
        <p className={styles.swipe} aria-hidden="true">‹ swipe · {String(PEOPLE.length).padStart(2, '0')} people · swipe ›</p>
      </Section>

      {/* Phones only: everyone at a glance under the carousel. */}
      <div className={styles.everyone}>
        <Section num="02" title="Everyone">
          <ul className={styles.list}>
            {PEOPLE.map((person) => (
              <li key={person.id}>
                <button type="button" className={styles.listRow} aria-haspopup="dialog"
                  onClick={() => setOpenId(person.id)}>
                  <PersonAvatar person={person} color="var(--grape)" className={styles.listAvatar} />
                  <span>
                    <span className={styles.listName}>{person.name}</span>
                    <span className={styles.listRole}>{person.role}</span>
                  </span>
                  <span className={styles.listArrow} aria-hidden="true">→</span>
                </button>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      {openPerson && (
        <PersonWindow
          key={openPerson.id}
          person={openPerson}
          index={openIdx}
          total={PEOPLE.length}
          anchor={profileRefs.current.get(openPerson.id) ?? null}
          onClose={() => setOpenId(null)}
        />
      )}
    </PageShell>
  )
}
