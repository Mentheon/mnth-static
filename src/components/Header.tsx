import GridNav from './GridNav'
import styles from './Header.module.css'

interface HeaderProps {
  currentHash: string
}

export default function Header({ currentHash }: HeaderProps) {
  return (
    <header className={styles.site}>
      <div className={styles.logoWrap}>
        <img
          src={`${import.meta.env.BASE_URL}web-svg.svg`}
          alt="Mentheon Logo"
          width={518}
          height={170}
        />
      </div>
      <GridNav currentHash={currentHash} />
    </header>
  )
}
