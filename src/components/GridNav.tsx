import styles from './GridNav.module.css'

const NAV_ITEMS = [
  { label: 'Home',  href: '#helix3d'       },
  { label: 'News',  href: '#marginalia' },
  { label: 'About', href: '#about'      },
  { label: 'Who?',  href: '#who'        },
  { label: 'What?', href: '#what'       },
  { label: 'Why?',  href: '#why'        },
]

function getActive(hash: string): string {
  if (hash === '#who') return 'Who?'
  if (hash === '#marginalia' || hash.startsWith('#marginalia/')) return 'News'
  return 'Home'
}

interface GridNavProps {
  currentHash: string
}

export default function GridNav({ currentHash }: GridNavProps) {
  const active = getActive(currentHash)

  return (
    <nav className={styles.gridContainer} aria-label="Primary">
      {NAV_ITEMS.map((item) => {
        const isActive = active === item.label
        return (
          <a
            key={item.label}
            href={item.href}
            className={`${styles.navItem} ${isActive ? styles.active : ''}`}
          >
            {item.label}
            {isActive && <span className={styles.cornerCrop} aria-hidden="true" />}
          </a>
        )
      })}
    </nav>
  )
}
