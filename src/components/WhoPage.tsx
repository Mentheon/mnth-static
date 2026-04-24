import { useState } from 'react'
import { PEOPLE } from '../data/people'
import PersonIcon from './PersonIcon'
import PersonPanel from './PersonPanel'
import styles from './RDStrands.module.css'
import whoStyles from './WhoPage.module.css'

export default function WhoPage() {
  const [openId, setOpenId] = useState<string | null>(null)

  function toggle(id: string) {
    setOpenId((prev) => (prev === id ? null : id))
  }

  const openPerson = PEOPLE.find((p) => p.id === openId) ?? null

  return (
    <section className={styles.rd} id="who">
      <h2 className={styles.rdTitle}>
        <span className={styles.thin}>Our</span> people
        <span className={styles.thin}>…</span>
      </h2>

      <div className={`${styles.rdRow} ${openId ? styles.collapsed : ''}`}>
        {PEOPLE.map((person) => {
          const isSelected = openId === person.id
          const isDimmed = openId !== null && !isSelected
          return (
            <div
              key={person.id}
              className={[
                styles.rdGroup,
                isSelected ? styles.selected : '',
                isDimmed ? styles.dimmed : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <button
                type="button"
                className={styles.rdLink}
                onClick={() => toggle(person.id)}
                aria-expanded={isSelected}
                aria-controls="people-panel"
                aria-label={person.name}
              >
                <PersonIcon
                  color={isSelected ? 'var(--strand-selected, #A30B37)' : 'var(--strand-default, #9C528B)'}
                  className={styles.svgDisc}
                />
              </button>
              <span className={styles.label}>
                {person.name.split(' ').slice(0, -1).join(' ')}<br />
                {person.name.split(' ').slice(-1)[0]}
              </span>
              <span className={whoStyles.credentials}>({person.credentials})</span>
            </div>
          )
        })}
      </div>

      {openPerson && (
        <PersonPanel
          key={openPerson.id}
          person={openPerson}
          isOpen={openId !== null}
          onClose={() => setOpenId(null)}
        />
      )}
    </section>
  )
}
